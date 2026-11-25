/* Loads the app's script under Node with just enough of a browser stubbed in
   for it to build its plan and run its calculations. Timers never fire and
   storage is empty, so the plan is the file's own DEFAULTS. names lists the
   top-level bindings the caller wants handed back. */
const fs=require('fs');
module.exports=(names)=>{
  const SRC=process.argv[2]||process.env.PLANNER_SRC||'finance-planner.html';
  const html=fs.readFileSync(SRC,'utf8');
  // The page has more than one script: a one-line theme loader in the head
  // runs before anything paints, and the app follows. The app is the one that
  // holds the plan's defaults.
  const app=html.split('<script>').slice(1).map(s=>s.split('</script>')[0]).find(s=>s.includes('const DEFAULTS = {'));
  if(!app) throw new Error('No script in '+SRC+' holds the plan defaults');
  // The Supabase address is blanked so the app stays on-device: the tests
  // exercise the calculations, never the shared copy.
  const code=app.replace(/const SUPABASE_URL\s*=\s*"[^"]*";/,'const SUPABASE_URL = "";');
  // One inert element stands in for every node: its lookups find nothing and
  // its methods do nothing, so painting runs through without a DOM.
  const st=new Proxy({},{get:(t,k)=>(k==='style'||k==='dataset'||k==='classList')?new Proxy({},{get:()=>()=>{}})
    :k==='querySelectorAll'?()=>[]:(k==='querySelector'||k==='closest')?()=>null:()=>{},set:()=>true});
  global.document={getElementById:()=>st,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},createElement:()=>st};
  global.window={scrollTo:()=>{},addEventListener:()=>{}};global.location={href:'x',search:'',hash:'',pathname:'/'};
  global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.confirm=()=>false;
  global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};global.FileReader=class{};
  global.setInterval=()=>0;global.clearInterval=()=>{};global.setTimeout=()=>0;global.clearTimeout=()=>{};
  eval(code+';global.__app={'+names.join(',')+'};');
  return global.__app;
};
