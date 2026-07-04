const thumbs = document.querySelectorAll('.thumb');
const mainImage = document.querySelector('#mainProductImage');
const CONFIG = {
  productName: 'Bolso Impermeable',
  productPrice: 199000,
  currency: 'PYG',
  origin: 'landing_bolso_impermeable',
  supabaseUrl: 'https://roruinqorwgolcrhhmpm.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcnVpbnFvcndnb2xjcmhobXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTU0MDcsImV4cCI6MjA5ODIzMTQwN30.VzNSqYUM6amTOToZUsJ7Emjapy-y9Y44hDmbC1XG9Eg',
  supabaseTable: 'pedidos_web',
};

const trackingFired = new Set();

function trackingPayload(quantity = Number(document.querySelector('#quantitySelect')?.value || 1)) {
  const subtotal = pricesByQuantity[quantity] || pricesByQuantity[1] || CONFIG.productPrice;
  return {
    producto: CONFIG.productName,
    precio: CONFIG.productPrice,
    cantidad: quantity,
    subtotal,
    moneda: CONFIG.currency,
    origen: CONFIG.origin,
    url: window.location.href,
  };
}


function metaPayload(payload) {
  return {
    content_name: CONFIG.productName,
    content_type: 'product',
    value: payload.subtotal,
    currency: CONFIG.currency,
    quantity: payload.cantidad,
  };
}

function fireTracking(key, callback) {
  if (trackingFired.has(key)) return;
  trackingFired.add(key);
  callback();
}

function trackGA(eventName, payload = trackingPayload()) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, payload);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
}

function trackMeta(eventName, payload = trackingPayload()) {
  if (typeof window.fbq === 'function') window.fbq('track', eventName, metaPayload(payload));
}

function trackLandingEvent(eventName, payload = trackingPayload()) {
  const events = {
    view_content: () => {
      fireTracking('ga4:view_item', () => trackGA('view_item', payload));
      fireTracking('meta:ViewContent', () => trackMeta('ViewContent', payload));
    },
    add_to_cart: () => {
      fireTracking('ga4:add_to_cart', () => trackGA('add_to_cart', payload));
      fireTracking('meta:AddToCart', () => trackMeta('AddToCart', payload));
    },
    begin_checkout: () => {
      fireTracking('ga4:begin_checkout', () => trackGA('begin_checkout', payload));
      fireTracking('meta:InitiateCheckout', () => trackMeta('InitiateCheckout', payload));
    },
    lead: () => {
      fireTracking('ga4:generate_lead', () => trackGA('generate_lead', payload));
      fireTracking('meta:Lead', () => trackMeta('Lead', payload));
    },
  };
  events[eventName]?.();
}

// Map thumbnail index to color name (index 0 = PROD default, no color)
const thumbIndexToColor = {
  0: null,
  1: 'Rosa',
  2: 'Lila',
  3: 'Gris',
  4: 'Negro'
};

// Map color name to image source
const colorToImageSrc = {
  'Rosa': 'img/rosa.jpeg',
  'Lila': 'img/Lila.jpeg',
  'Gris': 'img/Gris.jpg',
  'Negro': 'img/Negro.jpg'
};

function updateColorDropdowns(color) {
  const colorSelect = document.querySelector('#colorSelect');
  const summaryColor = document.querySelector('#summaryColor');

  if (colorSelect) colorSelect.value = color;
  if (summaryColor) summaryColor.textContent = color;
}

// Sync thumbnail clicks with color selections
thumbs.forEach((thumb, index) => {
  thumb.addEventListener('click', () => {
    thumbs.forEach((item) => item.classList.remove('active'));
    thumb.classList.add('active');
    mainImage.src = thumb.dataset.image;

    // Set corresponding color in form dropdowns
    const color = thumbIndexToColor[index];
    if (color) {
      updateColorDropdowns(color);
    }
  });
});

