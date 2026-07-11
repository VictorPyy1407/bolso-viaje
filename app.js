/* ==========================================================================
   BOLSO VIAJERA XL — Landing
   Backend: Supabase `pedidos_web` (infra compartida) + Telegram (trigger server-side)
   + Meta Pixel + Google Analytics 4 + tracker de visitantes (panel admin).
   ========================================================================== */

const CONFIG = {
  PRODUCT_NAME: 'Bolso Viajera XL',
  PRICE: 199000,
  OLD_PRICE: 260000,
  CURRENCY: 'PYG',

  SUPABASE_URL: 'https://roruinqorwgolcrhhmpm.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_aRPb1yNunMEheat00BxwtQ_Uft732KJ',
  SUPABASE_TABLE: 'pedidos_web',
  ORIGIN: 'landing_bolso_impermeable',

  META_PIXEL_ID: '2412226475899711',
  GA4_ID: 'G-8WM6CYEB73',
  WHATSAPP: '595972738779',
};

document.addEventListener('DOMContentLoaded', () => {

  /* ========================== Helpers ========================== */
  const isConfigured = (v) => Boolean(v) && !/^(PEGAR_AQUI|G-XXXX|TU_|YOUR_|XXXX)/i.test(v);
  const sanitize = (v) => String(v || '').replace(/[<>]/g, '').replace(/javascript:/gi, '').trim();
  const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
  const removeEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined));

  function formatPhone(value) {
    const d = onlyDigits(value).replace(/^5950/, '595');
    if (!d) return '';
    if (d.startsWith('595')) return '+' + d;
    if (d.startsWith('0')) return d;
    return '+595 ' + d;
  }

  function campaignData() {
    const p = new URLSearchParams(location.search);
    return {
      user_agent: sanitize(navigator.userAgent),
      utm_source: sanitize(p.get('utm_source')),
      utm_medium: sanitize(p.get('utm_medium')),
      utm_campaign: sanitize(p.get('utm_campaign')),
      fbclid: sanitize(p.get('fbclid')),
      gclid: sanitize(p.get('gclid')),
    };
  }

  function generateOrderId() {
    return `PY${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  }

  /* ========================== Supabase ========================== */
  async function guardarPedido(order) {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.SUPABASE_TABLE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`Supabase rechazó el pedido (${response.status}). ${details}`.trim());
    }
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data[0] : data;
  }

  /* ========================== Analytics (Meta Pixel + GA4) ========================== */
  function metaParams(extra) {
    return Object.assign({
      content_name: CONFIG.PRODUCT_NAME,
      content_type: 'product',
      value: CONFIG.PRICE,
      currency: CONFIG.CURRENCY,
    }, extra || {});
  }

  function gaParams(extra) {
    const quantity = Number(extra && extra.quantity) || 1;
    return Object.assign({
      currency: CONFIG.CURRENCY,
      value: CONFIG.PRICE * quantity,
      items: [{ item_name: CONFIG.PRODUCT_NAME, price: CONFIG.PRICE, currency: CONFIG.CURRENCY, quantity }],
    }, extra || {});
  }

  function metaEvent(name, params) { if (typeof fbq === 'function') fbq('track', name, params || metaParams()); }
  function gaEvent(name, params) { if (typeof gtag === 'function') gtag('event', name, gaParams(params)); }

  function initMetaPixel() {
    if (!isConfigured(CONFIG.META_PIXEL_ID)) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CONFIG.META_PIXEL_ID);
    fbq('track', 'PageView');
    fbq('track', 'ViewContent', metaParams());
  }

  function initGA4() {
    if (!isConfigured(CONFIG.GA4_ID)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', CONFIG.GA4_ID);
    gaEvent('view_item', { quantity: 1 });
  }

  let checkoutSent = false;
  function beginCheckout(quantity) {
    if (checkoutSent) return;
    checkoutSent = true;
    metaEvent('InitiateCheckout', metaParams({ value: CONFIG.PRICE * (Number(quantity) || 1) }));
    gaEvent('begin_checkout', { quantity: Number(quantity) || 1 });
    window.VisitorTracker?.trackEcommerce('begin_checkout', { revenue: CONFIG.PRICE * (Number(quantity) || 1) });
  }

  /* ========================== Tracker de visitantes (panel admin) ========================== */
  (function initTracker() {
    if (!isConfigured(CONFIG.SUPABASE_URL) || !isConfigured(CONFIG.SUPABASE_ANON_KEY)) return;
    const TRACK_URL = CONFIG.SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/track-visitor';
    const sessionId = sessionStorage.getItem('lp_session_id') ||
      ('sess_' + Math.random().toString(36).slice(2, 15) + '_' + Date.now().toString(36));
    sessionStorage.setItem('lp_session_id', sessionId);
    let hb = null;

    function send(event, extra) {
      const p = new URLSearchParams(location.search);
      try {
        fetch(TRACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY },
          body: JSON.stringify(Object.assign({
            event, sessionId, pageUrl: location.href, pageTitle: document.title,
            referrer: document.referrer, userAgent: navigator.userAgent,
            screenResolution: screen.width + 'x' + screen.height,
            viewport: window.innerWidth + 'x' + window.innerHeight,
            landingPage: CONFIG.ORIGIN, timestamp: new Date().toISOString(),
            utmSource: p.get('utm_source'), utmMedium: p.get('utm_medium'),
            utmCampaign: p.get('utm_campaign'), utmContent: p.get('utm_content'), utmTerm: p.get('utm_term'),
          }, extra || {})),
          keepalive: event === 'page_hide',
        }).catch(() => {});
      } catch (e) { /* noop */ }
    }

    function startHb() { if (!hb) hb = setInterval(() => { if (document.visibilityState === 'visible') send('heartbeat'); }, 30000); }
    function stopHb() { if (hb) { clearInterval(hb); hb = null; } }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { send('page_hide'); stopHb(); } else { send('page_view'); startHb(); }
    });
    window.addEventListener('pagehide', () => send('page_hide'));

    send('page_view');
    startHb();

    window.VisitorTracker = {
      trackEvent: send,
      trackEcommerce: (evt, data) => { data = data || {}; send(evt, { productName: data.productName || CONFIG.PRODUCT_NAME, productPrice: data.productPrice || CONFIG.PRICE, orderId: data.orderId, revenue: data.revenue }); },
      getSessionId: () => sessionId,
    };
  })();


  /* ========================== Galería de imágenes ========================== */
  const galleryMain = document.getElementById('gallery-main');
  const galleryThumbs = Array.from(document.querySelectorAll('.gallery-thumb'));
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  const galleryIdxIndicator = document.getElementById('gallery-current-idx');

  const images = [
    './images/Imagen principal.jpg',
    'images/Bolso-Gris.jpg',
    'images/Bolso-Negro.jpg',
    'images/Bolso-Rosa.jpg',
    'images/Bolso-Lila.jpg',
  ];

  let currentImgIdx = 0;

  function updateGallery(index) {
    currentImgIdx = (index + images.length) % images.length;
    if (galleryMain) {
      galleryMain.style.opacity = '0.3';
      setTimeout(() => { galleryMain.src = images[currentImgIdx]; galleryMain.style.opacity = '1'; }, 150);
    }
    galleryThumbs.forEach((thumb, idx) => thumb.classList.toggle('active', idx === currentImgIdx));
    if (galleryIdxIndicator) galleryIdxIndicator.textContent = currentImgIdx + 1;
  }

  galleryThumbs.forEach((thumb) => thumb.addEventListener('click', () => updateGallery(parseInt(thumb.getAttribute('data-index'), 10))));
  galleryPrev?.addEventListener('click', () => updateGallery(currentImgIdx - 1));
  galleryNext?.addEventListener('click', () => updateGallery(currentImgIdx + 1));


  /* ========================== Acordeón (features + FAQ) ========================== */
  const setupAccordionGroup = (triggers) => {
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const currentItem = trigger.parentElement;
        const group = currentItem.parentElement;
        const isActive = currentItem.classList.contains('active');
        group.querySelectorAll('.accordion-item').forEach((item) => {
          item.classList.remove('active');
          const icon = item.querySelector('.accordion-icon');
          if (icon) icon.textContent = '+';
        });
        if (!isActive) {
          currentItem.classList.add('active');
          const icon = currentItem.querySelector('.accordion-icon');
          if (icon) icon.textContent = '-';
        }
      });
    });
  };
  setupAccordionGroup(document.querySelectorAll('.accordion-section .accordion-trigger'));
  setupAccordionGroup(document.querySelectorAll('.faq .accordion-trigger'));


  /* ========================== Ubicación GPS (guarda ubicación real) ========================== */
  const gpsButton = document.getElementById('gps-button');
  const gpsCoords = { lat: null, lng: null };

  function gpsButtonHTML(text) {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2"></path>
      </svg>
      ${text}`;
  }

  gpsButton?.addEventListener('click', () => {
    if (!navigator.geolocation) { gpsButton.innerHTML = gpsButtonHTML('GPS no compatible'); return; }
    gpsButton.disabled = true;
    gpsButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      Obteniendo ubicación...`;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        gpsCoords.lat = position.coords.latitude.toFixed(6);
        gpsCoords.lng = position.coords.longitude.toFixed(6);
        gpsButton.disabled = false;
        gpsButton.innerHTML = gpsButtonHTML('✅ Ubicación cargada');
      },
      () => {
        gpsButton.disabled = false;
        gpsButton.innerHTML = gpsButtonHTML('No se pudo obtener. Cargá tu ciudad manualmente');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });


  /* ========================== Formulario → Supabase ========================== */
  const form = document.getElementById('purchase-form');
  const submitBtn = document.getElementById('submit-btn');
  const successModal = document.getElementById('success-modal');
  const modalUserName = document.getElementById('modal-user-name');
  const modalUserPhone = document.getElementById('modal-user-phone');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const colorSelect = document.getElementById('color');
  const selectedColor = document.getElementById('selected-color');

  colorSelect?.addEventListener('change', () => {
    if (selectedColor) selectedColor.textContent = colorSelect.value || '— Elegí un color';
  });

  // Dispara InitiateCheckout al empezar a completar el formulario.
  form?.addEventListener('focusin', () => beginCheckout(1), { once: true });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameValue = sanitize(document.getElementById('name')?.value);
    const phoneValue = sanitize(document.getElementById('phone')?.value);
    const colorValue = colorSelect?.value || '';
    const deptValue = sanitize(document.getElementById('dept')?.value);
    const cityValue = sanitize(document.getElementById('city')?.value);
    const addressValue = sanitize(document.getElementById('address')?.value);

    if (!nameValue || !phoneValue || !colorValue || !deptValue || !cityValue || !addressValue) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      Enviando pedido...`;

    const campaign = campaignData();
    const orderId = generateOrderId();
    const referenceParts = [`Color: ${colorValue}`, 'Pago contra entrega'];

    const order = removeEmpty({
      id: orderId,
      producto: CONFIG.PRODUCT_NAME,
      precio: CONFIG.PRICE,
      cantidad: 1,
      subtotal: CONFIG.PRICE,
      ganancia: 0,
      nombre: nameValue,
      telefono: formatPhone(phoneValue),
      correo: 'No informado',
      ci: 'No informado',
      departamento: deptValue,
      ciudad: cityValue,
      direccion: addressValue || 'No informado',
      referencia: referenceParts.join(' | '),
      ubicacion_maps: gpsCoords.lat ? `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}` : 'No informado',
      observaciones: 'Sin observaciones',
      estado: 'Pendiente',
      origen: CONFIG.ORIGIN,
      created_at: new Date().toISOString(),
      user_agent: campaign.user_agent,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      fbclid: campaign.fbclid,
      gclid: campaign.gclid,
    });

    try {
      const saved = await guardarPedido(order);
      const savedId = (saved && saved.id) || orderId;

      // Conversiones
      metaEvent('Lead', metaParams({ value: CONFIG.PRICE }));
      metaEvent('Purchase', metaParams({ value: CONFIG.PRICE }));
      gaEvent('generate_lead', { quantity: 1 });
      gaEvent('purchase', { quantity: 1, transaction_id: savedId });
      window.VisitorTracker?.trackEcommerce('generate_lead', { orderId: savedId, revenue: CONFIG.PRICE });
      window.VisitorTracker?.trackEcommerce('purchase', { orderId: savedId, revenue: CONFIG.PRICE });

      if (modalUserName) modalUserName.textContent = nameValue;
      if (modalUserPhone) modalUserPhone.textContent = formatPhone(phoneValue);
      successModal?.classList.add('active');
      form.reset();
      if (selectedColor) selectedColor.textContent = '— Elegí un color';
    } catch (err) {
      console.error('Error al guardar pedido:', err);
      alert('Hubo un problema al enviar el pedido. Por favor intentá de nuevo o contactanos por WhatsApp.');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHTML;
  });

  closeModalBtn?.addEventListener('click', () => successModal?.classList.remove('active'));
  successModal?.addEventListener('click', (e) => { if (e.target === successModal) successModal.classList.remove('active'); });


  /* ========================== Init analytics ========================== */
  initMetaPixel();
  initGA4();
});
