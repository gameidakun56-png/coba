/* =========================================================
   Glassmorphism Invitation - FINAL
   - Mobile friendly
   - Different backgrounds for cover/home/closing
   - Events: only 2 cards (Akad&Resepsi, Ngunduh Mantu)
   - Gallery: photos + video tiles (same style)
   - Gifts: show logos
   - RSVP: neat + right panel shows ALL wishes
   - Wishes/RSVP can be stored in Google Sheets via Apps Script (JSONP for read)
========================================================= */

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const LS = {
  RSVP: "inv_rsvp_v3",
  WISH: "inv_wish_v3"
};

const state = {
  cfg: null,
  muted: true
};

function safeText(s){ return (s ?? "").toString().replace(/[<>]/g,"").trim(); }
function qp(name){ return new URL(location.href).searchParams.get(name) || ""; }
function decodePlus(v){ return decodeURIComponent((v || "").replace(/\+/g, " ")); }

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("config.json tidak ditemukan");
  return res.json();
}

function setTheme(){
  const t = state.cfg.theme || {};
  if(t.bg) document.documentElement.style.setProperty("--bg", t.bg);
  if(t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  if(t.accent2) document.documentElement.style.setProperty("--accent2", t.accent2);

  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta && t.accent) meta.setAttribute("content", t.accent);

  document.title = state.cfg.siteTitle || document.title;
}

function setBrand(){
  $("#brandText").textContent = state.cfg.siteTitle || "Undangan";
  $("#footerBrand").textContent = state.cfg.brand || "Brand";
  $("#yearNow").textContent = new Date().getFullYear();
}

function applySectionBackgrounds(){
  const b = state.cfg.backgrounds || {};
  const cover = $("#coverBg");
  const home = $("#homeBg");
  const closing = $("#closingBg");

  // Cover bg handled by coverBg element
  if(cover && b.cover) cover.style.backgroundImage = `url("${b.cover}")`;
  if(home && b.home) home.style.backgroundImage = `url("${b.home}")`;
  if(closing && b.closing) closing.style.backgroundImage = `url("${b.closing}")`;
}

function fillCover(){
  const c = state.cfg.cover || {};
  $("#coverTitleTop").textContent = c.titleTop || "The Wedding Of";
  $("#coverTitle").textContent = c.title || "Wedding Invitation";
  $("#coverDateText").textContent = c.dateText || "";
  $("#coverGreeting").textContent = c.greeting || "";
}

function setGuest(){
  const pName = state.cfg.guest?.paramName || "to";
  const raw = qp(pName);
  const name = safeText(decodePlus(raw)) || (state.cfg.guest?.defaultName || "Tamu Undangan");

  $("#guestName").textContent = name;
  $("#guestInline").textContent = name;

  // Prefill forms
  $("#rsvpName").value = name !== (state.cfg.guest?.defaultName || "Tamu Undangan") ? name : "";
  $("#wishName").value = $("#rsvpName").value;
}

function setHome(){
  const home = state.cfg.home || {};
  $("#homeGreet").textContent = state.cfg.cover?.greeting || "Assalamu’alaikum Warahmatullahi Wabarakatuh";
  $("#homeHeadline").textContent = home.headline || "";
  $("#homeDatePill").textContent = state.cfg.cover?.dateText || "";
  $("#homeLocPill").textContent = home.locationText || "";

  const groomShort = (state.cfg.couple?.groom?.name || "Mempelai Pria").split(" ")[0];
  const brideShort = (state.cfg.couple?.bride?.name || "Mempelai Wanita").split(" ")[0];

  $("#groomNameShort").textContent = groomShort;
  $("#brideNameShort").textContent = brideShort;

  $("#closingGroom").textContent = groomShort;
  $("#closingBride").textContent = brideShort;
}

