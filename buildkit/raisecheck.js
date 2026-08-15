const fs=require('fs');const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};global.setInterval=()=>0;global.setTimeout=f=>0;global.clearTimeout=()=>{};
eval(code+';global.X={S,model,income,spend,checkAt};');
const X=global.X;
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(36),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};

console.log('--- no raise entered: behaves exactly as before ---');
let m=X.model();
chk('Person B net/check', m.P[1].net, 3933.18);
chk('combined net/mo',   m.netTotal, 17321.64);
chk('monthly = current-rate net x checks/12', m.P[1].monthly, m.P[1].netB*26/12);

console.log('\n--- Person B: base salary -> 185,000 for the last 9 of 26 checks ---');
X.S.people[1].newSalary = 185000;
X.S.people[1].raiseChecks = 9;
m = X.model();
const p = m.P[1];
const A = X.checkAt(X.S.people[1], X.S.people[1].salary), B = X.checkAt(X.S.people[1], 185000);
chk('net per check before', p.netA, A.net);
chk('net per check after',  p.netB, B.net);
chk('change per check',     p.raiseDelta, B.net - A.net);
chk('checks at old rate',   p.checksA, 17);
chk('checks at new rate',   p.checksB, 9);
chk('annual net = 17 old + 9 new', p.annualNet, A.net*17 + B.net*9);
chk('annual net blends both rates', p.annualNet, A.net*17 + B.net*9);
chk('monthly uses current rate', p.monthly, B.net*26/12);
console.log('   before', A.net.toFixed(2), '-> after', B.net.toFixed(2), '| +'+(B.net-A.net).toFixed(2)+'/check');
console.log('   monthly', p.monthly.toFixed(2), '| annual net', p.annualNet.toFixed(2));

const fwd=X.model();
X.S.incomeBasis='forward';

console.log('\n--- 401k projection uses the post-raise rate for remaining checks ---');
chk('grossLeft = new gross x 9', p.grossLeft, B.gross*9);
console.log('   projected 401k', p.total401k.toFixed(2), '| room', p.room.toFixed(2), '|', p.statusText);

console.log('\n--- raise larger than the year, and zero-check raise ---');
X.S.people[1].raiseChecks = 40;
console.log('   raiseChecks 40 of 26 -> checksB', X.model().P[1].checksB, '(capped)');
X.S.people[1].raiseChecks = 0;
console.log('   raiseChecks 0 -> hasRaise', X.model().P[1].hasRaise, '(falls back to single rate)');
X.S.people[1].newSalary=0;

const v=X.income();
console.log('\nraise inputs rendered:', (v.match(/data-f="newSalary"/g)||[]).length, 'salary +', (v.match(/data-f="raiseChecks"/g)||[]).length, 'checks');
console.log('basis selector:', /data-basis="1"/.test(v));
console.log('income view clean:', !['undefined','NaN','[object Object]'].some(x=>v.includes(x)));
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
