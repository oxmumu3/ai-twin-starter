import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import http from 'node:http';

async function moduleValue(){
  let factory;
  const code=await fs.readFile(new URL('../src/client.js',import.meta.url),'utf8');
  vm.runInNewContext(code,{window:{__ModuleLoader__:{load:v=>{factory=v.factory;}}},AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,fetch,URL,console});
  return factory(name=>name==='react'?{createElement(){}}:{});
}
const snapshot=(revision=0)=>({schemaVersion:1,revision,project:null,materials:{entries:[],inventory:[],status:'empty'},ability:{candidate:null,adopted:null,history:[]},channel:{config:{},status:'unconfigured'},identities:[],rules:{},service:{enabled:false,everEnabled:false},tasks:[],outbox:[],events:[],readiness:{project:false,ability:false,channels:false,rules:false,canEnable:false,gaps:[]},runtime:{executorConfigured:false,transportConfigured:false}});
async function host(t,handler){const server=http.createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));return `http://127.0.0.1:${server.address().port}`;}

test('native client sends an explicit expected revision and accepts authoritative snapshots',async t=>{
  const calls=[];
  const baseUrl=await host(t,async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;calls.push({url:req.url,method:req.method,body:body?JSON.parse(body):null});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(snapshot(req.method==='POST'?8:7)));});
  const {createTwinClient}=await moduleValue();const client=createTwinClient({baseUrl,fetch});t.after(()=>client.close());
  await client.refresh();assert.equal(client.getSnapshot().snapshot.revision,7);
  await client.command('pause',{});assert.equal(client.getSnapshot().snapshot.revision,8);
  assert.deepEqual(calls,[{url:'/api/agent_twin/status',method:'GET',body:null},{url:'/api/agent_twin/action',method:'POST',body:{action:'pause',payload:{},expectedRevision:7}}]);
});

test('lost mutation response is never retried and requires a fresh authoritative read',async t=>{
  let writes=0;
  const baseUrl=await host(t,(req,res)=>{if(req.method==='POST'){writes++;req.socket.destroy();return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify(snapshot(writes)));});
  const {createTwinClient}=await moduleValue();const client=createTwinClient({baseUrl,fetch});t.after(()=>client.close());await client.refresh();
  await client.command('enable',{});assert.equal(client.getSnapshot().uncertain,true);assert.equal(writes,1);
  await client.command('enable',{});assert.equal(writes,1);
  await client.refresh();assert.equal(client.getSnapshot().uncertain,false);assert.equal(client.getSnapshot().snapshot.revision,1);
});

test('conflicting and malformed server replies cannot make the UI writable',async t=>{
  let mode='good';let writes=0;
  const baseUrl=await host(t,(req,res)=>{res.setHeader('Content-Type','application/json');if(req.method==='POST'){writes++;res.statusCode=409;res.end(JSON.stringify({error:'stale',code:'REVISION_CONFLICT'}));return;}res.end(JSON.stringify(mode==='good'?snapshot(2):{revision:999}));});
  const {createTwinClient}=await moduleValue();const client=createTwinClient({baseUrl,fetch});t.after(()=>client.close());await client.refresh();await client.command('enable',{});
  assert.equal(client.getSnapshot().stale,true);assert.equal(writes,1);assert.match(client.getSnapshot().error,/刷新/);
  mode='bad';await client.refresh();assert.equal(client.getSnapshot().stale,true);assert.equal(client.getSnapshot().snapshot.revision,2);
  await client.command('pause',{});assert.equal(writes,1);
});