function setCouple(){
  const couple = state.cfg.couple || {};
  const bride = couple.bride || {};
  const groom = couple.groom || {};

  $("#brideName").textContent = bride.name || "Mempelai Wanita";
  $("#brideParents").textContent = bride.parents || "";
  $("#bridePhoto").src = bride.photo || $("#bridePhoto").src;
  $("#brideIg").href = bride.instagram || "#";

  $("#groomName").textContent = groom.name || "Mempelai Pria";
  $("#groomParents").textContent = groom.parents || "";
  $("#groomPhoto").src = groom.photo || $("#groomPhoto").src;
  $("#groomIg").href = groom.instagram || "#";
}

function buildEvents(){
  const wrap = $("#eventCards");
  wrap.innerHTML = "";
  const events = state.cfg.events || [];

  events.forEach((ev, i)=>{
    const card = document.createElement("article");
    card.className = "eventCard glass reveal";

    const itemsHtml = (ev.items || []).map(it => `
      <div class="eventBlock">
        <div class="badge" style="display:inline-block">${safeText(it.label)}</div>
        <div class="eventMeta" style="margin-top:8px">
          <div><b>${safeText(it.timeText)}</b></div>
          <div class="eventPlace">${safeText(it.place)}</div>
          <div class="muted small">${safeText(it.address)}</div>
        </div>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="eventTop">
        <span class="badge">${safeText(ev.type)}</span>
        <span class="muted small">#${String(i+1).padStart(2,"0")}</span>
      </div>

      <div class="eventMeta" style="margin-top:6px">
        <div><b>${safeText(ev.dateText || "")}</b></div>
      </div>

      ${itemsHtml}

      ${ev.mapEmbed ? `<iframe class="mapFrame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${ev.mapEmbed}" title="Peta ${safeText(ev.type)}"></iframe>` : ""}

      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:10px">
        ${ev.mapDirection ? `<a class="btn btn--ghost" href="${ev.mapDirection}" target="_blank" rel="noopener">Petunjuk Arah</a>` : ""}
      </div>
    `;

    wrap.appendChild(card);
  });
}

function countdown(){
  const target = new Date(state.cfg.home?.eventISO || new Date().toISOString()).getTime();
  const tick = ()=>{
    const now = Date.now();
    let d = Math.max(0, target - now);

    const days = Math.floor(d/(24*3600*1000)); d -= days*24*3600*1000;
    const hrs = Math.floor(d/(3600*1000)); d -= hrs*3600*1000;
    const mins = Math.floor(d/(60*1000)); d -= mins*60*1000;
    const secs = Math.floor(d/1000);

    $("#cdDays").textContent = String(days).padStart(2,"0");
    $("#cdHours").textContent = String(hrs).padStart(2,"0");
    $("#cdMins").textContent = String(mins).padStart(2,"0");
    $("#cdSecs").textContent = String(secs).padStart(2,"0");
  };
  tick();
  setInterval(tick, 1000);
}

/* -------- Gallery: photos + video tiles (same style) -------- */
function gallery(){
  const grid = $("#galleryGrid");
  grid.innerHTML = "";

  const photos = state.cfg.gallery?.photos || [];
  const videos = state.cfg.gallery?.videos || [];

  photos.forEach((src)=>{
    const d = document.createElement("div");
    d.className = "gItem glass";
    d.dataset.full = src;
    d.innerHTML = `<img src="${src}" alt="Foto galeri" loading="lazy" />`;
    grid.appendChild(d);
  });

  videos.forEach((v)=>{
    const d = document.createElement("div");
    d.className = "gItem glass gItem--video";
    d.dataset.video = v.src;
    const poster = v.poster || photos[0] || "assets/img/cover.jpg";
    d.innerHTML = `
      <img src="${poster}" alt="${safeText(v.title || "Prewedding Film")}" loading="lazy" />
      <div class="gPlay" aria-hidden="true"><div class="gPlayIcon">▶</div></div>
    `;
    grid.appendChild(d);
  });

  // Photo modal
  const photoModal = $("#photoModal");
  const photoFull = $("#photoFull");
  const openPhoto = (src)=>{
    photoFull.src = src;
    photoModal.classList.add("show");
    photoModal.setAttribute("aria-hidden","false");
  };
  const closePhoto = ()=>{
    photoModal.classList.remove("show");
    photoModal.setAttribute("aria-hidden","true");
  };
  $("#photoClose").addEventListener("click", closePhoto);
  photoModal.addEventListener("click",(e)=>{ if(e.target===photoModal) closePhoto(); });

  // Video modal
  const videoModal = $("#videoModal");
  const player = $("#videoPlayer");
  const openVideo = (src)=>{
    player.src = src;
    videoModal.classList.add("show");
    videoModal.setAttribute("aria-hidden","false");
    player.play().catch(()=>{});
  };
  const closeVideo = ()=>{
    player.pause();
    player.removeAttribute("src");
    player.load();
    videoModal.classList.remove("show");
    videoModal.setAttribute("aria-hidden","true");
  };
  $("#videoClose").addEventListener("click", closeVideo);
  videoModal.addEventListener("click",(e)=>{ if(e.target===videoModal) closeVideo(); });

  // Delegate click grid
  grid.addEventListener("click", (e)=>{
    const v = e.target.closest("[data-video]");
    const p = e.target.closest("[data-full]");
    if(v){
      openVideo(v.dataset.video);
      return;
    }
    if(p){
      openPhoto(p.dataset.full);
      return;
    }
  });

  window.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){ closePhoto(); closeVideo(); }
  });
}

