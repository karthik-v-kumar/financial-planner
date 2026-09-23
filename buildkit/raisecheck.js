const X=require('./_app')(["S","model","income","checkAt"]);
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(36),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};

/* Self-deriving, like cardcheck: the raise is 8% on whatever the second
   person earns, and every expected value comes from checkAt() at the
   withholding rate the app derives, so nothing from the plan is named here. */
const who=X.S.people[1];
const keep={newSalary:who.newSalary,raiseChecks:who.raiseChecks};
who.newSalary=0; who.raiseChecks=0;

console.log('--- no raise entered: one rate all year ---');
let m=X.model(), p=m.P[1];
const flat=X.checkAt(who, who.salary, p.taxRate);
chk('net/check at the one salary', p.net, flat.net);
chk('annual = before-raise net everywhere', p.netA, p.netB);
chk('monthly = net x checks/12', p.monthly, flat.net*who.paychecks/12);
chk('combined monthly = both people', m.netTotal, m.P.reduce((t,x)=>t+x.monthly,0));

const raise=Math.round(who.salary*1.08), late=Math.min(9, who.paychecks);
console.log('\n--- '+who.name+': salary up 8% for the last '+late+' of '+who.paychecks+' checks ---');
who.newSalary=raise; who.raiseChecks=late;
m=X.model(); p=m.P[1];
const A=X.checkAt(who, who.salary, p.taxRate), B=X.checkAt(who, raise, p.taxRate);
chk('net per check before', p.netA, A.net);
chk('net per check after',  p.netB, B.net);
chk('change per check',     p.raiseDelta, B.net - A.net);
chk('checks at old rate',   p.checksA, who.paychecks - late);
chk('checks at new rate',   p.checksB, late);
chk('monthly uses current rate', p.monthly, B.net*who.paychecks/12);
console.log('   before', A.net.toFixed(2), '-> after', B.net.toFixed(2), '| +'+(B.net-A.net).toFixed(2)+'/check');

console.log('\n--- 401k projection uses the post-raise rate for remaining checks ---');
chk('grossLeft = new gross x checks left', p.grossLeft, B.gross*who.checksLeft);
console.log('   projected 401k', p.total401k.toFixed(2), '| room', p.room.toFixed(2), '|', p.statusText);

console.log('\n--- raise larger than the year, and zero-check raise ---');
who.raiseChecks = who.paychecks + 14;
chk('raiseChecks past the year is capped', X.model().P[1].checksB, who.paychecks);
who.raiseChecks = 0;
console.log('   raiseChecks 0 -> hasRaise', X.model().P[1].hasRaise, '| flagged pending', X.model().P[1].raisePending);
Object.assign(who, keep);

const v=X.income();
console.log('\nraise inputs rendered:', (v.match(/data-f="newSalary"/g)||[]).length, 'salary +', (v.match(/data-f="raiseChecks"/g)||[]).length, 'checks');
console.log('income view clean:', !['undefined','NaN','[object Object]'].some(x=>v.includes(x)));
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
