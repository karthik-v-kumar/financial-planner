const fs=require('fs');const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{},addEventListener:()=>{}};global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};
eval(code+';global.X={S,cardModel,cardsview,expiringSoon,periodsOf,currentSlot,MONTHS};');
const X=global.X, m=X.cardModel();
let f=0;const chk=(l,g,w)=>{const ok=Math.abs(g-w)<0.01;if(!ok)f++;console.log((ok?'  PASS ':'  FAIL '),l.padEnd(44),g.toFixed(2).padStart(10),'expect',w.toFixed(2));};

/* Self-deriving: every credit's expected value is the sum of its slots as
   periodsOf() lays them out, so the test names nothing from the plan and
   holds for any wallet. A December override is exercised wherever one is set. */
console.log('--- annual value per card ---');
m.cards.forEach(c=>console.log('  '+c.name.padEnd(30), 'fee', String(c.fee).padStart(5), '| credits', c.total.toFixed(2).padStart(9), '| slots', c.credits.length));
console.log('--- every credit = sum of its slots ---');
let n=0, decs=0;
m.cards.forEach((c,ci)=>{
  const src=X.S.cards[ci];
  c.credits.forEach((cr,i)=>{
    const want=X.periodsOf(src.credits[i]).reduce((t,s)=>t+s.amt,0);
    if(Math.abs(cr.total-want)>0.01){f++;console.log('  FAIL  card',ci,'credit',i,cr.total.toFixed(2),'expect',want.toFixed(2));}
    n++; if(src.credits[i].dec) decs++;
  });
  chk('card '+ci+' total = its credits', c.total, c.credits.reduce((t,x)=>t+x.total,0));
});
console.log('  checked',n,'credits,',decs,'with a December override');
console.log('--- slot shapes ---');
[['monthly',12],['quarterly',4],['semi',2],['annual',1]].forEach(([per,cnt])=>{
  const got=X.periodsOf({period:per,amt:10}).length;
  const ok=got===cnt; if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),per.padEnd(12),got,'slots, expect',cnt);
});
chk('December override honoured', X.periodsOf({period:'monthly',amt:8,dec:12}).reduce((t,s)=>t+s.amt,0), 11*8+12);
console.log('--- toggle behaviour ---');
const ci=X.S.cards.findIndex(c=>c.credits.some(x=>x.period==='monthly'));
if(ci>=0){
  const cr=X.S.cards[ci].credits.findIndex(x=>x.period==='monthly');
  const key=X.S.cards[ci].id+':'+cr+':'+X.MONTHS[new Date().getMonth()];
  const amt=X.periodsOf(X.S.cards[ci].credits[cr])[new Date().getMonth()].amt;
  const before=X.cardModel().totalUsed; X.S.cardUse[key]=true;
  chk('marking this month adds its amount', X.cardModel().totalUsed-before, amt);
  delete X.S.cardUse[key];
}
console.log('--- expiring soon ---');
X.expiringSoon().slice(0,4).forEach(x=>console.log('   '+String(x.days).padStart(3)+'d  '+('$'+x.amt).padStart(6)+'  '+x.credit.padEnd(28)+x.card));
console.log('--- totals ---');
console.log('   available', m.totalAvailable.toFixed(2), '| fees', m.totalFees.toFixed(2), '| open now', m.totalOpen.toFixed(2));
const v=X.cardsview().replace(/data:image\/[^"')]+/g,'');
console.log('   view', v.length, 'bytes,', ['undefined','NaN','[object Object]'].filter(x=>v.includes(x)).join(',')||'clean');
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
