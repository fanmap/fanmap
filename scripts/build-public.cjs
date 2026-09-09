'use strict';
// An explicit allowlist also provides a future custom Pages deployment artifact.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'public-build');
const files=['index.html','app.html','app/index.html','site.webmanifest','favicon.ico','CNAME','robots.txt','404.html','assets/access.js','assets/access.css','assets/access-config.js','assets/web-app.js','assets/web-app.css','assets/web-launch.css','assets/vendor/leaflet.js','assets/vendor/leaflet.css','assets/vendor/leaflet.LICENSE.txt'];
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
for(const p of files){if(!fs.existsSync(path.join(root,p)))continue;fs.mkdirSync(path.dirname(path.join(dest,p)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(dest,p));}
fs.cpSync(path.join(root,'assets/brand'),path.join(dest,'assets/brand'),{recursive:true});
console.log('Public allowlist built. No location corpora, research, credentials, or server files copied.');