/* -------- Story -------- */
function story(){
  const wrap = $("#storyWrap");
  wrap.innerHTML = "";
  (state.cfg.story || []).forEach((s)=>{
    const d = document.createElement("div");
    d.className = "tItem glass reveal";
    d.innerHTML = `
      <div class="tTop">
        <span class="year">${safeText(s.year)}</span>
        <span class="muted small">—</span>
      </div>
      <h4>${safeText(s.title)}</h4>
      <p>${safeText(s.desc)}</p>
    `;
    wrap.appendChild(d);
  });
}

/* -------- Gifts with logo -------- */
function gifts(){
  const wrap = $("#giftWrap");
  wrap.innerHTML = "";

  if(!state.cfg.gifts?.enabled){
    $("#gifts").style.display = "none";
    return;
  }

  (state.cfg.gifts.options || []).forEach((g)=>{
    const d = document.createElement("div");
    d.className = "giftCard glass reveal";

    const logo = g.logo ? `<img class="giftLogo" src="${g.logo}" alt="Logo ${safeText(g.note || g.label)}" loading="lazy" />` : "";
    const note = g.note ? `<div class="giftNote">${safeText(g.note)}</div>` : `<div class="giftNote">${safeText(g.label)}</div>`;

    d.innerHTML = `
      <div class="giftTop">
        ${logo}
        <div style="text-align:left">
          ${note}
          <h4 style="margin:4px 0 0">${safeText(g.label)}</h4>
        </div>
      </div>

      <div class="valueBox">
        <b>${safeText(g.name)}</b>
        <div class="mono">${safeText(g.value)}</div>
      </div>

      <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; justify-content:center">
        <button class="btn btn--primary" type="button" data-copy="${safeText(g.value)}">
          <span class="btn__glow" aria-hidden="true"></span> Salin
        </button>
        <button class="btn btn--ghost" type="button" data-share="${safeText(g.value)}">Bagikan</button>
      </div>

      <p class="tiny muted" style="margin:10px 0 0">Terima kasih atas perhatian dan doanya 🙏</p>
    `;
    wrap.appendChild(d);
  });

  wrap.addEventListener("click", async (e)=>{
    const copyBtn = e.target.closest("[data-copy]");
    const shareBtn = e.target.closest("[data-share]");

    if(copyBtn){
      const val = copyBtn.getAttribute("data-copy");
      try{
        await navigator.clipboard.writeText(val);
        copyBtn.textContent = "Tersalin ✓";
        setTimeout(()=>copyBtn.innerHTML = `<span class="btn__glow" aria-hidden="true"></span> Salin`, 1200);
      }catch{
        alert("Gagal salin otomatis. Salin manual ya: " + val);
      }
    }

    if(shareBtn){
      const val = shareBtn.getAttribute("data-share");
      if(navigator.share){
        navigator.share({ title:"Kado Digital", text: val }).catch(()=>{});
      }else{
        alert("Browser belum support share. Kamu bisa salin teks ini:\n" + val);
      }
    }
  });
}

