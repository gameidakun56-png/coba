if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) { registration.unregister(); }
  });
}

const setIfExist = (id, content, isHtml = false) => {
  const el = document.getElementById(id);
  if (el) {
    if (isHtml) el.innerHTML = content;
    else el.textContent = content;
  }
};

function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function safeText(s){
  return (s || "").toString().replace(/[<>]/g, "").trim();
}

function prettyDate(idDateISO){
  const d = new Date(idDateISO);
  return d.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function pad2(n){ return String(n).padStart(2, "0"); }

async function loadConfig(){
  const res = await fetch("data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Gagal memuat config.json");
  return res.json();
}

// --- FUNGSI UPDATE PETA (GLOBAL) ---
function updateMapContent(type) {
  const event = state.config?.event;
  const mapFrame = document.getElementById('mapsFrame');
  const dirBtn = document.getElementById('directionBtn');
  const mapTitle = document.getElementById('mapTitle');
  
  if (!event || !mapFrame) return;

  mapFrame.style.opacity = "0";
  setTimeout(() => {
    if (type === 'akad') {
      if(mapTitle) mapTitle.innerText = "Lokasi Akad & Resepsi";
      mapFrame.src = event.akad.mapsEmbed;
      if(dirBtn) dirBtn.href = event.akad.mapsDirection;
    } else {
      if(mapTitle) mapTitle.innerText = "Lokasi Ngunduh Mantu";
      mapFrame.src = event.ngunduh.mapsEmbed;
      if(dirBtn) dirBtn.href = event.ngunduh.mapsDirection;
    }
    mapFrame.style.opacity = "1";
  }, 300);
}

function applyTheme() {
  const c = state.config;
  if(!c) return;
  }

  const hero = $("#heroBg");
  if(hero && c?.site?.coverImage) hero.style.backgroundImage = `url("${c.site.coverImage}")`;

  setIfExist("brandText", c.site?.brand);
  setIfExist("logoBrand", c.site?.brand);

  // Couple
  setIfExist("groomName", c.couple?.groom?.name);
  setIfExist("groomShort", c.couple?.groom?.short);
  $("#groomParents").textContent = c?.couple?.groom?.parents;
  $("#groomPhoto").src = c?.couple?.groom?.photo || $("#groomPhoto").src;
  $("#groomIg").href = c?.couple?.groom?.instagram || "#";

  setIfExist("brideName", c.couple?.bride?.name);
  setIfExist("brideShort", c.couple?.bride?.short);
  $("#brideParents").textContent = c?.couple?.bride?.parents;
  $("#bridePhoto").src = c?.couple?.bride?.photo || $("#bridePhoto").src;
  $("#brideIg").href = c?.couple?.bride?.instagram || "#";

  // Event
  const tz = c.event?.timezoneLabel || "";

  setIfExist("eventDateText", prettyDate(c.event?.dateISO));
  setIfExist("eventCityText", c.site?.city);

  // Bagian Ngunduh
  setIfExist("akadTime", `${c.event?.akad?.time || ""} ${tz}`);
  setIfExist("akadPlace", `<strong>${c.event?.akad?.place || ""}</strong>`, true);
  setIfExist("akadAddress", c.event?.akad?.address);
 
  // Bagian Ngunduh (Sesuaikan dengan ID di index.html baris 136-141)
  setIfExist("ngunduhTime", `${c.event?.ngunduh?.time || ""} ${tz}`);
  setIfExist("ngunduhPlace", `<strong>${c.event?.ngunduh?.place || ""}</strong>`, true);
  setIfExist("ngunduhAddress", c.event?.ngunduh?.address);

  updateMapContent('akad');
  renderStory(c?.story || []);
  renderGallery(c?.media?.gallery || []);
  renderGifts(c?.gift);

  const bgm = $("#bgm");
  if(bgm && c?.media?.music?.src) bgm.src = c.media.music.src;

  if(c?.gift?.enable === false) $("#gift")?.style.setProperty("display", "none");
  if(c?.rsvp?.enable === false) $("#rsvp")?.style.setProperty("display", "none");
}

