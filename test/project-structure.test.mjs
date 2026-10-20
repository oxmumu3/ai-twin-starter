import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, mkdir, readFile, writeFile, lstat, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const load = () => import('../src/project-structure.mjs');
async function fixture(t) { const cwd=await realpath(await mkdtemp(join(tmpdir(),'twin-structure-')));t.after(()=>rm(cwd,{recursive:true,force:true}));await mkdir(join(cwd,'.agent-twin'));return cwd; }
test('project preparation creates a private usable structure and capture workflow',async t=>{
 const cwd=await fixture(t),{ensureProjectStructure}=await load();const result=await ensureProjectStructure(cwd,{title:'Synthetic Project',goal:'Source-backed work',mechanism:'Owner-reviewed outputs'});
 assert.equal(result.created.length,3);for(const dir of ['context','sop','skills','tools','outputs'])assert.ok((await lstat(join(cwd,'twin-project',dir))).isDirectory());
 assert.match(await readFile(join(cwd,'twin-project/PROJECT.md'),'utf8'),/Source-backed work/);
 assert.match(await readFile(join(cwd,'twin-project/CAPTURE.md'),'utf8'),/来源|判断|验收/);
});
test('managed framework updates preserve owner-edited documents and never overwrite project originals',async t=>{
 const cwd=await fixture(t),{ensureProjectStructure}=await load();await writeFile(join(cwd,'README.md'),'owner original');await ensureProjectStructure(cwd,{title:'Synthetic',goal:'Old goal',mechanism:'Review'});
 await writeFile(join(cwd,'twin-project/CAPTURE.md'),'Owner custom capture instructions');
 const result=await ensureProjectStructure(cwd,{title:'Synthetic',goal:'Updated goal',mechanism:'Review'});
 assert.match(await readFile(join(cwd,'twin-project/PROJECT.md'),'utf8'),/Updated goal/);assert.equal(await readFile(join(cwd,'twin-project/CAPTURE.md'),'utf8'),'Owner custom capture instructions');assert.ok(result.preserved.includes('CAPTURE.md'));assert.equal(await readFile(join(cwd,'README.md'),'utf8'),'owner original');
});
test('project structure refuses symlink destinations before writing',async t=>{
 const cwd=await fixture(t),outside=join(cwd,'outside');await mkdir(outside);await symlink(outside,join(cwd,'twin-project'));
 const {ensureProjectStructure}=await load();await assert.rejects(ensureProjectStructure(cwd,{title:'Synthetic',goal:'Safe',mechanism:'Review'}),/symlink|unsafe/i);
});
