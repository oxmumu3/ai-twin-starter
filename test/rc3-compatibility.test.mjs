import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
test('the installed 0.4 lineage accepts the tested official rc.3 Host and SDK peers',()=>{
 const ranges={'engines.dsh':pkg.engines.dsh,...Object.fromEntries(Object.entries(pkg.peerDependencies).filter(([name])=>name.startsWith('@deepseek-ai/dsh-')))};
 for(const [name,range]of Object.entries(ranges))assert.ok(range.split(/\s*\|\|\s*/).includes('0.2.1-rc.3'),name);
});
