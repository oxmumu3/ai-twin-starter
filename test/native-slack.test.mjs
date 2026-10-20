import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeSlack} from '../src/native-slack.mjs';

const config={destinationIds:['C123'],tenantId:'T123',actorId:'U999',ownerId:'U111'};
const token='synthetic-test-credential';
const json=value=>Response.json({ok:true,...value});
function adapter(handler,opts={}){
  const calls=[];
  const transport=createNativeSlack({readConfig:()=>({slackBotToken:token}),fetchImpl:async(url,init)=>{calls.push({method:url.split('/').at(-1),init,params:Object.fromEntries(new URLSearchParams(init.body))});return handler(calls.at(-1));},...opts});
  return{transport,calls};
}
test('credentials are required before any network and never accepted from per-command config',async()=>{
  let requests=0;const transport=createNativeSlack({readConfig:()=>({}),fetchImpl:async()=>{requests++;}});
  await assert.rejects(transport.identity({...config,botToken:token}),/credential|配置|token/i);assert.equal(requests,0);
});
test('probe confirms current bot/team and exact configured destination membership',async()=>{
  const {transport,calls}=adapter(({method})=>json(method==='auth.test'?{team_id:'T123',user_id:'U999',bot_id:'B999'}:{channel:{id:'C123',is_member:true,is_archived:false}}));
  const actual=await transport.identity(config);
  assert.equal(actual.actorId,'U999');assert.equal(actual.tenantId,'T123');assert.deepEqual(actual.destinations,['C123']);
  assert.deepEqual(calls.map(c=>c.method),['auth.test','conversations.info']);
  assert.ok(calls.every(c=>c.init.headers.Authorization===`Bearer ${token}`));
});
test('probe refuses bot identity drift and inaccessible or shared channels',async()=>{
  const {transport}=adapter(({method})=>json(method==='auth.test'?{team_id:'T777',user_id:'U999'}:{channel:{id:'C123',is_member:true}}));
  await assert.rejects(transport.identity(config),/identity|身份|tenant/i);
});
test('read establishes a no-history baseline then processes only human messages after it',async()=>{
  const {transport,calls}=adapter(({params})=>json({messages:params.oldest?[{type:'message',ts:'1002.000001',user:'U111',text:'help'},{type:'message',ts:'1001.000001',user:'U999',bot_id:'B999',text:'own'}]:[{type:'message',ts:'1000.000001',user:'U111',text:'old'}],has_more:false}));
  const baseline=await transport.read(config,{limit:5});assert.deepEqual(baseline.messages,[]);assert.ok(baseline.cursor);
  const fresh=await transport.read(config,{cursor:baseline.cursor,limit:5});
  assert.equal(fresh.messages.length,1);assert.equal(fresh.messages[0].senderId,'U111');assert.equal(fresh.messages[0].destinationId,'C123');assert.equal(fresh.messages[0].text,'help');
  assert.equal(fresh.messages[0].scope,null);assert.equal(calls.length,2);assert.equal(calls[1].params.oldest,'1000.000001');
});
test('read pagination preserves oldest watermark until remaining pages consumed',async()=>{
  let phase=0;const {transport,calls}=adapter(()=>json(++phase===1?{messages:[{type:'message',ts:'1000.000001',user:'U111',text:'base'}],has_more:false}:phase===2?{messages:[{type:'message',ts:'1003.000001',user:'U111',text:'latest'}],has_more:true,response_metadata:{next_cursor:'page2'}}:{messages:[{type:'message',ts:'1001.000001',user:'U111',text:'older'}],has_more:false}));
  let result=await transport.read(config,{limit:5});result=await transport.read(config,{cursor:result.cursor,limit:5});assert.equal(result.hasMore,true);
  result=await transport.read(config,{cursor:result.cursor,limit:5});assert.equal(calls[2].params.oldest,'1000.000001');assert.equal(calls[2].params.cursor,'page2');assert.equal(result.messages[0].text,'older');
});
test('send is at most once on unknown network outcome and uses Slack stable deduplication metadata',async()=>{
  const {transport,calls}=adapter(()=>{throw new Error(`raw ${token}`);});
  const sent=await transport.send({config,destinationId:'C123',text:'bounded reply',idempotencyKey:'delivery-1'});
  assert.equal(sent.status,'unknown');assert.equal(calls.length,1);assert.ok(!JSON.stringify(sent).includes(token));
  assert.match(calls[0].params.client_msg_id,/^[a-f0-9-]{36}$/);assert.equal(JSON.parse(calls[0].params.metadata).event_type,'agent_twin_delivery');
});
test('send refuses destinations outside explicit config before network',async()=>{
  const {transport,calls}=adapter(()=>json({channel:'C123',ts:'1002.000001'}));
  await assert.rejects(transport.send({config,destinationId:'C999',text:'no',idempotencyKey:'x'}),/destination|通道/i);assert.equal(calls.length,0);
});
test('send only reports sent when Slack returns exact destination and stable timestamp',async()=>{
  const {transport}=adapter(()=>json({channel:'C123',ts:'1002.000001'}));
  assert.deepEqual(await transport.send({config,destinationId:'C123',text:'hello',idempotencyKey:'x'}),{status:'sent',remoteId:'1002.000001'});
});
test('check finds original metadata without posting another message',async()=>{
  let metadata;const {transport,calls}=adapter(({method,params})=>{if(method==='chat.postMessage'){metadata=JSON.parse(params.metadata);return json({channel:'C123',ts:'1002.000001'});}return json({messages:[{type:'message',ts:'1002.000001',metadata}],has_more:false});});
  await transport.send({config,destinationId:'C123',text:'hello',idempotencyKey:'delivery-1'});
  const result=await transport.check({config,destinationId:'C123',idempotencyKey:'delivery-1'});
  assert.equal(result.status,'sent');assert.equal(calls.filter(c=>c.method==='chat.postMessage').length,1);
});
test('missing evidence, rate limits and invalid JSON remain unknown and raw data never leak',async()=>{
  const {transport}=adapter(()=>new Response('rate limited',{status:429}));
  assert.equal((await transport.send({config,destinationId:'C123',text:'hello',idempotencyKey:'x'})).status,'unknown');
  assert.equal((await transport.check({config,destinationId:'C123',idempotencyKey:'x'})).status,'unknown');
});
test('inbound scan and outbound allowlist remain distinct and no unrelated owner inbox is scanned',async()=>{
  const split={allowedChannelIds:['C111'],allowedDestinationIds:['D222'],tenantId:'T123',actorId:'U999'};
  const {transport,calls}=adapter(()=>json({messages:[],has_more:false}));
  await transport.read(split,{limit:30});assert.equal(calls[0].params.channel,'C111');assert.equal(calls[0].params.limit,'1');
  await assert.rejects(transport.send({config:split,destinationId:'C111',text:'no',idempotencyKey:'x'}),/destination/i);assert.equal(calls.length,1);
});
test('explicit Agent identities can collaborate while unknown bots and the twin itself stay excluded',async()=>{
  let phase=0;const {transport}=adapter(()=>json({messages:phase++===0?[{type:'message',ts:'1000.000001',user:'U111',text:'base'}]:[{type:'message',subtype:'bot_message',bot_id:'B555',user:'U555',ts:'1003.000001',text:'allowed Agent'},{type:'message',bot_id:'B666',user:'U666',ts:'1002.000001',text:'unknown bot'},{type:'message',bot_id:'B999',user:'U999',ts:'1001.000001',text:'self'}],has_more:false}));
  const selected={...config,allowedBotSenderIds:['U555','U999']};let result=await transport.read(selected,{limit:5});result=await transport.read(selected,{cursor:result.cursor,limit:5});
  assert.deepEqual(result.messages.map(message=>message.senderId),['U555']);
});
