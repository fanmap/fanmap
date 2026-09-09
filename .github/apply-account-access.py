from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/access.js';s=p.read_text()
old="  try { localStorage.removeItem('fanmap.web.v1'); } catch { /* Storage may be unavailable. */ }"
new="""  try {
    const previous=localStorage.getItem('fanmap.web.v1');
    const backup='fanmap.legacy.backup.v1';
    // Preserve existing user-created bookmarks/pins, but never treat them as a login.
    if(previous && !localStorage.getItem(backup))localStorage.setItem(backup,previous);
    if(!previous || localStorage.getItem(backup)===previous)localStorage.removeItem('fanmap.web.v1');
  } catch { /* If backup storage fails, keep the original; it cannot authorize access. */ }"""
assert old in s
p.write_text(s.replace(old,new))
p=root/'tests/account-browser.py';s=p.read_text();s=s.replace('assert page.evaluate("localStorage.getItem(\'fanmap.web.v1\')")==None','assert page.evaluate("localStorage.getItem(\'fanmap.web.v1\')")==None\n    assert page.evaluate("JSON.parse(localStorage.getItem(\'fanmap.legacy.backup.v1\')).pins[0].lat")==36',1);p.write_text(s)
print('Preserved existing browser saves in a non-authorizing legacy backup.')
