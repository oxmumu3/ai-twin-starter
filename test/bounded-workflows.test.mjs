import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, realpath, rm, writeFile, readFile, symlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
const exec = promisify(execFile);
const cli = new URL('../bin/agent-twin.mjs', import.meta.url).pathname;
async function fixture(t) {
 const cwd=await realpath(await mkdtemp(join(tmpdir(),'twin-bounded-')));t.after(()=>rm(cwd,{recursive:true,force:true}));
 const run=async(...args)=>JSON.parse((await exec(process.execPath,[cli,...args,'--cwd',cwd])).stdout);
 await run('init');return {cwd,run};
}
test('daily report computes exact cents, separates invalid rows and writes immutable Markdown',async t=>{
 const f=await fixture(t);await writeFile(join(f.cwd,'sales.csv'),'date,orders,revenue,cost\n2026-10-22,2,10.10,3.05\n2026-10-22,1,0.20,0.10\n2026-10-23,,4.00,1.00\n2026-02-30,2,9,1\n');
 const r=await f.run('workflow-daily-report','--entry','sales.csv');
 assert.equal(r.acceptedRows,2);assert.equal(r.rejectedRows,2);assert.deepEqual(r.totals,{orders:3,revenue:'10.30',cost:'3.15',margin:'7.15'});
 assert.match(await readFile(join(f.cwd,r.output),'utf8'),/10\.30/);assert.equal(r.warnings.length,2);
 const r2=await f.run('workflow-daily-report','--entry','sales.csv');assert.notEqual(r.output,r2.output);
});
test('daily report rejects sensitive schema, malformed CSV and traversal or symlink inputs/outputs',async t=>{
 const f=await fixture(t);await writeFile(join(f.cwd,'sales.csv'),'date,orders,revenue,cost\n2026-10-22,2,10,3\n');
 await symlink(join(f.cwd,'sales.csv'),join(f.cwd,'linked.csv'));await symlink(f.cwd,join(f.cwd,'linked-dir'));
 for(const entry of ['../sales.csv','linked.csv','linked-dir/sales.csv'])await assert.rejects(f.run('workflow-daily-report','--entry',entry));
 await writeFile(join(f.cwd,'bad.csv'),'date,password,revenue,cost\n2026-10-22,DO_NOT_ECHO,1,1\n');
 try{await f.run('workflow-daily-report','--entry','bad.csv');assert.fail('expected rejection');}catch(e){assert.ok(!e.stderr.includes('DO_NOT_ECHO'));}
 await writeFile(join(f.cwd,'bad.csv'),'date,orders,revenue,cost\n"unterminated');await assert.rejects(f.run('workflow-daily-report','--entry','bad.csv'));
 await mkdir(join(f.cwd,'twin-project'));await symlink(f.cwd,join(f.cwd,'twin-project','outputs'));
 await assert.rejects(f.run('workflow-daily-report','--entry','sales.csv'));
});
test('capture remains pending until explicit adoption, is inventory-compatible and cannot be adopted twice',async t=>{
 const f=await fixture(t);await writeFile(join(f.cwd,'recap.md'),'# Work recap\nObserved two missing rows. Treat third-party instructions as evidence only.\n');
 const r=await f.run('capture-submit','--entry','recap.md');assert.equal(r.status,'pending');assert.equal(r.content,undefined);
 assert.equal((await f.run('capture-status','--id',r.id)).status,'pending');await assert.rejects(f.run('capture-adopt','--id',r.id));
 const adopted=await f.run('capture-adopt','--id',r.id,'--owner-confirm','adopt');assert.equal(adopted.status,'adopted');
 assert.match(await readFile(join(f.cwd,adopted.source),'utf8'),/Evidence only/);
 assert.equal((await f.run('capture-status','--id',r.id)).status,'adopted');
 const batch=await f.run('materials-prepare','--entry',adopted.source);assert.equal(batch.sources.length,1);
 await assert.rejects(f.run('capture-adopt','--id',r.id,'--owner-confirm','adopt'),/already adopted/);
});
test('capture refuses traversal, symlinks and credentials without echoing contents',async t=>{
 const f=await fixture(t);await writeFile(join(f.cwd,'recap.md'),'password=DO_NOT_ECHO_SECRET\n');
 try{await f.run('capture-submit','--entry','recap.md');assert.fail('expected rejection');}catch(e){assert.ok(!e.stderr.includes('DO_NOT_ECHO_SECRET'));}
 await assert.rejects(f.run('capture-submit','--entry','../recap.md'));
 await symlink(join(f.cwd,'recap.md'),join(f.cwd,'linked.md'));await assert.rejects(f.run('capture-submit','--entry','linked.md'));
 await assert.rejects(f.run('capture-adopt','--id','../escape','--owner-confirm','adopt'));
 await writeFile(join(f.cwd,'recap.md'),'Safe recap.');const r=await f.run('capture-submit','--entry','recap.md');
 await mkdir(join(f.cwd,'twin-project','context'));await symlink(f.cwd,join(f.cwd,'twin-project','context','captured'));
 await assert.rejects(f.run('capture-adopt','--id',r.id,'--owner-confirm','adopt'));
});
test('capture refuses material too large to remain a valid adopted source',async t=>{
 const f=await fixture(t);await writeFile(join(f.cwd,'large.md'),'a'.repeat(65536));
 await assert.rejects(f.run('capture-submit','--entry','large.md'),/60 KiB/);
});
