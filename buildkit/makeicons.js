#!/usr/bin/env node
/* Regenerates the served app icons from the brand pack in brand/: the
   Compound mark, a white curve rising to a red dot over a grey baseline on a
   black tile. brand/ is the source of record; this only re-draws the sizes
   the browsers and iOS ask for from its SVGs.

   Usage:  node buildkit/makeicons.js [outdir]

   Rasterising is done by qlmanage, which is part of macOS, so there is no
   dependency to install. Each PNG is drawn at 4x and resampled down by sips,
   which keeps the small sizes clean. */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const BRAND = path.join(__dirname, "..", "brand");
// Full-bleed square: iOS and the PWA round the corners themselves
const FULL = fs.readFileSync(path.join(BRAND, "app-icon-fullbleed.svg"), "utf8");
// Rounded tile: the browser tab, which does not
const ROUNDED = fs.readFileSync(path.join(BRAND, "app-icon-rounded.svg"), "utf8");
// Android and Chrome crop a maskable icon to a circle 80% across, so the art
// is drawn at 88% around the centre to keep the baseline's ends inside it.
const inner = FULL.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const MASKABLE = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">`
  + `<rect width="100" height="100" fill="#000000"/><g transform="translate(6 6) scale(0.88)">${inner}</g></svg>`;
const at = (src, size) => src.replace(/width="1024" height="1024"/, `width="${size}" height="${size}"`);

const OUT = path.resolve(process.argv[2] || ".");
const TMP = fs.mkdtempSync("/tmp/icons-");
const SPEC = [
  ["apple-touch-icon.png",      180,  FULL],
  ["apple-touch-icon-167.png",  167,  FULL],
  ["apple-touch-icon-152.png",  152,  FULL],
  ["icon-192.png",              192,  FULL],
  ["icon-512.png",              512,  FULL],
  ["icon-512-maskable.png",     512,  MASKABLE],
  ["icon-1024.png",            1024,  FULL],
  ["favicon-32.png",             32,  ROUNDED],
  ["favicon-16.png",             16,  ROUNDED],
];

// The scalable masters: the manifest's icon, and the browser tab's
fs.writeFileSync(path.join(OUT, "icon.svg"), FULL);
fs.writeFileSync(path.join(OUT, "favicon.svg"), ROUNDED);
fs.copyFileSync(path.join(BRAND, "web", "favicon.ico"), path.join(OUT, "favicon.ico"));

for(const [name, size, art] of SPEC){
  const src = path.join(TMP, name.replace(/\.png$/,"") + ".svg");
  fs.writeFileSync(src, at(art, size*4));
  execFileSync("qlmanage", ["-t","-s",String(size*4),"-o",TMP,src], {stdio:"ignore"});
  const raw = path.join(TMP, path.basename(src) + ".png");
  if(!fs.existsSync(raw)) throw new Error("qlmanage produced nothing for " + name);
  const dest = path.join(OUT, name);
  execFileSync("sips", ["-z",String(size),String(size),raw,"--out",dest], {stdio:"ignore"});
  console.log("  " + name.padEnd(26) + size + "x" + size + "  " +
              (fs.statSync(dest).size/1024).toFixed(1) + " KB");
}
fs.rmSync(TMP, {recursive:true, force:true});
console.log("  icon.svg, favicon.svg      scalable masters");
console.log("  favicon.ico                copied from brand/web");
