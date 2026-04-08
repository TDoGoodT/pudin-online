// ========================
// ELEMENTS
// ========================
const pills       = Array.from(document.querySelectorAll('.cat-pill'));
const sections    = Array.from(document.querySelectorAll('.section-header'));
const rows        = Array.from(document.querySelectorAll('.product-row'));
const cart        = {};

// ========================
// CATEGORY NAV — pill clicks scroll to section
// ========================
function initCategoryNav() {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.category;
      const section = document.querySelector(`.section-header[data-category="${cat}"]`);
      if (!section) return;
      // Offset for fixed header + section header
      const headerH = document.getElementById('siteHeader').offsetHeight;
      const top = section.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ========================
// SCROLL SPY — active pill follows scroll position
// ========================
function initScrollSpy() {
  const headerH = () => document.getElementById('siteHeader').offsetHeight;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cat = entry.target.dataset.category;
        pills.forEach(p => p.classList.toggle('active', p.dataset.category === cat));
      }
    });
  }, {
    rootMargin: `-${document.getElementById('siteHeader').offsetHeight + 2}px 0px -80% 0px`,
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
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
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ========================
// INIT
// ========================
function init() {
  initCategoryNav();
  initScrollSpy();
  renderCart();
}

init();
