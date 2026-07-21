<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fan Map — Find Your Fanhood</title>
<meta name="description" content="Fan Map connects college football fans to alumni chapter watch parties, tailgates, and game day crews in every city. Interactive demo — pick your school and find your fanhood.">
<meta property="og:title" content="Fan Map — Find Your Fanhood">
<meta property="og:description" content="Find your team's watch parties and tailgates anywhere. Drop a pin, text your crew, and never watch alone.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0E0E11">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Fan Map">
<link rel="apple-touch-icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAADk0lEQVR42u3c61ViQRQF4du9jERj0IAkLiegIQZJRRNwHB73cXr3V79dSl/KYiNgW4rw8fz6tWBoTpdzO/o2NAIjSfBGYiTJ3UiMJLkbkZEkdiMyksTuZMbRrOlNIzKSat3JjKRadzIjSepGZCRNkE5mJNW6kxlJUncyI0nq7lIhib7mbwdwdKU7mZEkdSczkqS2oTHHhlZnjFjpTmYkSW1yIHtyqDNGrrRCI7fQ6ozRK63QyN7QQITQ5gYSZodCw+QAqtLMDSg0QGiA0MBtQtvPUGiA0AChAUKD0EAETy7B+rx//r36a/+8vLlgK9L82W5fgQlO6HiJyU3oWInJ7UlhvMwVfr5CE1mtFZrMaq3QUwuj1godVT+1JnScHKQmdJwUpCZ0nAykJnScBLNL3cnsXIQGCK1izkdod7ZzEhomhzo7L6Hduc5dDZ8p3JDf3jjkRRBCDy/xv76O3CZHyYfde9/KucdbQGf5pVHoA0X+6XuotUIPL/PetSa0ubGrfFt93xnqr9AgNLafBqYHoWNkJjWhp96NrodCg9A4YgaYHYQGoQFCA4QGCA0QGoTGf9n7hQkvDBEahM7FCxNzXQ+FLjwDzA1Cx0hNZkIDcwg92keaRvvIGKFND1NjI/wbgxUlfKSARFbocg+390pZ+Z/gKLRaXyWRIhN6+n0Nk2PKh92Zz93duc5LaIDQquWchHZnOx+hYXKotHMR2p3vPIQmgXMQmgxkJjQIrdJuN6EBQqudOhMaIHRu9dSZ0DGykJnQILRKu12EBgit0upMaIDQ41ZRnQkdIxOZCQ1Co2Il1ZnQIDQq1lKdCQ1Co2I11ZnQMVKTmdAAoStWVJ0JDRC6Yk3VmdAAoStWVZ0JHSM1mQkNELpipdWZ0AChK1ZanQkNELpipdWZ0DFSk5nQAKErVlqdCQ0QumKl1ZnQAKErVlqdCR3/BBGEBggNQgOEBggNrCX06XJuLgMUGiA0QGjgNqHtaCRwupybQsPkAMoLbXZg9Lmh0DA5gGGENjsw8txQaORPDpXGqHVWaMzxpFClMWKdfy00qTGazCYH5pgcKo0R63xVoUmNUWS+enKQGiPIbENjrg2t0hipzjcXmtSoLPNdk4PUqCrzsizLQ3J+PL9+ueSoIPIqTwrVGpVkflhoUqOSzA9PDhMEVURerdBqjUrebCagWuOIAG5eVGJjz0fyXScCuUm8NYdtXnKTeAu+AcY0ieiZ4YMlAAAAAElFTkSuQmCC">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%239D2235'/%3E%3Cpath d='M32 14c-8 0-14 6-14 13.5C18 38 32 52 32 52s14-14 14-24.5C46 20 40 14 32 14z' fill='%23fff'/%3E%3Ccircle cx='32' cy='27' r='5.5' fill='%239D2235'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  :root{
    /* team tokens — set by JS on school select */
    --team:#9D2235;
    --team-dark:#6E1826;
    --team-soft:rgba(157,34,53,.16);
    --accent:#FFFFFF;
    /* dark system */
    --bg:#0E0E11;
    --surface:#17171C;
    --raised:#1F1F26;
    --line:rgba(255,255,255,.07);
    --text:#F2F1EF;
    --dim:#9B98A0;
    --faint:#6E6B74;
    --nav-h:64px;
    --tab-h:72px;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  @media (prefers-reduced-motion: reduce){
    html{scroll-behavior:auto;}
    *,*::before,*::after{animation:none!important;transition:none!important;}
  }
  body{background:#08080A;color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh;}
  .bebas{font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.04em;}
  button{font-family:'DM Sans',sans-serif;}
  a{color:var(--text);}
  a:focus-visible,button:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--team);outline-offset:2px;}

  /* ---------- App frame (phone-width on desktop) ---------- */
  #frame{max-width:520px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;box-shadow:0 0 60px rgba(0,0,0,.6);}
  @media(min-width:560px){
    body::before{content:"";position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 0%,var(--team-soft),transparent 70%);pointer-events:none;}
  }

  /* ---------- Icons ---------- */
  .ic{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:block;}

  /* ---------- Header ---------- */
  header{position:sticky;top:0;z-index:40;height:var(--nav-h);background:rgba(14,14,17,.88);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 18px;}
  .logo{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:.1em;}
  .logo b{color:var(--team);font-weight:400;}
  .team-pill{display:flex;align-items:center;gap:8px;background:var(--team-soft);border:1px solid var(--line);color:var(--text);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.08em;cursor:pointer;}
  .team-pill i{width:8px;height:8px;border-radius:50%;background:var(--team);display:inline-block;}

  /* ---------- Screens & tabs ---------- */
  .screen{display:none;padding-bottom:calc(var(--tab-h) + 24px);min-height:calc(100vh - var(--nav-h));}
  .screen.active{display:block;animation:rise .28s ease;}
  @keyframes rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .pad{padding:20px 18px 0;}
  .tabs{position:fixed;bottom:0;left:0;right:0;z-index:40;display:flex;justify-content:center;pointer-events:none;}
  .tabs-inner{pointer-events:auto;width:100%;max-width:520px;height:var(--tab-h);background:rgba(14,14,17,.92);backdrop-filter:blur(14px);border-top:1px solid var(--line);display:flex;align-items:stretch;}
  .tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:none;border:none;color:var(--faint);cursor:pointer;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
  .tab.on{color:var(--team);}
  .tab.on .ind{width:18px;height:3px;border-radius:2px;background:var(--team);}
  .tab .ind{width:18px;height:3px;border-radius:2px;background:transparent;margin-top:2px;}

  /* ---------- Shared components ---------- */
  .sec{margin:26px 0 12px;display:flex;align-items:baseline;justify-content:space-between;}
  .sec h2{font-family:'Bebas Neue',sans-serif;font-size:24px;font-weight:400;letter-spacing:.06em;}
  .sec .lnk{background:none;border:none;color:var(--dim);font-size:12px;font-weight:700;cursor:pointer;}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--team);color:#fff;border:none;border-radius:12px;padding:13px 20px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;}
  .btn:hover{background:var(--team-dark);}
  .btn.ghost{background:transparent;border:1px solid var(--line);color:var(--text);}
  .btn.ghost:hover{border-color:var(--team);color:var(--team);}
  .btn.sm{padding:8px 14px;font-size:12px;border-radius:10px;}
  .chiprow{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none;}
  .chiprow::-webkit-scrollbar{display:none;}
  .chip{flex:0 0 auto;background:var(--surface);border:1px solid var(--line);color:var(--dim);border-radius:999px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;}
  .chip.on{background:var(--team);border-color:var(--team);color:#fff;}
  .badge{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;border-radius:5px;padding:3px 8px;}
  .badge.v{background:rgba(56,161,105,.15);color:#5DC98B;}
  .badge.t{background:rgba(255,255,255,.07);color:var(--dim);}
  #toast{position:fixed;left:50%;bottom:calc(var(--tab-h) + 18px);transform:translateX(-50%) translateY(20px);background:var(--raised);border:1px solid var(--line);color:var(--text);padding:11px 20px;border-radius:12px;font-size:13px;opacity:0;transition:.25s;z-index:60;pointer-events:none;max-width:88%;text-align:center;}
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

  /* ---------- Welcome ---------- */
  #screen-welcome{display:none;min-height:100vh;padding:60px 24px 40px;flex-direction:column;align-items:center;text-align:center;}
  #screen-welcome.active{display:flex;}
  .w-logo{font-family:'Bebas Neue',sans-serif;font-size:60px;line-height:1;letter-spacing:.08em;}
  .w-logo b{color:var(--team);font-weight:400;}
  .w-tag{color:var(--dim);letter-spacing:.32em;text-transform:uppercase;font-size:12px;margin:10px 0 40px;}
  .w-sub{font-size:13px;color:var(--faint);margin-bottom:14px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;}
  .school-card{width:100%;max-width:360px;border-radius:18px;border:1px solid var(--line);background:var(--surface);padding:20px;display:flex;align-items:center;gap:16px;cursor:pointer;margin-bottom:14px;text-align:left;transition:transform .15s,border-color .15s;}
  .school-card:hover{transform:translateY(-2px);border-color:var(--sc,#9D2235);}
  .school-swatch{width:52px;height:52px;border-radius:14px;background:var(--sc);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--scText,#fff);}
  .school-name{font-family:'Bebas Neue',sans-serif;font-size:26px;line-height:1;}
  .school-meta{font-size:12px;color:var(--dim);margin-top:4px;}
  .w-more{font-size:12px;color:var(--faint);margin-top:18px;}

  /* ---------- Home ---------- */
  .hero{padding:34px 18px 26px;background:linear-gradient(170deg,var(--team-soft),transparent 62%);border-bottom:1px solid var(--line);}
  .hero .eyebrow{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--dim);font-weight:700;}
  .hero h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(52px,15vw,72px);line-height:.92;margin:8px 0 4px;}
  .hero h1 b{color:var(--team);font-weight:400;}
  .hero p{color:var(--dim);font-size:14px;}
  .stats{display:flex;gap:10px;margin-top:22px;}
  .stat{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;text-align:center;}
  .stat .n{font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--team);line-height:1;}
  .stat .l{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:4px;font-weight:700;}
  .support-band{display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--team);border-radius:16px;padding:16px;}
  .support-band .t{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.05em;}
  .support-band .s{font-size:13px;color:var(--dim);line-height:1.5;}
  .support-band .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;}
  .news-card{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);}
  .news-card:last-child{border-bottom:none;}
  .news-rail{width:4px;border-radius:2px;background:var(--team);flex-shrink:0;}
  .news-card .src{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--team);font-weight:700;}
  .news-card h3{font-size:15px;font-weight:600;line-height:1.35;margin:3px 0;}
  .news-card p{font-size:13px;color:var(--dim);line-height:1.5;}
  .empty{border:1px dashed var(--line);border-radius:16px;padding:22px;text-align:center;color:var(--dim);font-size:13px;line-height:1.6;}

  /* ---------- Map ---------- */
  .map-shell{margin:16px 18px 0;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:12px;}
  svg#usmap{width:100%;height:auto;display:block;}
  .us-outline{fill:#1A1A21;stroke:rgba(255,255,255,.09);stroke-width:1.4;}
  .pin{cursor:pointer;}
  .pin circle.dot{fill:var(--team);stroke:var(--bg);stroke-width:2;transition:r .15s;}
  .pin.tbd circle.dot{fill:#55525C;}
  .pin circle.halo{fill:none;stroke:var(--team);stroke-width:2;opacity:0;}
  .pin:hover circle.dot,.pin.sel circle.dot{r:9;}
  .pin.sel circle.halo{animation:halo 1.4s ease-out infinite;}
  @keyframes halo{0%{r:9;opacity:.8;}100%{r:22;opacity:0;}}
  .pin text{font-size:11px;font-weight:700;fill:var(--text);paint-order:stroke;stroke:var(--bg);stroke-width:3px;pointer-events:none;}
  .venue-sheet{margin:14px 18px 0;display:flex;flex-direction:column;gap:10px;}
  .vrow{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 14px;cursor:pointer;}
  .vrow.sel{border-color:var(--team);}
  .vrow .dot{width:9px;height:9px;border-radius:50%;background:var(--team);flex-shrink:0;}
  .vrow.tbd .dot{background:#55525C;}
  .vrow .nm{font-size:14px;font-weight:600;}
  .vrow .ct{font-size:12px;color:var(--dim);}
  .vrow .go{margin-left:auto;color:var(--team);font-size:12px;font-weight:700;white-space:nowrap;}

  /* ---------- Parties ---------- */
  .pcard{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:10px;transition:box-shadow .2s;}
  .pcard.flash{box-shadow:0 0 0 2px var(--team);}
  .pcard .head{display:flex;align-items:center;gap:10px;cursor:pointer;}
  .pcard .head-main{flex:1;min-width:0;}
  .pcard h3{font-family:'Bebas Neue',sans-serif;font-size:20px;font-weight:400;line-height:1.05;letter-spacing:.03em;}
  .pcard .venue{font-size:13px;font-weight:700;color:var(--team);margin-top:2px;}
  .pcard .chev{flex-shrink:0;color:var(--faint);transition:transform .22s;}
  .pcard.open .chev{transform:rotate(180deg);}
  .pcard .body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .24s ease;}
  .pcard.open .body{grid-template-rows:1fr;}
  .pcard .body-in{overflow:hidden;}
  .pcard .addr,.pcard .note{font-size:13px;color:var(--dim);line-height:1.5;}
  .pcard .addr{margin-top:8px;}
  .pcard .acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
  .going{background:none;border:1px solid var(--line);color:var(--dim);border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;}
  .going.on{border-color:var(--team);color:var(--team);}

  /* ---------- Tailgates ---------- */
  .timeline{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;}
  .timeline::-webkit-scrollbar{display:none;}
  .tl{flex:0 0 auto;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 16px;}
  .tl b{display:block;font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--team);font-weight:400;}
  .tl span{font-size:11px;color:var(--dim);}
  .zone{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--team);border-radius:14px;padding:13px 15px;margin-bottom:10px;}
  .zone .head{display:flex;align-items:center;gap:10px;cursor:pointer;}
  .zone .head-main{flex:1;min-width:0;}
  .zone .kind{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--team);}
  .zone h3{font-family:'Bebas Neue',sans-serif;font-size:20px;font-weight:400;margin-top:2px;}
  .zone .chev{flex-shrink:0;color:var(--faint);transition:transform .22s;}
  .zone.open .chev{transform:rotate(180deg);}
  .zone .body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .24s ease;}
  .zone.open .body{grid-template-rows:1fr;}
  .zone .body-in{overflow:hidden;}
  .zone .walk{font-size:12px;font-weight:600;margin-top:8px;}
  .zone p{font-size:13px;color:var(--dim);line-height:1.5;margin-top:4px;}
  .zone .acts{display:flex;gap:8px;margin-top:11px;}
  .mytg{background:var(--raised);border:1px solid var(--line);border-radius:16px;padding:18px;margin-top:8px;}
  .mytg h3{font-family:'Bebas Neue',sans-serif;font-size:24px;font-weight:400;}
  .mytg .sub{font-size:12px;color:var(--dim);margin:4px 0 14px;line-height:1.5;}
  .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .fgrid .full{grid-column:1/-1;}
  .fgrid label{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);font-weight:700;margin-bottom:5px;}
  .fgrid input,.fgrid select{width:100%;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--text);padding:11px 12px;font-size:14px;font-family:'DM Sans',sans-serif;}
  .mytg .btn{margin-top:12px;width:100%;}
  .tg-card{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line);border-left:4px solid var(--team);border-radius:12px;padding:13px 14px;margin-top:10px;flex-wrap:wrap;}
  .tg-card .t{font-family:'Bebas Neue',sans-serif;font-size:19px;}
  .tg-card .m{font-size:12px;color:var(--dim);}
  .tg-card.edited{border-left-color:#E0A63A;}
  .tg-card .acts2{display:flex;gap:8px;flex-wrap:wrap;}

  /* ---------- Mini map (drag pin) ---------- */
  .minimap-wrap{margin:4px 0 14px;background:var(--bg);border:1px solid var(--line);border-radius:14px;overflow:hidden;}
  #leafletMap{height:280px;width:100%;display:none;background:#0B0B0E;}
  #leafletMap.on{display:block;}
  .leaflet-container{font-family:'DM Sans',sans-serif;}
  .leaflet-control-attribution{background:rgba(14,14,17,.75)!important;color:var(--faint)!important;font-size:9px!important;}
  .leaflet-control-attribution a{color:var(--dim)!important;}
  .fm-pin{position:relative;}
  .fm-pin .p{width:22px;height:22px;border-radius:50% 50% 50% 0;background:var(--team);border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,.5);}
  .fm-pin .c{position:absolute;top:5px;left:5px;width:8px;height:8px;border-radius:50%;background:#fff;transform:none;}
  svg#miniMap{width:100%;height:auto;display:none;touch-action:none;}
  svg#miniMap.on{display:block;}
  .mm-ground{fill:#121217;}
  .mm-block{fill:#20202A;stroke:rgba(255,255,255,.10);stroke-width:1;}
  .mm-zone{fill:var(--team-soft);stroke:var(--team);stroke-width:1;stroke-dasharray:3 3;opacity:.7;}
  .mm-road{stroke:#2E2E38;stroke-width:5;fill:none;stroke-linecap:round;}
  .mm-label{font-size:9px;font-weight:700;fill:var(--dim);letter-spacing:.04em;}
  .mm-label.big{font-size:10px;fill:var(--text);}
  #mmPin{cursor:grab;}
  #mmPin.grabbing{cursor:grabbing;}
  #mmPin .head{fill:var(--team);stroke:#fff;stroke-width:1.6;}
  #mmPin .ring{fill:none;stroke:var(--team);opacity:.5;}
  .minimap-hint{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;font-size:11px;color:var(--dim);border-top:1px solid var(--line);}
  .minimap-hint b{color:var(--team);font-weight:700;}

  /* ---------- Walk-to-it overlay ---------- */
  #walkOverlay{position:fixed;inset:0;z-index:80;background:rgba(8,8,10,.96);backdrop-filter:blur(8px);display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 24px;}
  #walkOverlay.open{display:flex;}
  #walkOverlay .wo-name{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:.05em;}
  #walkOverlay .wo-zone{color:var(--dim);font-size:13px;margin-bottom:26px;}
  .compass{width:190px;height:190px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:22px;}
  .compass .n{position:absolute;top:8px;font-size:11px;font-weight:700;color:var(--faint);}
  #woArrow{transition:transform .3s ease;transform-origin:50% 50%;}
  #woArrow path{fill:var(--team);}
  #woDist{font-family:'Bebas Neue',sans-serif;font-size:44px;line-height:1;}
  #woDir{color:var(--dim);font-size:14px;margin-top:6px;min-height:20px;}
  #woStatus{color:var(--faint);font-size:12px;margin-top:14px;min-height:16px;max-width:300px;line-height:1.5;}
  #walkOverlay .row{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;justify-content:center;}

  /* ---------- More ---------- */
  .more-row{display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:11px;cursor:pointer;text-decoration:none;}
  .more-row .ic{color:var(--team);}
  .more-row .t{font-size:14px;font-weight:600;}
  .more-row .s{font-size:12px;color:var(--dim);}
  .more-row .go{margin-left:auto;color:var(--faint);}
  .fine{font-size:11px;color:var(--faint);line-height:1.6;margin:18px 4px 0;}
</style>
</head>
<body>
<div id="frame">

  <!-- WELCOME / SCHOOL SELECT -->
  <div id="screen-welcome" class="screen active">
    <div class="w-logo">FAN<b>MAP</b></div>
    <div class="w-tag">Find Your Fanhood</div>
    <div style="font-size:11px;color:var(--faint);margin:-30px 0 34px;letter-spacing:.1em;">INTERACTIVE DEMO &middot; BETA</div>
    <div class="w-sub">Choose your school</div>
    <div id="schoolList"></div>
    <div class="w-more">More schools joining soon &middot; Built on verified alumni chapter data</div>
  </div>

  <!-- APP -->
  <div id="app" style="display:none">
    <header>
      <div class="logo">FAN<b>MAP</b></div>
      <button class="team-pill" id="teamPill" aria-label="Switch school"><i></i><span id="teamPillName"></span></button>
    </header>

    <!-- HOME -->
    <div class="screen active" id="screen-home">
      <div class="hero">
        <div class="eyebrow" id="heroEyebrow"></div>
        <h1 id="heroTitle"></h1>
        <p id="heroSub"></p>
        <div class="stats" id="heroStats"></div>
      </div>
      <div class="pad">
        <div class="sec"><h2>Back the program</h2></div>
        <div class="support-band" id="supportBand"></div>
        <div class="sec"><h2>Team news</h2></div>
        <div class="card" id="newsList"></div>
      </div>
    </div>

    <!-- MAP -->
    <div class="screen" id="screen-map">
      <div class="pad" style="padding-bottom:0">
        <div class="sec" style="margin-top:16px"><h2>The watch party map</h2></div>
      </div>
      <div class="map-shell">
        <svg id="usmap" viewBox="0 0 960 560" role="img" aria-label="Map of watch party locations"></svg>
      </div>
      <div class="venue-sheet" id="venueSheet"></div>
    </div>

    <!-- PARTIES -->
    <div class="screen" id="screen-parties">
      <div class="pad">
        <div class="sec" style="margin-top:16px"><h2>Chapters &amp; venues</h2></div>
        <div class="chiprow" id="partyChips">
          <button class="chip on" data-f="all">All</button>
          <button class="chip" data-f="verified">Verified venue</button>
          <button class="chip" data-f="tbd">Announced per game</button>
        </div>
        <div id="partyList"></div>
      </div>
    </div>

    <!-- TAILGATES -->
    <div class="screen" id="screen-tailgates">
      <div class="pad">
        <div class="sec" style="margin-top:16px"><h2 id="tgTitle">Game day tailgates</h2></div>
        <div class="timeline" id="tgTimeline"></div>
        <div id="zoneList" style="margin-top:14px"></div>
        <div class="mytg">
          <h3 id="tgFormTitle">Drop your tailgate</h3>
          <div class="sub">Drag the pin to your exact spot, then text your crew — the invite carries a map link straight to your pin.</div>
          <div class="minimap-wrap">
            <div id="leafletMap" aria-label="Satellite map — drag the pin to your tailgate spot"></div>
            <svg id="miniMap" viewBox="0 0 320 300" role="img" aria-label="Stadium area map — drag the pin to your tailgate spot"></svg>
            <div class="minimap-hint"><span id="mmHint">Satellite map &middot; drag the pin or tap to place it</span><b id="mmCoords"></b></div>
          </div>
          <div class="fgrid">
            <div class="full"><label for="tgName">Tailgate name</label><input id="tgName" placeholder="e.g., The Johnson Family Tailgate" maxlength="60"></div>
            <div><label for="tgZone">Zone</label><select id="tgZone"></select></div>
            <div><label for="tgTime">Start time</label><input id="tgTime" placeholder="e.g., 8:00 AM"></div>
            <div class="full"><label for="tgSpot">Find us by</label><input id="tgSpot" placeholder="e.g., red canopy near the creek" maxlength="80"></div>
          </div>
          <button class="btn" id="tgAdd">Add tailgate</button>
          <button class="btn ghost" id="tgCancelEdit" style="width:100%;margin-top:8px;display:none">Cancel editing</button>
          <div id="tgList"></div>
        </div>
      </div>
    </div>

    <!-- MORE -->
    <div class="screen" id="screen-more">
      <div class="pad">
        <div class="sec" style="margin-top:16px"><h2>More</h2></div>
        <div id="moreLinks"></div>
        <button class="more-row" id="switchSchool" style="width:100%;text-align:left">
          <svg class="ic" viewBox="0 0 24 24"><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/><path d="M14 5l-4 14"/></svg>
          <div><div class="t">Switch school</div><div class="s">Change your team</div></div>
          <span class="go">&rsaquo;</span>
        </button>
        <p class="fine" id="finePrint"></p>
      </div>
    </div>

    <!-- TABS -->
    <nav class="tabs" aria-label="App navigation">
      <div class="tabs-inner">
        <button class="tab on" data-s="home">
          <svg class="ic" viewBox="0 0 24 24"><path d="M3 11.2L12 4l9 7.2"/><path d="M5.5 10.5V20h13v-9.5"/></svg>
          Home<span class="ind"></span>
        </button>
        <button class="tab" data-s="map">
          <svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.3-6.5-10a6.5 6.5 0 1 1 13 0C18.5 15.7 12 21 12 21z"/><circle cx="12" cy="10.8" r="2.4"/></svg>
          Map<span class="ind"></span>
        </button>
        <button class="tab" data-s="parties">
          <svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="16.8" cy="9.2" r="2.3"/><path d="M15.8 14.6c2.3.3 4 1.7 4.7 4.4"/></svg>
          Parties<span class="ind"></span>
        </button>
        <button class="tab" data-s="tailgates">
          <svg class="ic" viewBox="0 0 24 24"><path d="M12 4L3.5 20h17L12 4z"/><path d="M12 8v12"/></svg>
          Tailgate<span class="ind"></span>
        </button>
        <button class="tab" data-s="more">
          <svg class="ic" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
          More<span class="ind"></span>
        </button>
      </div>
    </nav>
  </div>

  <div id="walkOverlay" role="dialog" aria-label="Walking directions">
    <div class="wo-name" id="woName"></div>
    <div class="wo-zone" id="woZone"></div>
    <div class="compass">
      <span class="n">N</span>
      <svg id="woArrow" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 16 L78 78 L60 66 L42 78 Z"/>
      </svg>
    </div>
    <div id="woDist">—</div>
    <div id="woDir">Getting your position…</div>
    <div id="woStatus"></div>
    <div class="row">
      <a class="btn sm ghost" id="woMaps" href="#" target="_blank" rel="noopener">Open in Maps (walking)</a>
      <button class="btn sm" id="woClose">Done</button>
    </div>
  </div>

  <div id="toast" role="status"></div>
</div>

<script>
/* ============================================================
   FAN MAP v2 — unified multi-school prototype
   Theming: each school sets CSS vars + provides its own data.
   Merge target: SCHOOLS[*] maps to teams/organizations/events
   tables in the Supabase schema (incl. nil_url, foundation_url).
   ============================================================ */

/* ---- MAPBOX ----
   Paste your Mapbox public token (starts with "pk.") between the
   quotes below. Get one free at account.mapbox.com > Tokens.
   Leave it empty ("") and the app uses free Esri satellite tiles
   instead — everything still works. */
const MAPBOX_TOKEN = "";

/* ---- BETA FEEDBACK ----
   Put your email between the quotes and a "Send feedback"
   button appears in the More tab for beta testers. */
const FEEDBACK_EMAIL = "";

const SCHOOLS = {
  arkansas: {
    key:"arkansas", short:"ARKANSAS", display:"Arkansas", org:"University of Arkansas",
    theme:{team:"#9D2235", teamDark:"#6E1826", soft:"rgba(157,34,53,.16)", swatchText:"#fff"},
    tagline:"Find your people. Watch together.",
    stats:[["19","Chapters & clubs"],["12","Verified venues"],["17","Metro areas"]],
    alumni_url:"https://www.arkansasalumni.org",
    nil:{label:"Support NIL — Front Office", url:"https://www.thelinku.com/Arkansas"},
    foundation:{label:"Give — Razorback Foundation", url:"https://arkansasrazorbacks.evenue.net/give"},
    supportCopy:"Two ways to give: the Arkansas Front Office (official NIL program on TheLinkU) funds athlete NIL opportunities by sport, and the Razorback Foundation takes general donations to the athletic program.",
    verifiedDate:"07/20/2026",
    news:[
      {src:"Football", h:"New era on the sideline", p:"Arkansas hired Ryan Silverfield from Memphis as head football coach after the 2025 season — a fresh start for 2026."},
      {src:"New York City", h:"NYC chapter has a new home", p:"Watch parties moved to Stout Penn Station in Midtown late in the 2025 season, from longtime home The Hideaway Seaport."},
      {src:"Dallas", h:"Dallas lands at Barcadia", p:"The Dallas chapter introduced Barcadia on Henderson Avenue as its new watch party home for football and basketball."},
      {src:"Basketball", h:"A night at the Garden", p:"Arkansas faces Indiana at Madison Square Garden on Nov. 17, 2026 in the Bad Boy Mowers Series."}
    ],
    chapters:[
      {id:"dallas", name:"Dallas Alumni Chapter", city:"Dallas, TX", venue:"Barcadia Dallas", addr:"1917 N Henderson Ave, Dallas, TX 75206", note:"Football & basketball watch parties — the chapter's new home as of 2025.", lat:32.82,lng:-96.77, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"houston", name:"Houston Alumni Chapter", city:"Houston, TX", venue:"Nettbar Shady Acres", addr:"W 22nd St, Houston, TX", note:"Football watch parties in Shady Acres.", lat:29.80,lng:-95.41, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"chicago", name:"Chicago Alumni Chapter", city:"Chicago, IL", venue:"Joe's on Weed St.", addr:"Weed St, Chicago, IL", note:"Reserve a spot each week through the chapter's game link.", lat:41.91,lng:-87.65, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"kc", name:"Greater Kansas City Alumni Chapter", city:"Kansas City, KS", venue:"Tanner's Bar & Grill", addr:"Rainbow Blvd, Kansas City area", note:"Football watch parties on Rainbow.", lat:39.03,lng:-94.63, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"memphis", name:"Mid-South / Memphis Alumni Chapter", city:"Memphis, TN", venue:"Max's Sports Bar", addr:"115 G.E. Patterson Ave, Memphis, TN 38103", note:"Football & basketball downtown.", lat:35.13,lng:-90.06, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"tulsa", name:"Tulsa Alumni Chapter", city:"Tulsa, OK", venue:"Bricktown Brewery", addr:"3301 S Peoria Ave, Tulsa, OK 74105", note:"Football & basketball on Peoria.", lat:36.11,lng:-95.99, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"pitt", name:"Pittsburgh Alumni Community", city:"Pittsburgh, PA", venue:"Shorty's GoodTimes Bar", addr:"353 N Shore Dr, Pittsburgh, PA 15212", note:"Basketball watch parties on the North Shore.", lat:40.45,lng:-80.01, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"nyc", name:"Greater New York City Alumni Chapter", city:"New York, NY", venue:"Stout Penn Station", addr:"Midtown South, New York, NY", note:"New home as of late 2025 (previously The Hideaway Seaport).", lat:40.75,lng:-73.99, verified:true, src:"https://gamewatch.info/teams/arkansas-razorbacks"},
      {id:"nwa", name:"Northwest Arkansas Alumni Chapter", city:"Fayetteville, AR", venue:"Bugsy's on Dickson", addr:"Dickson St, Fayetteville, AR", note:"Chapter socials — game days are for tailgating at the stadium.", lat:36.07,lng:-94.16, verified:true, src:"https://www.arkansasalumni.org/groups"},
      {id:"rogers", name:"MSOM Society (with NWA Gator Club)", city:"Rogers, AR", venue:"Grubs Bar & Grill", addr:"3001 S Market St, Rogers, AR", note:"Joint basketball watch party events.", lat:36.31,lng:-94.13, verified:true, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"gdrc1", name:"Greater Dallas Razorback Club", city:"Carrollton, TX", venue:"Buffalo Wild Wings — Carrollton", addr:"3320 E Hebron Pkwy Suite 100, Carrollton, TX 75010", note:"Independent fan club — every football game.", lat:32.99,lng:-96.89, verified:true, src:"https://hogfan.com"},
      {id:"gdrc2", name:"Greater Dallas Razorback Club", city:"Richardson, TX", venue:"Austin Avenue Grill", addr:"1801 N Plano Rd, Richardson, TX 75081", note:"Location #2 for fans south and east of the metroplex.", lat:32.95,lng:-96.71, verified:true, src:"https://hogfan.com"},
      {id:"denver", name:"Denver Alumni Chapter", city:"Denver, CO", venue:"Venue announced per game", addr:"", note:"Ran watch parties for every 2025 game; the association is recruiting chapter leaders here.", lat:39.74,lng:-104.99, verified:false, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"austin", name:"Austin Alumni Chapter", city:"Austin, TX", venue:"Venue announced per game", addr:"", note:"Active every game week.", lat:30.27,lng:-97.74, verified:false, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"stl", name:"St. Louis Alumni Chapter", city:"St. Louis, MO", venue:"Venue announced per game", addr:"", note:"Publishes a full-season watch party schedule each fall.", lat:38.63,lng:-90.20, verified:false, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"ftsmith", name:"Fort Smith Alumni Chapter", city:"Fort Smith, AR", venue:"Venue announced per game", addr:"", note:"Active in game-by-game listings.", lat:35.39,lng:-94.40, verified:false, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"okc", name:"Oklahoma City Alumni Chapter", city:"Oklahoma City, OK", venue:"Venue announced per game", addr:"", note:"Active in game-by-game listings.", lat:35.47,lng:-97.52, verified:false, src:"https://www.arkansasalumni.org/watchparties"},
      {id:"vegas", name:"Las Vegas Alumni Chapter", city:"Las Vegas, NV", venue:"Venue announced per game", addr:"", note:"All fans welcome — venues posted on the chapter's Facebook.", lat:36.17,lng:-115.14, verified:false, src:"https://www.arkansasalumni.org/?pgid=2618&gid=1"},
      {id:"dc", name:"Washington D.C. Alumni Chapter", city:"Washington, DC", venue:"Venue announced per game", addr:"", note:"Venues posted on the chapter's Facebook.", lat:38.91,lng:-77.04, verified:false, src:"https://www.arkansasalumni.org/?pgid=2612&gid=1"}
    ],
    mapLabels:{dallas:[10,-6],gdrc1:[-64,-10],gdrc2:[10,14],nwa:[-72,4],rogers:[10,-8],ftsmith:[-70,16],kc:[10,-6],tulsa:[-52,16],okc:[10,16],memphis:[10,12],stl:[10,-8],nyc:[10,-6],chicago:[10,-8],denver:[10,-6],vegas:[-64,-8],dc:[10,12],houston:[10,12],austin:[10,12],pitt:[-70,-8]},
    stadium:"Donald W. Reynolds Razorback Stadium, Fayetteville, AR",
    tgIntro:"Home games at Donald W. Reynolds Razorback Stadium.",
    timeline:[["6 hrs early","Lots open"],["7:00 AM","HogTown opens"],["~2.5 hrs early","Team walk"],["2 hrs early","Gates open"]],
    zones:[
      {id:"gardens", name:"The Gardens", kind:"Reserved tents", walk:"Next to Bud Walton Arena, south of the stadium", desc:"The traditional heart of tailgating; reserved tent rentals.", maps:"The Gardens University of Arkansas Fayetteville"},
      {id:"vvn", name:"Victory Village North", kind:"Reserved tailgating", walk:"North of the stadium — on the team walk route", desc:"Reserved spaces booked through the athletics tailgating program.", maps:"Victory Village Razorback Stadium Fayetteville"},
      {id:"vve", name:"Victory Village East", kind:"Reserved tailgating", walk:"East of Stadium Drive, ~2-minute walk", desc:"Shortest walk to the gates on the east side.", maps:"Razorback Stadium east Stadium Drive Fayetteville"},
      {id:"vvs", name:"Victory Village South", kind:"Reserved tailgating", walk:"South of Nolan Richardson Drive, ~8-minute walk", desc:"Reserved spaces south of the stadium complex.", maps:"Nolan Richardson Drive Razorback Stadium Fayetteville"},
      {id:"hogtown", name:"HogTown", kind:"Free fan zone", walk:"On the team walk route — opens 7:00 AM", desc:"The official game day fan zone: music, team store trailer, spirit squads.", maps:"Razorback Stadium Fayetteville"},
      {id:"lot300", name:"Lot 300 — Friday night", kind:"Free (night before)", walk:"Opens 5:00 PM Friday", desc:"Free Friday-night tailgating; vacate by midnight without a game day pass.", maps:"Lot 300 University of Arkansas Fayetteville"},
      {id:"grass", name:"Free grass areas", kind:"Free, first-come", walk:"Around the lots + near the Basketball Performance Center", desc:"Personal setups welcome in grass areas, first-come first-serve.", maps:"Basketball Performance Center University of Arkansas Fayetteville"},
      {id:"rv", name:"Road Hog Park", kind:"RV parking", walk:"Remote lot, free game day shuttle", desc:"RV headquarters with a shuttle starting four hours before kickoff.", maps:"Road Hog Park Fayetteville AR"}
    ],
    stadiumMap:{
      bbox:{lat0:36.078, lat1:36.058, lng0:-94.190, lng1:-94.166}, // top/bottom lat, left/right lng
      start:[36.0672,-94.1830], // default pin: Gardens side
      features:[
        {t:"road", x1:-94.190, y1:36.0716, x2:-94.166, y2:36.0716, label:"Maple St"},
        {t:"road", x1:-94.1768, y1:36.078, x2:-94.1768, y2:36.058, label:"Stadium Dr"},
        {t:"road", x1:-94.1820, y1:36.078, x2:-94.1820, y2:36.058, label:"Razorback Rd"},
        {t:"road", x1:-94.190, y1:36.0650, x2:-94.166, y2:36.0650, label:"Nolan Richardson Dr"},
        {t:"block", lat0:36.0694, lat1:36.0666, lng0:-94.1803, lng1:-94.1779, label:"STADIUM", big:true},
        {t:"block", lat0:36.0648, lat1:36.0628, lng0:-94.1788, lng1:-94.1764, label:"Bud Walton"},
        {t:"zone", lat0:36.0663, lat1:36.0646, lng0:-94.1817, lng1:-94.1787, label:"The Gardens"},
        {t:"zone", lat0:36.0712, lat1:36.0697, lng0:-94.1806, lng1:-94.1774, label:"Victory Vlg N"},
        {t:"zone", lat0:36.0692, lat1:36.0666, lng0:-94.1776, lng1:-94.1756, label:"Victory Vlg E"},
        {t:"zone", lat0:36.0646, lat1:36.0632, lng0:-94.1812, lng1:-94.1792, label:"Victory Vlg S"}
      ]
    },
    fine:"Fan Map links to official programs and is not affiliated with the University of Arkansas, the Razorback Foundation, or TheLinkU. Venue data verified 07/20/2026 from arkansasalumni.org and club-published pages."
  },

  asu: {
    key:"asu", short:"ARIZONA STATE", display:"Arizona State", org:"Arizona State University",
    theme:{team:"#8C1D40", teamDark:"#6B1530", soft:"rgba(140,29,64,.18)", swatchText:"#FFC627"},
    tagline:"Find your people. Watch together.",
    stats:[["3","Sample venues"],["3","Cities"],["31","Chapters to import"]],
    alumni_url:"https://alumni.asu.edu",
    nil:null,
    foundation:null,
    supportCopy:"Official ASU giving and NIL links are being added — the same two-button support module Arkansas has will appear here.",
    verifiedDate:null,
    news:[],
    chapters:[
      {id:"austin-asu", name:"Austin Watch Party", city:"Austin, TX", venue:"Little Woodrow's Burnet", addr:"5425 Burnet Rd, Austin, TX", note:"Sample entry from the beta — pending re-verification.", lat:30.36,lng:-97.74, verified:false, src:"https://alumni.asu.edu"},
      {id:"chicago-asu", name:"Chicago Watch Party", city:"Chicago, IL", venue:"Murphy's Bleachers", addr:"3655 N Sheffield Ave, Chicago, IL", note:"Sample entry from the beta — pending re-verification.", lat:41.95,lng:-87.65, verified:false, src:"https://alumni.asu.edu"},
      {id:"portland-asu", name:"Portland Alumni Chapter", city:"Portland, OR", venue:"Venue announced per game", addr:"", note:"Sample entry from the beta — pending re-verification.", lat:45.52,lng:-122.68, verified:false, src:"https://alumni.asu.edu"}
    ],
    mapLabels:{"austin-asu":[10,12],"chicago-asu":[10,-8],"portland-asu":[10,-6]},
    stadium:"Mountain America Stadium, Tempe, AZ",
    tgIntro:"Home games in Tempe.",
    timeline:[["Game day","Lots open early"],["Pre-kickoff","Fan zones"],["Kickoff","Gates open before"]],
    zones:[],
    stadiumMap:{
      bbox:{lat0:33.4360, lat1:33.4180, lng0:-111.9430, lng1:-111.9210},
      start:[33.4245,-111.9350],
      features:[
        {t:"road", x1:-111.9430, y1:33.4290, x2:-111.9210, y2:33.4290, label:"Rio Salado Pkwy"},
        {t:"road", x1:-111.9395, y1:33.4360, x2:-111.9395, y2:33.4180, label:"Mill Ave"},
        {t:"road", x1:-111.9430, y1:33.4220, x2:-111.9210, y2:33.4220, label:"University Dr"},
        {t:"block", lat0:33.4278, lat1:33.4252, lng0:-111.9337, lng1:-111.9307, label:"STADIUM", big:true}
      ]
    },
    fine:"Fan Map links to official programs and is not affiliated with Arizona State University. ASU venue data shown here is from the earlier beta and is pending re-verification; the 31-chapter verified dataset imports next."
  }
};

// ---------------- State ----------------
let S = null;               // current school object
const myTailgates = [];     // prototype only — Supabase events (event_type=tailgate) in production
const going = new Set();    // in-memory RSVP toggles

// ---------------- Utilities ----------------
const $ = id => document.getElementById(id);
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600);
}
function mapsQ(q){ return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q); }
async function textCrew(message, url){
  const full = url ? message+" "+url : message;
  if(navigator.share){
    try{ await navigator.share(url?{text:message,url:url}:{text:message}); return; }
    catch(e){ if(e && e.name==='AbortError') return; }
  }
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)){
    window.location.href='sms:?&body='+encodeURIComponent(full); return;
  }
  try{ await navigator.clipboard.writeText(full); toast('Invite copied — paste it into any message.'); }
  catch(e){ toast(full); }
}

