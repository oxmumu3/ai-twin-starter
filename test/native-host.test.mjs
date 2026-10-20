import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeHost,createNativeExecutor} from '../src/native-host.mjs';

const request=(path,body,opts={})=>new Request(`http://127.0.0.1:3000${path}`,body===undefined?opts:{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3000',...opts.headers},body:JSON.stringify(body),...opts});
function fixture(){
  const routes=new Map(),effects=[],commands=[],creates=[];let state={revision:1,service:{enabled:false},project:null};
  const workspace={id:'project-1',title:'Synthetic project',path:'/tmp/synthetic-project',sessionIds:['source-session']};
  const values={connection:{fetch:{register:route=>{routes.set(route.path,route);return async()=>routes.delete(route.path);}}},workspaceRegistry:{list:()=>[workspace],get:id=>id===workspace.id?workspace:undefined},sessionController:{create:async input=>{creates.push(input);return{sessionId:'dedicated-twin'};}}};
  const ctx={get:name=>values[name],effect:fn=>effects.push(fn())};
  const service={snapshot:async()=>structuredClone(state),command:async(action,payload,options)=>{commands.push({action,payload,options});return structuredClone(state);}};
  return{ctx,values,routes,effects,commands,creates,workspace,service,setState:value=>{state=value;}};
}
test('registers only owner-authenticated official Fetch routes and GET never creates or runs work',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service});
  assert.deepEqual([...f.routes.keys()].sort(),['/api/agent_twin/action','/api/agent_twin/projects','/api/agent_twin/status']);
  const response=await f.routes.get('/api/agent_twin/status').fetch(request('/api/agent_twin/status'));
  assert.equal(response.status,200);assert.equal(f.creates.length,0);assert.equal(f.commands.length,0);assert.equal(response.headers.get('Cache-Control'),'no-store');
  await host.close();assert.equal(f.routes.size,0);
});
test('missing official connection has no bare HTTP fallback',()=>{assert.throws(()=>createNativeHost({get:()=>undefined},{service:{}}),/connection|宿主/i);});
test('projects lists bounded native metadata without opening session content',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service});
  const response=await f.routes.get('/api/agent_twin/projects').fetch(request('/api/agent_twin/projects'));
  const data=await response.json();assert.equal(data.projects[0].id,'project-1');assert.equal(data.projects[0].cwd,f.workspace.path);assert.equal(data.projects[0].sessions[0].id,'source-session');assert.equal(f.creates.length,0);await host.close();
});
test('binding resolves only existing workspace and explicitly creates a dedicated official Session',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service});
  const response=await f.routes.get('/api/agent_twin/action').fetch(request('/api/agent_twin/action',{action:'configure_project',expectedRevision:1,payload:{workspaceId:'project-1',title:'Twin project',goal:'help',mechanism:'sources first'}}));
  assert.equal(response.status,200);assert.deepEqual(f.creates,[{workspaceId:'project-1'}]);assert.equal(f.commands[0].payload.cwd,f.workspace.path);assert.equal(f.commands[0].payload.sessionId,'dedicated-twin');assert.equal(f.commands[0].payload.projectId,'project-1');await host.close();
});
test('stale revisions and arbitrary cwd/session cannot cause side effects',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service}),route=f.routes.get('/api/agent_twin/action');
  for(const payload of [{workspaceId:'missing'},{workspaceId:'project-1',cwd:'/etc'},{workspaceId:'project-1',sessionId:'another-project-session'}])assert.ok((await route.fetch(request('/api/agent_twin/action',{action:'configure_project',payload,expectedRevision:1}))).status>=400);
  assert.equal((await route.fetch(request('/api/agent_twin/action',{action:'configure_project',payload:{workspaceId:'project-1'},expectedRevision:0}))).status,409);
  assert.equal(f.commands.length,0);assert.equal(f.creates.length,0);await host.close();
});
test('POST rejects foreign or opaque origins, cross-site markers, query strings, secrets and oversized bodies',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service}),route=f.routes.get('/api/agent_twin/action'),body={action:'set_rules',payload:{},expectedRevision:1};
  for(const headers of [{Origin:'https://evil.invalid'},{Origin:'null'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await route.fetch(request('/api/agent_twin/action',body,{headers}))).status,403);
  assert.equal((await route.fetch(request('/api/agent_twin/action?token=secret',body))).status,400);
  assert.equal((await route.fetch(request('/api/agent_twin/action',{...body,payload:{slackBotToken:'synthetic-private-credential'}}))).status,400);
  assert.equal((await route.fetch(request('/api/agent_twin/action',{...body,payload:{x:'x'.repeat(100000)}}))).status,413);
  assert.equal(f.commands.length,0);await host.close();
});
test('desktop custom-scheme requests require the same authority instead of equating opaque URL origins',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service}),route=f.routes.get('/api/agent_twin/status');
  assert.equal((await route.fetch(new Request('dsh-app://app/api/agent_twin/status',{headers:{Origin:'file://elsewhere'}}))).status,403);
  assert.equal((await route.fetch(new Request('dsh-app://app/api/agent_twin/status',{headers:{Origin:'dsh-app://app'}}))).status,200);await host.close();
});
test('official SDK bridge internal Request URL checks browser Origin against preserved admitted Host authority',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service}),route=f.routes.get('/api/agent_twin/status');
  const valid=new Request('http://dsh.internal/api/agent_twin/status',{headers:{Host:'127.0.0.1:63470',Origin:'http://127.0.0.1:63470'}});
  const invalid=new Request('http://dsh.internal/api/agent_twin/status',{headers:{Host:'127.0.0.1:63470',Origin:'https://evil.invalid'}});
  assert.equal((await route.fetch(valid)).status,200);assert.equal((await route.fetch(invalid)).status,403);await host.close();
});
test('errors are generic and never return raw model/network credentials or payloads',async()=>{
  const f=fixture();f.service.command=async()=>{throw new Error('Bearer synthetic-private-api-key');};const host=createNativeHost(f.ctx,{service:f.service});
  const response=await f.routes.get('/api/agent_twin/action').fetch(request('/api/agent_twin/action',{action:'pause',payload:{},expectedRevision:1}));
  assert.ok(response.status>=400);assert.ok(!(await response.text()).includes('synthetic-private-api-key'));await host.close();
});
test('scheduler is scoped to enabled bound service, serial and disposable',async()=>{
  const f=fixture();let callback,cleared=false;const timers={setInterval:fn=>{callback=fn;return 1;},clearInterval:()=>{cleared=true;}};
  const host=createNativeHost(f.ctx,{service:f.service,timers,pollIntervalMs:1000});
  await callback();assert.equal(f.commands.length,0);
  f.setState({revision:2,project:{sessionId:'dedicated-twin',cwd:'/tmp/synthetic-project'},service:{enabled:true}});
  await callback();assert.equal(f.commands.length,1);assert.equal(f.commands[0].action,'tick');await host.close();assert.equal(cleared,true);await callback();assert.equal(f.commands.length,1);
});
test('background polling honors the configured cadence without scanning every heartbeat',async()=>{
  const f=fixture(),now=()=>new Date('2026-10-20T12:05:00Z');
  const host=createNativeHost(f.ctx,{service:f.service,now});
  f.setState({revision:2,project:{sessionId:'dedicated-twin',cwd:'/tmp/synthetic-project'},service:{enabled:true,lastTickAt:'2026-10-20T12:00:00Z'},rules:{config:{intervalMinutes:10}}});
  await host.poll();assert.equal(f.commands.length,0);
  f.setState({revision:3,project:{sessionId:'dedicated-twin',cwd:'/tmp/synthetic-project'},service:{enabled:true,lastTickAt:'2026-10-20T11:50:00Z'},rules:{config:{intervalMinutes:10}}});
  await host.poll();assert.equal(f.commands.length,1);await host.close();
});
test('status merges service runtime and reports actual native adapter readiness without revealing secrets',async()=>{
  const f=fixture();f.setState({revision:1,runtime:{executorConfigured:true,transportConfigured:true,backgroundRunning:false},service:{enabled:false}});
  const host=createNativeHost(f.ctx,{service:f.service,executor:{available:()=>false},transport:{available:()=>false}});
  const snapshot=await host.status();assert.equal(snapshot.runtime.executorConfigured,false);assert.equal(snapshot.runtime.transportConfigured,false);assert.equal(snapshot.runtime.backgroundRunning,false);await host.close();
});
test('owner explicit tick and run_once both map to the scoped service poll',async()=>{
  const f=fixture(),host=createNativeHost(f.ctx,{service:f.service}),route=f.routes.get('/api/agent_twin/action');
  assert.equal((await route.fetch(request('/api/agent_twin/action',{action:'tick',payload:{},expectedRevision:1}))).status,200);
  assert.equal((await route.fetch(request('/api/agent_twin/action',{action:'run_once',payload:{},expectedRevision:1}))).status,200);
  assert.equal(f.commands.length,2);assert.equal(f.commands[0].action,'tick');assert.equal(f.commands[1].action,'tick');await host.close();
});
test('known actionable failures get a fixed local message and no raw exception',async()=>{
  const f=fixture();f.service.command=async()=>{throw Object.assign(new Error('raw synthetic credential + /private/project'),{code:'materials_stale'});};const host=createNativeHost(f.ctx,{service:f.service});
  const result=await (await f.routes.get('/api/agent_twin/action').fetch(request('/api/agent_twin/action',{action:'distill',payload:{},expectedRevision:1}))).json();
  assert.equal(result.code,'materials_stale');assert.match(result.error,/材料/);assert.ok(!JSON.stringify(result).includes('/private/project'));await host.close();
});