// Sync color select change with gallery main image and active thumbnail
function handleColorChange(event) {
  const color = event.target.value;
  updateColorDropdowns(color);

  // Update main product image
  const imgSrc = colorToImageSrc[color];
  if (imgSrc && mainImage) {
    mainImage.src = imgSrc;
  }

  // Update active thumbnail borders
  thumbs.forEach((thumb, idx) => {
    const thumbColor = thumbIndexToColor[idx];
    if (thumbColor === color) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

document.querySelector('#colorSelect')?.addEventListener('change', handleColorChange);

document.querySelector('.gallery-arrow-right')?.addEventListener('click', () => {
  const currentIndex = Array.from(thumbs).findIndex((thumb) => thumb.classList.contains('active'));
  const nextThumb = thumbs[(currentIndex + 1) % thumbs.length];
  nextThumb.click();
});

document.querySelector('.gallery-arrow-left')?.addEventListener('click', () => {
  const currentIndex = Array.from(thumbs).findIndex((thumb) => thumb.classList.contains('active'));
  const prevThumb = thumbs[(currentIndex - 1 + thumbs.length) % thumbs.length];
  prevThumb.click();
});

const purchaseForm = document.querySelector('#purchaseForm');
const orderForms = document.querySelectorAll('[data-order-form]');
const confirmation = document.querySelector('#confirmation');
const orderNumber = document.querySelector('#orderNumber');
const confirmationPhone = document.querySelector('#confirmationPhone');
const confirmationPaymentText = document.querySelector('#confirmationPaymentText');
const productPage = document.querySelector('[data-page="product"]');
const checkoutPage = document.querySelector('[data-page="checkout"]');
const buyButton = document.querySelector('#pedido');
const backLink = document.querySelector('.back-link');
const closeCheckout = document.querySelector('.checkout-close');
const quantitySelect = document.querySelector('#quantitySelect');
const productPriceTop = document.querySelector('#productPriceTop');
const summaryQuantityText = document.querySelector('#summaryQuantityText');
const summaryQuantity = document.querySelector('#summaryQuantity');
const summaryTotal = document.querySelector('#summaryTotal');
const cityInput = document.querySelector('#cityInput');
const deliveryNotice = document.querySelector('#deliveryNotice');
const paymentNote = document.querySelector('#paymentNote');
const formError = document.querySelector('#formError');
let map;
let mapMarker;
let selectedMapLink = '';
const pricesByQuantity = {
  1: 199000,
  2: 369000,
  3: 525000,
};

function formatGuarani(value) {
  return `Gs. ${Number(value).toLocaleString('es-PY')}`;
}

function getQuantityText(quantity) {
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
}

function updateOrderSummary() {
  if (!quantitySelect) return;

  const quantity = Number(quantitySelect.value || 1);
  const price = pricesByQuantity[quantity] || pricesByQuantity[1];
  const quantityText = getQuantityText(quantity);
  const totalText = formatGuarani(price);

  if (productPriceTop) productPriceTop.textContent = totalText;
  if (summaryQuantityText) summaryQuantityText.textContent = quantityText;
  if (summaryQuantity) summaryQuantity.textContent = quantityText;
  if (summaryTotal) summaryTotal.textContent = totalText;
}

function isCashOnDeliveryArea(value) {
  const city = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const centralCities = ['asuncion', 'central', 'san lorenzo', 'fernando de la mora', 'luque', 'capitata', 'capiata', 'lambare', 'mariano roque alonso', 'nemby', 'ñemby', 'villa elisa', 'san antonio', 'limpio', 'itaugua', 'ita', 'aregua', 'ypane', 'yaguaron'];

  return centralCities.some((area) => city.includes(area.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
}

function updateDeliveryNotice() {
  if (!cityInput || !deliveryNotice || !paymentNote) return;

  const value = cityInput.value.trim();
  const isKnownCashArea = value && isCashOnDeliveryArea(value);

  deliveryNotice.classList.toggle('delivery-ok', Boolean(isKnownCashArea));
  deliveryNotice.classList.toggle('delivery-interior', Boolean(value && !isKnownCashArea));

  if (!value) {
    deliveryNotice.textContent = 'Asunción y Central: envío gratis y pago contra entrega. Interior: te contactamos para coordinar el abono antes del despacho.';
    paymentNote.textContent = 'No pagás nada ahora. Registrás el pedido y te contactamos para confirmar antes del envío.';
    return;
  }

  if (isKnownCashArea) {
    deliveryNotice.textContent = 'Zona habilitada para envío gratis y pago contra entrega. No abonás nada ahora.';
    paymentNote.textContent = 'No pagás nada ahora, abonás al recibir.';
    return;
  }

  deliveryNotice.textContent = 'Para envíos al interior te contactamos para coordinar el abono antes del despacho.';
  paymentNote.textContent = 'Interior: coordinamos el abono y despacho luego de registrar el pedido.';
}

function setDeliveryNoticeText(notice, value) {
  if (!notice) return;

  const isKnownCashArea = value && isCashOnDeliveryArea(value);
  notice.classList.toggle('delivery-ok', Boolean(isKnownCashArea));
  notice.classList.toggle('delivery-interior', Boolean(value && !isKnownCashArea));

  if (!value) {
    notice.textContent = 'Asunción y Central: envío gratis y pago contra entrega. Interior: te contactamos para coordinar el abono antes del despacho.';
    return;
  }

  notice.textContent = isKnownCashArea
    ? 'Zona habilitada para envío gratis y pago contra entrega. No abonás nada ahora.'
    : 'Para envíos al interior te contactamos para coordinar el abono antes del despacho.';
}

function initFormDeliveryNotices() {
  orderForms.forEach((form) => {
    const city = form.querySelector('[name="city"]');
    const notice = form.querySelector('.delivery-notice');
    if (!city || !notice) return;

    setDeliveryNoticeText(notice, city.value.trim());
    city.addEventListener('input', () => setDeliveryNoticeText(notice, city.value.trim()));
  });
}

function setMapLink(link) {
  selectedMapLink = link;
  const mapLinkInput = document.querySelector('#mapLinkInput');
  const mapOpenLink = document.querySelector('#mapOpenLink');

  if (mapLinkInput) mapLinkInput.value = link;
  if (mapOpenLink) mapOpenLink.href = link || 'https://www.google.com/maps';
}

function createGoogleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function updateMapLocation(lat, lng, zoom = 16) {
  setMapLink(createGoogleMapsLink(lat, lng));

  if (!map) return;
  map.setView([lat, lng], zoom);
  if (!mapMarker) {
    mapMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
    mapMarker.on('dragend', () => {
      const position = mapMarker.getLatLng();
      updateMapLocation(position.lat, position.lng, map.getZoom());
    });
    return;
  }

  mapMarker.setLatLng([lat, lng]);
}

function initMapInstance() {
  if (map || typeof L === 'undefined') return;

  const defaultLocation = [-25.2637, -57.5759];
  map = L.map('mapPicker', { zoomControl: true }).setView(defaultLocation, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  map.on('click', (event) => updateMapLocation(event.latlng.lat, event.latlng.lng, map.getZoom()));
  updateMapLocation(defaultLocation[0], defaultLocation[1], 13);
}

function openMapModal() {
  const mapModal = document.querySelector('#mapModal');
  if (!mapModal) return;

  mapModal.classList.remove('hidden');
  initMapInstance();
  setTimeout(() => { if (map) map.invalidateSize(); }, 100);
}

function closeMapModal() {
  document.querySelector('#mapModal')?.classList.add('hidden');
}

async function searchMapLocation() {
  const mapSearch = document.querySelector('#mapSearch');
  const mapError = document.querySelector('#mapError');
  const query = mapSearch?.value.trim();

  if (!query) {
    if (mapError) mapError.textContent = 'Escribí una dirección o lugar para buscar.';
    return;
  }

  if (mapError) mapError.textContent = 'Buscando ubicación...';
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${query}, Paraguay`)}`);
    const results = await response.json();
    if (!results.length) {
      if (mapError) mapError.textContent = 'No encontramos esa dirección. Probá con otra referencia.';
      return;
    }

    updateMapLocation(Number(results[0].lat), Number(results[0].lon), 17);
    if (mapError) mapError.textContent = 'Tocá el mapa o arrastrá el pin para ajustar la ubicación exacta.';
  } catch (error) {
    if (mapError) mapError.textContent = 'No se pudo buscar. Tocá directamente el mapa para marcar la ubicación.';
  }
}

function initMapPicker() {
  document.querySelector('[data-open-map]')?.addEventListener('click', openMapModal);
  document.querySelectorAll('[data-close-map]').forEach((button) => button.addEventListener('click', closeMapModal));
  document.querySelector('#mapModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'mapModal') closeMapModal();
  });
  document.querySelector('#mapSearchButton')?.addEventListener('click', searchMapLocation);
  document.querySelector('#mapSearch')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchMapLocation();
    }
  });
  document.querySelector('#mapLinkInput')?.addEventListener('input', (event) => {
    selectedMapLink = event.target.value.trim();
    const mapOpenLink = document.querySelector('#mapOpenLink');
    if (mapOpenLink) mapOpenLink.href = selectedMapLink || 'https://www.google.com/maps';
  });
  document.querySelector('#mapConfirm')?.addEventListener('click', () => {
    const link = document.querySelector('#mapLinkInput')?.value.trim() || selectedMapLink;
    const mapsInput = document.querySelector('#mapsInput');
    if (mapsInput) mapsInput.value = link;
    closeMapModal();
  });
}