// ---------------- Welcome / school select ----------------
function buildWelcome(){
  const list=$('schoolList'); list.innerHTML='';
  Object.values(SCHOOLS).forEach(sc=>{
    const b=document.createElement('button');
    b.className='school-card';
    b.style.setProperty('--sc',sc.theme.team);
    b.style.setProperty('--scText',sc.theme.swatchText);
    b.innerHTML='<div class="school-swatch">'+sc.display.split(' ').map(w=>w[0]).join('').slice(0,2)+'</div>'+
      '<div><div class="school-name">'+sc.short+'</div><div class="school-meta">'+sc.chapters.length+' chapters &middot; '+sc.org+'</div></div>';
    b.onclick=()=>selectSchool(sc.key);
    list.appendChild(b);
  });
}
function selectSchool(key){
  S=SCHOOLS[key];
  const r=document.documentElement.style;
  r.setProperty('--team',S.theme.team);
  r.setProperty('--team-dark',S.theme.teamDark);
  r.setProperty('--team-soft',S.theme.soft);
  $('screen-welcome').classList.remove('active');
  $('app').style.display='block';
  $('teamPillName').textContent=S.short;
  renderAll();
  switchScreen('home');
}
$('teamPill').onclick=()=>{ $('app').style.display='none'; $('screen-welcome').classList.add('active'); };

