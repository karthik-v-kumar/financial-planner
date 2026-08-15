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
global.window={scrollTo:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;
global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};
global.setInterval=()=>0;global.setTimeout=f=>0;global.clearTimeout=()=>{};
eval(code+';global.D=DEFAULTS;');
const D=JSON.parse(JSON.stringify(global.D));

/* ---- people ---- */
D.people[0]={key:"alex",name:"Alex",salary:142000,bonus:10000,paychecks:24,
  pre401k:0.10,post401k:0,taxRate:0.32,otherPre:5.20,otherPost:8.00,
  ytd401k:9500,checksLeft:9,bonusLeft:10000};
D.people[1]={key:"jordan",name:"Jordan",salary:128000,bonus:15000,paychecks:26,
  pre401k:0.12,post401k:0,taxRate:0.295,otherPre:14.00,otherPost:11.50,
  ytd401k:12800,checksLeft:9,bonusLeft:0};
D.notes={salary:"Annualized from current gross per paycheck",bonus:"",
  paychecks:"24 semi-monthly · 26 bi-weekly",pre401k:"Use the recommender below",
  post401k:"Mega-backdoor, if the plan allows in-plan Roth conversion",
  taxRate:"Fed + SS/Medicare + state, applied to TAXABLE pay — not gross",
  otherPre:"Per paycheck",otherPost:"Per paycheck"};

/* ---- spending: keep the shape, generic amounts ---- */
const fixedDemo={"Mortgage + interest":2850,"HOA":320,"Property tax":7200,
 "Electricity + Gas":240,"Trash":28,"Sewer":0,"Water":65,"Internet":70,"Phone":90,
 "Auto":2400,"Home":1200,"Guardian disability":0,"Umbrella":600,
 "Car loan":410,"Groceries + Costco":750};
D.fixed=D.fixed.map(i=>{
  const n=(i.n in MAP.renames)?MAP.renames[i.n]:i.n;
  return {...i,n,a:(n in fixedDemo)?fixedDemo[n]:i.a,note:i.note};
});
D.invest=[{n:"Brokerage — automatic transfer",a:2200,c:"m",note:"Biweekly recurring deposit"},{n:"Other",a:0,c:"m"}];
D.savings=[{n:"Travel fund",a:600,c:"m"}];
D.iraTotal=15000;

/* ---- tax ---- */
D.tax={...D.tax,
  grossK:142000+10000,k401kK:15200,preTaxK:250,
  grossS:128000+15000,k401kS:17160,preTaxS:0,
  interest:640,ordDiv:6800,qualDiv:4100,usGovDiv:0,
  accounts:[{n:"Brokerage A",a:18400},{n:"Brokerage B",a:-2600},{n:"Crypto",a:-4100}],
  ltPortion:6000,mortInterest:21000,propTax:7200,vlf:420,charitable:2400,
  priorFed:48200,priorCA:9100,
  fedPmts:[0,0,0,0],caPmts:[0,0,0,0],
  whK:{perYear:24,left:9,fedPer:980,caPer:265},
  whS:{perYear:26,left:9,fedPer:840,caPer:210},
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
D.nw.gains={years:["2025","2026"],rows:[{n:"Dividends",v:[5200,6800]},
 {n:"Short-term gains",v:[14000,11700]},{n:"Long-term gains",v:[22000,6000]},
 {n:"Earned income",v:[268000,295000]}]};

D.cardUse={};
D.updated=new Date().toISOString().slice(0,10);
D.dataVersion=1;

/* ---- write the demo build ---- */
let out=html;
const s=out.indexOf('const DEFAULTS = {');
// the object literal terminates at a "};" sitting in column 0
const e=out.indexOf('\n};\n', s)+4;
out=out.slice(0,s)+'const DEFAULTS = '+JSON.stringify(D,null,2)+';\n'+out.slice(e);
out=out.replace('const KEY = "finplan.v2";','const KEY = "finplan.demo";');
// Blank the Supabase config — the app falls back to browser-only storage,
// which is what a public demo should do. Never ship the project URL or key.
out=out.replace(/const SUPABASE_URL\s*=\s*"[^"]*";/,'const SUPABASE_URL      = "";');
out=out.replace(/const SUPABASE_ANON_KEY\s*=\s*"[^"]*";/,'const SUPABASE_ANON_KEY = "";');
// card art belongs to the issuers — the styled fallbacks ship instead
out=out.replace(/const CARD_IMG = \{[\s\S]*?\n\}/,'const CARD_IMG = {}');
out=out.replace('<title>Financial Plan</title>','<title>Financial Plan — Demo</title>');
out=out.replace('<span class="wm-thin">Plan</span>','<span class="wm-thin">Plan</span><span class="demoflag">Demo data</span>');
out=out.replace('.wm-year{','.demoflag{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#E3D3A0;border:1px solid rgba(227,211,160,.45);border-radius:3px;padding:3px 7px;margin-left:8px}\n  .wm-year{');
/* The live file sits one level ABOVE the repo, so the demo must be written
   into the repo (buildkit's parent) rather than next to the source. */
const OUT=process.argv[3]||process.env.DEMO_OUT||path.join(__dirname,'..','demo.html');

/* Last line of defence: never write a demo that still carries a real term.
   Card art is stripped above, but base64 can still coincidentally match, so
   scan the markup with data: URIs removed. */
const scan=out.replace(/data:image\/[^"')]+/g,'');
const leaked=(MAP.forbidden||[]).filter(t=>new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(scan));
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
