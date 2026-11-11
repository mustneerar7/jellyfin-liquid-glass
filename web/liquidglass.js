/* =====================================================================
   Liquid Glass for Jellyfin web — behaviour layer
   - Floating glass sidebar (desktop) / bottom tab bar (phone)
   - Apple TV-style featured hero on Home
   - Cinematic backdrop + logo on item pages
   - Pointer-following specular light on glass controls
   - Appearance switch: Dark / Light / Automatic
   Pairs with liquidglass.css. Installed into Jellyfin's web client by apply.sh.
   Everything is additive: if this file fails, stock Jellyfin still works.
   ===================================================================== */
(() => {
  'use strict';
  if (window.__liquidGlass) return;
  window.__liquidGlass = true;

  const doc = document;
  const root = doc.documentElement;
  const HERO_INTERVAL = 8000;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
  const api = () => window.ApiClient;
  const uid = () => { try { return api() && api().getCurrentUserId && api().getCurrentUserId(); } catch (e) { return null; } };
  const getJSON = (path, q) => api().getJSON(api().getUrl(path, q));
  const imgUrl = (id, type, q) => api().getUrl(`Items/${id}/Images/${type}`, Object.assign({ quality: 90 }, q));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const route = () => location.hash.replace(/^#!?\/?/, '');
  const routeName = () => route().split('?')[0].toLowerCase();
  const routeParams = () => new URLSearchParams(route().split('?')[1] || '');
  const serverId = () => { try { return api().serverId(); } catch (e) { return ''; } };
  const detailsHash = (id) => `#/details?id=${id}` + (serverId() ? `&serverId=${serverId()}` : '');
  const log = (...a) => console.debug('[liquid-glass]', ...a);

  /* ---------------- Icons (SF Symbols–like line icons) ---------------- */
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9"/>',
    heart: '<path d="M12 20.2s-7.4-4.5-9.3-9C1.4 8 3.4 4.8 6.6 4.8c2.1 0 3.6 1.2 5.4 3.3 1.8-2.1 3.3-3.3 5.4-3.3 3.2 0 5.2 3.2 3.9 6.4-1.9 4.5-9.3 9-9.3 9z"/>',
    tv: '<rect x="2.5" y="4.5" width="19" height="13" rx="2.5"/><path d="M8 21h8"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 3v18M16.5 3v18M3 8h4.5M3 12h18M3 16h4.5M16.5 8H21M16.5 16H21"/>',
    music: '<path d="M9 18V5.5l11-2.5v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    photo: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 15.5-4.8-4.8L7 20"/>',
    book: '<path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2z"/><path d="M12 6.5v14"/>',
    live: '<rect x="2.5" y="7" width="19" height="13" rx="2.5"/><path d="m8 2.5 4 4.5 4-4.5"/>',
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r=".9"/><circle cx="4.5" cy="12" r=".9"/><circle cx="4.5" cy="18" r=".9"/>',
    stack: '<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M5.5 5h13M8 2.5h8"/>',
    settings: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2.2"/><rect x="3" y="13" width="18" height="7" rx="2.2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    back: '<path d="m14.5 18-6-6 6-6"/>',
    left: '<path d="m14.5 18-6-6 6-6"/>',
    right: '<path d="m9.5 6 6 6-6 6"/>',
    play: '<path d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12.4-7.4a1 1 0 0 0 0-1.72L8.5 3.74A1 1 0 0 0 7 4.6z" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
    moon: '<path d="M20 14.6A8.2 8.2 0 0 1 9.4 4 8.2 8.2 0 1 0 20 14.6z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.folder}</svg>`;
  const libIcon = (type) => ({
    tvshows: 'tv', movies: 'film', music: 'music', musicvideos: 'music', homevideos: 'photo', photos: 'photo',
    books: 'book', livetv: 'live', playlists: 'list', boxsets: 'stack', mixed: 'tv', folders: 'folder',
  }[(type || '').toLowerCase()] || 'folder');

  /* ---------------- Appearance: Dark / Light / Automatic ---------------- */
  const APPEARANCES = ['dark', 'light', 'auto'];
  const APPEARANCE_LABEL = { dark: 'Dark', light: 'Light', auto: 'Automatic' };
  const APPEARANCE_ICON = { dark: 'moon', light: 'sun', auto: 'auto' };
  const systemLight = matchMedia('(prefers-color-scheme: light)');
  const getAppearance = () => { try { const v = localStorage.getItem('lg-appearance'); return APPEARANCES.includes(v) ? v : 'dark'; } catch (e) { return 'dark'; } };
  function applyAppearance(animate) {
    const mode = getAppearance();
    const light = mode === 'light' || (mode === 'auto' && systemLight.matches);
    if (animate) { root.classList.add('lg-appearance-anim'); setTimeout(() => root.classList.remove('lg-appearance-anim'), 500); }
    root.classList.toggle('lg-light', light);
    const meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f2f2f7' : '#000000');
    $$('.lg-nav-appearance').forEach((b) => {
      const svg = b.querySelector('svg');
      if (svg) svg.outerHTML = icon(APPEARANCE_ICON[mode]);
      b.querySelector('.lg-nav-value').textContent = APPEARANCE_LABEL[mode];
      b.setAttribute('aria-label', 'Appearance: ' + APPEARANCE_LABEL[mode]);
    });
    $$('.lg-appearance-row .listItemAside').forEach((el) => { el.textContent = APPEARANCE_LABEL[mode]; });
  }
  function cycleAppearance() {
    const next = APPEARANCES[(APPEARANCES.indexOf(getAppearance()) + 1) % APPEARANCES.length];
    try { localStorage.setItem('lg-appearance', next); } catch (e) { /* ignore */ }
    applyAppearance(true);
  }
  systemLight.addEventListener('change', () => applyAppearance(true));
  window.addEventListener('storage', (e) => { if (e.key === 'lg-appearance') applyAppearance(true); });
  applyAppearance(false);

  // Settings page: add an "Appearance" row next to Jellyfin's Display row (reachable on phones too)
  function ensureAppearanceRow() {
    if (routeName() !== 'mypreferencesmenu') return;
    const display = $('.page:not(.hide) a.listItem-border[href*="mypreferencesdisplay"]');
    if (!display || $('.lg-appearance-row', display.parentElement)) return;
    const row = display.cloneNode(true);
    row.classList.add('lg-appearance-row');
    row.setAttribute('href', '#');
    const ic = row.querySelector('.listItemIcon');
    if (ic) {
      ic.classList.forEach((c) => { if (!/^(material-icons|listItemIcon.*)$/.test(c)) ic.classList.remove(c); });
      ic.classList.add('contrast');
      ic.textContent = '';
    }
    const text = row.querySelector('.listItemBodyText');
    if (text) text.textContent = 'Appearance';
    const li = row.querySelector('.listItem') || row;
    const aside = doc.createElement('div');
    aside.className = 'listItemAside';
    aside.textContent = APPEARANCE_LABEL[getAppearance()];
    li.appendChild(aside);
    row.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); cycleAppearance(); }, true);
    display.insertAdjacentElement('afterend', row);
  }

  /* ---------------- Visibility rules ---------------- */
  function navShouldHide() {
    const r = routeName();
    if (!uid()) return true;
    if (/^(login|selectserver|addserver|forgotpassword|resetpassword|wizard|startup|video|dashboard|configurationpage)/.test(r)) return true;
    if ($('.videoPlayerContainer:not(.hide)') || $('#videoOsdPage:not(.hide)')) return true;
    return false;
  }

  /* ---------------- Sidebar / tab bar ---------------- */
  let navLibsKey = '';
  let userCache = null;

  function ensureNav() {
    let nav = $('.lg-nav');
    if (!nav) {
      nav = doc.createElement('nav');
      nav.className = 'lg-nav';
      nav.setAttribute('aria-label', 'Main');
      nav.innerHTML = `
        <div class="lg-nav-panel">
          <a class="lg-nav-item lg-nav-profile" href="#/mypreferencesmenu" data-key="profile">
            <span class="lg-avatar" aria-hidden="true"></span>
            <span class="lg-nav-label"><span class="lg-nav-name">Profile</span><span class="lg-nav-sub">Profile</span></span>
          </a>
          <div class="lg-nav-group lg-nav-main">
            <a class="lg-nav-item" href="#/search" data-key="search">${icon('search')}<span class="lg-nav-label">Search</span></a>
            <a class="lg-nav-item" href="#/home" data-key="home">${icon('home')}<span class="lg-nav-label">Home</span></a>
            <a class="lg-nav-item" href="#/home?tab=1" data-key="favorites">${icon('heart')}<span class="lg-nav-label">Favorites</span></a>
          </div>
          <div class="lg-nav-sep" role="separator"></div>
          <div class="lg-nav-scroll lg-nav-group lg-nav-libs"></div>
          <div class="lg-nav-spacer"></div>
          <div class="lg-nav-group lg-nav-sys">
            <button type="button" class="lg-nav-item lg-nav-appearance" data-key="appearance">${icon('moon')}<span class="lg-nav-label">Appearance</span><span class="lg-nav-label lg-nav-value"></span></button>
            <a class="lg-nav-item" href="#/mypreferencesmenu" data-key="settings">${icon('settings')}<span class="lg-nav-label">Settings</span></a>
          </div>
        </div>`;
      doc.body.appendChild(nav);
      $('.lg-nav-appearance', nav).addEventListener('click', cycleAppearance);
      applyAppearance(false);

      const back = doc.createElement('button');
      back.className = 'lg-back lg-glass';
      back.type = 'button';
      back.setAttribute('aria-label', 'Back');
      back.innerHTML = icon('back');
      back.hidden = true;
      back.addEventListener('click', () => history.back());
      doc.body.appendChild(back);
    }
    root.classList.add('lg-nav-on');
    loadLibraries(nav);
    loadUser(nav);
    return nav;
  }

  function loadLibraries(nav) {
    // Prefer the links Jellyfin already built (correct routes for every library type)
    const fromDrawer = $$('.mainDrawer .libraryMenuOptions a.navMenuOption').map((a) => {
      const href = a.getAttribute('href') || '';
      const p = new URLSearchParams(href.split('?')[1] || '');
      return { id: a.getAttribute('data-itemid') || p.get('topParentId') || p.get('parentId') || href, name: a.textContent.trim(), href, type: p.get('collectionType') || '' };
    }).filter((l) => l.name);
    const fromBar = $$('header.MuiAppBar-root a.MuiButton-root[href*="topParentId"]').map((a) => {
      const href = a.getAttribute('href');
      const p = new URLSearchParams(href.split('?')[1] || '');
      return { id: p.get('topParentId'), name: a.textContent.trim(), href, type: p.get('collectionType') || '' };
    });
    const libs = fromDrawer.length ? fromDrawer : fromBar;
    const key = libs.map((l) => l.id + l.name).join('|');
    if (!libs.length || key === navLibsKey) return;
    navLibsKey = key;
    $('.lg-nav-libs', nav).innerHTML = libs.map((l) =>
      `<a class="lg-nav-item" href="${esc(l.href.startsWith('#') ? l.href : '#' + l.href.replace(/^#?/, ''))}" data-key="lib:${esc(l.id)}" data-lib="${esc(l.id)}">${icon(libIcon(l.type))}<span class="lg-nav-label">${esc(l.name)}</span></a>`
    ).join('');
  }

  function loadUser(nav) {
    const id = uid();
    if (!id || (userCache && userCache.Id === id && nav.dataset.user === id)) return;
    nav.dataset.user = id;
    api().getUser(id).then((u) => {
      userCache = u;
      $('.lg-nav-name', nav).textContent = u.Name;
      const av = $('.lg-avatar', nav);
      if (u.PrimaryImageTag) {
        av.style.backgroundImage = `url("${api().getUrl(`Users/${u.Id}/Images/Primary`, { tag: u.PrimaryImageTag, maxWidth: 96, quality: 90 })}")`;
        av.textContent = '';
      } else {
        av.textContent = (u.Name || '?').trim().charAt(0).toUpperCase();
      }
      const sys = $('.lg-nav-sys', nav);
      if (u.Policy && u.Policy.IsAdministrator && !$('[data-key="dashboard"]', sys)) {
        sys.insertAdjacentHTML('beforeend', `<a class="lg-nav-item" href="#/dashboard" data-key="dashboard">${icon('server')}<span class="lg-nav-label">Dashboard</span></a>`);
      }
    }).catch((e) => log('user', e));
  }

  function updateNav() {
    const nav = $('.lg-nav');
    if (!nav) return;
    const r = routeName();
    const p = routeParams();
    let key = '';
    if (r === 'home' || r === '' || r === 'home.html') key = p.get('tab') === '1' ? 'favorites' : 'home';
    else if (r === 'search') key = 'search';
    else if (/^(mypreferencesmenu|mypreferences|userprofile|quickconnect)/.test(r)) key = 'settings';
    else if (p.get('topParentId') || p.get('parentId')) key = 'lib:' + (p.get('topParentId') || p.get('parentId'));
    $$('.lg-nav-item', nav).forEach((a) => {
      const on = a.dataset.key === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const back = $('.lg-back');
    if (back) back.hidden = key === 'home' || key === 'favorites' || key.startsWith('lib:') || key === 'search' || r === '';
  }

  /* ---------------- Featured hero ---------------- */
  let heroTimer = null;

  async function fetchFeatured() {
    const u = uid();
    const fields = 'Overview,Genres,OfficialRating,ProductionYear,CommunityRating,PremiereDate,EndDate,Status,ChildCount,Taglines';
    const empty = { Items: [] };
    const [latest, nextUp, resume] = await Promise.all([
      getJSON('Items', { userId: u, IncludeItemTypes: 'Movie,Series', Recursive: true, ImageTypes: 'Backdrop', SortBy: 'DateCreated', SortOrder: 'Descending', Limit: 12, Fields: fields, EnableUserData: true }).catch(() => empty),
      getJSON('Shows/NextUp', { userId: u, Limit: 12, EnableUserData: true, DisableFirstEpisode: false }).catch(() => empty),
      getJSON('UserItems/Resume', { userId: u, Limit: 12, MediaTypes: 'Video', EnableUserData: true }).catch(() => empty),
    ]);
    const up = new Map(); // seriesId/movieId -> episode/movie to play
    const order = [];
    const push = (id, target) => { if (!id) return; if (!up.has(id)) { up.set(id, target); order.push(id); } };
    (resume.Items || []).forEach((i) => push(i.Type === 'Episode' ? i.SeriesId : i.Id, i));
    (nextUp.Items || []).forEach((i) => push(i.SeriesId, i));
    const byId = new Map((latest.Items || []).map((i) => [i.Id, i]));
    const missing = order.filter((id) => !byId.has(id));
    if (missing.length) {
      const extra = await getJSON('Items', { userId: u, Ids: missing.join(','), Fields: fields, EnableUserData: true }).catch(() => empty);
      (extra.Items || []).forEach((i) => byId.set(i.Id, i));
    }
    (latest.Items || []).forEach((i) => { if (!order.includes(i.Id)) order.push(i.Id); });
    return order.map((id) => byId.get(id))
      .filter((i) => i && i.BackdropImageTags && i.BackdropImageTags.length)
      .slice(0, 7)
      .map((i) => ({ item: i, target: up.get(i.Id) || null }));
  }

  function yearText(i) {
    if (i.Type === 'Series' && i.ProductionYear) {
      const end = i.EndDate ? new Date(i.EndDate).getFullYear() : null;
      return i.Status === 'Continuing' ? `${i.ProductionYear}–Present` : (end && end !== i.ProductionYear ? `${i.ProductionYear}–${end}` : `${i.ProductionYear}`);
    }
    return i.ProductionYear ? String(i.ProductionYear) : '';
  }

  function playLabel(entry) {
    const t = entry.target;
    const resumed = (x) => x && x.UserData && x.UserData.PlaybackPositionTicks > 0;
    if (t && t.Type === 'Episode') {
      const se = (t.ParentIndexNumber != null && t.IndexNumber != null) ? ` S${t.ParentIndexNumber}, E${t.IndexNumber}` : '';
      return (resumed(t) ? 'Resume' : 'Play') + se;
    }
    return resumed(t || entry.item) ? 'Resume' : 'Play';
  }

  function slideHTML(entry, idx) {
    const i = entry.item;
    const art = imgUrl(i.Id, 'Backdrop/0', { maxWidth: 2560, tag: i.BackdropImageTags[0] });
    const logo = i.ImageTags && i.ImageTags.Logo ? imgUrl(i.Id, 'Logo', { maxWidth: 920, tag: i.ImageTags.Logo }) : '';
    const kind = i.Type === 'Series' ? 'TV Show' : 'Movie';
    const meta = [];
    meta.push(`<span>${kind}</span>`);
    if (i.Genres && i.Genres.length) meta.push(`<span>${esc(i.Genres.slice(0, 2).join(' · '))}</span>`);
    const y = yearText(i);
    if (y) meta.push(`<span>${esc(y)}</span>`);
    let metaHTML = meta.join('<span class="lg-dot"></span>');
    if (i.OfficialRating) metaHTML += `<span class="lg-badge">${esc(i.OfficialRating)}</span>`;
    if (i.CommunityRating) metaHTML += `<span><span class="lg-star">★</span> ${Number(i.CommunityRating).toFixed(1)}</span>`;
    const fav = i.UserData && i.UserData.IsFavorite;
    const eyebrow = entry.target ? 'Continue Watching' : (idx === 0 ? 'New on ' + esc(document.title || 'Jellyfin') : 'Featured');
    return `
      <div class="lg-hero-slide" data-index="${idx}" aria-roledescription="slide" aria-label="${idx + 1}: ${esc(i.Name)}">
        <div class="lg-hero-art" style="background-image:url('${esc(art)}')"></div>
        <div class="lg-hero-scrim"></div>
        <div class="lg-hero-content">
          <div class="lg-hero-eyebrow">${eyebrow}</div>
          ${logo ? `<img class="lg-hero-logo" src="${esc(logo)}" alt="${esc(i.Name)}">` : `<h2 class="lg-hero-title">${esc(i.Name)}</h2>`}
          <div class="lg-hero-meta">${metaHTML}</div>
          ${i.Overview ? `<p class="lg-hero-overview">${esc(i.Overview)}</p>` : ''}
          <div class="lg-hero-actions">
            <button type="button" class="lg-btn lg-btn-primary" data-act="play">${icon('play')}<span>${esc(playLabel(entry))}</span></button>
            <button type="button" class="lg-btn lg-btn-glass" data-act="info">${icon('info')}<span>More Info</span></button>
            <button type="button" class="lg-btn lg-btn-glass lg-btn-icon" data-act="fav" aria-pressed="${fav ? 'true' : 'false'}" aria-label="${fav ? 'Remove from Favorites' : 'Add to Favorites'}" title="${fav ? 'Remove from Favorites' : 'Add to Favorites'}">${icon(fav ? 'check' : 'plus')}</button>
          </div>
        </div>
      </div>`;
  }

  function createHero() {
    const hero = doc.createElement('section');
    hero.className = 'lg-hero';
    hero.setAttribute('aria-roledescription', 'carousel');
    hero.setAttribute('aria-label', 'Featured');
    hero.style.setProperty('--lg-hero-interval', HERO_INTERVAL + 'ms');
    hero.hidden = true;
    return hero;
  }

  async function loadHero(hero) {
    hero.dataset.loadedAt = String(Date.now());
    let entries = [];
    try { entries = await fetchFeatured(); } catch (e) { log('hero', e); }
    if (!entries.length) { hero.hidden = true; root.classList.remove('lg-has-hero'); return; }
    hero._entries = entries;
    hero.innerHTML = entries.map(slideHTML).join('') + (entries.length > 1 ? `
      <button type="button" class="lg-hero-arrow prev lg-glass" aria-label="Previous">${icon('left')}</button>
      <button type="button" class="lg-hero-arrow next lg-glass" aria-label="Next">${icon('right')}</button>
      <div class="lg-hero-pager lg-glass" role="tablist">${entries.map((e, i) => `<button type="button" role="tab" aria-label="Show ${i + 1} of ${entries.length}: ${esc(e.item.Name)}"></button>`).join('')}</div>` : '');
    hero.hidden = false;
    root.classList.add('lg-has-hero');
    wireHero(hero);
    showSlide(hero, 0);
    layoutHero(hero);
  }

  function showSlide(hero, n) {
    const slides = $$('.lg-hero-slide', hero);
    if (!slides.length) return;
    const idx = (n + slides.length) % slides.length;
    hero._index = idx;
    slides.forEach((s, i) => {
      const on = i === idx;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('button', s).forEach((b) => { b.tabIndex = on ? 0 : -1; });
    });
    $$('.lg-hero-pager button', hero).forEach((b, i) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      if (i === idx) { void b.offsetWidth; b.classList.add('is-active'); } // restart progress animation
    });
    restartTimer(hero);
  }

  function restartTimer(hero) {
    clearTimeout(heroTimer);
    if (reducedMotion.matches || !hero._entries || hero._entries.length < 2) return;
    heroTimer = setTimeout(function tickHero() {
      if (!hero.isConnected || hero.offsetParent === null || doc.hidden || hero.classList.contains('is-paused')) {
        heroTimer = setTimeout(tickHero, 1000);
        return;
      }
      showSlide(hero, hero._index + 1);
    }, HERO_INTERVAL);
  }

  function wireHero(hero) {
    if (hero._wired) return;
    hero._wired = true;
    const pause = (on) => { hero.classList.toggle('is-paused', on); if (!on) restartTimer(hero); };
    hero.addEventListener('mouseenter', () => pause(true));
    hero.addEventListener('mouseleave', () => pause(false));
    hero.addEventListener('focusin', () => pause(true));
    hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) pause(false); });
    hero.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { showSlide(hero, hero._index + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { showSlide(hero, hero._index - 1); e.preventDefault(); }
    });
    // swipe on touch screens
    let x0 = null;
    hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) showSlide(hero, hero._index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    hero.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.classList.contains('prev')) return showSlide(hero, hero._index - 1);
      if (b.classList.contains('next')) return showSlide(hero, hero._index + 1);
      if (b.parentElement && b.parentElement.classList.contains('lg-hero-pager')) return showSlide(hero, $$('.lg-hero-pager button', hero).indexOf(b));
      const entry = hero._entries && hero._entries[hero._index];
      if (!entry) return;
      const act = b.dataset.act;
      if (act === 'info') location.hash = detailsHash(entry.item.Id);
      if (act === 'play') {
        const target = entry.target ? entry.target.Id : entry.item.Id;
        try { sessionStorage.setItem('lg-autoplay', target); } catch (err) { /* ignore */ }
        location.hash = detailsHash(target);
      }
      if (act === 'fav') toggleFavorite(entry.item, b);
    });
  }

  async function toggleFavorite(item, btn) {
    const now = !(item.UserData && item.UserData.IsFavorite);
    try {
      if (typeof api().updateFavoriteStatus === 'function') await api().updateFavoriteStatus(uid(), item.Id, now);
      else await api().ajax({ type: now ? 'POST' : 'DELETE', url: api().getUrl(`UserFavoriteItems/${item.Id}`, { userId: uid() }) });
      item.UserData = Object.assign({}, item.UserData, { IsFavorite: now });
      btn.innerHTML = icon(now ? 'check' : 'plus');
      btn.setAttribute('aria-pressed', String(now));
      const label = now ? 'Remove from Favorites' : 'Add to Favorites';
      btn.setAttribute('aria-label', label); btn.title = label;
    } catch (e) { log('favorite', e); }
  }

  // Pull the hero to the very top-left of the viewport so it runs full-bleed under the glass nav.
  function layoutHero(hero) {
    if (!hero || hero.hidden || hero.offsetParent === null) return;
    const r = hero.getBoundingClientRect();
    const top = r.top + window.scrollY;
    if (Math.abs(top) > 0.5) hero.style.marginTop = ((parseFloat(hero.style.marginTop) || 0) - top) + 'px';
    if (Math.abs(r.left) > 0.5) hero.style.marginLeft = ((parseFloat(hero.style.marginLeft) || 0) - r.left) + 'px';
    const w = root.clientWidth + 'px';
    if (hero.style.width !== w) hero.style.width = w;
  }

  function ensureHero() {
    const page = $('.homePage:not(.hide)');
    const tab = page && $('#homeTab, .homeTab, .pageTabContent[data-index="0"]', page);
    if (!tab || !tab.classList.contains('is-active')) { root.classList.remove('lg-has-hero'); return; }
    let hero = $(':scope > .lg-hero', tab);
    if (!hero) {
      hero = createHero();
      tab.insertBefore(hero, tab.firstChild);
      loadHero(hero);
    } else if (Date.now() - Number(hero.dataset.loadedAt || 0) > 5 * 60 * 1000) {
      loadHero(hero);
    } else if (!hero.hidden) {
      root.classList.add('lg-has-hero');
    }
    layoutHero(hero);
  }

  /* ---------------- Cinematic item pages ---------------- */
  function measureDetail(page) {
    const bg = $(':scope > .lg-detail-bg', page);
    const pc = $('.detailPagePrimaryContainer', page);
    if (!bg || !pc || !page.classList.contains('lg-cinematic')) return;
    const top = page.getBoundingClientRect().top;
    const extra = Math.max(0, Math.round(pc.getBoundingClientRect().bottom - top + 30 - bg.offsetHeight));
    if (page.style.getPropertyValue('--lg-detail-extra') !== extra + 'px') page.style.setProperty('--lg-detail-extra', extra + 'px');
  }

  function ensureDetail() {
    const page = $('.itemDetailPage:not(.hide)');
    root.classList.toggle('lg-cinematic-page', !!(page && page.classList.contains('lg-cinematic') && routeName() === 'details'));
    if (!page || routeName() !== 'details') return;
    measureDetail(page);
    const id = routeParams().get('id');
    if (!id) return;
    maybeAutoplay(page, id);
    if (page.dataset.lgId === id) { ensureLogo(page); return; }
    page.dataset.lgId = id;
    page.classList.remove('lg-cinematic', 'lg-has-logo');
    getJSON(`Items/${id}`, { userId: uid() }).then((it) => {
      if (page.dataset.lgId !== id) return;
      let bg = '';
      if (it.BackdropImageTags && it.BackdropImageTags.length) bg = imgUrl(it.Id, 'Backdrop/0', { maxWidth: 2560, tag: it.BackdropImageTags[0] });
      else if (it.ParentBackdropItemId && it.ParentBackdropImageTags && it.ParentBackdropImageTags.length) bg = imgUrl(it.ParentBackdropItemId, 'Backdrop/0', { maxWidth: 2560, tag: it.ParentBackdropImageTags[0] });
      else if (it.Type === 'Episode' && it.ImageTags && it.ImageTags.Primary) bg = imgUrl(it.Id, 'Primary', { maxWidth: 1920, tag: it.ImageTags.Primary });
      let logo = '';
      if (it.ImageTags && it.ImageTags.Logo) logo = imgUrl(it.Id, 'Logo', { maxWidth: 960, tag: it.ImageTags.Logo });
      else if (it.ParentLogoItemId && it.ParentLogoImageTag) logo = imgUrl(it.ParentLogoItemId, 'Logo', { maxWidth: 960, tag: it.ParentLogoImageTag });
      page.dataset.lgType = it.Type || '';
      page.dataset.lgLogo = logo;
      let layer = $(':scope > .lg-detail-bg', page);
      if (!layer) { layer = doc.createElement('div'); layer.className = 'lg-detail-bg'; page.insertBefore(layer, page.firstChild); }
      layer.style.backgroundImage = bg ? `url("${bg}")` : '';
      page.classList.toggle('lg-cinematic', !!bg);
      root.classList.toggle('lg-cinematic-page', !!bg);
      ensureLogo(page);
      requestAnimationFrame(() => measureDetail(page));
    }).catch((e) => log('detail', e));
  }

  function ensureLogo(page) {
    const logo = page.dataset.lgLogo || '';
    const nc = $('.detailRibbon .nameContainer', page);
    if (!nc) return;
    let el = $('.lg-detail-logo', nc);
    if (!logo || !page.classList.contains('lg-cinematic')) { if (el) el.remove(); page.classList.remove('lg-has-logo'); return; }
    if (!el) { el = doc.createElement('img'); el.className = 'lg-detail-logo'; el.alt = ''; nc.insertBefore(el, nc.firstChild); }
    if (el.getAttribute('src') !== logo) el.setAttribute('src', logo);
    page.classList.add('lg-has-logo');
  }

  function maybeAutoplay(page, id) {
    let want = null;
    try { want = sessionStorage.getItem('lg-autoplay'); } catch (e) { return; }
    if (want !== id) return;
    const btn = $('.mainDetailButtons .btnPlay:not(.hide)', page);
    if (btn) { sessionStorage.removeItem('lg-autoplay'); btn.click(); }
  }

  /* ---------------- Specular light that follows the pointer ---------------- */
  const LIGHT_SEL = '.lg-glass, .lg-btn, .lg-nav-panel, .lg-nav-item, .detailButton, .MuiMenu-paper';
  let lightFrame = 0, lightEvt = null;
  doc.addEventListener('pointermove', (e) => {
    lightEvt = e;
    if (lightFrame) return;
    lightFrame = requestAnimationFrame(() => {
      lightFrame = 0;
      const el = lightEvt.target && lightEvt.target.closest && lightEvt.target.closest(LIGHT_SEL);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lg-mx', ((lightEvt.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--lg-my', ((lightEvt.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }, { passive: true });

  /* ---------------- Main loop ---------------- */
  function tick() {
    try {
      if (!api() || !uid()) {
        root.classList.add('lg-nav-hidden');
        return;
      }
      ensureNav();
      root.classList.toggle('lg-nav-hidden', navShouldHide());
      updateNav();
      ensureHero();
      ensureDetail();
      ensureAppearanceRow();
    } catch (e) {
      log('tick', e);
    }
  }

  let queued = 0;
  const schedule = () => { if (!queued) queued = setTimeout(() => { queued = 0; tick(); }, 120); };
  new MutationObserver(schedule).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', () => {
    const h = $('.lg-hero:not([hidden])'); if (h) { h.style.width = ''; layoutHero(h); }
    const d = $('.itemDetailPage.lg-cinematic:not(.hide)'); if (d) measureDetail(d);
  }, { passive: true });
  let scrolled = false;
  window.addEventListener('scroll', () => {
    const s = window.scrollY > 8;
    if (s !== scrolled) { scrolled = s; root.classList.toggle('lg-scrolled', s); }
  }, { passive: true });
  schedule();
  log('loaded');
})();