function showCheckout() {
  if (!productPage || !checkoutPage) return;

  productPage.hidden = true;
  checkoutPage.hidden = false;
  document.body.classList.add('checkout-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const payload = trackingPayload();
  trackLandingEvent('add_to_cart', payload);
  trackLandingEvent('begin_checkout', payload);
}

function showProduct() {
  if (!productPage || !checkoutPage) return;

  checkoutPage.hidden = true;
  productPage.hidden = false;
  document.body.classList.remove('checkout-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateOrderNumber() {
  return `#PY${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

function getComboName(quantity) {
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
}

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function cleanReferenceNote(value, city) {
  const note = cleanText(value);
  if (!note) return '';

  const compactNote = note.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  const compactCity = cleanText(city).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');

  if (compactCity && compactNote === compactCity) return '';
  return note;
}

function getDeliveryZone(city) {
  return isCashOnDeliveryArea(city) ? 'Asunción/Central' : 'Interior';
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem('bagOrders') || '[]');
  orders.push(order);
  localStorage.setItem('bagOrders', JSON.stringify(orders));
}

async function saveOrderToSupabase(order) {
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${CONFIG.supabaseTable}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error guardando pedido en Supabase.');
  }
}

function showConfirmation(order) {
  if (orderNumber) orderNumber.textContent = order.id;
  if (confirmationPhone) confirmationPhone.textContent = order.phone || '---';
  if (confirmationPaymentText) {
    confirmationPaymentText.innerHTML = order.paymentMode === 'cash_on_delivery'
      ? `Recordá que el pago se realiza al recibir el producto. Te hablaremos al número <strong>${order.phone || '---'}</strong>.`
      : `Para envíos al interior coordinaremos el abono previo. Te contactaremos al número <strong>${order.phone || '---'}</strong>.`;
  }

  if (productPage) productPage.hidden = true;
  if (checkoutPage) checkoutPage.hidden = false;
  confirmation?.classList.remove('hidden');
  document.body.classList.add('checkout-open');
  document.documentElement.style.overflow = 'hidden';
}

function closeConfirmation() {
  confirmation?.classList.add('hidden');
  document.documentElement.style.overflow = '';
  showProduct();
}

document.querySelectorAll('a[href="#checkout"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showCheckout();
  });
});

backLink?.addEventListener('click', (event) => {
  event.preventDefault();
  showProduct();
});

closeCheckout?.addEventListener('click', showProduct);
document.querySelector('[data-close-confirmation]')?.addEventListener('click', closeConfirmation);
confirmation?.addEventListener('click', (event) => {
  if (event.target.id === 'confirmation') closeConfirmation();
});
quantitySelect?.addEventListener('change', updateOrderSummary);
cityInput?.addEventListener('input', updateDeliveryNotice);
updateOrderSummary();
updateDeliveryNotice();
initMapPicker();
initFormDeliveryNotices();
fireTracking('ga4:page_view', () => trackGA('page_view'));
trackLandingEvent('view_content');

orderForms.forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const quantity = Number(formData.get('quantity') || 1);
  const color = String(formData.get('color') || 'Rosa');
  const submitButton = form.querySelector('button[type="submit"]');
  const currentFormError = form.querySelector('.form-error') || formError;

  const city = cleanText(formData.get('city'));
  const address = cleanText(formData.get('address'));
  const neighborhood = cleanText(formData.get('neighborhood'));
  const notes = cleanReferenceNote(formData.get('notes'), city);
  const mapUrl = cleanText(formData.get('map'));
  const subtotal = pricesByQuantity[quantity] || pricesByQuantity[1];
  const paymentMode = isCashOnDeliveryArea(city) ? 'cash_on_delivery' : 'deposit_required_for_interior';
  const referenceParts = [`Color: ${color}`];
  if (notes) referenceParts.push(`Referencia: ${notes}`);
  referenceParts.push(paymentMode === 'cash_on_delivery' ? 'Pago contra entrega' : 'Interior: coordinar abono previo');

  const order = {
    id: generateOrderNumber(),
    producto: CONFIG.productName,
    precio: CONFIG.productPrice,
    cantidad: quantity,
    subtotal,
    nombre: cleanText(formData.get('name')),
    telefono: cleanText(formData.get('phone')),
    correo: 'No informado',
    ci: 'No informado',
    departamento: getDeliveryZone(city),
    ciudad: city,
    direccion: address || 'No informado',
    referencia: referenceParts.join(' | '),
    ubicacion_maps: mapUrl || 'No informado',
    estado: 'Pendiente',
    origen: CONFIG.origin,
    created_at: new Date().toISOString(),
  };

  if (currentFormError) currentFormError.textContent = '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando pedido...';
  }

  try {
    saveOrder(order);
    await saveOrderToSupabase(order);
    const payload = trackingPayload(quantity);
    trackLandingEvent('lead', payload);
  } catch (error) {
    console.error(error);
    if (currentFormError) currentFormError.textContent = 'No se pudo guardar el pedido. Revisá la conexión o la configuración de Supabase.';
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Realizar pedido';
    }
    return;
  }

  form.reset();
  updateOrderSummary();
  updateDeliveryNotice();
  updateColorDropdowns('Rosa'); // Reset color back to default in UI
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = 'Realizar pedido';
  }
    showConfirmation({
      id: order.id,
      phone: order.telefono,
      paymentMode,
    });
}));
