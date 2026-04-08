// ========================
// CONSTANTS
// ========================
const HEADER_H  = 108;   // px — must match CSS --header-h
const STRIP_H   = 56;    // px — collapsed strip height
const ZONE_H    = () => Math.round(window.innerHeight * 0.9);

// Progress thresholds
const DESC_SHOW_AT = 0.72;  // description + button fade in after 72% expanded
const IMAGE_START  = 0.08;  // image starts revealing at 8% progress

// ========================
// ELEMENTS
// ========================
const allCards = Array.from(document.querySelectorAll('.stack-card'));
const pills    = Array.from(document.querySelectorAll('.cat-pill'));
const cart     = {};

// ========================
// CATEGORY STATE
// visibleCards = the currently-filtered subset, in DOM order
// ========================
let activeCategory = allCards[0]?.dataset.category ?? null;
let visibleCards   = allCards.filter(c => c.dataset.category === activeCategory);

// ========================
// HELPERS
// ========================
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function getZoneStart(i) { return i * ZONE_H(); }

// ========================
// SHOW / HIDE CATEGORIES
// Filters visible cards, resets scroll, rebuilds layout
// ========================
function setCategory(category) {
  activeCategory = category;
  visibleCards   = allCards.filter(c => c.dataset.category === category);

  // Hide all, then show only the new visible set
  allCards.forEach(card => {
    const inCategory = card.dataset.category === category;
    card.classList.toggle('cat-hidden', !inCategory);
    // Reset all state on hidden cards
    if (!inCategory) {
      card.style.top = '100vh';
      card.style.setProperty('--progress', '0');
      card.style.setProperty('--img-reveal', '0');
      card.style.setProperty('--content-opacity', '0');
      card.style.setProperty('--card-opacity', '0');
      card.classList.remove('is-collapsed', 'is-active', 'is-pending');
    }
  });

  setPageHeight();

  // Scroll to start of new category (instant — smooth would feel sluggish here)
  window.scrollTo({ top: 0, behavior: 'instant' });

  updateLayout();
  syncActivePill();
}

// ========================
// CORE — scroll-driven layout
// Operates only on visibleCards
// ========================
function updateLayout() {
  const sy   = window.scrollY;
  const zone = ZONE_H();
  let collapsedCount = 0;

  visibleCards.forEach((card, i) => {
    const zStart = i * zone;
    const zEnd   = (i + 1) * zone;

    const isCollapsed = sy >= zEnd;
    const isPending   = sy < zStart;
    const isActive    = !isCollapsed && !isPending;

    card.classList.toggle('is-collapsed', isCollapsed);
    card.classList.toggle('is-pending',   isPending);
    card.classList.toggle('is-active',    isActive);

    if (isCollapsed) {
      card.style.top = (HEADER_H + collapsedCount * STRIP_H) + 'px';
      card.style.setProperty('--progress',        '0');
      card.style.setProperty('--img-reveal',      '0');
      card.style.setProperty('--content-opacity', '0');
      card.style.setProperty('--card-opacity',    '1');
      collapsedCount++;
    } else if (isPending) {
      card.style.top = '100vh';
      card.style.setProperty('--progress',        '0');
      card.style.setProperty('--img-reveal',      '0');
      card.style.setProperty('--content-opacity', '0');
      card.style.setProperty('--card-opacity',    '0.5');
    } else {
      // Active — compute continuous progress
      const rawProgress    = clamp((sy - zStart) / zone, 0, 1);
      const progress       = ease(rawProgress);
      const imgReveal      = clamp((rawProgress - IMAGE_START) / (1 - IMAGE_START), 0, 1);
      const contentOpacity = clamp((rawProgress - DESC_SHOW_AT) / (1 - DESC_SHOW_AT), 0, 1);
      const cardOpacity    = 0.55 + progress * 0.45;

      card.style.top = (HEADER_H + collapsedCount * STRIP_H) + 'px';
      card.style.setProperty('--progress',        progress.toFixed(4));
      card.style.setProperty('--img-reveal',      imgReveal.toFixed(4));
      card.style.setProperty('--content-opacity', contentOpacity.toFixed(4));
      card.style.setProperty('--card-opacity',    cardOpacity.toFixed(4));
    }
  });
}

// ========================
// PAGE HEIGHT — based on visible cards only
// ========================
function setPageHeight() {
  const zone  = ZONE_H();
  const stack = document.getElementById('productStack');
  stack.style.height = (visibleCards.length * zone + window.innerHeight) + 'px';
}

// ========================
// CATEGORY PILL SYNC
// ========================
function syncActivePill() {
  pills.forEach(p => p.classList.toggle('active', p.dataset.category === activeCategory));
}

// ========================
// CATEGORY NAV CLICKS
// ========================
function initCategoryNav() {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.dataset.category === activeCategory) return;
      setCategory(pill.dataset.category);
    });
  });
}

// ========================
// COLLAPSED STRIP CLICKS
// ========================
function initStripClicks() {
  allCards.forEach((card, i) => {
    card.querySelector('.card-collapsed').addEventListener('click', () => {
      // Find this card's index within visibleCards
      const vi = visibleCards.indexOf(card);
      if (vi < 0) return;
      window.scrollTo({ top: getZoneStart(vi), behavior: 'smooth' });
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
  syncActivePill();
  renderCart();

  window.addEventListener('scroll', updateLayout, { passive: true });
  window.addEventListener('resize', () => {
    setPageHeight();
    updateLayout();
  });
}

init();
