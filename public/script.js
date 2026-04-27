let isAdmin = false;
let slots = Array(16).fill(0);
let houses = [];

const slotsContainer = document.getElementById('slots');
const adminButton = document.getElementById('adminButton');
const adminHint = document.getElementById('adminHint');
const housesList = document.getElementById('housesList');
const houseSearch = document.getElementById('houseSearch');

adminButton?.addEventListener('click', handleAdminClick);
houseSearch?.addEventListener('input', () => renderHouses(houseSearch.value));

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdmin();
  await loadSlots();
  await loadHouses();
  await initMap();
});

async function handleAdminClick() {
  if (isAdmin) {
    await fetch('/api/admin/logout', { method: 'POST' });
    isAdmin = false;
    updateAdminUI();
    renderSlots();
    return;
  }

  const password = prompt('Введите пароль администратора');
  if (!password) return;

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!res.ok) {
    alert('Неверный пароль');
    return;
  }

  isAdmin = true;
  updateAdminUI();
  renderSlots();
}

async function checkAdmin() {
  try {
    const res = await fetch('/api/admin/status');
    const data = await res.json();
    isAdmin = !!data.isAdmin;
  } catch (_) {
    isAdmin = false;
  }
  updateAdminUI();
}

function updateAdminUI() {
  if (adminHint) adminHint.hidden = !isAdmin;
  if (adminButton) {
    adminButton.textContent = isAdmin ? 'Отключить режим' : 'Вход админа';
    adminButton.classList.toggle('is-admin', isAdmin);
  }
}

async function loadSlots() {
  try {
    const res = await fetch('/api/slots');
    const data = await res.json();
    if (Array.isArray(data) && data.length === 16) slots = data.map(Number);
  } catch (_) {}
  renderSlots();
}

function renderSlots() {
  if (!slotsContainer) return;
  slotsContainer.innerHTML = '';
  slots.forEach((value, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.setAttribute('aria-label', `Слот ${index + 1}`);
    if (value) button.classList.add('is-filled');
    if (isAdmin) button.classList.add('is-admin');
    button.addEventListener('click', async () => {
      if (!isAdmin) return;
      slots[index] = slots[index] ? 0 : 1;
      renderSlots();
      await saveSlots();
    });
    slotsContainer.appendChild(button);
  });
}

async function saveSlots() {
  try {
    const res = await fetch('/api/admin/save-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots })
    });
    if (!res.ok) throw new Error('save failed');
  } catch (_) {
    alert('Не удалось сохранить слоты. Проверьте вход администратора.');
    await loadSlots();
  }
}

async function loadHouses() {
  try {
    const res = await fetch('/api/houses');
    houses = await res.json();
  } catch (_) {
    houses = [];
  }
  renderHouses('');
}

function renderHouses(query = '') {
  if (!housesList) return;
  const q = query.trim().toLowerCase().replace('ё', 'е');
  const filtered = houses.filter((h) => getAddress(h).toLowerCase().replace('ё', 'е').includes(q));
  housesList.innerHTML = '';

  if (!filtered.length) {
    housesList.innerHTML = '<div class="house-row"><span>Адреса не найдены</span><span>—</span><span>—</span></div>';
    return;
  }

  filtered.slice(0, 250).forEach((h) => {
    const row = document.createElement('div');
    row.className = 'house-row';
    const address = getAddress(h);
    row.innerHTML = `
      <span><a href="https://yandex.ru/maps/?text=${encodeURIComponent('Нижнекамск, ' + address)}" target="_blank" rel="noopener">${escapeHTML(address)}</a></span>
      <span>${escapeHTML(h.entrances || '—')}</span>
      <span>${escapeHTML(h.floors || '—')}</span>
    `;
    housesList.appendChild(row);
  });
}

async function initMap() {
  const mapEl = document.getElementById('map');
  const fallback = document.getElementById('mapFallback');
  if (!mapEl || typeof L === 'undefined') {
    if (fallback) fallback.hidden = false;
    return;
  }

  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    dragging: true,
    zoomControl: true,
    attributionControl: true
  }).setView([55.635, 51.82], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let mapHouses = [];
  try {
    const res = await fetch('/api/houses-map');
    mapHouses = await res.json();
  } catch (_) {}

  const withCoords = Array.isArray(mapHouses)
    ? mapHouses.filter((h) => Number.isFinite(Number(h.lat)) && Number.isFinite(Number(h.lon)))
    : [];

  if (!withCoords.length) {
    if (fallback) fallback.hidden = false;
    return;
  }

  const pinIcon = L.divIcon({
    className: '',
    html: '<div class="pin-marker"></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });

  const group = typeof L.markerClusterGroup === 'function'
    ? L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 17,
        maxClusterRadius: 44
      })
    : L.layerGroup();

  const bounds = [];
  withCoords.forEach((h) => {
    const lat = Number(h.lat);
    const lon = Number(h.lon);
    bounds.push([lat, lon]);
    const popup = `<b>${escapeHTML(getAddress(h))}</b><br>Подъездов: ${escapeHTML(h.entrances || '—')}<br>Этажей: ${escapeHTML(h.floors || '—')}`;
    group.addLayer(L.marker([lat, lon], { icon: pinIcon }).bindPopup(popup));
  });

  group.addTo(map);
  setTimeout(() => map.invalidateSize(), 180);
  if (bounds.length) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
}


function getAddress(h) {
  if (!h) return '';
  if (h.address) return String(h.address);
  const street = h.street ? String(h.street) : '';
  const house = h.house ? ` д.${h.house}` : '';
  return `${street}${house}`.trim() || 'Адрес не указан';
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// Плавная навигация с запасом сверху, чтобы заголовки не прятались под шапкой
(function setupSmartAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      const header = document.querySelector('.site-header');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const extraGap = window.innerWidth <= 820 ? 22 : 34;
      const y = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - extraGap;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      history.pushState(null, '', href);
    });
  });
})();

// Premium interactions: tariff windows, soft 3D, scroll reveal, background light
(function premiumInteractions(){
  const root = document.documentElement;
  window.addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', `${e.clientX}px`);
    root.style.setProperty('--my', `${e.clientY}px`);
  }, { passive:true });

  const labels = ['Максимальный охват','Оптимальный формат','Лёгкий старт'];
  document.querySelectorAll('.tariff-card').forEach((card, index) => {
    card.setAttribute('data-tilt','');
    if (!card.querySelector('.tariff-glow')) card.insertAdjacentHTML('afterbegin','<div class="tariff-glow"></div>');
    if (!card.querySelector('.tariff-label')) {
      const cls = index === 1 ? 'tariff-label tariff-label--hit' : 'tariff-label';
      const title = labels[index] || 'Тариф';
      card.insertAdjacentHTML('afterbegin', `<span class="${cls}">${title}</span>`);
    }
  });

  const revealTargets = document.querySelectorAll('.section-shell, .contacts-band, .tariff-card, .format-copy div');
  revealTargets.forEach((el) => el.classList.add('reveal'));
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;
  revealTargets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 0.025, 0.18)}s`;
    if (observer) observer.observe(el); else el.classList.add('is-visible');
  });

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (window.innerWidth < 900) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -7;
      const ry = ((x / r.width) - 0.5) * 8;
      const lift = -12;
      card.style.transform = `translateY(${lift}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
})();