// ---------------- Tabs ----------------
function switchScreen(name){
  document.querySelectorAll('#app .screen').forEach(s=>s.classList.remove('active'));
  $('screen-'+name).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.s===name));
  window.scrollTo({top:0});
  if(name==='tailgates' && lmap) setTimeout(()=>{ lmap.invalidateSize(); lmap.setView(pinPos); },60);
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>switchScreen(t.dataset.s));

// ---------------- Home ----------------
function renderHome(){
  $('heroEyebrow').textContent=S.org;
  $('heroTitle').innerHTML=S.short.split(' ').length>1
    ? S.short.split(' ')[0]+'<br><b>'+S.short.split(' ').slice(1).join(' ')+'</b>'
    : '<b>'+S.short+'</b>';
  $('heroSub').textContent=S.tagline;
  $('heroStats').innerHTML=S.stats.map(([n,l])=>'<div class="stat"><div class="n">'+n+'</div><div class="l">'+l+'</div></div>').join('');
  const sb=$('supportBand');
  let btns='';
  if(S.nil) btns+='<a class="btn" href="'+S.nil.url+'" target="_blank" rel="noopener">'+S.nil.label+'</a>';
  if(S.foundation) btns+='<a class="btn ghost" href="'+S.foundation.url+'" target="_blank" rel="noopener">'+S.foundation.label+'</a>';
  sb.innerHTML='<div class="t">Back the athletes &amp; the program</div><div class="s">'+S.supportCopy+'</div>'+
    (btns?'<div class="row">'+btns+'</div>':'');
  const nl=$('newsList');
  if(S.news.length){
    nl.style.display='block';
    nl.innerHTML=S.news.map(n=>'<div class="news-card"><div class="news-rail"></div><div><div class="src">'+n.src+'</div><h3>'+n.h+'</h3><p>'+n.p+'</p></div></div>').join('');
  }else{
    nl.style.display='block';
    nl.innerHTML='<div class="empty">Team news connects to live sources as this school completes verification.</div>';
  }
}

