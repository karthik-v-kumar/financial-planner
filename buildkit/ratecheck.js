const fs=require('fs');const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};global.setInterval=()=>0;global.setTimeout=f=>0;global.clearTimeout=()=>{};
eval(code+';global.X={S,taxModel,taxview,TPF,TPC,TP,saltCapAt,saltFloorAt};');
const X=global.X;
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(38),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};

const base=X.taxModel();
console.log('--- baseline is internally consistent ---');
const wagesExp=(X.S.tax.grossK||0)||0; // gross now derives from the income plan
chk('AGI = wages + investment income', base.agi, base.wages + X.S.tax.interest + X.S.tax.ordDiv + base.netCap);
chk('federal = ord + pref + niit + addmed', base.fedTax, base.fedOrd+base.fedPref+base.niit+base.addMed);
chk('CA taxable = AGI - usgov - deduction', base.caTaxable, base.agi - X.S.tax.usGovDiv - base.caDeduction);
chk('total = federal + California', base.totalTax, base.fedTax + base.caTax);
console.log();

console.log('--- editing parameters actually moves the answer ---');
X.S.tax.params.fed.std = 40000;
console.log('  std deduction 32,200 -> 40,000 : deduction now', X.taxModel().fedDeduction.toFixed(0), '(itemized still wins:', X.taxModel().useItemized+')');
X.S.tax.params.fed.std = 70000;
const bigStd=X.taxModel();
console.log('  std deduction -> 70,000        : deduction', bigStd.fedDeduction.toFixed(0), 'itemized wins?', bigStd.useItemized, '| federal', bigStd.fedTax.toFixed(0));
X.S.tax.params.fed.std = 32200;

X.S.tax.params.fed.ord[3][1] = 0.28;   // 24% -> 28%
const hi=X.taxModel();
console.log('  24% bracket -> 28%             : federal', hi.fedTax.toFixed(0), 'vs', base.fedTax.toFixed(0), '| marginal', (hi.marginal*100).toFixed(1)+'%');
X.S.tax.params.fed.ord[3][1] = 0.24;

X.S.tax.params.ca.ord[5][1] = 0.10;    // CA 9.3% -> 10%
const ca=X.taxModel();
console.log('  CA 9.3% -> 10%                 : California', ca.caTax.toFixed(0), 'vs', base.caTax.toFixed(0));
X.S.tax.params.ca.ord[5][1] = 0.093;

X.S.tax.params.fed.saltCap = 10000;
const salt=X.taxModel();
console.log('  SALT cap 40,400 -> 10,000      : deduction', salt.fedDeduction.toFixed(0), '| federal', salt.fedTax.toFixed(0));
X.S.tax.params.fed.saltCap = 40400;

X.S.tax.params.fed.niitRate = 0.05;
console.log('  NIIT 3.8% -> 5%                : NIIT', X.taxModel().niit.toFixed(0), 'vs', base.niit.toFixed(0));
X.S.tax.params.fed.niitRate = 0.038;

console.log();
console.log('--- restored to baseline ---');
const back=X.taxModel();
chk('total back to baseline', back.totalTax, base.totalTax, 0.001);
chk('SALT floor-at derived', X.saltFloorAt(), 505000+(40400-10000)/0.30);
console.log();
console.log('--- next year: swap in hypothetical 2027 figures ---');
X.S.tax.params.year=2027; X.S.tax.params.fed.std=33200; X.S.tax.params.fed.saltCap=40800;
const y27=X.taxModel(), v27=X.taxview();
console.log('  year label in view:', /2027 rates/.test(v27));
console.log('  total tax at 2027 params:', y27.totalTax.toFixed(2));
X.S.tax.params.year=2026; X.S.tax.params.fed.std=32200; X.S.tax.params.fed.saltCap=40400;

const v=X.taxview();
console.log();
console.log('view', Math.round(v.length/1024),'KB,', ['undefined','NaN','[object Object]'].filter(x=>v.includes(x)).join(',')||'clean');
console.log('editable param fields:', (v.match(/data-param=/g)||[]).length, '| bracket cells:', (v.match(/data-brk=/g)||[]).length, '| ltcg cells:', (v.match(/data-ltcg=/g)||[]).length);
console.log('withholding label fixed:', /Projected year-end withholding/.test(v));
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
