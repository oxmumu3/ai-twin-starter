import { constants } from 'node:fs';
import { lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';

const hash=value=>createHash('sha256').update(value).digest('hex');
const directories=['context','sop','skills','tools','outputs'];
const bounded=async path=>{
 const stat=await lstat(path);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>65536)throw new Error('Unsafe project structure document');
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{return await file.readFile('utf8');}finally{await file.close();}
};
async function directory(path){
 try{await mkdir(path,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}
 const stat=await lstat(path);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Unsafe project structure directory or symlink');
}
async function atomic(path,value){
 const tmp=path+'.'+randomUUID()+'.tmp';let file;
 try{file=await open(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await file.writeFile(value);await file.sync();await file.close();file=null;await rename(tmp,path);}finally{await file?.close();await unlink(tmp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}

/** Create only plugin-owned project assets; preserve independently edited files. */
export async function ensureProjectStructure(cwd,{title,goal,mechanism}){
 const state=join(cwd,'.agent-twin');const stat=await lstat(state);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Unsafe project state directory');
 const root=join(cwd,'twin-project');await directory(root);for(const name of directories)await directory(join(root,name));
 const manifestPath=join(root,'.structure-manifest.json');let manifest={version:1,files:{}};
 try{manifest=JSON.parse(await bounded(manifestPath));if(manifest.version!==1||!manifest.files||typeof manifest.files!=='object')throw new Error('Unsafe project structure manifest');}catch(error){if(error.code!=='ENOENT')throw error;}
 const docs={
  'PROJECT.md':`# ${title}\n\n## 项目目标\n\n${goal}\n\n## 核心机制与验收\n\n${mechanism}\n\n## 当前状态\n\n由所有者在工作中持续补充；缺失信息保留为待确认。\n`,
  'INDEX.md':'# 项目沉淀索引\n\n- PROJECT.md：项目目标、核心机制与验收标准。\n- context/：事实背景、来源、决策及复盘。\n- sop/：高频工作的输入、步骤、异常和验收。\n- skills/：可复用能力说明与适用边界。\n- tools/：工具连接、权限、调用说明与已验证状态。\n- outputs/：可复用成果、大礼包与原始依据索引。\n- CAPTURE.md：每次工作结束后的确认与归档方式。\n\n项目资料归项目所有；分身只使用明确选取并复核采用的来源版本。\n',
  'CAPTURE.md':'# 每次工作后的沉淀\n\n1. 记录本次任务、输入来源及交付物位置。\n2. 将新增事实与背景归入 context，保留时间、原始依据和仍未知的部分。\n3. 将重要判断写清依据、适用条件与替代方案。\n4. 重复工作整理到 sop 或 skills：输入、步骤、异常、权限和验收标准。\n5. 工具放 tools：区分可用、待授权、待开发；调用成功与业务交付分别验收。\n6. 产出及大礼包放 outputs，并更新索引；先提出建议，由所有者确认后归档。\n7. 新材料不会自动覆盖已采用的分身能力；回到分身能力页复核受影响的范围。\n\n本流程是已生成的工作规范，不代表插件会自动监听全部聊天或改写你的资料。\n',
 };
 const result={root:'twin-project',directories:[...directories],created:[],updated:[],preserved:[],files:Object.keys(docs)};
 for(const [name,content] of Object.entries(docs)){
  const path=join(root,name);let previous;
  try{previous=await bounded(path);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(previous!==undefined&&manifest.files[name]!==hash(previous)){result.preserved.push(name);continue;}
  if(previous!==content){await atomic(path,content);result[previous===undefined?'created':'updated'].push(name);}manifest.files[name]=hash(content);
 }
 await atomic(manifestPath,JSON.stringify(manifest,null,2)+'\n');return result;
}
