const fs=require('fs');
const path=require('path');
const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
const html=fs.readFileSync(SRC,'utf8');

/* Real labels and the terms that must never reach the demo live in an
   untracked map beside the repo root, so this script stays publishable. */
const MAP_PATH=process.env.DEMO_MAP||path.join(__dirname,'..','demo-map.local.json');
let MAP={renames:{},forbidden:[]};
if(fs.existsSync(MAP_PATH)) MAP={...MAP,...JSON.parse(fs.readFileSync(MAP_PATH,'utf8'))};
else console.warn('WARNING: no '+path.basename(MAP_PATH)+' found — real labels will not be renamed.');
const code=html.split('<script>')[1].split('</script>')[0];
const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}}):()=>{},set:()=>true});
global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
global.window={scrollTo:()=>{},addEventListener:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;
global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};
global.setInterval=()=>0;global.setTimeout=f=>0;global.clearTimeout=()=>{};
eval(code+';global.D=DEFAULTS;');
const D=JSON.parse(JSON.stringify(global.D));

/* ---- people ---- */
// Replaced wholesale, and every paystub field is set: a missing field renders
// as "undefined" in its input cell. The figures are one consistent set of
// paystubs part-way through the year — year-to-date columns that agree with
// the salary, 401k rate and paychecks already received — so the income plan,
// the 401k tracker and the tax tab's withholding all have something to show.
// Alex: semi-monthly, 18 of 24 paid, bonus still to come.
// Jordan: bi-weekly, 19 of 26 paid, a raise that landed one paycheck ago,
// bonus already paid (so it sits inside the year-to-date columns).
const stubDay=new Date(Date.now()-8*864e5).toISOString().slice(0,10);
D.people[0]={key:"alex",name:"Alex",salary:142000,newSalary:0,raiseChecks:0,bonus:10000,paychecks:24,
  pre401k:0.10,post401k:0,otherPre:5.20,otherPost:8.00,
  fedPer:905.40,caPer:318.60,ficaPer:529.54,
  ytdGross:106500,ytdFed:16297.20,ytdCA:5734.80,ytdFica:9531.72,
  bonusFedRate:0.22,bonusCARate:0.1023,stubUpdated:stubDay,
  ytd401k:10650,checksLeft:6,bonusLeft:10000};
D.people[1]={key:"jordan",name:"Jordan",salary:128000,newSalary:136000,raiseChecks:8,bonus:15000,paychecks:26,
  pre401k:0.12,post401k:0,otherPre:14.00,otherPost:11.50,
  fedPer:772.30,caPer:291.10,ficaPer:468.15,
  ytdGross:108846.15,ytdFed:17349.70,ytdCA:6888.40,ytdFica:9741.73,
  bonusFedRate:0.22,bonusCARate:0.1023,stubUpdated:stubDay,
  ytd401k:13061.54,checksLeft:7,bonusLeft:0};
D.notes={salary:"Annualized from gross per paycheck on the latest paystub",bonus:"",
  paychecks:"24 semi-monthly · 26 bi-weekly",pre401k:"Use the recommender below",
  post401k:"Mega-backdoor, if the plan allows in-plan Roth conversion",
  otherPre:"Per paycheck",otherPost:"Per paycheck"};

/* ---- spending: the same groups, a generic household ---- */
// Replaced whole, not renamed line by line: the real list is one household's
// actual subscriptions, with notes on which card covers each. A demo anyone
// can pick up carries none of that.
D.fixed=[
  {g:"Housing",       n:"Mortgage + interest",  a:2850, c:"m"},
  {g:"Housing",       n:"HOA",                  a:320,  c:"m"},
  {g:"Housing",       n:"Property tax",         a:7200, c:"y"},
  {g:"Utilities",     n:"Electricity + gas",    a:240,  c:"m"},
  {g:"Utilities",     n:"Water + sewer",        a:65,   c:"m"},
  {g:"Utilities",     n:"Trash",                a:28,   c:"m"},
  {g:"Utilities",     n:"Internet",             a:70,   c:"m"},
  {g:"Utilities",     n:"Mobile phones",        a:90,   c:"m"},
  {g:"Insurance",     n:"Auto",                 a:2400, c:"y", note:"Two cars"},
  {g:"Insurance",     n:"Home",                 a:1200, c:"y"},
  {g:"Insurance",     n:"Umbrella",             a:600,  c:"y"},
  {g:"Loans & living",n:"Car loan",             a:410,  c:"m"},
  {g:"Loans & living",n:"Groceries",            a:750,  c:"m"},
  {g:"Subscriptions", n:"Streaming bundle",     a:32,   c:"m"},
  {g:"Subscriptions", n:"Music",                a:11,   c:"m"},
  {g:"Subscriptions", n:"Cloud storage",        a:10,   c:"m"},
  {g:"Subscriptions", n:"Warehouse club",       a:65,   c:"y"},
  {g:"Subscriptions", n:"News",                 a:0,    c:"m", note:"Covered by a card credit"},
  {g:"Subscriptions", n:"Gym",                  a:45,   c:"m"}
];
D.invest=[{n:"Brokerage — automatic transfer",a:2200,c:"m",note:"Biweekly recurring deposit"},{n:"Other",a:0,c:"m"}];
D.savings=[{n:"Travel fund",a:600,c:"m"}];
D.iraTotal=15000;

