const X=require('./_app')(["S","model","nwModel"]);
const m=X.model(), nw=X.nwModel(), S=X.S;
let fails=0;
const chk=(l,got,want,tol=0.02)=>{const ok=Math.abs(got-want)<=tol;if(!ok)fails++;console.log((ok?'  PASS ':'  FAIL '),l.padEnd(34),got.toFixed(2).padStart(12),'expect',want.toFixed(2));};
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);

/* Self-deriving: every expected value is worked out here, by hand, from the
   plan's own inputs, so the test names nothing from the plan and holds for
   any household. What it checks is that the app's chain of arithmetic —
   paycheck, paystub, 401k, withholding, spending, net worth — says the same. */
S.people.forEach((p,i)=>{
  console.log('--- '+p.name+' ---');
  const P=m.P[i];
  const raised=p.newSalary>0 && p.raiseChecks>0;
  const rate=raised?p.newSalary:p.salary;
  const g=rate/p.paychecks, pre=g*p.pre401k, tb=g-pre-p.otherPre;
  // the withholding rate is the paystub's three lines over pay subject to tax
  const wr=(p.fedPer+p.caPer+p.ficaPer)/tb, tax=tb*wr;
  const post=(tb-tax)*p.post401k, net=tb-tax-post-p.otherPost;
  chk('gross/check',P.gross,g); chk('401k $/check',P.preAmt,pre);
  chk('taxable',P.taxable,tb); chk('withholding rate %',P.taxRate*100,wr*100,0.0001);
  chk('tax = paystub withholding',P.tax,p.fedPer+p.caPer+p.ficaPer);
  chk('net/check',P.net,net); chk('net/month',P.monthly,net*p.paychecks/12);
  chk('401k projected',P.total401k,p.ytd401k+p.pre401k*(g*p.checksLeft+p.bonusLeft));
  chk('federal withheld for year',P.wh.fed.year,p.ytdFed+p.fedPer*p.checksLeft+p.bonusLeft*p.bonusFedRate);
  chk('CA withheld for year',P.wh.ca.year,p.ytdCA+p.caPer*p.checksLeft+p.bonusLeft*p.bonusCARate);
  const checksB=raised?Math.min(p.raiseChecks,p.paychecks):p.paychecks;
  const modelled=(p.salary/p.paychecks)*(p.paychecks-checksB)+g*checksB+p.bonus;
  chk('gross for year',P.annualGross,p.ytdGross>0?p.ytdGross+g*p.checksLeft+p.bonusLeft:modelled);
  console.log('   room',P.room.toFixed(2),'->',P.statusText);
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
