const fs=require('fs');const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{},addEventListener:()=>{}};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};
eval(code+';global.Y={S,model,nwModel};');
const Y=global.Y, m=Y.model(), nw=Y.nwModel(), S=Y.S;
let fails=0;
const chk=(l,got,want,tol=0.02)=>{const ok=Math.abs(got-want)<=tol;if(!ok)fails++;console.log((ok?'  PASS ':'  FAIL '),l.padEnd(34),got.toFixed(2).padStart(12),'expect',want.toFixed(2));};

console.log('--- Person B (hand-computed) ---');
const kg=172250/26, kpre=kg*0.11, ktb=kg-kpre-22.03, ktax=ktb*0.3277, knet=ktb-ktax-16.06;
chk('gross/check',m.P[1].gross,kg); chk('401k $/check',m.P[1].preAmt,kpre);
chk('taxable',m.P[1].taxable,ktb); chk('tax',m.P[1].tax,ktax); chk('net/check',m.P[1].net,knet);
chk('net/month',m.P[1].monthly,knet*26/12);
chk('401k projected',m.P[1].total401k,18174.17+0.11*kg*9);
console.log('   room',m.P[1].room.toFixed(2),'->',m.P[1].statusText);

console.log('--- Person A (hand-computed) ---');
const sg=189000/24, spre=sg*0.12, stb=sg-spre-4.94, stax=stb*0.3632, snet=stb-stax-10;
chk('gross/check',m.P[0].gross,sg); chk('taxable',m.P[0].taxable,stb);
chk('net/check',m.P[0].net,snet); chk('net/month',m.P[0].monthly,snet*24/12);
chk('401k projected',m.P[0].total401k,14000+0.12*(sg*9+14000));

console.log('--- SPENDING (hand-computed) ---');
const base=S.fixed.map(i=>i.c==='y'?i.a/12:i.a).reduce((a,b)=>a+b,0);
chk('fixed base',m.fixedBase,base); chk('misc 15%',m.misc,base*0.15); chk('fixed total',m.fixedTotal,base*1.15);
chk('net income total',m.netTotal,snet*24/12+knet*26/12);
chk('guilt-free',m.free,(snet*24/12+knet*26/12)-base*1.15-5600-1200);
console.log('   utilities:',S.fixed.filter(i=>i.g==='Utilities').map(i=>i.n+' $'+i.a).join(', '));
console.log('   stray Gas line?',S.fixed.some(i=>i.n==='Gas')?'YES - BUG':'no');

console.log('--- NET WORTH ---');
chk('assets',nw.assets,941000); chk('cash',nw.cash,1693100); chk('debt',nw.debt,656350);
chk('total',nw.total,941000+1693100-656350);
chk('latest history = computed total',nw.hist[nw.hist.length-1][1],nw.total);

console.log('--- INTEGRITY ---');
chk('sections sum to 100%',(m.pct.fixed+m.pct.invest+m.pct.savings+m.pct.free)*100,100);
chk('savings rate',m.savingsRate*100,(m.pre401kYr+m.post401kYr+S.iraTotal+m.brokerageYr)/m.netYr*100);
console.log();
console.log(fails===0?'>>> ALL CHECKS PASSED':'>>> '+fails+' FAILURES');
console.log('SUMMARY net/mo',m.netTotal.toFixed(2),'| fixed',m.fixedTotal.toFixed(2),'('+(m.pct.fixed*100).toFixed(1)+'%) | guilt-free',m.free.toFixed(2),'| rate',(m.savingsRate*100).toFixed(1)+'%');
