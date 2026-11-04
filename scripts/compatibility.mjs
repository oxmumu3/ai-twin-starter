import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const matrixVersions=JSON.parse(readFileSync(new URL('../compatibility.json',import.meta.url),'utf8'));
const sdkPeers=["@deepseek-ai/dsh-tools", "@deepseek-ai/dsh-llm"];
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
// These contracts intentionally enumerate validated prereleases. Never bypass
// Host admission or silently widen compatibility after an upstream release.
export function validateCompatibility(metadata,version,verified=matrixVersions){
 if(!Array.isArray(verified)||!verified.length||verified.length>20||new Set(verified).size!==verified.length||verified.some(v=>typeof v!=='string'||!/^0\.\d+\.\d+-(?:rc|alpha)\.\d+$/.test(v)))throw Error('Invalid SDK matrix');
 const listed=range=>typeof range==='string'?range.split(/\s*\|\|\s*/).sort():[];
 const exact=range=>JSON.stringify(listed(range))===JSON.stringify([...verified].sort());
 if(!exact(metadata.engines?.dsh)||sdkPeers.some(name=>!exact(metadata.peerDependencies?.[name]))||Object.entries(metadata.devDependencies??{}).some(([name,range])=>name.startsWith('@deepseek-ai/dsh-')&&!exact(range)))throw Error('Host and all SDK peers must exactly match the tested matrix');
 if(!verified.includes(version))throw Error('Official version is absent from the tested matrix: '+version);
 if(!/^0\.\d+\.\d+-(?:rc|alpha)\.\d+$/.test(version))throw Error('Invalid exact SDK version');
 const admits=range=>typeof range==='string'&&range.split(/\s*\|\|\s*/).includes(version);
 if(!admits(metadata.engines?.dsh))throw Error('Latest official SDK is outside validated host compatibility: '+version);
 for(const [name,range] of Object.entries(metadata.peerDependencies??{}))if(name.startsWith('@deepseek-ai/dsh-')&&!admits(range))throw Error('Required peer is outside validated compatibility: '+name+' '+version);
 return version;
}
export function desktopVersion(feed){
 if(typeof feed!=='string'||Buffer.byteLength(feed)>256*1024)throw Error('Invalid official Desktop feed');
 const values=[];
 // Project only supported top-level YAML fields; quoted version keys are the
 // same key, so a second spelling cannot hide an ambiguous release target.
 for(const line of feed.replace(/^\ufeff/,'').split(/\r?\n/)){
  if(!line.trim()||/^[ \t#]/.test(line))continue;
  const field=/^(?:([A-Za-z_][A-Za-z0-9_-]*)|("version"|'version'))[ \t]*:[ \t]*(.*)$/.exec(line);
  if(!field)throw Error('Unsupported official Desktop feed syntax');
  if((field[1]??field[2].slice(1,-1))==='version')values.push(field[3]);
 }
 if(values.length!==1)throw Error('Official Desktop feed must supply one unambiguous exact version');
 const scalar=/^(?:"([^"]+)"|'([^']+)'|([^\s#]+))(?:[ \t]+#[^\r\n]*)?[ \t]*$/.exec(values[0]);
 if(!scalar)throw Error('Invalid official Desktop version scalar');
 const version=scalar.slice(1).find(value=>value!==undefined);
 const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
 if(!semver.test(version)||version.split('+',1)[0].split('-').slice(1).join('-').split('.').some(value=>/^0\d+$/.test(value)))throw Error('Invalid exact official Desktop version');
 return version;
}
export function validateOfficialTargets(metadata,{latest,desktop}={}){
 validateCompatibility(metadata,latest);validateCompatibility(metadata,desktop);
 return {latest,desktop};
}
async function main(){
 const metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
 let version=process.argv[2];
 if(version==='--matrix'){validateCompatibility(metadata,matrixVersions.at(-1));console.log(JSON.stringify({sdk:matrixVersions}));return;}
 if(version==='--latest'){
  const urls=['https://registry.npmjs.org/@deepseek-ai%2fdsh','https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml'];
  const responses=await Promise.all(urls.map(url=>fetch(url,{signal:AbortSignal.timeout(15000)})));
  for(const response of responses)if(!response.ok)throw Error('Official version lookup failed: '+response.status);
  const registry=await responses[0].json(),desktop=desktopVersion(await responses[1].text());
  const targets=validateOfficialTargets(metadata,{latest:registry['dist-tags']?.latest,desktop});
  console.log(JSON.stringify({supportedOfficialVersion:targets.latest,officialDesktopVersion:targets.desktop,compatibilityOverride:false}));return;
 }
 validateCompatibility(metadata,version);console.log(JSON.stringify({supportedOfficialVersion:version,compatibilityOverride:false}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
