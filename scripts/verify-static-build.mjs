import fs from "node:fs";
import path from "node:path";

const required = [
  "dist/index.html",
  "dist/manifest.webmanifest",
  "dist/sw.js",
  "dist/icons/icon.svg",
  "dist/icons/icon-192.png",
  "dist/icons/icon-512.png",
  "dist/icons/apple-touch-icon.png"
];

const missing = required.filter((file) => !fs.existsSync(path.resolve(file)));
if (missing.length > 0) {
  console.error(`Missing static build files:\n${missing.join("\n")}`);
  process.exit(1);
}

const html = fs.readFileSync("dist/index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("dist/manifest.webmanifest", "utf8"));
const sw = fs.readFileSync("dist/sw.js", "utf8");

if (!html.includes("manifest.webmanifest")) throw new Error("index.html does not reference manifest.webmanifest");
if (manifest.display !== "standalone") throw new Error("manifest display must be standalone");
if (!sw.includes("CACHE_NAME")) throw new Error("service worker cache is missing");

console.log("FlowWorks static standalone build is deployable.");