/* ---- tax ---- */
// Wages, 401k and withholding are the income plan's; the tax tab reads them
// from the paystubs above rather than holding its own copy.
D.tax={...D.tax,
  interest:640,ordDiv:6800,qualDiv:4100,usGovDiv:0,
  accounts:[{n:"Brokerage A",a:18400},{n:"Brokerage B",a:-2600},{n:"Crypto",a:-4100}],
  ltPortion:6000,mortInterest:21000,propTax:7200,vlf:420,charitable:2400,
  priorFed:48200,priorCA:19300,
  fedPmts:[0,0,0,0],caPmts:[0,0,0,0],
  scenAmount:-10000,scenTerm:"ST"};

/* ---- net worth ---- */
D.nw.assets=[{n:"Home",note:"",a:640000},{n:"Land & other real estate",note:"",a:0},
 {n:"Cryptocurrency",note:"",a:8000},{n:"Jewelry & collectibles",note:"",a:12000},{n:"Cars",note:"",a:34000}];
D.nw.cash=[{n:"Cash",note:"",a:500},{n:"Checking",note:"",a:8200},{n:"Savings",note:"High-yield",a:26000},
 {n:"Roth IRA — Alex",note:"",a:41000},{n:"401k — Alex",note:"",a:88000},
 {n:"Roth IRA — Jordan",note:"",a:33000},{n:"401k — Jordan",note:"",a:71000},
 {n:"Brokerage",note:"Joint",a:186000}];
D.nw.debt=[{n:"Mortgage",note:"",a:498000},{n:"Auto loan",note:"",a:16500},
 {n:"Credit cards",note:"Statement balances",a:3200},
 {n:"Federal estimated tax",note:"",a:0},{n:"State estimated tax",note:"",a:0}];
const total=D.nw.assets.concat(D.nw.cash).reduce((t,x)=>t+x.a,0)-D.nw.debt.reduce((t,x)=>t+x.a,0);
// plausible upward-drifting history ending at the computed total
const hist=[];let v=total*0.62;const start=new Date("2024-01-15");
for(let i=0;i<34;i++){
  const d=new Date(start); d.setDate(d.getDate()+i*28);
  v*= 1 + (0.011 + (Math.sin(i*1.7)*0.016));
  hist.push([d.toISOString().slice(0,10), Math.round(v/100)*100]);
}
hist[hist.length-1]=[new Date().toISOString().slice(0,10), total];
D.nw.history=hist;

/* ---- earlier years: only the return as filed ---- */
// The years before the plan began carry six figures off the 1040 and 540.
// They feed the net worth tab's year-by-year table; 2025's taxes are the
// safe-harbor figures the tax tab measures this year against.
D.years={
  2024:{filed:{income:251000,st:9000,lt:15000,deductions:44800,fedTax:41300,caTax:16900}},
  2025:{filed:{income:289000,st:14000,lt:22000,deductions:50600,fedTax:48200,caTax:19300}}
};

/* ---- cards: a fictional wallet that exercises every credit period ---- */
D.cards=[
  {id:"travel", name:"Voyager Card", issuer:"Meridian Bank", fee:550, auFee:175, theme:"silver",
   reset:"Calendar year", offers:true, credits:[
     {n:"Rideshare credit",  amt:15,  period:"monthly",   dec:35, note:"Expires end of each month; $35 in December"},
     {n:"Streaming credit",  amt:20,  period:"monthly",   note:"Eligible services only"},
     {n:"Airline incidentals", amt:200, period:"annual",  note:"One airline, chosen each January"},
     {n:"Hotel credit",      amt:200, period:"semi",      note:"Prepaid stays of two nights or more"},
     {n:"Lounge day passes", amt:50,  period:"quarterly", note:"Two passes per quarter"}
   ]},
  {id:"dining", name:"Table Rewards", issuer:"Meridian Bank", fee:95, theme:"navy",
   reset:"Anniversary — March", offers:true, credits:[
     {n:"Dining credit",     amt:10,  period:"monthly",   note:"Restaurant charges only"},
     {n:"Grocery delivery",  amt:120, period:"annual",    basis:"anniversary", note:"Anniversary year"}
   ]},
  {id:"cash", name:"Everyday Cash", issuer:"Northgate Credit Union", fee:0, theme:"crimson", credits:[],
   flat:"3% groceries, 2% gas and transit, 1% elsewhere"},
  {id:"store", name:"Warehouse Club Card", issuer:"Northgate Credit Union", fee:0, theme:"ink", credits:[],
   flat:"4% gas, 2% at the club, 1% elsewhere", flatNote:"Fee covered by club membership"}
];
D.cardOffers={travel:[],dining:[]};
D.cardUse={};
D.updated=new Date().toISOString().slice(0,10);
// dataVersion stays the live file's. A plan older than the current version
// has its paystubs restated from these defaults on every load, with a notice
// saying so — which a demo stamped with a low version would show every time.

