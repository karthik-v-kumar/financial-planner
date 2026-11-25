const X=require('./_app')(["S","model","nwModel"]);
const m=X.model(), nw=X.nwModel(), S=X.S;
let fails=0;
const chk=(l,got,want,tol=0.02)=>{const ok=Math.abs(got-want)<=tol;if(!ok)fails++;console.log((ok?'  PASS ':'  FAIL '),l.padEnd(34),got.toFixed(2).padStart(12),'expect',want.toFixed(2));};
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);

/* Self-deriving: every expected value is worked out here, by hand, from the
   plan's own inputs, so the test names nothing from the plan and holds for
   any household. What it checks is that the app's chain of arithmetic —
   paycheck, paystub, 401k, withholding, spending, net worth — says the same.
   Pay is a list of salary rates; which one pays which paycheck is the app's
   own placement (P.runs, tested in raisecheck.js), and every figure priced
   from it is worked out here. Year-to-date figures are the app's after it
   rolls a dated stub forward to today, which leaves an undated one as typed. */
S.people.forEach((p,i)=>{
  console.log('--- '+p.name+' ---');
  const P=m.P[i];
  const paid=P.checksPaid, left=P.checksLeft, total=P.stub.total;
  const live=P.runs.filter(r=>r.checks>0);
  const rateAt=k=>(live.find(r=>k>=r.first&&k<r.first+r.checks)||live[live.length-1]).annual;
  const grossOf=a=>a/p.paychecks, taxableOf=a=>grossOf(a)-grossOf(a)*p.pre401k-p.otherPre;
  // the withholding rate is the paystub's four lines over pay subject to tax,
  // on the stub's own paycheck: federal, California, FICA and CA SDI
  const whPer=p.fedPer+p.caPer+p.ficaPer+(p.sdiPer||0);
  const stubRate=rateAt(Math.max(1,P.anchor.checksPaid)), wr=whPer/taxableOf(stubRate);
  // the visible paycheck is the next one, at the rate in force for it
  const rate=rateAt(left>0?paid+1:total);
  const g=grossOf(rate), pre=g*p.pre401k, tb=taxableOf(rate), tax=tb*wr;
  const post=(tb-tax)*p.post401k, net=tb-tax-post-p.otherPost;
  chk('gross/check',P.gross,g); chk('401k $/check',P.preAmt,pre);
  chk('taxable',P.taxable,tb); chk('withholding rate %',P.taxRate*100,wr*100,0.0001);
  if(rate===stubRate) chk('tax = paystub withholding',P.tax,whPer);
  chk('net/check',P.net,net); chk('net/month',P.monthly,net*p.paychecks/12);
  let grossLeft=0; for(let k=paid+1;k<=total;k++) grossLeft+=grossOf(rateAt(k));
  // payroll stops taking contributions at the IRS limit
  chk('401k projected',P.total401k,Math.max(P.ytd401k,Math.min(P.ytd401k+p.pre401k*(grossLeft+p.bonusLeft),S.irsLimit)));
  chk('federal withheld for year',P.wh.fed.year,P.ytdFed+p.fedPer*left+p.bonusLeft*p.bonusFedRate);
  chk('CA withheld for year',P.wh.ca.year,P.ytdCA+p.caPer*left+p.bonusLeft*p.bonusCARate);
  chk('FICA withheld for year',P.wh.fica.year,P.ytdFica+p.ficaPer*left);
  chk('CA SDI withheld for year',P.wh.sdi.year,P.ytdSdi+(p.sdiPer||0)*left);
  let modelled=p.bonus; for(let k=1;k<=total;k++) modelled+=grossOf(rateAt(k));
  chk('gross for year',P.annualGross,P.ytdGross>0?P.ytdGross+grossLeft+p.bonusLeft:modelled);
  console.log('   room',P.room.toFixed(2),'->',P.statusText,'| paystub check:',P.stub.issue||'agrees');
});

console.log('--- SPENDING ---');
const mo=i=>i.c==='y'?i.a/12:i.a;
const base=sum(S.fixed,mo), inv=sum(S.invest,mo), sav=sum(S.savings,mo);
chk('fixed base',m.fixedBase,base); chk('buffer',m.misc,base*S.miscPct); chk('fixed total',m.fixedTotal,base*(1+S.miscPct));
chk('net income total',m.netTotal,sum(m.P,p=>p.net*p.paychecks/12));
chk('guilt-free',m.free,m.netTotal-base*(1+S.miscPct)-inv-sav);
console.log('   stray Gas line?',S.fixed.some(i=>i.n==='Gas')?'YES - BUG':'no');

console.log('--- NET WORTH ---');
const a=sum(S.nw.assets,x=>x.a), c=sum(S.nw.cash,x=>x.a), d=sum(S.nw.debt,x=>x.a);
chk('assets',nw.assets,a); chk('cash',nw.cash,c); chk('debt',nw.debt,d);
chk('total',nw.total,a+c-d);

console.log('--- INTEGRITY ---');
chk('sections sum to 100%',(m.pct.fixed+m.pct.invest+m.pct.savings+m.pct.free)*100,100);
chk('savings rate',m.savingsRate*100,(m.pre401kYr+m.post401kYr+S.iraTotal+m.brokerageYr)/m.netYr*100);
console.log();
console.log(fails===0?'>>> ALL CHECKS PASSED':'>>> '+fails+' FAILURES');
console.log('SUMMARY net/mo',m.netTotal.toFixed(2),'| fixed',m.fixedTotal.toFixed(2),'('+(m.pct.fixed*100).toFixed(1)+'%) | guilt-free',m.free.toFixed(2),'| rate',(m.savingsRate*100).toFixed(1)+'%');