// ---------------- Map ----------------
const NS="http://www.w3.org/2000/svg";
const W=960,H=560,LNG0=-125,LNG1=-66,LAT0=49.6,LAT1=24.2;
const px=lng=>(lng-LNG0)/(LNG1-LNG0)*W;
const py=lat=>(LAT0-lat)/(LAT0-LAT1)*H;
const OUTLINE=[[48.4,-124.7],[49,-123],[49,-95.1],[48.9,-95.1],[48.1,-89.5],[46.5,-84.5],[45.8,-83.5],[43.6,-82.4],[42.3,-83.1],[41.7,-82.5],[42.9,-79],[43.6,-76.4],[45,-74.7],[45.3,-71.5],[47.3,-69.2],[47.1,-67.8],[45.2,-67.2],[44.8,-66.9],[43.6,-70.2],[42.6,-70.7],[41.5,-71],[41,-73.7],[40.5,-74],[38.9,-75],[37,-76],[35.2,-75.5],[33.8,-78.6],[32,-80.9],[30.7,-81.4],[28.9,-80.8],[25.2,-80.4],[26,-81.8],[27.9,-82.8],[29.7,-83.6],[30.1,-85.6],[30.4,-86.5],[30.2,-88.9],[29.2,-89.4],[29.7,-93.8],[28.9,-95.4],[26,-97.2],[25.9,-97.5],[26.5,-99.1],[29.5,-101],[29.8,-102.7],[31.8,-106.5],[31.3,-111],[32.5,-114.8],[32.5,-117.1],[34,-118.5],[34.5,-120.5],[36.3,-121.9],[38,-123],[40.4,-124.4],[43.3,-124.4],[46.2,-124],[48.4,-124.7]];

