import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url=process.env.FANMAP_SUPABASE_URL||'';
const key=process.env.FANMAP_SUPABASE_SERVER_KEY||'';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Set FANMAP_SUPABASE_URL.');
// Only a server-side secret or legacy service_role key may import the corpus.
let serviceRole=false;
try{serviceRole=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='service_role';}catch{}
if(!key.startsWith('sb_secret_')&&!serviceRole)throw Error('A server-only secret/service_role key is required. Never commit or publish it.');
const payload=JSON.parse(await fs.readFile(path.join(root,'_private/member-payload.json'),'utf8'));
if(!payload.teams||!Object.keys(payload.teams).length||!payload.colors||!payload.stadiums)throw Error('Build and validate the member payload first.');
const headers={apikey:key,'Content-Type':'application/json',...(serviceRole?{Authorization:'Bearer '+key}:{})};
const response=await fetch(url+'/rest/v1/fanmap_member_payload?on_conflict=id',{
  method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},
  body:JSON.stringify({id:'directory',payload,updated_at:new Date().toISOString()}),
  signal:AbortSignal.timeout(120000)
});
if(!response.ok)throw Error('Private import failed (HTTP '+response.status+'). The existing payload is unchanged unless a write completed; verify before retrying.');
const verify=await fetch(url+'/rest/v1/fanmap_member_payload?id=eq.directory&select=payload',{
  headers,cache:'no-store',signal:AbortSignal.timeout(120000)
});
if(!verify.ok)throw Error('Import verification failed (HTTP '+verify.status+').');
const rows=await verify.json();
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
if(rows.length!==1||canonical(rows[0].payload)!==canonical(payload))throw Error('Imported payload does not match the local build.');
console.log('Verified protected import: '+Object.keys(payload.teams).length+' teams. No credentials or directory contents logged.');