/* -------- Calendar (ICS) -------- */
function makeICS({title, startISO, durationHours=3, location="", description=""}){
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationHours*3600*1000);
  const fmt = (d)=> new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Glass Invite//GitHub Pages//ID
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@glass-invite
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "undangan.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* -------- Audio + Gate -------- */
function setMutedUI(muted){
  state.muted = muted;
  $("#btnMute").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").textContent = muted ? "Musik: Off" : "Musik: On";
}

async function playAudio(){
  const bgm = $("#bgm");
  bgm.muted = state.muted;
  try{ await bgm.play(); }catch{}
}

function wireAudio(){
  const bgm = $("#bgm");
  bgm.src = state.cfg.music?.src || "";

  setMutedUI(!!state.cfg.music?.startMuted);

  const toggle = async ()=>{
    setMutedUI(!state.muted);
    bgm.muted = state.muted;
    if(!state.muted) await playAudio();
  };

  $("#btnMute").addEventListener("click", toggle);
  $("#btnMuteGate").addEventListener("click", toggle);

  $("#btnOpen").addEventListener("click", async ()=>{
    $("#coverGate").classList.add("hidden");
    await playAudio();
  });
}

/* -------- Wishes via Google Sheets (Apps Script JSONP) --------
   - Post: fetch with no-cors (works)
   - Read: JSONP via <script> (no CORS issue)
*/
function readLS(key){
  try{ return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch{ return []; }
}
function writeLS(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function wishItem(w){
  const el = document.createElement("div");
  el.className = "wish";
  const when = w.createdAt ? new Date(w.createdAt).toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" }) : "";
  el.innerHTML = `<b>${safeText(w.name || "Tamu")}</b><p>${safeText(w.text || "")}</p>${when ? `<small>${when}</small>` : ""}`;
  return el;
}

async function postToSheet(payload){
  if(!state.cfg.sheet?.enabled) return { ok:false, msg:"sheet-disabled" };
  const url = state.cfg.sheet?.postEndpoint;
  if(!url) return { ok:false, msg:"missing-endpoint" };

  try{
    // no-cors avoids CORS issues on Apps Script
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    return { ok:true };
  }catch(err){
    return { ok:false, msg: err.message || "failed" };
  }
}

// JSONP loader for wishes
function fetchWishesJSONP(limit=100){
  return new Promise((resolve)=>{
    if(!state.cfg.sheet?.enabled) return resolve(null);
    const url = state.cfg.sheet?.readEndpoint;
    if(!url) return resolve(null);

    const cbName = "wishes_cb_" + Math.random().toString(16).slice(2);
    window[cbName] = (data)=>{
      try{
        resolve(Array.isArray(data?.wishes) ? data.wishes : []);
      }finally{
        delete window[cbName];
        script.remove();
      }
    };

    const script = document.createElement("script");
    script.src = `${url}?type=wishes&limit=${encodeURIComponent(limit)}&callback=${encodeURIComponent(cbName)}`;
    script.onerror = ()=>{
      delete window[cbName];
      script.remove();
      resolve(null);
    };
    document.body.appendChild(script);
  });
}

async function renderWishes(){
  const wrap = $("#wishList");
  wrap.innerHTML = `<p class="muted small">Memuat ucapan...</p>`;

  // Prefer sheet data
  let list = await fetchWishesJSONP(200);

  // fallback local storage if sheet not ready
  if(!list){
    list = readLS(LS.WISH);
  }

  wrap.innerHTML = "";
  if(!list.length){
    wrap.innerHTML = `<p class="muted small">Belum ada ucapan. Jadilah yang pertama 😊</p>`;
    return;
  }

  // newest first
  list.slice().reverse().forEach(w => wrap.appendChild(wishItem(w)));
}

/* -------- RSVP & Wish forms -------- */
function wireRSVP(){
  if(!state.cfg.rsvp?.enabled){
    $("#rsvp").style.display = "none";
    return;
  }

  $("#rsvpPax").max = String(state.cfg.rsvp.maxPax || 5);

  $("#rsvpForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#rsvpName").value);
    const attend = $("#rsvpAttend").value;
    const pax = Math.max(1, Math.min(Number($("#rsvpPax").value || 1), Number(state.cfg.rsvp.maxPax || 5)));
    const msg = safeText($("#rsvpMsg").value);

    const entry = { type:"rsvp", name, attend, pax, msg, createdAt: new Date().toISOString() };

    const res = await postToSheet(entry);
    $("#rsvpNote").textContent = res.ok ? "RSVP terkirim ✓" : "RSVP tersimpan lokal (endpoint belum siap).";

    // fallback local
    const list = readLS(LS.RSVP);
    list.unshift(entry);
    writeLS(LS.RSVP, list);

    $("#rsvpForm").reset();
    $("#rsvpPax").value = 1;
  });

  $("#wishForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#wishName").value);
    const text = safeText($("#wishText").value);

    const entry = { type:"wish", name, text, createdAt: new Date().toISOString() };

    const res = await postToSheet(entry);

    // fallback local
    const list = readLS(LS.WISH);
    list.unshift(entry);
    writeLS(LS.WISH, list);

    $("#wishForm").reset();

    // refresh right panel
    await renderWishes();

    // tiny feedback
    if(!res.ok){
      // optional: you can show toast; keep simple
      console.warn("Sheet endpoint not ready. Stored locally.");
    }
  });

  $("#btnRefreshWishes").addEventListener("click", ()=>renderWishes());

  renderWishes();
}

