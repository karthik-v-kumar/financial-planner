const X=require('./_app')(["S","taxModel","taxview","TPC","TPF"]);
let f=0;const chk=(l,g,w,tol=0.02)=>{const ok=Math.abs(g-w)<=tol;if(!ok)f++;
  console.log((ok?'  PASS ':'  FAIL '),l.padEnd(40),g.toFixed(2).padStart(12),'expect',w.toFixed(2));};

const base=X.taxModel();
console.log('--- today ---');
console.log('   AGI', base.agi.toFixed(0), '| CA threshold', X.TPC().itemThresh.toLocaleString());
const TH=X.TPC().itemThresh;
chk('CA phase-out', base.caPhaseout, Math.max(0, Math.min(0.06*(base.agi-TH), 0.80*base.caItemRaw)));
chk('CA itemized = raw - reduction', base.caItemized, base.caItemRaw - base.caPhaseout);
console.log('   total tax', base.totalTax.toFixed(2), '');

console.log('\n--- push AGI over the CA threshold with a big gain ---');
// Pushed a fixed distance past the threshold rather than by a fixed gain,
// so the test crosses it whatever the plan's own income is.
const acct=X.S.tax.accounts[0].a;
X.S.tax.accounts[0].a = acct + Math.max(0, TH - base.agi) + 100000;
let r=X.taxModel();
const expected = Math.min(0.06*(r.agi-TH), 0.80*r.caItemRaw);
console.log('   AGI', r.agi.toFixed(0), '-> over by', (r.agi-TH).toFixed(0));
chk('CA reduction = 6% of excess', r.caPhaseout, expected);
chk('CA itemized = raw - reduction', r.caItemized, r.caItemRaw - r.caPhaseout);
console.log('   CA itemized', r.caItemRaw.toFixed(0), '->', r.caItemized.toFixed(0), '| CA tax', r.caTax.toFixed(2));

console.log('\n--- 80% cap binds at very high AGI ---');
X.S.tax.accounts[0].a = acct + Math.max(0, TH - base.agi) + 1200000;
r=X.taxModel();
chk('reduction capped at 80% of itemized', r.caPhaseout, 0.80*r.caItemRaw);
console.log('   AGI', r.agi.toFixed(0), '| 6% of excess would be', (0.06*(r.agi-TH)).toFixed(0), '| capped to', r.caPhaseout.toFixed(2));
chk('CA itemized floors at 20% of raw', r.caItemized, 0.20*r.caItemRaw);
X.S.tax.accounts[0].a = acct;

console.log('\n--- parameters are editable ---');
X.S.tax.params.ca.itemThresh = 300000;
r=X.taxModel();
console.log('   threshold lowered to 300,000 -> CA reduction', r.caPhaseout.toFixed(2), '| CA tax', r.caTax.toFixed(2));
X.S.tax.params.ca.itemThresh = TH;
chk('restored to baseline', X.taxModel().totalTax, base.totalTax);

const v=X.taxview();
console.log('\nCA phase-out fields:', (v.match(/data-param="ca\.item/g)||[]).length);
console.log('clean:', !['undefined','NaN','[object Object]'].some(x=>v.includes(x)));
console.log(f===0?'\n>>> ALL CHECKS PASSED':'\n>>> '+f+' FAILURES');
