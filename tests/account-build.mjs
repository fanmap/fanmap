import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
function run(...args){return spawnSync(process.execPath,['scripts/build-accounts.cjs',...args],{cwd:root,encoding:'utf8'});}
test('account artifact excludes every static data and open-access path',()=>{
  assert.equal(run().status,0);
  const out=path.join(root,'account-build');
  for(const p of ['assets/data','research','supabase','scripts','tests','_private','assets/open-access.js','accounts'])assert(!fs.existsSync(path.join(out,p)),p);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.match(html,/assets\/access.js/);assert(!html.includes('assets/data/'));
  const app=fs.readFileSync(path.join(out,'assets/web-app.js'),'utf8');
  assert.match(app,/FANMAP_ACCESS\?\.isAllowed/);
  assert(!app.includes("localStorage.setItem(STORAGE_KEY"));
  assert(!app.includes("u.hash='pin='"));
  const env={window:{}};vm.runInNewContext(fs.readFileSync(path.join(out,'assets/access-config.js'),'utf8'),env);
  assert.equal(env.window.FANMAP_ACCESS_CONFIG.enabled,false);
  assert.match(fs.readFileSync('index.html','utf8'),/assets\/open-access.js/);
});
test('configured build rejects a secret key',()=>{
  const r=spawnSync(process.execPath,['scripts/build-accounts.cjs','--configured'],{cwd:root,encoding:'utf8',env:{...process.env,FANMAP_SUPABASE_URL:'https://test.supabase.co',FANMAP_SUPABASE_PUBLISHABLE_KEY:'sb_secret_should_never_be_in_browser'}});
  assert.notEqual(r.status,0);
});
