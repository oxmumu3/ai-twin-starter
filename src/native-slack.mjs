/** Real Slack Web API adapter. Secrets exist only in the native configuration closure.
 * There are no message retries, text-based delivery guesses or global-channel scans.
 */
import {createHash} from 'node:crypto';

const API='https://slack.com/api/';
const ID=/^[A-Z][A-Z0-9]{1,79}$/;
const TS=/^\d{1,16}\.\d{1,10}$/;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const digest=value=>createHash('sha256').update(value).digest('hex');
const failure=code=>Object.assign(new Error(`Slack ${code}; check native connection settings.`),{code});
const channels=(config,kind='all')=>{
  const inbound=config?.allowedChannelIds??config?.destinationIds??config?.allowedDestinationIds;
  const outbound=config?.allowedDestinationIds??config?.destinationIds??config?.allowedChannelIds;
  const values=kind==='in'?inbound:kind==='out'?outbound:Array.isArray(inbound)&&Array.isArray(outbound)?[...new Set([...inbound,...outbound])]:null;
  if(!Array.isArray(values)||!values.length||values.length>(kind==='in'?10:kind==='out'?16:26)||values.some(id=>!ID.test(id))||new Set(values).size!==values.length)throw failure('invalid_destinations');
  return [...values];
};
function keyFor(value){if(typeof value!=='string'||!value||value.length>300)throw failure('invalid_delivery_key');return digest(value);}
function destination(config,id){if(!channels(config,'out').includes(id))throw failure('destination_not_authorized');return id;}
function uuid(key){const value=keyFor(key);return`${value.slice(0,8)}-${value.slice(8,12)}-5${value.slice(13,16)}-a${value.slice(17,20)}-${value.slice(20,32)}`;}
function cursorFor(config,cursor){
  const ids=channels(config,'in'),fingerprint=digest(JSON.stringify(ids));
  if(cursor===undefined||cursor===null)return{version:1,fingerprint,index:0,channels:{}};
  if(!object(cursor)||cursor.version!==1||cursor.fingerprint!==fingerprint||!Number.isInteger(cursor.index)||cursor.index<0||cursor.index>=ids.length||!object(cursor.channels)||Buffer.byteLength(JSON.stringify(cursor))>16384)throw failure('cursor_changed');
  for(const [id,row] of Object.entries(cursor.channels))if(!ids.includes(id)||!object(row)||!TS.test(row.latest??'')||(row.high!==undefined&&!TS.test(row.high))||(row.next!==undefined&&(typeof row.next!=='string'||row.next.length>2000)))throw failure('invalid_cursor');
  return structuredClone(cursor);
}