/* -------- Closing text -------- */
function closing(){
  $("#closingTitle").textContent = state.cfg.closing?.title || "Terima Kasih";
  $("#closingDesc").textContent = state.cfg.closing?.desc || "";
}

/* -------- Reveal animation -------- */
function reveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting) en.target.classList.add("show");
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el=>io.observe(el));
}

/* -------- UI helpers -------- */
function wireUI(){
  $("#btnTop").addEventListener("click", ()=>window.scrollTo({ top:0, behavior:"smooth" }));
  $("#btnIcs").addEventListener("click", ()=>{
    makeICS({
      title: state.cfg.cover?.title || "Undangan Pernikahan",
      startISO: state.cfg.home?.eventISO || new Date().toISOString(),
      durationHours: 3,
      location: state.cfg.home?.locationText || "",
      description: "Undangan Pernikahan"
    });
  });
}

/* -------- Service worker -------- */
function registerSW(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
}

/* -------- Init -------- */
(async function init(){
  try{
    state.cfg = await loadConfig();

    setTheme();
    setBrand();
    fillCover();
    applySectionBackgrounds();

    setGuest();
    setHome();
    setCouple();
    buildEvents();
    gallery();
    story();
    gifts();
    wireRSVP();
    closing();

    countdown();
    wireAudio();
    wireUI();
    reveal();
    registerSW();

  }catch(err){
    console.error(err);
    alert("Gagal memuat undangan. Pastikan struktur folder & path file benar.");
  }
})();
