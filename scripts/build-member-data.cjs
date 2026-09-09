'use strict';
// Prepare the protected import locally. This file and its output are excluded from Pages.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),env={window:{}};
for(const file of ['team-base','team-catalog','team-colors','team-stadiums','verified-locations'])vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data',file+'.js'),'utf8'),env);
const core=require('../assets/web-app.js');
const payload={teams:core.buildTeams(env.window),colors:env.window.FANMAP_TEAM_COLORS,stadiums:env.window.FANMAP_TEAM_STADIUMS,affiliates:env.window.FANMAP_AFFILIATES};
const dest=path.join(root,'_private');fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'member-payload.json'),JSON.stringify(payload));
console.log('Prepared protected member payload. Do not publish it or upload it as a public workflow artifact.');
