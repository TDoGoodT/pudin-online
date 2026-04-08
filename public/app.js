// ========================
// CONSTANTS
// ========================
const HEADER_H  = 108;   // px — must match CSS --header-h
const STRIP_H   = 56;    // px — collapsed strip height
const ZONE_H    = () => Math.round(window.innerHeight * 0.9);

// Progress thresholds
const DESC_SHOW_AT  = 0.72;  // description + button fade in after 72% expanded
const IMAGE_START   = 0.08;  // image starts revealing at 8% progress
const SCALE_MIN     = 0.97;  // slight scale-down for collapsed-adjacent cards

// ========================
// ELEMENTS
// ========================
const cards = Array.from(document.querySelectorAll('.stack-card'));
const pills  = Array.from(document.querySelectorAll('.cat-pill'));
const cart   = {};

// ========================
// CORE — scroll-driven layout
//
// Each card has a "zone" — a window.scrollY range.
// Before zone: card is off-screen below (pending).
// Inside zone: card is the active expanding/contracting card.
// After zone:  card is collapsed to a STRIP_H strip, stacked at top below header.
//
// Within the active zone we compute progress [0..1]:
//   0 = bottom of zone (just arrived, slim bar)
//   1 = top of zone (fully expanded)
//
// progress drives everything via CSS custom properties on the element.
// ========================

function getZoneStart(i) { return i * ZONE_H(); }
function getZoneEnd(i)   { return (i + 1) * ZONE_H(); }

// easeInOutCubic — makes the expansion feel physical
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function updateLayout() {
  const sy    = window.scrollY;
  const zone  = ZONE_H();
  let collapsedCount = 0;

  cards.forEach((card, i) => {
    const zStart = i * zone;
    const zEnd   = (i + 1) * zone;

    const isCollapsed = sy >= zEnd;
    const isPending   = sy < zStart;
    const isActive    = !isCollapsed && !isPending;

    card.classList.toggle('is-collapsed', isCollapsed);
    card.classList.toggle('is-pending',   isPending);
    card.classList.toggle('is-active',    isActive);

    if (isCollapsed) {
      // Stack at top below header — each collapsed card adds STRIP_H
      card.style.top = (HEADER_H + collapsedCount * STRIP_H) + 'px';
      card.style.setProperty('--progress', '0');
      card.style.setProperty('--img-reveal', '0');
      card.style.setProperty('--content-opacity', '0');
      card.style.setProperty('--card-opacity', '1');
      collapsedCount++;
    } else if (isPending) {
      card.style.top = '100vh';
      card.style.setProperty('--progress', '0');
      card.style.setProperty('--img-reveal', '0');
      card.style.setProperty('--content-opacity', '0');
      card.style.setProperty('--card-opacity', '0.5');
    } else {
      // Active card — compute continuous progress
      const rawProgress = clamp((sy - zStart) / zone, 0, 1);
      const progress    = ease(rawProgress);

      // Image reveal: starts at IMAGE_START progress, reaches 1 at progress=1
      const imgReveal = clamp((rawProgress - IMAGE_START) / (1 - IMAGE_START), 0, 1);

      // Content (desc + button): fades in only in upper portion
      const contentOpacity = clamp((rawProgress - DESC_SHOW_AT) / (1 - DESC_SHOW_AT), 0, 1);

      // Strip opacity: as card expands, the collapsed strip fades out
      const cardOpacity = 0.55 + progress * 0.45;

      card.style.top = (HEADER_H + collapsedCount * STRIP_H) + 'px';
      card.style.setProperty('--progress',        progress.toFixed(4));
      card.style.setProperty('--img-reveal',      imgReveal.toFixed(4));
      card.style.setProperty('--content-opacity', contentOpacity.toFixed(4));
      card.style.setProperty('--card-opacity',    cardOpacity.toFixed(4));
    }
  });

  syncActivePill();
}

// ========================
// PAGE HEIGHT
// ========================
function setPageHeight() {
  const zone  = ZONE_H();
  const stack = document.getElementById('productStack');
  stack.style.height = (cards.length * zone + window.innerHeight) + 'px';
}