export function createNativeSlack({readConfig=()=>({}),fetchImpl=globalThis.fetch,timeoutMs=20000,now=()=>new Date()}={}){
  if(typeof fetchImpl!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw failure('invalid_runtime');
  const lifecycle=new AbortController();
  async function request(method,parameters={},signal){
    if(lifecycle.signal.aborted)throw failure('closed');
    let secret;try{const configured=readConfig();const value=configured?.slackBotToken;secret=typeof value?.get==='function'?value.get():value;}catch{throw failure('credential_unavailable');}
    if(typeof secret!=='string'||!secret.trim()||secret.length>16384)throw failure('credential_missing');
    const operation=AbortSignal.any([lifecycle.signal,AbortSignal.timeout(timeoutMs),...(signal?[signal]:[])]);
    let response;try{response=await fetchImpl(`${API}${method}`,{method:'POST',redirect:'error',signal:operation,headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},body:new URLSearchParams(Object.entries(parameters).map(([key,value])=>[key,String(value)]))});}catch{throw failure('network_unknown');}
    if(!response?.ok)throw failure(response?.status===429?'rate_limited':'http_unconfirmed');
    let raw,data;try{raw=await response.text();if(Buffer.byteLength(raw)>2*1024*1024)throw new Error();data=JSON.parse(raw);}catch{throw failure('response_unconfirmed');}
    if(!object(data)||data.ok!==true){const code=['invalid_auth','not_authed','token_revoked','token_expired','account_inactive','missing_scope','channel_not_found','not_in_channel','is_archived','msg_too_long','invalid_arguments','restricted_action'].includes(data?.error)?data.error:'api_unconfirmed';throw failure(code);}
    return data;
  }
  async function auth(config,signal){
    const result=await request('auth.test',{},signal);
    if(!ID.test(result.team_id??'')||!ID.test(result.user_id??''))throw failure('invalid_identity');
    if(config?.tenantId&&config.tenantId!==result.team_id||config?.actorId&&config.actorId!==result.user_id)throw failure('identity_changed');
    return{actorId:result.user_id,tenantId:result.team_id,...(ID.test(result.bot_id??'')?{botId:result.bot_id}:{})};
  }
  return{
    available(){try{const value=readConfig()?.slackBotToken,token=typeof value?.get==='function'?value.get():value;return!lifecycle.signal.aborted&&typeof token==='string'&&Boolean(token.trim())&&token.length<=16384;}catch{return false;}},
    async identity(config,{signal}={}){
      const ids=channels(config),identity=await auth(config,signal);
      for(const id of ids){
        const result=await request('conversations.info',{channel:id},signal),channel=result.channel;
        if(!object(channel)||channel.id!==id||channel.is_archived===true||channel.is_ext_shared===true||!(channel.is_member===true||channel.is_im===true))throw failure('destination_inaccessible');
      }
      return{...identity,destinations:ids};
    },
    async read(config,{cursor,limit=10,signal}={}){
      if(!Number.isInteger(limit)||limit<1||limit>30)throw failure('invalid_limit');
      limit=Math.min(limit,15);
      const ids=channels(config,'in'),state=cursorFor(config,cursor),id=ids[state.index],row=state.channels[id];
      const params={channel:id,limit,...(row?{oldest:row.latest,inclusive:false,...(row.next?{cursor:row.next}:{})}:{limit:1})};
      const result=await request('conversations.history',params,signal);
      if(!Array.isArray(result.messages)||result.messages.length>limit||typeof result.has_more!=='boolean')throw failure('invalid_history');
      const valid=result.messages.filter(message=>object(message)&&TS.test(message.ts??''));
      const high=valid.reduce((value,message)=>Number(message.ts)>Number(value)?message.ts:value,row?.high??row?.latest??'0.000000');
      const next=result.response_metadata?.next_cursor??'';
      if(typeof next!=='string'||next.length>2000||result.has_more===true&&!next)throw failure('pagination_unavailable');
      const baseline=!row;
      const latest=baseline?(high==='0.000000'?`${Math.floor(new Date(now()).getTime()/1000)}.000000`:high):row.latest;
      state.channels[id]=!baseline&&next?{latest,high,next}:{latest:baseline?latest:high};
      if(baseline||!next)state.index=(state.index+1)%ids.length;
      const messages=[];
      if(!baseline)for(const message of valid.slice().reverse()){
        const bot=Boolean(message.bot_id)||message.subtype==='bot_message';
        const allowedAgent=bot&&Array.isArray(config?.allowedBotSenderIds)&&config.allowedBotSenderIds.includes(message.user);
        if(message.type!=='message'||message.subtype&&message.subtype!=='bot_message'||bot&&!allowedAgent||!ID.test(message.user??'')||message.user===config?.actorId||typeof message.text!=='string'||!message.text.trim())continue;
        if(Buffer.byteLength(message.text)>65536)throw failure('message_too_large');
        if(message.thread_ts!==undefined&&!TS.test(message.thread_ts))throw failure('invalid_thread');
        messages.push({messageId:message.ts,senderId:message.user,destinationId:id,text:message.text,scope:null,action:'reply',threadId:message.thread_ts??message.ts});
      }
      return{messages,cursor:state,hasMore:!baseline&&Boolean(next)};
    },
    async send({config,destinationId,text,idempotencyKey,threadId,signal}={}){
      destination(config,destinationId);
      if(typeof text!=='string'||!text.trim()||text.length>12000||threadId!==undefined&&!TS.test(threadId))throw failure('invalid_message');
      const parameters={channel:destinationId,text,client_msg_id:uuid(idempotencyKey),metadata:JSON.stringify({event_type:'agent_twin_delivery',event_payload:{deliveryKey:keyFor(idempotencyKey)}}),unfurl_links:false,unfurl_media:false,...(threadId?{thread_ts:threadId}:{})};
      try{
        const result=await request('chat.postMessage',parameters,signal);
        return result.channel===destinationId&&TS.test(result.ts??'')?{status:'sent',remoteId:result.ts}:{status:'unknown'};
      }catch(error){return{status:['invalid_auth','not_authed','token_revoked','token_expired','account_inactive','missing_scope','channel_not_found','not_in_channel','is_archived','msg_too_long','invalid_arguments','restricted_action'].includes(error?.code)?'failed':'unknown'};}
    },
    async check({config,destinationId,idempotencyKey,remoteId,signal}={}){
      destination(config,destinationId);const key=keyFor(idempotencyKey);
      if(remoteId!==undefined&&!TS.test(remoteId))throw failure('invalid_remote_id');
      try{
        const result=await request('conversations.history',{channel:destinationId,limit:15,include_all_metadata:true,...(remoteId?{oldest:remoteId,latest:remoteId,inclusive:true}:{})},signal);
        const match=Array.isArray(result.messages)&&result.messages.find(message=>TS.test(message?.ts??'')&&message?.metadata?.event_type==='agent_twin_delivery'&&message.metadata.event_payload?.deliveryKey===key&&(!remoteId||message.ts===remoteId));
        return match?{status:'sent',remoteId:match.ts}:{status:'unknown'};
      }catch{return{status:'unknown'};}
    },
    close(){lifecycle.abort();},
  };
}