/* ---- write the demo build ---- */
// A replacement whose target has moved is a silent no-op, and some of these
// are what keep real data out. Every one must land or nothing is written.
const must=(re,to,what)=>{
  if(!(typeof re==='string'?out.includes(re):re.test(out))){
    console.error('ABORTED \u2014 could not find '+what+' in '+SRC+'. makedemo.js needs updating for the new source.');
    process.exit(1);
  }
  out=out.replace(re,to);
};
let out=html;
const s=out.indexOf('const DEFAULTS = {');
// the object literal terminates at a "};" sitting in column 0
const e=out.indexOf('\n};\n', s)+4;
out=out.slice(0,s)+'const DEFAULTS = '+JSON.stringify(D,null,2)+';\n'+out.slice(e);
must('const KEY = "finplan.v2";','const KEY = "finplan.demo";','the storage key');
// Blank the Supabase config — the app falls back to browser-only storage,
// which is what a public demo should do. Never ship the project URL or key.
must(/const SUPABASE_URL\s*=\s*"[^"]*";/,'const SUPABASE_URL      = "";','SUPABASE_URL');
must(/const SUPABASE_ANON_KEY\s*=\s*"[^"]*";/,'const SUPABASE_ANON_KEY = "";','SUPABASE_ANON_KEY');
// card art belongs to the issuers — the styled fallbacks ship instead
must(/const CARD_IMG = \{[\s\S]*?\n\}/,'const CARD_IMG = {}','CARD_IMG');
// The gains table the net worth tab carried before years were tracked is a
// literal in the code, not part of DEFAULTS, and it holds real figures. The
// demo's earlier years come from D.years above, so it is never needed.
must(/const LEGACY_GAINS = \{[\s\S]*?\};\n/,'const LEGACY_GAINS = null;\n','LEGACY_GAINS');
// The styled fallbacks are named after the real cards. The demo keeps four of
// the gradients under neutral names and drops the rest of the block.
const THEME={platinum:"silver",chase:"navy",boa:"crimson",capone:"ink"};
out=out.split('\n').filter(l=>!/\.theme-[a-z]+/.test(l) || Object.keys(THEME).some(k=>l.includes('.theme-'+k+'{')||l.includes('.theme-'+k+' ')))
  .map(l=>l.replace(/\.theme-([a-z]+)/g,(m,k)=>'.theme-'+(THEME[k]||k))).join('\n');
out=out.replace('<title>Financial Plan</title>','<title>Financial Plan — Demo</title>');
out=out.replace('<span class="wm-thin">Plan</span>','<span class="wm-thin">Plan</span><span class="demoflag">Demo data</span>');
// On a phone the brand and the sync light share one row with no room for the
// flag beside them, so it drops under the name instead.
out=out.replace('.wm-year{','.demoflag{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#201e1d;background:#bab6b6;border-radius:0;padding:3px 7px;margin-left:9px;white-space:nowrap}\n'
  +'  @media (max-width:820px){.demoflag{display:block;width:max-content;margin:4px 0 0;font-size:8px;padding:2px 6px}}\n  .wm-year{');
/* The live file sits one level ABOVE the repo, so the demo must be written
   into the repo (buildkit's parent) rather than next to the source. */
const OUT=process.argv[3]||process.env.DEMO_OUT||path.join(__dirname,'..','demo.html');

/* Last line of defence: never write a demo that still carries a real term.
   Card art is stripped above, but base64 can still coincidentally match, so
   scan the markup with data: URIs removed. */
const scan=out.replace(/data:image\/[^"')]+/g,'');
// Whole words only — a three-letter brand was otherwise found inside "dashboard"
const leaked=(MAP.forbidden||[]).filter(t=>new RegExp('(?<![A-Za-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![A-Za-z0-9])','i').test(scan));
// Always checked, map or no map: a JWT, or a real Supabase project subdomain.
if(/eyJ[A-Za-z0-9_-]{20,}/.test(scan)) leaked.push('JWT/anon key');
if(/https:\/\/[a-z0-9]{16,}\.supabase\.co/i.test(scan)) leaked.push('Supabase project URL');
if(leaked.length){
  console.error('ABORTED \u2014 real terms survived into the demo: '+leaked.join(', '));
  console.error('Nothing was written. Fix the sanitization in makedemo.js before publishing.');
  process.exit(1);
}

fs.writeFileSync(OUT,out);
console.log('read', SRC, '\u2192 wrote', OUT, '|', Math.round(out.length/1024),'KB (real file is', Math.round(html.length/1024)+'KB)');
console.log('leak guard: clean against', (MAP.forbidden||[]).length, 'forbidden terms + key patterns');
// The app schedules async work (a dynamic import) that has no meaning under
// Node; exit now that the file is written so it cannot fail the build.
process.exit(0);
