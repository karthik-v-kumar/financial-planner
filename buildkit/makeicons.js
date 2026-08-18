#!/usr/bin/env node
/* Regenerates the app icons from one source: the mark the masthead already
   draws. Ink ground, a paper polyline going up, a red square at the apex —
   square caps and miter joins, since the system has no rounded corners.
   Writes an SVG master plus every PNG the browsers and iOS ask for.

   Usage:  node buildkit/makeicons.js [outdir]

   Rasterising is done by qlmanage, which is part of macOS, so there is no
   dependency to install. Each PNG is drawn at 4x and resampled down by sips,
   which keeps the small sizes clean. */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const INK = "#201e1d", PAPER = "#f3f2f2", RED = "#ec3013";
// The masthead path, in its native 40x40 space
const FULL = [[7,28],[13,25],[17,29],[22,20],[27,21],[33,12]];
// Below about 32px the six points collapse into a smudge, so the favicons
// take the same rise in three segments. Same mark, optically sized.
const LITE = [[7,28],[15,24],[21,28],[33,12]];
const SQ = {x:30, y:9, w:6, h:6};
// Drawn a little heavier than the masthead's 2.6, which is ordinary optical
// compensation at icon sizes rather than a second logo.
const SW = 3.1;

function svg(size, pts, frac){
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  const x0 = Math.min(...xs) - SW/2;
  const x1 = Math.max(SQ.x + SQ.w, Math.max(...xs) + SW/2);
  const y0 = Math.min(SQ.y, Math.min(...ys) - SW/2);
  const y1 = Math.max(...ys) + SW/2;
  const bw = x1-x0, bh = y1-y0;
  const s = (size*frac)/bw;
  const tx = (size - bw*s)/2 - x0*s, ty = (size - bh*s)/2 - y0*s;
  const d = pts.map(([x,y],i)=>(i?"L":"M")+x+" "+y).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${INK}"/>
<g transform="translate(${tx.toFixed(4)},${ty.toFixed(4)}) scale(${s.toFixed(6)})">
<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="${SW}" stroke-linecap="square" stroke-linejoin="miter"/>
<rect x="${SQ.x}" y="${SQ.y}" width="${SQ.w}" height="${SQ.h}" fill="${RED}"/>
</g>
</svg>
`;
}

const OUT = path.resolve(process.argv[2] || ".");
const TMP = fs.mkdtempSync("/tmp/icons-");
const SPEC = [
  ["apple-touch-icon.png",      180,  FULL, .74],
  ["apple-touch-icon-167.png",  167,  FULL, .74],
  ["apple-touch-icon-152.png",  152,  FULL, .74],
  ["icon-192.png",              192,  FULL, .74],
  ["icon-512.png",              512,  FULL, .74],
  // Android crops a maskable icon to a circle, so the mark pulls well inside
  ["icon-512-maskable.png",     512,  FULL, .52],
  ["icon-1024.png",            1024,  FULL, .74],
  ["favicon-32.png",             32,  LITE, .80],
  ["favicon-16.png",             16,  LITE, .80],
];

// The scalable master, for the SVG favicon and for anything drawn later
fs.writeFileSync(path.join(OUT,"icon.svg"), svg(512, FULL, .74));

for(const [name, size, pts, frac] of SPEC){
  const src = path.join(TMP, name.replace(/\.png$/,"") + ".svg");
  fs.writeFileSync(src, svg(size*4, pts, frac));
  execFileSync("qlmanage", ["-t","-s",String(size*4),"-o",TMP,src], {stdio:"ignore"});
  const raw = path.join(TMP, path.basename(src) + ".png");
  if(!fs.existsSync(raw)) throw new Error("qlmanage produced nothing for " + name);
  const dest = path.join(OUT, name);
  execFileSync("sips", ["-z",String(size),String(size),raw,"--out",dest], {stdio:"ignore"});
  console.log("  " + name.padEnd(26) + size + "x" + size + "  " +
              (fs.statSync(dest).size/1024).toFixed(1) + " KB");
}
fs.rmSync(TMP, {recursive:true, force:true});
console.log("  icon.svg" + " ".repeat(19) + "scalable master");