function setGuestName(){
  const raw = getQueryParam("to");
  const name = safeText(decodeURIComponent(raw.replace(/\+/g," "))) || "Tamu Undangan";
  if($("#guestName")) $("#guestName").textContent = name;
  if($("#guestNameInline")) $("#guestNameInline").textContent = name;
  
  const rsvpNameInput = $("#rsvpName");
  if(rsvpNameInput) rsvpNameInput.value = name !== "Tamu Undangan" ? name : "";
}

function revealOnScroll(){
  const els = $$(".reveal");
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add("show");
    });
  }, { threshold: 0.12 });
  els.forEach(el=>io.observe(el));
}

function startCountdown() {
  const dateISO = state.config?.event?.dateISO;
  if (!dateISO) return;

  const target = new Date(dateISO).getTime();
  
  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    diff -= hrs * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    const secs = Math.floor(diff / 1000);

    if ($("#cdDays")) $("#cdDays").textContent = pad2(days);
    if ($("#cdHours")) $("#cdHours").textContent = pad2(hrs);
    if ($("#cdMins")) $("#cdMins").textContent = pad2(mins);
    if ($("#cdSecs")) $("#cdSecs").textContent = pad2(secs);
  };

  tick();
  setInterval(tick, 1000);
}

function addToCalendar() {
  const c = state.config;
  if (!c) return;
  const summary = `Pernikahan ${c.couple.groom.short} & ${c.couple.bride.short}`;
  const location = `${c.event.akad.place}, ${c.event.akad.address}`;
  const desc = `Akad: ${c.event.akad.time}\nNgunduh: ${c.event.ngunduh.time}`;
  const dateStr = c.event.dateISO.replace(/[-:]/g, "").split(".")[0] + "Z";
  const url = `https://calendar.google.com{encodeURIComponent(summary)}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
  window.open(url, "_blank");
}

function renderGallery(list){
  const wrap = $("#galleryGrid");
  if(!wrap) return;
  wrap.innerHTML = "";
  list.forEach((src)=>{
    const div = document.createElement("div");
    div.className = "gitem";
    div.setAttribute("data-full", src);
    div.innerHTML = `<img src="${src}" alt="Foto" loading="lazy">`;
    wrap.appendChild(div);
  });
}

function renderStory(items){
  const wrap = $("#storyWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  items.forEach(it=>{
    const el = document.createElement("div");
    el.className = "titem card reveal";
    el.innerHTML = `<div class="date">${safeText(it.date)}</div><h4>${safeText(it.title)}</h4><p>${safeText(it.text)}</p>`;
    wrap.appendChild(el);
  });
}

function renderGifts(gift){
  const wrap = $("#giftWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  if(!gift || gift.enable === false) return;
  (gift.accounts || []).forEach(acc=>{
    const card = document.createElement("div");
    card.className = "card reveal";
    card.innerHTML = `<h4>${safeText(acc.bank)}</h4><p><strong>${safeText(acc.name)}</strong></p><p class="muted">${safeText(acc.number)}</p><button class="btn btn--sm" onclick="copyToClipboard('${acc.number}')">Salin</button>`;
    wrap.appendChild(card);
  });
}

function copyToClipboard(text){
  navigator.clipboard.writeText(text).then(() => alert("Berhasil disalin!"));
}

// --- INISIALISASI UTAMA ---
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openBtn");
  const gate = document.getElementById("gate");

  // 1. Logika Buka Gate (Langsung aktif)
  if (openBtn && gate) {
    openBtn.onclick = () => {
      gate.classList.add("gate--hidden");
      const bgm = document.getElementById("bgm");
      if (bgm) bgm.play().catch(() => console.log("Autoplay blocked"));
    };
  }

  initInvitation();
});

async function initInvitation() {
  try {
    state.config = await loadConfig();
    applyTheme();
    setGuestName();
    if (typeof startCountdown === "function") startCountdown();
    if (typeof revealOnScroll === "function") revealOnScroll();
    
    // Aktifkan Tombol Kalender
    const calBtn = document.getElementById("addToCalendar");
    if (calBtn) calBtn.onclick = addToCalendar;

  } catch (err) {
    console.error("Gagal memuat config:", err);
  }
}
