// Call only AFTER Auth getUser verifies this exact token. Decoding only binds
// the verified user to an existing server-side session; it never authorizes.
export function sessionId(token, userId) {
  try {
    const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const claims=JSON.parse(atob(part.padEnd(Math.ceil(part.length/4)*4,'=')));
    if(claims.sub!==userId || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(claims.session_id||''))return null;
    return claims.session_id;
  } catch { return null; }
}
