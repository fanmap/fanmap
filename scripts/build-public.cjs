'use strict';
// Explicit public-mode allowlist; never copy backend credentials or private imports.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'public-build');
const files=['index.html','app.html','app/index.html','site.webmanifest','favicon.ico','CNAME','robots.txt','404.html','assets/open-access.js','assets/web-app.js','assets/web-app.css','assets/web-launch.css','assets/vendor/leaflet.js','assets/vendor/leaflet.css','assets/vendor/leaflet.LICENSE.txt',...['team-base','team-catalog','team-colors','team-stadiums','verified-locations'].map(x=>'assets/data/'+x+'.js')];
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
for(const p of files){if(!fs.existsSync(path.join(root,p)))throw new Error('Missing public asset: '+p);fs.mkdirSync(path.dirname(path.join(dest,p)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(dest,p));}
fs.cpSync(path.join(root,'assets/brand'),path.join(dest,'assets/brand'),{recursive:true});
console.log('Built public app, public directory, maps and sharing. Account/backend code excluded.');