function renderMap(){
  const svg=$('usmap'); svg.innerHTML='';
  const path=document.createElementNS(NS,'path');
  path.setAttribute('d',"M"+OUTLINE.map(([la,lo])=>px(lo).toFixed(1)+","+py(la).toFixed(1)).join(" L")+" Z");
  path.setAttribute('class','us-outline');
  svg.appendChild(path);
  S.chapters.forEach(c=>{
    const g=document.createElementNS(NS,'g');
    g.setAttribute('class','pin'+(c.verified?'':' tbd'));
    g.setAttribute('tabindex','0'); g.setAttribute('role','button');
    g.setAttribute('aria-label',c.name+' — '+c.venue);
    const x=px(c.lng),y=py(c.lat);
    const halo=document.createElementNS(NS,'circle');
    halo.setAttribute('cx',x);halo.setAttribute('cy',y);halo.setAttribute('r',9);halo.setAttribute('class','halo');
    const dot=document.createElementNS(NS,'circle');
    dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r',7);dot.setAttribute('class','dot');
    g.appendChild(halo);g.appendChild(dot);
    const off=S.mapLabels[c.id];
    if(off){
      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',x+off[0]); t.setAttribute('y',y+off[1]);
      t.textContent=c.city.split(',')[0];
      g.appendChild(t);
    }
    const act=()=>selectPin(c.id,true);
    g.addEventListener('click',act);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}});
    g.dataset.pin=c.id;
    svg.appendChild(g);
  });
  const sheet=$('venueSheet'); sheet.innerHTML='';
  S.chapters.forEach(c=>{
    const r=document.createElement('div');
    r.className='vrow'+(c.verified?'':' tbd'); r.id='vrow-'+c.id;
    r.innerHTML='<div class="dot"></div><div><div class="nm">'+(c.verified?c.venue:c.name)+'</div><div class="ct">'+
      (c.verified?c.city+' &middot; '+c.name:c.city+' &middot; venue posted per game')+'</div></div><div class="go">View &rsaquo;</div>';
    r.onclick=()=>{ selectPin(c.id,false); switchScreen('parties'); flashParty(c.id); };
    sheet.appendChild(r);
  });
}
function selectPin(id,scrollSheet){
  document.querySelectorAll('.pin').forEach(p=>p.classList.toggle('sel',p.dataset.pin===id));
  document.querySelectorAll('.vrow').forEach(v=>v.classList.toggle('sel',v.id==='vrow-'+id));
  if(scrollSheet){
    const row=$('vrow-'+id); if(row) row.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

// ---------------- Parties ----------------
let partyFilter='all';
function renderParties(){
  const list=$('partyList'); list.innerHTML='';
  S.chapters
    .filter(c=>partyFilter==='all'||(partyFilter==='verified'&&c.verified)||(partyFilter==='tbd'&&!c.verified))
    .forEach(c=>{
      const el=document.createElement('article');
      el.className='pcard'; el.id='pcard-'+c.id;
      const gOn=going.has(c.id);
      el.innerHTML=
        '<div class="head" data-toggle="'+c.id+'" role="button" tabindex="0" aria-expanded="false">'+
          '<div class="head-main"><h3>'+c.name+'</h3><div class="venue">'+c.venue+'</div></div>'+
          '<span class="badge '+(c.verified?'v':'t')+'">'+(c.verified?'Verified':'Per game')+'</span>'+
          '<svg class="ic chev" viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg>'+
        '</div>'+
        '<div class="body"><div class="body-in">'+
          '<div class="addr">'+(c.addr||c.city)+'</div>'+
          '<div class="note">'+c.note+'</div>'+
          '<div class="acts">'+
            (c.verified?'<a class="btn sm ghost" href="'+mapsQ(c.venue+' '+(c.addr||c.city))+'" target="_blank" rel="noopener">Directions</a>':'')+
            '<button class="btn sm ghost" data-invite="'+c.id+'">Invite by text</button>'+
            '<button class="going'+(gOn?' on':'')+'" data-going="'+c.id+'">'+(gOn?"I'm going ✓":"I'm going")+'</button>'+
          '</div>'+
        '</div></div>';
      list.appendChild(el);
    });
}
function flashParty(id){
  setTimeout(()=>{
    let el=$('pcard-'+id);
    if(!el){ partyFilter='all'; document.querySelectorAll('#partyChips .chip').forEach(k=>k.classList.toggle('on',k.dataset.f==='all')); renderParties(); el=$('pcard-'+id); }
    if(el){
      setOpen(el,true);
      el.scrollIntoView({behavior:'smooth',block:'center'});
      el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),2200);
    }
  },80);
}
function setOpen(card,open){
  card.classList.toggle('open',open);
  const h=card.querySelector('.head'); if(h) h.setAttribute('aria-expanded',open);
}
$('partyChips').addEventListener('click',e=>{
  const ch=e.target.closest('.chip'); if(!ch) return;
  document.querySelectorAll('#partyChips .chip').forEach(k=>k.classList.remove('on'));
  ch.classList.add('on'); partyFilter=ch.dataset.f; renderParties();
});
$('partyList').addEventListener('click',e=>{
  const tg=e.target.closest('[data-toggle]');
  if(tg && !e.target.closest('.acts')){
    const card=tg.closest('.pcard');
    setOpen(card,!card.classList.contains('open'));
    return;
  }
  const inv=e.target.closest('[data-invite]');
  if(inv){
    const c=S.chapters.find(x=>x.id===inv.dataset.invite);
    const msg=c.verified
      ? "Watch the game with me! "+S.display+" watch party at "+c.venue+" ("+(c.addr||c.city)+") with the "+c.name+"."
      : "Watch the game with me! The "+c.name+" posts each week's watch party spot here:";
    textCrew(msg, c.verified?mapsQ(c.venue+' '+(c.addr||c.city)):c.src);
    return;
  }
  const gg=e.target.closest('[data-going]');
  if(gg){
    const id=gg.dataset.going;
    if(going.has(id)){going.delete(id);}else{going.add(id);toast("You're on the list — see you there.");}
    renderParties();
  }
});

