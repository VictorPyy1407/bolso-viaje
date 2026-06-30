const thumbs = document.querySelectorAll('.thumb');
const mainImage = document.querySelector('#mainProductImage');
const CONFIG = {
  productName: 'Bolso Impermeable',
  supabaseUrl: 'https://roruinqorwgolcrhhmpm.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcnVpbnFvcndnb2xjcmhobXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTU0MDcsImV4cCI6MjA5ODIzMTQwN30.VzNSqYUM6amTOToZUsJ7Emjapy-y9Y44hDmbC1XG9Eg',
  supabaseTable: 'cleanpro',
};

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
  const footerColorSelect = document.querySelector('#footerColorSelect');
  const summaryColor = document.querySelector('#summaryColor');

  if (colorSelect) colorSelect.value = color;
  if (footerColorSelect) footerColorSelect.value = color;
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
document.querySelector('#footerColorSelect')?.addEventListener('change', handleColorChange);

const offerDuration = 10 * 60;
let remaining = offerDuration;
const minutes = document.querySelector('#minutes');
const seconds = document.querySelector('#seconds');

function updateTimer() {
  const currentMinutes = Math.floor(remaining / 60);
  const currentSeconds = remaining % 60;

  if (minutes) minutes.textContent = String(currentMinutes).padStart(2, '0');
  if (seconds) seconds.textContent = String(currentSeconds).padStart(2, '0');

  remaining = remaining > 0 ? remaining - 1 : offerDuration;
}

updateTimer();
setInterval(updateTimer, 1000);

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

const viewerCount = document.querySelector('#viewerCount');

function updateViewerCount() {
  if (!viewerCount) return;

  const nextCount = Math.floor(Math.random() * 12) + 9;
  viewerCount.textContent = String(nextCount);
}

setInterval(updateViewerCount, 6500);

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
  2: 398000,
  3: 597000,
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

function updateFooterSummary() {
  const footerQty = document.querySelector('#footerQuantitySelect');
  const footerColor = document.querySelector('#footerColorSelect');
  const footerSummaryQty = document.querySelector('#footerSummaryQuantity');
  const footerSummaryColor = document.querySelector('#footerSummaryColor');
  const footerSummaryQtyText = document.querySelector('#footerSummaryQty');
  const footerSummaryTotal = document.querySelector('#footerSummaryTotal');

  if (!footerQty) return;

  const quantity = Number(footerQty.value || 1);
  const price = pricesByQuantity[quantity] || pricesByQuantity[1];
  const quantityText = getQuantityText(quantity);
  const totalText = formatGuarani(price);

  if (footerSummaryQty) footerSummaryQty.textContent = quantityText;
  if (footerSummaryColor && footerColor) footerSummaryColor.textContent = footerColor.value;
  if (footerSummaryQtyText) footerSummaryQtyText.textContent = quantityText;
  if (footerSummaryTotal) footerSummaryTotal.textContent = totalText;
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
    deliveryNotice.textContent = 'Asunción y Central: envío gratis y pago contra entrega. Interior: se coordina una seña previa por WhatsApp.';
    paymentNote.textContent = 'Asunción y Central: no pagás nada ahora, abonás al recibir.';
    return;
  }

  if (isKnownCashArea) {
    deliveryNotice.textContent = 'Zona habilitada para envío gratis y pago contra entrega. No abonás nada ahora.';
    paymentNote.textContent = 'No pagás nada ahora, abonás al recibir.';
    return;
  }

  deliveryNotice.textContent = 'Para envíos al interior se coordina una seña previa por WhatsApp antes del despacho.';
  paymentNote.textContent = 'Interior: se coordina una seña previa por WhatsApp y el saldo al recibir.';
}

function setDeliveryNoticeText(notice, value) {
  if (!notice) return;

  const isKnownCashArea = value && isCashOnDeliveryArea(value);
  notice.classList.toggle('delivery-ok', Boolean(isKnownCashArea));
  notice.classList.toggle('delivery-interior', Boolean(value && !isKnownCashArea));

  if (!value) {
    notice.textContent = 'Asunción y Central: envío gratis y pago contra entrega. Interior: se coordina una seña previa por WhatsApp.';
    return;
  }

  notice.textContent = isKnownCashArea
    ? 'Zona habilitada para envío gratis y pago contra entrega. No abonás nada ahora.'
    : 'Para envíos al interior se coordina una seña previa por WhatsApp antes del despacho.';
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
      : `Para envíos al interior coordinaremos una seña previa por WhatsApp. Te hablaremos al número <strong>${order.phone || '---'}</strong>.`;
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

buyButton?.addEventListener('click', (event) => {
  event.preventDefault();
  showCheckout();
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
document.querySelector('#footerQuantitySelect')?.addEventListener('change', updateFooterSummary);
document.querySelector('#footerColorSelect')?.addEventListener('change', updateFooterSummary);
cityInput?.addEventListener('input', updateDeliveryNotice);
updateOrderSummary();
updateFooterSummary();
updateDeliveryNotice();
initMapPicker();
initFormDeliveryNotices();

orderForms.forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const quantity = Number(formData.get('quantity') || 1);
  const color = String(formData.get('color') || 'Rosa');
  const submitButton = form.querySelector('button[type="submit"]');
  const currentFormError = form.querySelector('.form-error') || formError;
  
  const order = {
    id: generateOrderNumber(),
    product: CONFIG.productName,
    combo: `${getComboName(quantity)} | Color: ${color}`,
    quantity,
    total: pricesByQuantity[quantity] || pricesByQuantity[1],
    customer_name: String(formData.get('name') || '').trim(),
    customer_phone: String(formData.get('phone') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    neighborhood: String(formData.get('neighborhood') || '').trim(),
    reference: String(formData.get('notes') || '').trim(),
    maps_url: String(formData.get('map') || '').trim(),
    paymentMode: isCashOnDeliveryArea(String(formData.get('city') || '')) ? 'cash_on_delivery' : 'deposit_required_for_interior',
    status: 'pending_confirmation',
    created_at: new Date().toISOString(),
  };

  const supabaseOrder = {
    id: order.id,
    product: order.product,
    combo: order.combo,
    quantity: order.quantity,
    total: order.total,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    city: order.city,
    address: order.address,
    neighborhood: order.neighborhood,
    reference: `${order.reference}${order.paymentMode === 'deposit_required_for_interior' ? ' | Interior: coordinar seña previa' : ' | Pago contra entrega'}`,
    maps_url: order.maps_url,
    status: order.status,
    created_at: order.created_at,
  };

  if (currentFormError) currentFormError.textContent = '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando pedido...';
  }

  try {
    saveOrder(order);
    await saveOrderToSupabase(supabaseOrder);
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
    phone: order.customer_phone,
    paymentMode: order.paymentMode,
  });
}));
