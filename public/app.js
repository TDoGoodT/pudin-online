// ========================
// CONSTANTS
// ========================
const HEADER_H = 108;   // matches --header-h in CSS
const STRIP_H  = 64;    // matches --strip-h in CSS

// ========================
// STATE
// ========================
const cart = {}; // { id: { name, price, qty } }

// ========================
// STICKY SCROLL MECHANIC
// ========================
const cards = Array.from(document.querySelectorAll('.stack-card'));

function updateStickyTops() {
  // Each card's sticky top = header height + (number of already-collapsed cards × strip height)
  // But only cards BEFORE this one that are collapsed count.
  let collapsedCount = 0;
  cards.forEach(card => {
    const top = HEADER_H + collapsedCount * STRIP_H;
    card.style.top = top + 'px';
    if (card.classList.contains('is-collapsed')) collapsedCount++;
  });
}

function updateCollapsedState() {
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    // A card is "collapsed" once its full content has been scrolled past —
    // i.e. when the card's bottom edge is at or above where the next card starts.
    // We detect this by checking if the card is in sticky collapsed position:
    // the card is collapsed when the NEXT card is also sticky and overlapping it.
    // Simpler heuristic: card is collapsed when its top is at exactly its sticky threshold
    // AND the scroll position has moved it to show only the strip.

    // Practical approach: a card collapses when the viewport top of the card
    // equals its assigned sticky top (meaning it's stuck) AND there's content
    // below that's pushing it — i.e. not the currently active card.
    // We treat the LAST non-collapsed card as "active".

    // Actually the cleanest approach: collapse all cards whose bottom edge
    // is above the top of the next card's full content area.
    // We use IntersectionObserver for this — see initObservers().
  });
}

// Use IntersectionObserver to detect when a card's full content scrolls out of view upward
function initScrollMechanic() {
  // We observe a sentinel element at the top of each card-full.
  // When it leaves the top of the viewport (going up), the card collapses.

  cards.forEach((card, i) => {
    const cardFull = card.querySelector('.card-full');

    // Create a sentinel div at the very bottom of the card-full
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    sentinel.style.cssText = 'height:1px;width:100%;';
    cardFull.appendChild(sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            // Sentinel has scrolled above viewport — card should collapse
            card.classList.add('is-collapsed');
          } else if (entry.isIntersecting || entry.boundingClientRect.top > 0) {
            // Sentinel is visible or below — card should be full
            card.classList.remove('is-collapsed');
          }
          updateStickyTops();
        });
      },
      {
        root: null,
        rootMargin: `${-HEADER_H}px 0px 0px 0px`,
        threshold: 0
      }
    );

    observer.observe(sentinel);

    // Clicking a collapsed strip scrolls back to that card
    const strip = card.querySelector('.card-collapsed');
    strip.addEventListener('click', () => {
      const top = card.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ========================
// CATEGORY NAV
// ========================
function initCategoryNav() {
  const pills = document.querySelectorAll('.cat-pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Update active state
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Find first card in that category and scroll to it
      const category = pill.dataset.category;
      const target = document.querySelector(`.stack-card[data-category="${category}"]`);
      if (!target) return;

      // Reset all cards above this one to non-collapsed first
      // (so the sticky offsets are correct)
      const targetIdx = cards.indexOf(target);
      cards.forEach((card, i) => {
        if (i < targetIdx) {
          // Cards before target: will be collapsed after scroll, don't force state
        }
        if (i >= targetIdx) {
          card.classList.remove('is-collapsed');
        }
      });
      updateStickyTops();

      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Update active pill on scroll based on visible card
  window.addEventListener('scroll', () => {
    let activeCategory = null;
    cards.forEach(card => {
      if (!card.classList.contains('is-collapsed')) {
        activeCategory = card.dataset.category;
        return;
      }
    });
    if (activeCategory) {
      pills.forEach(p => {
        p.classList.toggle('active', p.dataset.category === activeCategory);
      });
    }
  }, { passive: true });
}

// ========================
// QUANTITY
// ========================
document.addEventListener('click', e => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const el = document.getElementById(`qty-${id}`);
  if (!el) return;
  let val = parseInt(el.textContent) + (action === 'plus' ? 1 : -1);
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  el.textContent = val;
});

function getQty(id) {
  const el = document.getElementById(`qty-${id}`);
  return el ? parseInt(el.textContent) : 1;
}

// ========================
// CART
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

  // Reset qty display
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = '1';

  renderCart();
  showToast(`${name} נוסף לסל`);
});

function removeFromCart(id) {
  delete cart[id];
  renderCart();
}

function renderCart() {
  const itemsEl    = document.getElementById('cartItems');
  const footerEl   = document.getElementById('cartFooter');
  const totalEl    = document.getElementById('cartTotal');
  const countEl    = document.getElementById('cartCount');
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

  // Build WhatsApp message
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
renderCart();
updateStickyTops();
initScrollMechanic();
initCategoryNav();
