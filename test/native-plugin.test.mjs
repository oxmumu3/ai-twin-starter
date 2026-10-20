import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import * as plugin from '../index.js';
import {mountNativeTwin} from '../src/native-plugin.mjs';

test('real Cordis nested native mount stays active and retains authenticated routes until disposal',async()=>{
  const directory=await realpath(await mkdtemp(join(tmpdir(),'twin-cordis-lifecycle-'))),ctx=new Context(),routes=new Map();
  ctx.provide('tools',{register:()=>()=>{}});
  ctx.provide('connection',{fetch:{register:route=>{routes.set(route.path,route);return async()=>routes.delete(route.path);}}});
  ctx.provide('workspaceRegistry',{list:()=>[]});
  ctx.provide('sessionController',{create:async()=>({sessionId:'synthetic-control'})});
  try{
    const fiber=ctx.plugin(plugin,{stateDirectory:directory});await fiber;
    const children=[...ctx.registry.entries()].flatMap(([,runtime])=>[...runtime.fibers]).filter(child=>child.parent.fiber.uid===fiber.uid);
    assert.equal(children.length,1);await children[0];assert.equal(children[0].state,2);
    const status=await routes.get('/api/agent_twin/status').fetch(new Request('http://127.0.0.1/api/agent_twin/status'));
    assert.equal(status.status,200);assert.equal((await status.json()).revision,0);
    await fiber.dispose();assert.equal(routes.size,0);
  }finally{await ctx.fiber.dispose();await rm(directory,{recursive:true,force:true});}
});
test('only trusted host service or explicit injection may replace real Slack; absent injection stays unconfigured',async()=>{
  for(const injected of [false,true]){
    const directory=await realpath(await mkdtemp(join(tmpdir(),'twin-transport-lifecycle-'))),ctx=new Context();
    ctx.provide('connection',{fetch:{register:()=>async()=>{}}});ctx.provide('workspaceRegistry',{list:()=>[]});
    if(injected)ctx.provide('agentTwinTransport',{available:()=>true,identity:async()=>({actorId:'U1',tenantId:'T1',destinations:['D1']}),read:async()=>({messages:[],cursor:null}),send:async()=>({status:'unknown'}),check:async()=>({status:'unknown'})});
    try{const runtime=await mountNativeTwin(ctx,{stateDirectory:directory});assert.equal((await runtime.host.status()).runtime.transportConfigured,injected);await runtime.close();}
    finally{await ctx.fiber.dispose();await rm(directory,{recursive:true,force:true});}
  }
});
