'use strict';
// Opt-in artifact; never changes the temporary open-access entry point.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'account-build');
const configured=process.argv.includes('--configured');
const url=process.env.FANMAP_SUPABASE_URL||'',key=process.env.FANMAP_SUPABASE_PUBLISHABLE_KEY||'';
if(configured && (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)))throw Error('Configured build requires a project URL and publishable key. Secret and service-role keys are forbidden.');
const files=['app.html','app/index.html','site.webmanifest','favicon.ico','CNAME','robots.txt','404.html','assets/access.js','assets/access.css','assets/access-config.js','assets/web-app.css','assets/web-launch.css','assets/vendor/leaflet.js','assets/vendor/leaflet.css','assets/vendor/leaflet.LICENSE.txt'];
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
for(const file of files){fs.mkdirSync(path.dirname(path.join(dest,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(dest,file));}
fs.copyFileSync(path.join(root,'accounts/index.html'),path.join(dest,'index.html'));
fs.copyFileSync(path.join(root,'accounts/web-app.js'),path.join(dest,'assets/web-app.js'));
fs.cpSync(path.join(root,'assets/brand'),path.join(dest,'assets/brand'),{recursive:true});
if(configured)fs.writeFileSync(path.join(dest,'assets/access-config.js'),'window.FANMAP_ACCESS_CONFIG=Object.freeze('+JSON.stringify({enabled:true,url,publishableKey:key})+');\n');
else {
  const env={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dest,'assets/access-config.js'),'utf8'),env);
  if(env.window.FANMAP_ACCESS_CONFIG.enabled!==false)throw Error('Default preview must stay disabled. Use --configured explicitly.');
}
fs.writeFileSync(path.join(dest,'.nojekyll'),'');
console.log('Built account-build with '+(configured?'configured':'disabled')+' authentication; no data, research, server files or open-access runtime included.');