test('disposing the native surface aborts requests and prevents late subscriptions',async()=>{
  const {createTwinClient}=await moduleValue();let aborted=false;let notifications=0;
  const client=createTwinClient({fetch:(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Aborted','AbortError'));}))});client.subscribe(()=>notifications++);const pending=client.refresh();client.close();await pending;
  assert.equal(aborted,true);const count=notifications;await client.refresh();assert.equal(notifications,count);await client.command('pause',{});assert.equal(notifications,count);
});

test('native surface preserves the host shell and renders all four management modules from one service snapshot',async t=>{
  const value=snapshot(3);value.project={projectId:'p1',sessionId:'service-1',cwd:'/tmp/project',title:'真实选中项目',goal:'明确项目目标',mechanism:'明确验收机制'};value.service={enabled:false,everEnabled:true};value.rules={config:{intervalMinutes:27,maxTasksPerTick:4,ownerDestinationId:'D_OWNER',requireApproval:true},test:null};value.channel={config:{platform:'slack',allowedChannelIds:['C_TEAM'],allowedDestinationIds:['C_TEAM','D_OWNER'],ownerDestinationId:'D_OWNER'},probe:{status:'verified',readVerified:true},delivery:{status:'sent'},status:'ready'};value.tasks=[{id:'t1',request:{text:'待验收交付',senderId:'U1',scope:'knowledge',action:'reply'},status:'sent',deliveryId:'d1'}];value.outbox=[{id:'d1',taskId:'t1',status:'sent'}];
  const baseUrl=await host(t,(req,res)=>{assert.equal(req.method,'GET');res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));});
  let plugin;const state=[];let cursor=0;const effects=[];const effectSlots=[];
  const React={createElement:(type,props,...children)=>({type,props:props??{},children}),useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useEffect(fn){const i=cursor++;if(!(i in state)){state[i]=true;effects.push(fn);}},useRef(value){const i=cursor++;return state[i]??(state[i]={current:value});},useMemo(fn){const i=cursor++;return state[i]??(state[i]=fn());}};
  const code=await fs.readFile(new URL('../src/client.js',import.meta.url),'utf8');
  vm.runInNewContext(code,{window:{__ModuleLoader__:{load:v=>{plugin=v.factory(name=>name==='react'?React:{Modal:'native-modal',SettingsForm:'native-settings-form',SettingsSecretField:'native-secret-field'});}}},AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,fetch:(url,options)=>fetch(baseUrl+url,options),URL,console});
  const registrations=[];const ctx={layout:{selectPanel(){}},effect(fn){const dispose=fn();if(typeof dispose==='function')effectSlots.push(dispose);},slots:{inject(_name,fn){return fn();},register(options,Component){registrations.push({options,Component});return()=>{};}}};plugin.apply(ctx);t.after(()=>{effectSlots.forEach(fn=>fn());effects.forEach(()=>{});});
  assert.deepEqual(registrations.map(r=>r.options.name),['main','sidebar.panellist','settings.section','plugins.row.config']);assert.equal(registrations.some(r=>['root','sidebar','rightbar'].includes(r.options.name)),false);
  const Main=registrations.find(r=>r.options.name==='main').Component;
  function expand(node){if(node==null||typeof node==='boolean')return null;if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.flatMap(expand);if(typeof node.type==='function')return expand(node.type({...node.props,children:node.children}));return{...node,children:node.children.flatMap(child=>{const out=expand(child);return Array.isArray(out)?out:[out];}).filter(x=>x!==null)};}
  const content=node=>typeof node==='string'?node:node?.children?.map(content).join('')??'';
  const find=(node,predicate)=>{if(!node||typeof node==='string')return null;if(predicate(node))return node;for(const child of node.children??[]){const match=find(child,predicate);if(match)return match;}return null;};
  const render=()=>{cursor=0;return expand(Main());};let tree=render();const stops=effects.map(fn=>fn());t.after(()=>stops.forEach(fn=>fn?.()));
  await new Promise(resolve=>setTimeout(resolve,40));tree=render();assert.match(content(tree),/分身已暂停/);assert.match(content(tree),/待验收交付/);assert.match(content(tree),/通道报告已发出/);assert.equal(content(tree).includes('让分身从一个项目开始'),false);
  for(const [label,expected] of [['项目沉淀','明确项目目标'],['分身能力','当前采用版'],['通道连接','读取已核验'],['身份与规则','每 27 分钟检查']]){const button=find(tree,node=>node.type==='button'&&content(node)===label);assert.ok(button);button.props.onClick();tree=render();assert.match(content(tree),new RegExp(expected));assert.match(content(tree),/专用会话：service-1/);}
});

test('candidate trial collects a concrete task and renders actual draft and project structure receipts',async t=>{
  let value=snapshot(20);value.project={projectId:'p1',sessionId:'s1',cwd:'/tmp/owner-project',title:'项目',goal:'目标',mechanism:'验收机制',structure:{root:'twin-project',directories:['context','sop','skills','tools','outputs'],files:['PROJECT.md','INDEX.md','CAPTURE.md'],created:['INDEX.md','CAPTURE.md'],updated:[],preserved:['PROJECT.md']}};value.runtime.executorConfigured=true;value.ability.candidate={id:'candidate-1',version:1,cards:[{id:'c1',kind:'knowledge',title:'支持的事实',content:'事实',when:'被询问时',limits:'仅回答材料',sourceRefs:[],status:'documented'}],scopes:['knowledge'],fingerprint:'abc123',test:{passed:true,output:null,outputFingerprint:null}};
  const writes=[];
  const baseUrl=await host(t,async(req,res)=>{if(req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);writes.push(body);value={...value,revision:value.revision+1,ability:{...value.ability,candidate:{...value.ability.candidate,test:{passed:true,prompt:body.payload.prompt,output:'真实试跑草稿：可回答已记录事实；缺少依据时找主人。',outputFingerprint:'draft-fingerprint',cases:[{cardId:'c1',passed:true,reason:'逐项有依据'}],checkedAt:'2026-10-20T12:00:00Z'}}}};}res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));});
  let plugin;const state=[],effects=[],disposers=[];let cursor=0;
  const React={createElement:(type,props,...children)=>({type,props:props??{},children}),useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useEffect(fn){const i=cursor++;if(!(i in state)){state[i]=true;effects.push(fn);}},useRef(value){const i=cursor++;return state[i]??(state[i]={current:value});},useMemo(fn){const i=cursor++;return state[i]??(state[i]=fn());}};
  const code=await fs.readFile(new URL('../src/client.js',import.meta.url),'utf8');
  vm.runInNewContext(code,{window:{__ModuleLoader__:{load:entry=>{plugin=entry.factory(name=>name==='react'?React:{Modal:'native-modal',SettingsForm:'native-settings-form',SettingsSecretField:'native-secret-field'});}}},AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,fetch:(url,options)=>fetch(baseUrl+url,options),URL,FormData:class{constructor(values){this.values=values;}get(name){return this.values[name]??null;}},console});
  const registrations=[];plugin.apply({layout:{selectPanel(){}},effect(fn){const off=fn();if(typeof off==='function')disposers.push(off);},slots:{inject(_name,fn){return fn();},register(options,Component){registrations.push({options,Component});return()=>{};}}});t.after(()=>disposers.forEach(fn=>fn()));const Main=registrations.find(x=>x.options.name==='main').Component;
  function expand(node){if(node==null||typeof node==='boolean')return null;if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.flatMap(expand);if(typeof node.type==='function')return expand(node.type({...node.props,children:node.children}));return{...node,children:node.children.flatMap(child=>{const out=expand(child);return Array.isArray(out)?out:[out];}).filter(x=>x!==null)};}
  const content=node=>typeof node==='string'?node:node?.children?.map(content).join('')??'';const find=(node,predicate)=>{if(!node||typeof node==='string')return null;if(predicate(node))return node;for(const child of node.children??[]){const match=find(child,predicate);if(match)return match;}return null;};const render=()=>{cursor=0;return expand(Main());};let tree=render();effects.forEach(fn=>{const off=fn();if(typeof off==='function')disposers.push(off);});await new Promise(r=>setTimeout(r,30));tree=render();
  find(tree,node=>node.type==='button'&&content(node)==='项目沉淀').props.onClick();tree=render();assert.match(content(tree),/twin-project\/context/);assert.match(content(tree),/CAPTURE.md/);assert.match(content(tree),/保留.*PROJECT.md/);
  find(tree,node=>node.type==='button'&&content(node)==='分身能力').props.onClick();tree=render();assert.equal(find(tree,node=>node.type==='button'&&content(node)==='核对并采用').props.disabled,true);
  find(tree,node=>node.type==='button'&&content(node)==='对候选执行试跑').props.onClick();tree=render();assert.ok(find(tree,node=>node.type==='native-modal'));assert.ok(find(tree,node=>node.type==='textarea'&&node.props.name==='prompt'));
  const form=find(tree,node=>node.type==='form');await form.props.onSubmit({preventDefault(){},currentTarget:{prompt:'请依据项目背景交付一份小结，说明限制。'}});tree=render();
  assert.equal(writes.length,1);assert.equal(writes[0].action,'test_candidate');assert.deepEqual(writes[0].payload,{prompt:'请依据项目背景交付一份小结，说明限制。'});assert.equal(writes[0].expectedRevision,20);assert.match(content(tree),/真实试跑草稿/);assert.match(content(tree),/逐项有依据/);assert.match(content(tree),/不外发/);
});
