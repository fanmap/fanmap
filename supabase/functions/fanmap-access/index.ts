import { createClient } from 'npm:@supabase/supabase-js@2.115.0';
import { createHandler } from './handler.mjs';
// Service key is read only in the deployed Edge Function, never in the browser.
const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) throw new Error('Backend configuration is missing.');
const admin = createClient(url, key, {auth:{persistSession:false, autoRefreshToken:false}});
async function readPayload() {
  const {data,error} = await admin.from('fanmap_member_payload').select('payload').eq('id','directory').maybeSingle();
  if(error)throw error;return data?.payload;
}
Deno.serve(createHandler({
  async verify(token: string) {
    // getUser validates the token with Auth. Never authorize from decoded claims
    // alone, getSession(), user metadata, a browser flag, or the publishable key.
    const {data,error} = await admin.auth.getUser(token);
    if(error || !data.user)throw new Error('Invalid session.');
    const {data:profile,error:profileError} = await admin.from('fanmap_profiles').select('id').eq('id',data.user.id).maybeSingle();
    if(profileError)throw profileError;
    return {...data.user,profile:!!profile};
  },
  async rateLimit(uid: string) {
    const {data,error} = await admin.rpc('fanmap_take_request',{member_id:uid});
    if(error)throw error;return data === true;
  },
  readPayload,
  async readState(uid: string) {
    const {data,error} = await admin.from('fanmap_member_state').select('state').eq('user_id',uid).maybeSingle();
    if(error)throw error;return data?.state || {};
  },
  async saveState(uid: string,state: object) {
    const {error} = await admin.from('fanmap_member_state').upsert({user_id:uid,state,updated_at:new Date().toISOString()});
    if(error)throw error;
  },
  async readShare(id: string) {
    const {data,error} = await admin.from('fanmap_member_shares').select('pin').eq('id',id).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
    if(error)throw error;return data?.pin || null;
  },
  async createShare(uid: string,pin: object) {
    const {data,error} = await admin.from('fanmap_member_shares').insert({owner_id:uid,pin}).select('id').single();
    if(error)throw error;return data.id;
  }
}));