// ---------------- Tailgates ----------------
let pinPos=null;      // [lat,lng] of the draggable pin
let editingUid=null;  // uid of tailgate being edited

function renderTailgates(){
  $('tgTitle').textContent='Game day tailgates';
  $('tgTimeline').innerHTML=S.timeline.map(([b,s])=>'<div class="tl"><b>'+b+'</b><span>'+s+'</span></div>').join('');
  const zl=$('zoneList'); zl.innerHTML='';
  if(S.zones.length){
    S.zones.forEach(z=>{
      const el=document.createElement('article');
      el.className='zone'; el.dataset.zone=z.id;
      el.innerHTML=
        '<div class="head" role="button" tabindex="0" aria-expanded="false">'+
          '<div class="head-main"><span class="kind">'+z.kind+'</span><h3>'+z.name+'</h3></div>'+
          '<svg class="ic chev" viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg>'+
        '</div>'+
        '<div class="body"><div class="body-in">'+
          '<div class="walk">'+z.walk+'</div><p>'+z.desc+'</p>'+
          '<div class="acts"><a class="btn sm ghost" href="'+mapsQ(z.maps)+'" target="_blank" rel="noopener">Directions</a>'+
          '<button class="btn sm ghost" data-zshare="'+z.id+'">Text your crew</button></div>'+
        '</div></div>';
      zl.appendChild(el);
    });
  }else{
    zl.innerHTML='<div class="empty">Official tailgating zones for '+S.stadium+' are being verified — drop your own tailgate below in the meantime.</div>';
  }
  const sel=$('tgZone'); sel.innerHTML='';
  const zopts=S.zones.length?S.zones:[{id:'stadium',name:S.stadium}];
  zopts.forEach(z=>{const o=document.createElement('option');o.value=z.id;o.textContent=z.name;sel.appendChild(o);});
  cancelEdit();
  pinPos=[...S.stadiumMap.start];
  initTailgateMap();
  renderMyTailgates();
}

