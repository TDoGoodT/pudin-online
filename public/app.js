// ========================
// CONSTANTS
// ========================
const HEADER_H = 108;
const STRIP_H  = 64;

// ========================
// STATE
// ========================
const cart = {};
const cards = Array.from(document.querySelectorAll('.stack-card'));

// naturalTop[i] = offsetTop of card i in normal document flow (no sticky)
let naturalTops = [];

// ========================
// MEASURE NATURAL POSITIONS
// Temporarily make everything relative so we get true document offsets
// ========================
function measureNaturalTops() {
  // Save and clear sticky
  cards.forEach(c => {
    c.style.position = 'relative';
    c.style.top = '0px';
  });

  naturalTops = cards.map(c => {
    let el = c;
    let top = 0;
    while (el) {
      top += el.offsetTop;
      el = el.offsetParent;
    }
    return top;
  });

  // Restore sticky
  cards.forEach(c => {
    c.style.position = '';
    c.style.top = '';
  });
}

// ========================
// LAYOUT UPDATE
// Called on every scroll tick
// ========================
function updateLayout() {
  const scrollY = window.scrollY;
  let collapsedBefore = 0; // strips stacked above current card

  cards.forEach((card, i) => {
    // This card collapses once the user has scrolled past it entirely.
    // "Past it" means: scroll position has brought the NEXT card's natural top
    // up to the bottom edge of the sticky zone (header + existing strips).
    //
    // Collapse condition: there is a next card AND
    //   scrollY + HEADER_H + collapsedBefore * STRIP_H >= naturalTops[i+1]
    //
    // Which rearranges to:
    //   scrollY >= naturalTops[i+1] - HEADER_H - collapsedBefore * STRIP_H

    let shouldCollapse = false;
    if (i < cards.length - 1) {
      const collapseAt = naturalTops[i + 1] - HEADER_H - collapsedBefore * STRIP_H;
      shouldCollapse = scrollY >= collapseAt;
    }

    card.classList.toggle('is-collapsed', shouldCollapse);

    // Sticky top for this card = header + strips stacked above it
    card.style.top = (HEADER_H + collapsedBefore * STRIP_H) + 'px';

    if (shouldCollapse) collapsedBefore++;
  });

  syncActivePill();
}

// ========================
// CATEGORY PILL SYNC
// ========================
const pills = Array.from(document.querySelectorAll('.cat-pill'));

function syncActivePill() {
  // The "active" card is the first non-collapsed one
  let activeCategory = null;
  for (const card of cards) {
    if (!card.classList.contains('is-collapsed')) {
      activeCategory = card.dataset.category;
      break;
    }
  }
  if (!activeCategory) {
    activeCategory = cards[cards.length - 1]?.dataset.category;
  }

  pills.forEach(p => {
    p.classList.toggle('active', p.dataset.category === activeCategory);
  });
}

// ========================
// CATEGORY NAV CLICKS
// ========================
function initCategoryNav() {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.dataset.category;
      const targetIdx = cards.findIndex(c => c.dataset.category === category);
      if (targetIdx < 0) return;

      // Scroll so that card[targetIdx] becomes the first non-collapsed card.
      // At that scroll position: scrollY = naturalTops[targetIdx] - HEADER_H - (cards before it that'll be collapsed) * STRIP_H
      // But we want it just at the threshold where it's NOT collapsed yet,
      // so scroll to naturalTops[targetIdx] - HEADER_H - (targetIdx) * STRIP_H
      // Actually: use targetIdx as collapsedBefore since all previous cards collapse
      const scrollTo = naturalTops[targetIdx] - HEADER_H - targetIdx * STRIP_H;
      window.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
    });
  });
}

// ========================
// COLLAPSED STRIP CLICKS — tap to go back to that card
// ========================
function initStripClicks() {
  cards.forEach((card, i) => {
    card.querySelector('.card-collapsed').addEventListener('click', () => {
      // Scroll to just before this card collapses — i.e. just before next card's threshold
      const scrollTo = naturalTops[i] - HEADER_H - i * STRIP_H;
      window.scrollTo({ top: Math.max(0, scrollTo - 1), behavior: 'smooth' });
    });
  });
}

// ========================
// QUANTITY
// ========================
document.addEventListener('click', e => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const el = document.getElementById(`qty-${id}`);
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

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name, price, qty };
  }

  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = '1';

  renderCart();
  showToast(`${name} נוסף לסל`);
});

function removeFromCart(id) {
  delete cart[id];
  renderCart();
}

// ========================
// CART — RENDER
// ========================
function renderCart() {
  const itemsEl     = document.getElementById('cartItems');
  const footerEl    = document.getElementById('cartFooter');
  const totalEl     = document.getElementById('cartTotal');
  const countEl     = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const ids        = Object.keys(cart);
  const totalItems = ids.reduce((s, id) => s + cart[id].qty, 0);
  const totalPrice = ids.reduce((s, id) => s + cart[id].price * cart[id].qty, 0);

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
    return `
      <div class="cart-line">
        <div class="cart-line-info">
          <div class="cart-line-name">${item.name}</div>
          <div class="cart-line-meta">${item.qty} × ₪${item.price}</div>
        </div>
        <span class="cart-line-price">₪${item.price * item.qty}</span>
        <button class="cart-line-remove" onclick="removeFromCart('${id}')" aria-label="הסר">✕</button>
      </div>
    `;
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
  renderCart();

  // Let fonts and layout fully render before measuring
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      measureNaturalTops();
      initStripClicks();
      initCategoryNav();
      updateLayout();
      window.addEventListener('scroll', updateLayout, { passive: true });
      window.addEventListener('resize', () => {
        measureNaturalTops();
        updateLayout();
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
