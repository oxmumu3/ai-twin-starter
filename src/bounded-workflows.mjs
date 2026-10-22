import { join, extname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { assertNoCredentials } from './distill.mjs';
import { projectRoot, explicitPath, privateDirectory, readBounded, exclusiveWrite } from './material-capture.mjs';
function parseCsv(content){
 const rows=[];let row=[],field='',quoted=false,closed=false;
 const finish=()=>{row.push(field);field='';closed=false;};
 for(let i=0;i<content.length;i++){
  const c=content[i];if(quoted){if(c==='"'){if(content[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field||closed)throw new Error('Malformed CSV quoting');quoted=true;}
  else if(c===','){finish();}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&content[i+1]==='\n')i++;finish();rows.push(row);row=[];if(rows.length>1001)throw new Error('CSV exceeds 1000 data rows');}
  else{if(closed)throw new Error('Malformed CSV quoting');field+=c;}
 }
 if(quoted)throw new Error('Malformed CSV quoting');if(field||row.length||closed){finish();rows.push(row);}if(rows.length>1001)throw new Error('CSV exceeds 1000 data rows');return rows;
}
const money=n=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
const cents=value=>{if(!/^\d{1,12}(?:\.\d{1,2})?$/.test(value))return null;const [whole,frac='']=value.split('.');return BigInt(whole)*100n+BigInt(frac.padEnd(2,'0'));};
export async function runDailyReport(cwd,entry){
 explicitPath(entry);if(extname(entry).toLowerCase()!=='.csv')throw new Error('Select an explicit CSV input');
 const root=await projectRoot(cwd),content=await readBounded(join(root,entry),262144);assertNoCredentials(content,'CSV input');
 const rows=parseCsv(content.replace(/^\uFEFF/,''));if(JSON.stringify(rows.shift())!==JSON.stringify(['date','orders','revenue','cost']))throw new Error('CSV header must be exactly date,orders,revenue,cost; other fields are refused');
 const days=new Map(),warnings=[];let acceptedRows=0;const total={orders:0,revenue:0n,cost:0n};
 for(let i=0;i<rows.length;i++){
  const row=rows[i];let code;
  if(row.length!==4)code='column_count';else if(row.some(v=>!v.trim()))code='missing_value';
  const [date,ordersText,revenueText,costText]=row;
  if(!code&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))code='invalid_date';
  const revenue=cents(revenueText??''),cost=cents(costText??'');
  if(!code&&(!/^\d{1,9}$/.test(ordersText)||revenue===null||cost===null))code='invalid_nonnegative_number';
  if(code){warnings.push({row:i+2,code});continue;}
  const orders=Number(ordersText),day=days.get(date)??{orders:0,revenue:0n,cost:0n};day.orders+=orders;day.revenue+=revenue;day.cost+=cost;days.set(date,day);total.orders+=orders;total.revenue+=revenue;total.cost+=cost;acceptedRows++;
 }
 if(!acceptedRows)throw new Error('CSV contains no valid data rows');
 const totals={orders:total.orders,revenue:money(total.revenue),cost:money(total.cost),margin:money(total.revenue-total.cost)};
 const lines=[`# Local daily business report`,'','Only accepted rows are included. Currency/unit is inherited from the input and must be consistent. Margin is revenue minus cost. Duplicate rows are additive; this workflow does not infer unique orders.','',`Accepted rows: ${acceptedRows}; rejected rows: ${warnings.length}.`,'','| Date | Orders | Revenue | Cost | Margin |','| --- | ---: | ---: | ---: | ---: |'];
 for(const [date,d] of [...days.entries()].sort(([a],[b])=>a.localeCompare(b)))lines.push(`| ${date} | ${d.orders} | ${money(d.revenue)} | ${money(d.cost)} | ${money(d.revenue-d.cost)} |`);
 lines.push(`| Total | ${totals.orders} | ${totals.revenue} | ${totals.cost} | ${totals.margin} |`,'','## Validation warnings','',...(warnings.length?warnings.map(w=>`- Row ${w.row}: ${w.code}; excluded from totals.`):['None.']),'');
 await privateDirectory(join(root,'twin-project'));await privateDirectory(join(root,'twin-project','outputs'));const runId=randomUUID(),output=`twin-project/outputs/daily-report-${runId}.md`;await exclusiveWrite(join(root,output),lines.join('\n'));
 return {workflow:'daily-report',runId,output,inputSha256:createHash('sha256').update(content).digest('hex'),acceptedRows,rejectedRows:warnings.length,warnings,totals,mode:'local-cli',externalActions:false};
}