function modelContext(chunks,values={}){
  const calls=[];const ctx={get:name=>({agentDefaultModel:{currentSelection:()=>({provider:'synthetic',model:'test-model'})},llm:{prepareCall:async(config,signal)=>{calls.push({config,signal});return{config,async *stream(input){calls.at(-1).input=input;for(const chunk of chunks)yield chunk;}};}},...values}[name])};return{ctx,calls};
}
const outputChunks=value=>[{type:'block-start',index:0,blockType:'text'},{type:'text-delta',index:0,text:JSON.stringify(value)},{type:'block-end',index:0,block:{type:'text',text:JSON.stringify(value)}},{type:'finish',reason:{kind:'stop'}}];
test('native executor uses current host model with bounded tools-free prompt and no Session',async()=>{
  const value={packet:{project:{title:'Synthetic',summary:'source grounded',sourceRefs:[]},materials:[],gaps:[]}},f=modelContext(outputChunks(value));
  const executor=createNativeExecutor(f.ctx);assert.deepEqual(await executor.run({kind:'organize',input:{sources:[]}}),value);
  assert.equal(f.calls[0].config.provider,'synthetic');assert.deepEqual(f.calls[0].input.tools,[]);assert.match(f.calls[0].input.system,/source|来源|证据/i);executor.close();
});
test('native executor rejects tool-call streams, truncated completion and unstructured prose',async()=>{
  for(const chunks of [[{type:'block-start',index:0,blockType:'tool-call'}],[{type:'text-delta',index:0,text:'{"output":"x"}'},{type:'finish',reason:{kind:'length'}}],[{type:'text-delta',index:0,text:'made up prose'},{type:'finish',reason:{kind:'stop'}}]]){
    const f=modelContext(chunks),executor=createNativeExecutor(f.ctx);await assert.rejects(executor.run({kind:'task',input:{request:{text:'help'},cards:[]}}));executor.close();
  }
});
test('native executor requires non-empty task output and explicit evaluation verdict',async()=>{
  for(const [kind,value] of [['task',{output:''}],['test_rules',{passed:'true'}],['test_candidate',{}]]){
    const f=modelContext(outputChunks(value)),executor=createNativeExecutor(f.ctx);await assert.rejects(executor.run({kind,input:{}}));executor.close();
  }
});
test('native executor aborts stalled adapters and stops on plugin disposal',async()=>{
  const f=modelContext([],{llm:{prepareCall:()=>new Promise(()=>{})}}),executor=createNativeExecutor(f.ctx,{timeoutMs:20});
  await assert.rejects(executor.run({kind:'task',input:{}}),/timeout|aborted/i);executor.close();await assert.rejects(executor.run({kind:'task',input:{}}),/closed/i);
});
test('model evaluations cannot pass by omitting required cases or inventing a mismatched verdict',async()=>{
  const inputs={test_candidate:{cards:[{id:'source-card'}]},test_rules:{cases:[{senderId:'U1',scope:'knowledge',action:'reply',destinationId:'C1',expected:'deny'}]}};
  for(const [kind,input] of Object.entries(inputs)){
    const f=modelContext(outputChunks({passed:true,cases:[]})),executor=createNativeExecutor(f.ctx);
    await assert.rejects(executor.run({kind,input}),/model_invalid_output/);executor.close();
  }
});
test('route invokes the native model using only request text and granted scope IDs',async()=>{
  const f=modelContext(outputChunks({scope:'workflow'})),executor=createNativeExecutor(f.ctx);
  assert.deepEqual(await executor.run({kind:'route',input:{request:{text:'How do I prepare the weekly report?'},allowedScopes:['knowledge','workflow']}}),{scope:'workflow'});
  const data=JSON.parse(f.calls[0].input.messages[0].content[0].text);assert.deepEqual(Object.keys(data).sort(),['allowedScopes','request']);assert.deepEqual(f.calls[0].input.tools,[]);executor.close();
});
test('route allows uncertainty but never accepts a model-selected scope outside the explicit allowlist',async()=>{
  for(const value of [{scope:'tool'},{scope:'workflow',extra:'private'},{scope:123}]){
    const f=modelContext(outputChunks(value)),executor=createNativeExecutor(f.ctx);await assert.rejects(executor.run({kind:'route',input:{request:{text:'help'},allowedScopes:['workflow']}}));executor.close();
  }
  const f=modelContext(outputChunks({scope:null})),executor=createNativeExecutor(f.ctx);assert.deepEqual(await executor.run({kind:'route',input:{request:{text:'unclear'},allowedScopes:['workflow']}}),{scope:null});executor.close();
});
test('route refuses accidentally supplied private cards or identity details before model invocation',async()=>{
  const f=modelContext(outputChunks({scope:'workflow'})),executor=createNativeExecutor(f.ctx);
  await assert.rejects(executor.run({kind:'route',input:{request:{text:'help'},allowedScopes:['workflow'],cards:[{content:'private'}]}}));assert.equal(f.calls.length,0);executor.close();
});
