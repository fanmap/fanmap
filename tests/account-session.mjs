import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sessionId} from '../supabase/functions/fanmap-access/session.mjs';
const sid='055dcf51-021b-4ff8-aa55-3bd9261208be';
const token=claims=>'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
test('verified-token session binding rejects malformed and wrong-owner claims',()=>{
  assert.equal(sessionId(token({sub:'a',session_id:sid}),'a'),sid);
  for(const t of ['bad',token({sub:'b',session_id:sid}),token({sub:'a'}),token({sub:'a',session_id:'forged'})])assert.equal(sessionId(t,'a'),null);
});
