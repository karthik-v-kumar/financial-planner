const fs=require('fs');const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};global.setInterval=()=>0;global.setTimeout=f=>0;global.clearTimeout=()=>{};
eval(code+';global.X={S,taxModel,taxview,TPC,TPF};');
const X=global.X;
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(40),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};

const base=X.taxModel();
console.log('--- today: AGI below both thresholds ---');
console.log('   AGI', base.agi.toFixed(0), '| CA threshold', X.TPC().itemThresh.toLocaleString());
chk('CA phase-out', base.caPhaseout, 0);
chk('CA itemized unchanged', base.caItemized, base.caItemRaw);
console.log('   total tax', base.totalTax.toFixed(2), '(unchanged from before)');

console.log('\n--- push AGI over the CA threshold with a big gain ---');
const acct=X.S.tax.accounts[0].a;
X.S.tax.accounts[0].a = acct + 200000;
let r=X.taxModel();
const expected = Math.min(0.06*(r.agi-504411), 0.80*r.caItemRaw);
console.log('   AGI', r.agi.toFixed(0), '-> over by', (r.agi-504411).toFixed(0));
chk('CA reduction = 6% of excess', r.caPhaseout, expected);
chk('CA itemized = raw - reduction', r.caItemized, r.caItemRaw - r.caPhaseout);
console.log('   CA itemized', r.caItemRaw.toFixed(0), '->', r.caItemized.toFixed(0), '| CA tax', r.caTax.toFixed(2));

console.log('\n--- 80% cap binds at very high AGI ---');
X.S.tax.accounts[0].a = acct + 1200000;
r=X.taxModel();
chk('reduction capped at 80% of itemized', r.caPhaseout, 0.80*r.caItemRaw);
console.log('   AGI', r.agi.toFixed(0), '| 6% of excess would be', (0.06*(r.agi-504411)).toFixed(0), '| capped to', r.caPhaseout.toFixed(2));
chk('CA itemized floors at 20% of raw', r.caItemized, 0.20*r.caItemRaw);
X.S.tax.accounts[0].a = acct;

console.log('\n--- parameters are editable ---');
X.S.tax.params.ca.itemThresh = 300000;
r=X.taxModel();
console.log('   threshold lowered to 300,000 -> CA reduction', r.caPhaseout.toFixed(2), '| CA tax', r.caTax.toFixed(2));
X.S.tax.params.ca.itemThresh = 504411;
chk('restored to baseline', X.taxModel().totalTax, base.totalTax);

const v=X.taxview();
console.log('\nCA phase-out fields:', (v.match(/data-param="ca\.item/g)||[]).length);
console.log('clean:', !['undefined','NaN','[object Object]'].some(x=>v.includes(x)));
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