// ---- Tailgate map: satellite (Leaflet + Esri World Imagery), schematic fallback offline ----
let lmap=null, lmarker=null;
function satAvailable(){ return typeof window.L!=='undefined' && navigator.onLine!==false; }
function initTailgateMap(){
  const lm=$('leafletMap'), mm=$('miniMap');
  if(lmap){ lmap.remove(); lmap=null; lmarker=null; }
  if(satAvailable()){
    lm.classList.add('on'); mm.classList.remove('on');
    $('mmHint').textContent='Satellite map · drag the pin or tap to place it';
    lmap=L.map(lm,{zoomControl:true,attributionControl:true}).setView(pinPos,16);
    if(MAPBOX_TOKEN){
      L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token='+MAPBOX_TOKEN,{
        maxZoom:20, tileSize:512, zoomOffset:-1,
        attribution:'&copy; Mapbox &copy; OpenStreetMap &copy; Maxar'
      }).addTo(lmap);
    }else{
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
        maxZoom:19, attribution:'Imagery &copy; Esri'
      }).addTo(lmap);
    }
    const icon=L.divIcon({className:'fm-pin',html:'<div class="p"></div><div class="c"></div>',iconSize:[22,22],iconAnchor:[3,22]});
    lmarker=L.marker(pinPos,{icon,draggable:true,keyboard:true}).addTo(lmap);
    lmarker.on('drag dragend',()=>{
      const p=lmarker.getLatLng(); pinPos=[p.lat,p.lng]; updateCoordsLabel();
    });
    lmap.on('click',e=>{
      pinPos=[e.latlng.lat,e.latlng.lng];
      lmarker.setLatLng(e.latlng); updateCoordsLabel();
    });
    // tiles may fail while "online" (captive portals, blocked CDN) — fall back if nothing loads
    let loaded=false;
    lmap.eachLayer(l=>{ if(l.on) l.on('load',()=>{loaded=true;}); });
    setTimeout(()=>{ if(!loaded && lmap){ lmap.remove(); lmap=null; lmarker=null; showSchematic(); } },5000);
  }else{
    showSchematic();
  }
  updateCoordsLabel();
}
function showSchematic(){
  $('leafletMap').classList.remove('on');
  $('miniMap').classList.add('on');
  $('mmHint').textContent='Offline schematic · drag the pin or tap to place it';
  renderMiniMap();
}
function syncPin(){
  if(lmap&&lmarker){ lmarker.setLatLng(pinPos); lmap.setView(pinPos); }
  else { positionPin(); }
  updateCoordsLabel();
}
$('zoneList').addEventListener('click',e=>{
  const b=e.target.closest('[data-zshare]');
  if(b){
    const z=S.zones.find(x=>x.id===b.dataset.zshare);
    textCrew("Game day! Meet us at "+z.name+" for the "+S.display+" tailgate — "+z.walk+".", mapsQ(z.maps));
    return;
  }
  const h=e.target.closest('.zone .head');
  if(h){
    const card=h.closest('.zone');
    const open=!card.classList.contains('open');
    card.classList.toggle('open',open);
    h.setAttribute('aria-expanded',open);
  }
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ') return;
  const h=e.target.closest && e.target.closest('.zone .head, .pcard .head');
  if(!h) return;
  e.preventDefault();
  h.click();
});
function zoneById(id){ return (S.zones.find(z=>z.id===id)) || {id:'stadium',name:S.stadium,maps:S.stadium}; }

// ---- Mini map: schematic stadium area with a draggable pin ----
const MMW=320, MMH=300;
function mmx(lng){ const b=S.stadiumMap.bbox; return (lng-b.lng0)/(b.lng1-b.lng0)*MMW; }
function mmy(lat){ const b=S.stadiumMap.bbox; return (b.lat0-lat)/(b.lat0-b.lat1)*MMH; }
function mmToLatLng(x,y){
  const b=S.stadiumMap.bbox;
  const lng=b.lng0 + (x/MMW)*(b.lng1-b.lng0);
  const lat=b.lat0 - (y/MMH)*(b.lat0-b.lat1);
  return [Math.min(Math.max(lat,Math.min(b.lat0,b.lat1)),Math.max(b.lat0,b.lat1)),
          Math.min(Math.max(lng,Math.min(b.lng0,b.lng1)),Math.max(b.lng0,b.lng1))];
}
function renderMiniMap(){
  const svg=$('miniMap'); svg.innerHTML='';
  const g=(tag,attrs)=>{const el=document.createElementNS(NS,tag);for(const k in attrs)el.setAttribute(k,attrs[k]);return el;};
  svg.appendChild(g('rect',{x:0,y:0,width:MMW,height:MMH,class:'mm-ground'}));
  S.stadiumMap.features.forEach(f=>{
    if(f.t==='road'){
      svg.appendChild(g('line',{x1:mmx(f.x1),y1:mmy(f.y1),x2:mmx(f.x2),y2:mmy(f.y2),class:'mm-road'}));
      const horiz=Math.abs(mmy(f.y1)-mmy(f.y2))<1;
      const lbl=g('text',{x:horiz?8:mmx(f.x1)+6, y:horiz?mmy(f.y1)-5:16, class:'mm-label'});
      if(!horiz){lbl.setAttribute('transform','rotate(90 '+(mmx(f.x1)+6)+' 16)');}
      lbl.textContent=f.label; svg.appendChild(lbl);
    }else{
      const x=mmx(f.lng0),y=mmy(f.lat0),w=mmx(f.lng1)-x,h=mmy(f.lat1)-y;
      svg.appendChild(g('rect',{x,y,width:w,height:h,rx:4,class:f.t==='block'?'mm-block':'mm-zone'}));
      const lbl=g('text',{x:x+w/2,y:y+h/2+3,'text-anchor':'middle',class:'mm-label'+(f.big?' big':'')});
      lbl.textContent=f.label; svg.appendChild(lbl);
    }
  });
  // pin
  const pin=g('g',{id:'mmPin',tabindex:'0',role:'slider','aria-label':'Tailgate pin — drag to your spot'});
  pin.appendChild(g('circle',{class:'ring',r:13,'stroke-width':2}));
  pin.appendChild(g('circle',{class:'head',r:8}));
  const stem=g('path',{d:'M0 8 L0 16',stroke:'#fff','stroke-width':1.6});
  pin.appendChild(stem);
  svg.appendChild(pin);
  positionPin();
  wireMiniMap(svg,pin);
  updateCoordsLabel();
}
function positionPin(){
  const pin=$('mmPin'); if(!pin) return;
  pin.setAttribute('transform','translate('+mmx(pinPos[1]).toFixed(1)+' '+mmy(pinPos[0]).toFixed(1)+')');
}
function updateCoordsLabel(){
  $('mmCoords').textContent=pinPos[0].toFixed(5)+', '+pinPos[1].toFixed(5);
}
function wireMiniMap(svg,pin){
  const toLocal=e=>{
    const r=svg.getBoundingClientRect();
    return [(e.clientX-r.left)/r.width*MMW,(e.clientY-r.top)/r.height*MMH];
  };
  const move=e=>{
    const [x,y]=toLocal(e);
    pinPos=mmToLatLng(x,y);
    positionPin(); updateCoordsLabel();
  };
  let dragging=false;
  svg.addEventListener('pointerdown',e=>{
    dragging=true; pin.classList.add('grabbing');
    svg.setPointerCapture(e.pointerId); move(e);
  });
  svg.addEventListener('pointermove',e=>{ if(dragging) move(e); });
  const stop=()=>{ dragging=false; pin.classList.remove('grabbing'); };
  svg.addEventListener('pointerup',stop);
  svg.addEventListener('pointercancel',stop);
  pin.addEventListener('keydown',e=>{
    const step=0.00012;
    if(e.key==='ArrowUp')pinPos[0]+=step; else if(e.key==='ArrowDown')pinPos[0]-=step;
    else if(e.key==='ArrowLeft')pinPos[1]-=step; else if(e.key==='ArrowRight')pinPos[1]+=step;
    else return;
    e.preventDefault(); positionPin(); updateCoordsLabel();
  });
}

