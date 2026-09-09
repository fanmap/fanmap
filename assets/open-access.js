/* Temporary public mode: recover browser saves without creating or impersonating an account. */
(function(root){
  'use strict';
  const CURRENT='fanmap.web.v1', BACKUP='fanmap.legacy.backup.v1';
  function restoreLegacy(storage){
    try{
      const current=storage.getItem(CURRENT);
      // Never replace an existing browser profile, even with an older backup.
      if(current!==null)return false;
      const raw=storage.getItem(BACKUP);if(!raw)return false;
      const parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return false;
      // The app applies its normal team/pin validation. This is data, not login state.
      const data={teamKey:typeof parsed.teamKey==='string'?parsed.teamKey:'',
        myTeams:parsed.myTeams&&typeof parsed.myTeams==='object'&&!Array.isArray(parsed.myTeams)?parsed.myTeams:{},
        saved:Array.isArray(parsed.saved)?parsed.saved:[],pins:Array.isArray(parsed.pins)?parsed.pins:[]};
      storage.setItem(CURRENT,JSON.stringify(data));return true;
    }catch{return false;}
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={restoreLegacy};
  if(!root.document)return;
  try{restoreLegacy(root.localStorage);}catch{/* The app still works without persistent storage. */}
})(typeof window!=='undefined'?window:globalThis);