// ========================
// CATEGORY PILL SYNC
// ========================
function syncActivePill() {
  let activeCat = null;
  for (const card of cards) {
    if (card.classList.contains('is-active')) {
      activeCat = card.dataset.category;
      break;
    }
  }
  pills.forEach(p => p.classList.toggle('active', p.dataset.category === activeCat));
}

// ========================
// CATEGORY NAV CLICKS
// ========================
function initCategoryNav() {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.dataset.category;
      const idx = cards.findIndex(c => c.dataset.category === category);
      if (idx < 0) return;
      window.scrollTo({ top: getZoneStart(idx), behavior: 'smooth' });
    });
  });
}

// ========================
// COLLAPSED STRIP CLICKS
// ========================
function initStripClicks() {
  cards.forEach((card, i) => {
    card.querySelector('.card-collapsed').addEventListener('click', () => {
      window.scrollTo({ top: getZoneStart(i), behavior: 'smooth' });
    });
  });
}

// ========================
// QUANTITY
// ========================
document.addEventListener('click', e => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const id  = btn.dataset.id;
  const el  = document.getElementById(`qty-${id}`);
  if (!el) return;
  let val = parseInt(el.textContent) + (btn.dataset.action === 'plus' ? 1 : -1);
  el.textContent = Math.max(1, Math.min(99, val));
});

function getQty(id) {
  const el = document.getElementById(`qty-${id}`);
  return el ? parseInt(el.textContent) : 1;
}

// ========================
// CART — ADD
// ========================
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  const id    = btn.dataset.id;
  const name  = btn.dataset.name;
  const price = parseInt(btn.dataset.price);
  const qty   = getQty(id);
  if (cart[id]) { cart[id].qty += qty; } else { cart[id] = { name, price, qty }; }
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = '1';
  renderCart();
  showToast(`${name} נוסף לסל`);
});

function removeFromCart(id) { delete cart[id]; renderCart(); }

// ========================
// CART — RENDER
// ========================
function renderCart() {
  const itemsEl     = document.getElementById('cartItems');
  const footerEl    = document.getElementById('cartFooter');
  const totalEl     = document.getElementById('cartTotal');
  const countEl     = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const ids         = Object.keys(cart);
  const totalItems  = ids.reduce((s, id) => s + cart[id].qty, 0);
  const totalPrice  = ids.reduce((s, id) => s + cart[id].price * cart[id].qty, 0);

  countEl.textContent = totalItems;
  countEl.classList.toggle('visible', totalItems > 0);

  if (ids.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">הסל ריק עדיין</p>';
    footerEl.style.display = 'none';
    return;
  }
  footerEl.style.display = 'flex';
  totalEl.textContent = `₪${totalPrice}`;
  itemsEl.innerHTML = ids.map(id => {
    const item = cart[id];
    return `<div class="cart-line">
      <div class="cart-line-info">
        <div class="cart-line-name">${item.name}</div>
        <div class="cart-line-meta">${item.qty} × ₪${item.price}</div>
      </div>
      <span class="cart-line-price">₪${item.price * item.qty}</span>
      <button class="cart-line-remove" onclick="removeFromCart('${id}')" aria-label="הסר">✕</button>
    </div>`;
  }).join('');

  let msg = 'שלום זיו! אשמח להזמין:\n\n';
  ids.forEach(id => {
    const item = cart[id];
    msg += `• ${item.name} × ${item.qty} — ₪${item.price * item.qty}\n`;
  });
  msg += `\nסה״כ: ₪${totalPrice}\n\nאנא אשרי זמינות ופרטי איסוף/משלוח`;
  checkoutBtn.href = `https://wa.me/9720544878282?text=${encodeURIComponent(msg)}`;
}

// ========================
// CART DRAWER
// ========================
function openCart() {
  document.getElementById('cartDrawer').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('floatCart').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

// ========================
// TOAST
// ========================
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ========================
// INIT
// ========================
function init() {
  setPageHeight();
  updateLayout();
  initStripClicks();
  initCategoryNav();
  renderCart();

  window.addEventListener('scroll', updateLayout, { passive: true });
  window.addEventListener('resize', () => {
    setPageHeight();
    updateLayout();
  });
}

init();
