const X=require('./_app')(["S","model","income","checkAt","nthPayday","YEAR"]);
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(40),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};
const count=(l,g,w)=>chk(l,g,w,0);

/* Self-deriving, like cardcheck: the raise is 8% on whatever the second
   person earns, dated the way a real one is, and every expected value comes
   from checkAt() at the withholding rate the app derives, so nothing from the
   plan is named here. Pay is a list of salary rates, each from the date of the
   first paycheck paid at it; see rateRuns(). Paychecks are counted against
   the year's own paydays: on a real pay calendar a year can hold one more
   than the paychecks a year the pay is divided by. */
const who=X.S.people[1], Y=X.YEAR, n=who.paychecks;
const keep=JSON.parse(JSON.stringify(who.rates));
const base=keep[0].annual;

console.log('--- one rate all year ---');
who.rates=[{annual:base,from:""}];
let m=X.model(), p=m.P[1];
const total=p.stub.total;
const flat=X.checkAt(who, base, p.taxRate);
count('runs', p.runs.length, 1);
count('paychecks in it', p.runs[0].checks, p.stub.total);
chk('net/check at the one rate', p.net, flat.net);
chk('monthly = net x checks/12', p.monthly, flat.net*n/12);
chk('combined monthly = both people', m.netTotal, m.P.reduce((t,x)=>t+x.monthly,0));
if(p.hasRaise){f++;console.log('  FAIL  one rate reads as a raise');}

const raise=Math.round(base*1.08), late=Math.min(9, total);
const from=X.nthPayday(who, Y, total-late+1);
console.log('\n--- '+who.name+': a rate 8% higher from '+from+', the last '+late+' of '+total+' paychecks ---');
who.rates=[{annual:base,from:""},{annual:raise,from}];
m=X.model(); p=m.P[1];
const A=X.checkAt(who, base, p.taxRate), B=X.checkAt(who, raise, p.taxRate);
const [rA,rB]=p.runs;
count('paychecks at the first rate', rA.checks, total-late);
count('paychecks at the new rate', rB.checks, late);
count('the new rate starts at paycheck', rB.first, total-late+1);
chk('net per check before', rA.net, A.net);
chk('net per check after', rB.net, B.net);
// monthly is what the rate paying the next paycheck brings in
const next=p.checksLeft>0?p.checksPaid+1:p.stub.total;
chk('monthly uses the rate in force now', p.monthly, (next>=rB.first?B:A).net*n/12);
console.log('   before', A.net.toFixed(2), '-> after', B.net.toFixed(2), '| +'+(B.net-A.net).toFixed(2)+'/check');

console.log('\n--- the 401k projection prices each paycheck left at its own rate ---');
let left=0; for(let k=p.checksPaid+1;k<=p.stub.total;k++) left+=(k>=rB.first?B:A).gross;
chk('gross left = each check at its rate', p.grossLeft, left);
console.log('   projected 401k', p.total401k.toFixed(2), '| room', p.room.toFixed(2), '|', p.statusText);

console.log('\n--- a second raise: three rates, three runs ---');
const third=Math.round(raise*1.05), from3=X.nthPayday(who, Y, total-2);
who.rates=[{annual:base,from:""},{annual:raise,from},{annual:third,from:from3}];
p=X.model().P[1];
count('runs', p.runs.length, 3);
count('their paychecks fill the year', p.runs.reduce((t,r)=>t+r.checks,0), p.stub.total);
count('the third rate pays the last 3', p.runs[2].checks, 3);

console.log('\n--- a rate with no date waits, flagged, and changes nothing ---');
who.rates=[{annual:base,from:""},{annual:raise,from:""}];
p=X.model().P[1];
count('rates waiting for a date', p.pendingRates.length, 1);
count('runs', p.runs.length, 1);
chk('net/check unchanged', p.net, flat.net);

console.log('\n--- a rate dated after the year pays none of it ---');
who.rates=[{annual:base,from:""},{annual:raise,from:(Y+1)+"-01-15"}];
p=X.model().P[1];
count('paychecks at the new rate', p.runs[1].checks, 0);
chk('net/check unchanged', p.net, flat.net);
who.rates=keep;

const v=X.income();
const clean=!['undefined','NaN','[object Object]'].some(x=>v.includes(x)); if(!clean) f++;
console.log('\nrate inputs rendered:', (v.match(/data-f="annual"/g)||[]).length, 'rates +', (v.match(/data-f="from"/g)||[]).length, 'dates');
console.log('income view clean:', clean);
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
