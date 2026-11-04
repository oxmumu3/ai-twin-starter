import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as compatibility from '../scripts/compatibility.mjs';
import {planSdk} from '../scripts/ci-sdk.mjs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const rc1='0.2.2-rc.1';
test('the new official desktop exact SDK is admitted while unknown releases remain rejected',()=>{
 assert.equal(compatibility.validateCompatibility(pkg,rc1),rc1);
 for(const version of ['0.2.2-alpha.3','0.2.2-rc.2','0.2.2','0.2.1-rc.6'])assert.throws(()=>compatibility.validateCompatibility(pkg,version),/absent/);
});
test('the rc1 carrier plan pins the official Cordis and minimum Node without relaxing budgets',async()=>{
 const plan=await planSdk(['--sdk',rc1,'--plan']);
 assert.equal(plan.dependencies['@deepseek-ai/cordis'],'4.1.0');assert.equal(plan.dependencies['@deepseek-ai/schemastery'],'3.19.0');
 assert.equal(plan.nodeMinimumVersion,'24.9.0');assert.equal(plan.otherNodeHeapMb,128);
 const old=await planSdk(['--sdk','0.2.1-rc.5','--plan']);assert.equal(old.dependencies['@deepseek-ai/cordis'],'4.0.5');
});
test('official current desktop and npm latest are independently checked without admitting next or alpha',()=>{
 assert.equal(typeof compatibility.validateOfficialTargets,'function');
 assert.deepEqual(compatibility.validateOfficialTargets(pkg,{latest:'0.2.1-rc.5',desktop:rc1}),{latest:'0.2.1-rc.5',desktop:rc1});
 for(const desktop of ['0.2.2-alpha.3','0.2.2-rc.2',undefined,''])assert.throws(()=>compatibility.validateOfficialTargets(pkg,{latest:'0.2.1-rc.5',desktop}));
 assert.throws(()=>compatibility.validateOfficialTargets(pkg,{latest:'0.2.1-rc.6',desktop:rc1}));
});
test('the official desktop feed must supply one exact version',()=>{
 assert.equal(typeof compatibility.desktopVersion,'function');
 assert.equal(compatibility.desktopVersion('version: 0.2.2-rc.1\nfiles: []\n'),rc1);
 for(const text of ['', 'version: latest\n','version: 0.2.2-rc.1\nversion: 0.2.1-rc.5\n',"version: '0.2.2-rc.1\n",'version: 0.2.2-rc.1\nversion : 0.2.1-rc.5\n'])assert.throws(()=>compatibility.desktopVersion(text));
});
test('Twin declares both exact official schemastery peers while preserving every tested older SDK',async()=>{
 assert.equal(pkg.peerDependencies['@deepseek-ai/schemastery'],'3.18.5 || 3.19.0');
 for(const version of ['0.2.1-rc.2','0.2.1-rc.3','0.2.1-rc.4','0.2.1-rc.5'])assert.equal(compatibility.validateCompatibility(pkg,version),version);
 const plan=await planSdk(['--sdk',rc1,'--plan']);assert.equal(plan.dependencies['@deepseek-ai/schemastery'],'3.19.0');
 const old=await planSdk(['--sdk','0.2.1-rc.5','--plan']);assert.equal(old.dependencies['@deepseek-ai/schemastery'],'3.18.5');
});

test('executing the official rc1 gate rejects a Node runtime below its exact minimum before installing',async()=>{
 const {assertSdkNodeVersion}=await import('../scripts/ci-sdk.mjs');assert.equal(typeof assertSdkNodeVersion,'function');
 for(const version of ['22.22.0','24.0.0','24.8.9','unknown'])assert.throws(()=>assertSdkNodeVersion(rc1,version),/24\.9\.0/);
 for(const version of ['24.9.0','24.22.1','25.0.0'])assert.equal(assertSdkNodeVersion(rc1,version),version);
 assert.equal(assertSdkNodeVersion('0.2.1-rc.5','22.22.0'),'22.22.0');
});

test('desktop version projection rejects quoted duplicate keys and malformed quote syntax',()=>{
 const parse=compatibility.desktopVersion;
 for(const key of ['version','"version"',"'version'"]){
  for(const scalar of ['0.2.2-rc.1','"0.2.2-rc.1"',"'0.2.2-rc.1'"])assert.equal(parse(`${key}: ${scalar}\nfiles: []\n`),rc1);
  for(const second of ['version','"version"',"'version'"])assert.throws(()=>parse(`${key}: 0.2.2-rc.1\n${second}: 0.2.2-rc.2\n`));
 }
 for(const feed of [
  'version: 0.2.2-rc.1\n"version": 0.2.2-rc.2\n',
  'version: 0.2.2-rc.1\n"version: 0.2.2-rc.2\n',
  'version: 0.2.2-rc.1\nversion": 0.2.2-rc.2\n',
  'version: "0.2.2-rc.1\n',"version: '0.2.2-rc.1\"\n",
  'version: 0.2.2-rc.1"\n','version: "0.2.2-rc.1" junk\n',
  'version: 0.2.2-rc.01\n','version: [0.2.2-rc.1]\n',
 ])assert.throws(()=>parse(feed));
 assert.equal(parse('\ufeff# official feed\n"version": "0.2.2-rc.1" # exact\nfiles: []\n'),rc1);
});
