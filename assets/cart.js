/* ==========================================================================
   Nutrava — Cart Module
   Handles AJAX cart operations + slide-out cart drawer.
   Works with Shopify Cart API when deployed, localStorage for local preview.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Shopify Detection ---------- */
  const isShopify = typeof Shopify !== 'undefined' || window.location.hostname.includes('myshopify.com');

  /* ---------- Local Cart (preview mode) ---------- */
  const localCart = {
    _key: 'nutrava_cart',

    _read() {
      try {
        return JSON.parse(localStorage.getItem(this._key)) || { items: [], item_count: 0, total_price: 0 };
      } catch { return { items: [], item_count: 0, total_price: 0 }; }
    },

    _write(cart) {
      cart.item_count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      cart.total_price = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      localStorage.setItem(this._key, JSON.stringify(cart));
      return cart;
    },

    async get() {
      return this._read();
    },

    async add(item) {
      const cart = this._read();
      // item = { id, title, price, handle, quantity, image? }
      const existing = cart.items.find(i => i.handle === item.handle);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        cart.items.push({
          key: item.handle,
          id: item.id || Date.now(),
          handle: item.handle,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image || null,
          variant_title: item.variant_title || null
        });
      }
      return this._write(cart);
    },

    async change(key, quantity) {
      const cart = this._read();
      if (quantity <= 0) {
        cart.items = cart.items.filter(i => i.key !== key);
      } else {
        const item = cart.items.find(i => i.key === key);
        if (item) item.quantity = quantity;
      }
      return this._write(cart);
    },

    async clear() {
      return this._write({ items: [], item_count: 0, total_price: 0 });
    }
  };

  /* ---------- Shopify Cart API ---------- */
  const shopifyCart = {
    async get() {
      const res = await fetch('/cart.js');
      return res.json();
    },

    async add(item) {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: item.id, quantity: item.quantity || 1 }] })
      });
      return this.get();
    },

    async change(key, quantity) {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      return this.get();
    },

    async clear() {
      await fetch('/cart/clear.js', { method: 'POST' });
      return this.get();
    }
  };

  const api = isShopify ? shopifyCart : localCart;

  /* ---------- Format Price ---------- */
  function formatPrice(pence) {
    return '£' + (pence / 100).toFixed(2);
  }

  function parsePriceString(str) {
    // Convert "£14.99" to pence: 1499
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return Math.round(num * 100);
  }

  /* ---------- Cart Drawer Renderer ---------- */
  function renderDrawer(cart) {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;

    const itemsContainer = drawer.querySelector('[data-cart-items]');
    const subtotalEl = drawer.querySelector('[data-cart-subtotal]');
    const countEl = drawer.querySelector('[data-cart-count]');
    const emptyState = drawer.querySelector('[data-cart-empty]');
    const filledState = drawer.querySelector('[data-cart-filled]');

    // Update badge
    updateBadge(cart.item_count);

    if (!cart.items.length) {
      if (emptyState) emptyState.style.display = 'flex';
      if (filledState) filledState.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (filledState) filledState.style.display = 'flex';

    if (itemsContainer) {
      itemsContainer.innerHTML = cart.items.map(item => {
        const price = typeof item.price === 'number' ? item.price : parsePriceString(String(item.price));
        return `
          <div class="cart-item" data-cart-item-key="${item.key}">
            <div class="cart-item__image">
              ${item.image
                ? `<img src="${item.image}" alt="${item.title}">`
                : `<div class="cart-item__placeholder"><i data-lucide="pill"></i></div>`
              }
            </div>
            <div class="cart-item__details">
              <div class="cart-item__title">${item.title}</div>
              ${item.variant_title ? `<div class="cart-item__variant">${item.variant_title}</div>` : ''}
              <div class="cart-item__price">${formatPrice(price)}</div>
              <div class="cart-item__controls">
                <button class="cart-item__qty-btn" data-cart-decrease="${item.key}" aria-label="Decrease quantity">
                  <i data-lucide="minus"></i>
                </button>
                <span class="cart-item__qty">${item.quantity}</span>
                <button class="cart-item__qty-btn" data-cart-increase="${item.key}" aria-label="Increase quantity">
                  <i data-lucide="plus"></i>
                </button>
              </div>
            </div>
            <button class="cart-item__remove" data-cart-remove="${item.key}" aria-label="Remove item">
              <i data-lucide="x"></i>
            </button>
          </div>
        `;
      }).join('');

      // Re-init Lucide icons inside the drawer
      if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide' });

      // Bind qty/remove events
      itemsContainer.querySelectorAll('[data-cart-decrease]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.dataset.cartDecrease;
          const item = cart.items.find(i => i.key === key);
          if (item) {
            const newCart = await api.change(key, item.quantity - 1);
            renderDrawer(newCart);
          }
        });
      });

      itemsContainer.querySelectorAll('[data-cart-increase]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.dataset.cartIncrease;
          const item = cart.items.find(i => i.key === key);
          if (item) {
            const newCart = await api.change(key, item.quantity + 1);
            renderDrawer(newCart);
          }
        });
      });

      itemsContainer.querySelectorAll('[data-cart-remove]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.dataset.cartRemove;
          const newCart = await api.change(key, 0);
          renderDrawer(newCart);
        });
      });
    }

    if (subtotalEl) {
      const total = typeof cart.total_price === 'number'
        ? cart.total_price
        : cart.items.reduce((sum, i) => {
            const p = typeof i.price === 'number' ? i.price : parsePriceString(String(i.price));
            return sum + (p * i.quantity);
          }, 0);
      subtotalEl.textContent = formatPrice(total);
    }

    if (countEl) {
      countEl.textContent = `${cart.item_count} item${cart.item_count !== 1 ? 's' : ''}`;
    }
  }

  /* ---------- Badge ---------- */
  function updateBadge(count) {
    document.querySelectorAll('[data-cart-badge]').forEach(badge => {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  /* ---------- Open / Close ---------- */
  function openDrawer() {
    const drawer = document.querySelector('[data-cart-drawer]');
    const overlay = document.querySelector('[data-cart-overlay]');
    if (drawer) {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    if (overlay) overlay.classList.add('is-open');
  }

  function closeDrawer() {
    const drawer = document.querySelector('[data-cart-drawer]');
    const overlay = document.querySelector('[data-cart-overlay]');
    if (drawer) {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (overlay) overlay.classList.remove('is-open');
  }

  /* ---------- Auth Overlay ---------- */
  function openAuthOverlay() {
    const overlay = document.querySelector('[data-auth-overlay]');
    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      // Focus first input after animation
      setTimeout(() => {
        const input = overlay.querySelector('input:not([style*="display: none"])');
        if (input) input.focus();
      }, 300);
    }
  }

  function closeAuthOverlay() {
    const overlay = document.querySelector('[data-auth-overlay]');
    if (overlay) {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  function proceedToCheckout() {
    closeAuthOverlay();
    if (isShopify) {
      window.location.href = '/checkout';
    } else {
      // Preview mode: show success feedback
      showToast('Redirecting to checkout...');
    }
  }

  function initAuth() {
    // Close auth overlay
    document.querySelectorAll('[data-auth-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthOverlay();
      });
    });

    // Backdrop click to close
    document.querySelectorAll('[data-auth-overlay]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) closeAuthOverlay();
      });
    });

    // Google sign in
    document.querySelectorAll('[data-auth-google]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.add('is-loading');
        btn.textContent = 'Connecting...';
        setTimeout(() => {
          btn.classList.remove('is-loading');
          btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google';
          proceedToCheckout();
        }, 1200);
      });
    });

    // Apple sign in
    document.querySelectorAll('[data-auth-apple]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.add('is-loading');
        btn.textContent = 'Connecting...';
        setTimeout(() => {
          btn.classList.remove('is-loading');
          btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg> Continue with Apple';
          proceedToCheckout();
        }, 1200);
      });
    });

    // Guest checkout
    document.querySelectorAll('[data-auth-guest]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        proceedToCheckout();
      });
    });

    // Toggle between sign in / sign up forms
    document.querySelectorAll('[data-auth-toggle]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-auth-toggle');
        const signinForm = document.querySelector('[data-auth-signin]');
        const signupForm = document.querySelector('[data-auth-signup]');
        if (target === 'signup') {
          if (signinForm) signinForm.style.display = 'none';
          if (signupForm) signupForm.style.display = 'block';
        } else {
          if (signupForm) signupForm.style.display = 'none';
          if (signinForm) signinForm.style.display = 'block';
        }
      });
    });

    // Sign in form submit
    document.querySelectorAll('[data-auth-signin]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.auth-form__submit');
        if (btn) {
          btn.textContent = 'Signing in...';
          btn.disabled = true;
        }
        setTimeout(() => {
          if (btn) {
            btn.textContent = 'Sign In & Pay';
            btn.disabled = false;
          }
          proceedToCheckout();
        }, 1000);
      });
    });

    // Sign up form submit
    document.querySelectorAll('[data-auth-signup]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.auth-form__submit');
        if (btn) {
          btn.textContent = 'Creating account...';
          btn.disabled = true;
        }
        setTimeout(() => {
          if (btn) {
            btn.textContent = 'Create Account';
            btn.disabled = false;
          }
          proceedToCheckout();
        }, 1000);
      });
    });
  }

  /* ---------- Toast Notification ---------- */
  function showToast(message) {
    // Remove any existing toast
    const existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
      <span class="cart-toast__icon"><i data-lucide="check-circle"></i></span>
      <span class="cart-toast__text">${message}</span>
      <button class="cart-toast__view" data-toast-view>View Cart</button>
    `;
    document.body.appendChild(toast);

    if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide' });

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    // "View Cart" button
    const viewBtn = toast.querySelector('[data-toast-view]');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        toast.remove();
        openDrawer();
      });
    }

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ---------- Public API ---------- */
  window.NutravaCart = {
    /**
     * Add a product to cart and open the drawer.
     * @param {Object} product - { handle, title, price (string like "£14.99" or pence int), id?, image?, quantity? }
     */
    async addItem(product) {
      const item = { ...product };
      // Normalise price to pence if string
      if (typeof item.price === 'string') {
        item.price = parsePriceString(item.price);
      }
      item.quantity = item.quantity || 1;
      const cart = await api.add(item);
      renderDrawer(cart);
      openDrawer();
      showToast(`${item.title} added to cart`);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart, addedItem: item } }));
    },

    /**
     * Add multiple products at once (for tier "Add to Cart").
     * @param {Array} products - Array of product objects
     */
    async addItems(products) {
      let cart;
      for (const product of products) {
        const item = { ...product };
        if (typeof item.price === 'string') {
          item.price = parsePriceString(item.price);
        }
        item.quantity = item.quantity || 1;
        cart = await api.add(item);
      }
      renderDrawer(cart);
      openDrawer();
      showToast(`${products.length} items added to cart`);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    },

    async refresh() {
      const cart = await api.get();
      renderDrawer(cart);
      updateBadge(cart.item_count);
    },

    open: openDrawer,
    close: closeDrawer
  };

  /* ---------- Init ---------- */
  function init() {
    // Close button
    document.querySelectorAll('[data-cart-close]').forEach(btn => {
      btn.addEventListener('click', closeDrawer);
    });

    // Overlay click to close
    document.querySelectorAll('[data-cart-overlay]').forEach(el => {
      el.addEventListener('click', closeDrawer);
    });

    // Cart icon click to open
    document.querySelectorAll('[data-cart-toggle]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const cart = await api.get();
        renderDrawer(cart);
        openDrawer();
      });
    });

    // Checkout button → open auth overlay
    document.querySelectorAll('[data-cart-checkout]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeDrawer();
        setTimeout(() => openAuthOverlay(), 300);
      });
    });

    // Keyboard: Escape to close drawer or auth overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const authOverlay = document.querySelector('[data-auth-overlay]');
        if (authOverlay && authOverlay.classList.contains('is-open')) {
          closeAuthOverlay();
        } else {
          closeDrawer();
        }
      }
    });

    // Init auth overlay
    initAuth();

    // Initial badge update
    api.get().then(cart => updateBadge(cart.item_count));
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
