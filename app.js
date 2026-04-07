// ========================
// STATE
// ========================
const cart = {}; // { id: { name, price, qty } }

// ========================
// PRODUCT TOGGLE
// ========================
function toggleProduct(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  const isOpen = item.classList.contains('open');

  // Close all others
  document.querySelectorAll('.product-item.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

// ========================
// QUANTITY
// ========================
function changeQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let val = parseInt(el.textContent) + delta;
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  el.textContent = val;
}

function getQty(id) {
  const el = document.getElementById(`qty-${id}`);
  return el ? parseInt(el.textContent) : 1;
}

// ========================
// CART
// ========================
function addToCart(id, name, price) {
  const qty = getQty(id);

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name, price, qty };
  }

  // Reset qty display
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = '1';

  renderCart();
  showToast(`${name} נוסף לסל ✓`);
}

function removeFromCart(id) {
  delete cart[id];
  renderCart();
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const ids = Object.keys(cart);
  const totalItems = ids.reduce((s, id) => s + cart[id].qty, 0);
  const totalPrice = ids.reduce((s, id) => s + cart[id].price * cart[id].qty, 0);

  // Update count badge
  countEl.textContent = totalItems;
  countEl.classList.toggle('visible', totalItems > 0);

  if (ids.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">הסל ריק עדיין 🛒</p>';
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
  msg += `\nסה״כ: ₪${totalPrice}\n\nאנא אשרי זמינות ופרטי איסוף/משלוח 🙏`;

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

document.getElementById('cartBtn').addEventListener('click', openCart);

// ========================
// TOAST
// ========================
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========================
// INIT
// ========================
renderCart();