// ---- Create / edit ----
function cancelEdit(){
  editingUid=null;
  $('tgFormTitle').textContent='Drop your tailgate';
  $('tgAdd').textContent='Add tailgate';
  $('tgCancelEdit').style.display='none';
  $('tgName').value='';$('tgTime').value='';$('tgSpot').value='';
}
$('tgCancelEdit').onclick=()=>{ cancelEdit(); pinPos=[...S.stadiumMap.start]; syncPin(); };
$('tgAdd').onclick=()=>{
  const name=$('tgName').value.trim();
  if(!name){toast('Give your tailgate a name so your crew knows what to look for.');return;}
  const data={school:S.key, name, zone:$('tgZone').value, time:$('tgTime').value.trim(), spot:$('tgSpot').value.trim(), lat:pinPos[0], lng:pinPos[1]};
  if(editingUid){
    const t=myTailgates.find(x=>x.uid===editingUid);
    Object.assign(t,data,{edited:true});
    toast('Tailgate updated — text your crew the new details.');
  }else{
    myTailgates.push({uid:Date.now(), edited:false, ...data});
    toast('Tailgate added — now text your crew.');
  }
  cancelEdit();
  renderMyTailgates();
};
function renderMyTailgates(){
  const wrap=$('tgList'); wrap.innerHTML='';
  myTailgates.filter(t=>t.school===S.key).forEach(t=>{
    const z=zoneById(t.zone);
    const el=document.createElement('div');
    el.className='tg-card'+(t.edited?' edited':'');
    el.innerHTML='<div style="flex:1;min-width:150px"><div class="t">'+t.name+(t.edited?' <span class="badge t">updated</span>':'')+'</div>'+
      '<div class="m">'+z.name+(t.time?' &middot; from '+t.time:'')+(t.spot?' &middot; look for: '+t.spot:'')+'</div>'+
      '<div class="m">'+t.lat.toFixed(5)+', '+t.lng.toFixed(5)+'</div></div>'+
      '<div class="acts2">'+
        '<button class="btn sm" data-tgshare="'+t.uid+'">Text crew</button>'+
        '<button class="btn sm ghost" data-tgwalk="'+t.uid+'">Walk to it</button>'+
        '<button class="btn sm ghost" data-tgedit="'+t.uid+'">Edit</button>'+
      '</div>';
    wrap.appendChild(el);
  });
}
function coordsUrl(t){ return 'https://www.google.com/maps?q='+t.lat.toFixed(6)+','+t.lng.toFixed(6); }
function walkUrl(t){ return 'https://www.google.com/maps/dir/?api=1&destination='+t.lat.toFixed(6)+','+t.lng.toFixed(6)+'&travelmode=walking'; }
$('tgList').addEventListener('click',e=>{
  const share=e.target.closest('[data-tgshare]');
  if(share){
    const t=myTailgates.find(x=>String(x.uid)===share.dataset.tgshare);
    const z=zoneById(t.zone);
    let msg=(t.edited?'Update: ':"You're invited: ")+t.name+' at '+z.name;
    if(t.time) msg+=', starting '+t.time;
    if(t.spot) msg+='. Look for: '+t.spot;
    msg+='. Exact spot:';
    textCrew(msg, coordsUrl(t));
    return;
  }
  const ed=e.target.closest('[data-tgedit]');
  if(ed){
    const t=myTailgates.find(x=>String(x.uid)===ed.dataset.tgedit);
    editingUid=t.uid;
    $('tgFormTitle').textContent='Edit tailgate';
    $('tgAdd').textContent='Save changes';
    $('tgCancelEdit').style.display='block';
    $('tgName').value=t.name; $('tgZone').value=t.zone; $('tgTime').value=t.time; $('tgSpot').value=t.spot;
    pinPos=[t.lat,t.lng]; syncPin();
    document.querySelector('.mytg').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  const wk=e.target.closest('[data-tgwalk]');
  if(wk){
    const t=myTailgates.find(x=>String(x.uid)===wk.dataset.tgwalk);
    openWalk(t);
  }
});

// ---- Walk to it: offline compass (GPS works without data) ----
let woWatch=null, woHeading=null, woTarget=null, woOrientHandler=null;
function haversine(a1,o1,a2,o2){
  const R=6371000, r=Math.PI/180;
  const dA=(a2-a1)*r, dO=(o2-o1)*r;
  const s=Math.sin(dA/2)**2 + Math.cos(a1*r)*Math.cos(a2*r)*Math.sin(dO/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function bearingTo(a1,o1,a2,o2){
  const r=Math.PI/180;
  const y=Math.sin((o2-o1)*r)*Math.cos(a2*r);
  const x=Math.cos(a1*r)*Math.sin(a2*r)-Math.sin(a1*r)*Math.cos(a2*r)*Math.cos((o2-o1)*r);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function fmtDist(m){
  const ft=m*3.28084;
  if(ft<1000) return Math.round(ft)+' ft';
  return (m/1609.34).toFixed(2)+' mi';
}
function cardinal(b){ return ['N','NE','E','SE','S','SW','W','NW'][Math.round(b/45)%8]; }
async function openWalk(t){
  woTarget=t;
  const z=zoneById(t.zone);
  $('woName').textContent=t.name;
  $('woZone').textContent=z.name+' · '+t.lat.toFixed(5)+', '+t.lng.toFixed(5);
  $('woMaps').href=walkUrl(t);
  $('woDist').textContent='—';
  $('woDir').textContent='Getting your position…';
  $('woStatus').textContent='Works offline: GPS needs no cell data. The arrow points from you to your tailgate.';
  $('walkOverlay').classList.add('open');
  // compass heading (iOS needs a permission tap)
  try{
    if(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission==='function'){
      const p=await DeviceOrientationEvent.requestPermission(); if(p!=='granted') woHeading=null;
    }
  }catch(e){}
  woOrientHandler=ev=>{
    if(typeof ev.webkitCompassHeading==='number') woHeading=ev.webkitCompassHeading;
    else if(ev.absolute && typeof ev.alpha==='number') woHeading=(360-ev.alpha)%360;
    updateWalk();
  };
  window.addEventListener('deviceorientation',woOrientHandler);
  if(!navigator.geolocation){
    $('woDir').textContent='Location not available on this device.';
    return;
  }
  woWatch=navigator.geolocation.watchPosition(pos=>{
    woPos=[pos.coords.latitude,pos.coords.longitude];
    updateWalk();
  },err=>{
    $('woDir').textContent='Location unavailable — check permissions.';
    $('woStatus').textContent='Tip: allow location access, or use the Maps button when you have signal.';
  },{enableHighAccuracy:true,maximumAge:2000,timeout:15000});
}
let woPos=null;
function updateWalk(){
  if(!woPos||!woTarget) return;
  const d=haversine(woPos[0],woPos[1],woTarget.lat,woTarget.lng);
  const b=bearingTo(woPos[0],woPos[1],woTarget.lat,woTarget.lng);
  $('woDist').textContent=fmtDist(d);
  if(d<12){
    $('woDir').textContent="You're here — look around!";
    $('woArrow').style.transform='none';
  }else if(woHeading!==null&&woHeading!==undefined){
    const rel=(b-woHeading+360)%360;
    $('woArrow').style.transform='rotate('+rel.toFixed(0)+'deg)';
    $('woDir').textContent='Follow the arrow · heading '+cardinal(b);
  }else{
    $('woArrow').style.transform='rotate('+b.toFixed(0)+'deg)';
    $('woDir').textContent='Head '+cardinal(b)+' (arrow shows direction with North up)';
  }
}
function closeWalk(){
  $('walkOverlay').classList.remove('open');
  if(woWatch!==null){navigator.geolocation.clearWatch(woWatch);woWatch=null;}
  if(woOrientHandler){window.removeEventListener('deviceorientation',woOrientHandler);woOrientHandler=null;}
  woPos=null; woTarget=null;
}
$('woClose').onclick=closeWalk;

// ---------------- More ----------------
function renderMore(){
  const wrap=$('moreLinks'); wrap.innerHTML='';
  const rows=[
    {t:"Alumni association", s:S.alumni_url.replace('https://',''), url:S.alumni_url,
     ic:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>'},
  ];
  if(S.nil) rows.push({t:"NIL — athlete support", s:S.nil.url.replace('https://',''), url:S.nil.url,
     ic:'<circle cx="12" cy="8" r="3.4"/><path d="M5 20c.8-3.6 3.5-5.6 7-5.6s6.2 2 7 5.6"/>'});
  if(S.foundation) rows.push({t:"Athletics giving", s:S.foundation.url.replace('https://',''), url:S.foundation.url,
     ic:'<path d="M12 20s-7-4.6-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.4 12 20 12 20z"/>'});
  if(FEEDBACK_EMAIL) rows.push({t:"Send beta feedback", s:"Tell us what to fix or build next",
     url:'mailto:'+FEEDBACK_EMAIL+'?subject='+encodeURIComponent('Fan Map beta feedback — '+S.display),
     ic:'<path d="M4 5h16v11H8l-4 4V5z"/><path d="M8 9h8M8 12h5"/>'});
  rows.forEach(r=>{
    const a=document.createElement('a');
    a.className='more-row'; a.href=r.url; a.target='_blank'; a.rel='noopener';
    a.innerHTML='<svg class="ic" viewBox="0 0 24 24">'+r.ic+'</svg><div><div class="t">'+r.t+'</div><div class="s">'+r.s+'</div></div><span class="go">&rsaquo;</span>';
    wrap.appendChild(a);
  });
  $('finePrint').textContent=S.fine;
}

// ---------------- Boot ----------------
function renderAll(){ renderHome(); renderMap(); renderParties(); renderTailgates(); renderMore(); }
buildWelcome();
</script>
</body>
</html>
