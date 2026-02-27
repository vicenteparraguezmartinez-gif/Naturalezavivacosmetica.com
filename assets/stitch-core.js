/**
 * Stitch Theme Core Logic
 * Handles AJAX Cart, Profitability filters and dynamic UI updates
 */

window.stitch = {
  /**
   * Add to cart using the AJAX API
   * @param {number} variantId 
   * @param {number} quantity 
   */
  addToCart: async (variantId, quantity = 1) => {
    try {
      const response = await fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'xmlhttprequest'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
          sections: 'cart-drawer,cart-icon-bubble'
        })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        alert(data.description);
        return;
      }

      // Update Dawn's cart drawer
      if (document.querySelector('cart-drawer')) {
        const cartDrawer = document.querySelector('cart-drawer');
        const sectionsToRender = ['cart-drawer', 'cart-icon-bubble'];
        
        sectionsToRender.forEach((section) => {
          const elementToReplace = document.getElementById(section) || document.querySelector(`.${section}`);
          if (elementToReplace && data.sections && data.sections[section]) {
            elementToReplace.innerHTML = new DOMParser()
              .parseFromString(data.sections[section], 'text/html')
              .getElementById(section).innerHTML;
          }
        });
        
        cartDrawer.open();
      } else {
        window.location.href = window.routes.cart_url;
      }

    } catch (error) {
      console.error('Stitch AJAX Cart Error:', error);
    }
  },

  /**
   * Refreshes the cart data and updates UI elements
   */
  refreshCart: async () => {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      
      // Update progress bar
      window.stitch.updateProgressBar(cart);
      
      // Update Volume Discounts display
      window.stitch.updateVolumeDiscounts(cart);
      
    } catch (e) {
      console.error('Stitch Refresh Error:', e);
    }
  },

  /**
   * Update Progress Bar UI
   */
  updateProgressBar: (cart) => {
    const bar = document.querySelector('.stitch-gift-bar .animate-progress');
    const label = document.querySelector('.stitch-gift-bar .uppercase');
    const perceText = document.querySelector('.stitch-gift-bar .text-slate-400');
    
    if (!bar) return;

    const t1 = 2500000;
    const t2 = 4500000;
    const t3 = 7000000;
    const total = cart.total_price;
    
    let progress, remaining, goal;

    if (total < t1) {
      progress = (total / t1) * 100;
      remaining = t1 - total;
      goal = 'Envío Gratis + Bálsamo Labial';
    } else if (total < t2) {
      progress = (total / t2) * 100;
      remaining = t2 - total;
      goal = 'Roll-on Aromaterapia de regalo';
    } else if (total < t3) {
      progress = (total / t3) * 100;
      remaining = t3 - total;
      goal = 'Jabón Artesanal Premium de regalo';
    } else {
      progress = 100;
    }

    bar.style.width = `${progress}%`;
    if (perceText) perceText.innerText = `${Math.round(progress)}%`;
    
    if (label) {
      if (total >= t3) {
        label.innerText = '🎉 ¡Todos los regalos desbloqueados!';
      } else {
        const formattedRemaining = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(remaining / 100);
        label.innerText = `🎁 Te faltan ${formattedRemaining} para ${goal}`;
      }
    }

    // Update icons opacity
    const icons = document.querySelectorAll('.stitch-gift-bar .flex-col');
    if (icons[0]) icons[0].style.opacity = total >= t1 ? '1' : '0.3';
    if (icons[1]) icons[1].style.opacity = total >= t2 ? '1' : '0.3';
    if (icons[2]) icons[2].style.opacity = total >= t3 ? '1' : '0.3';
  },

  /**
   * Volume Discount Logic
   * 2 units -> 5% off
   * 3+ units -> 10% off
   */
  updateVolumeDiscounts: (cart) => {
    // This is visual only as real discount requires Shopify Functions/App
    // We update the subtotal or individual line items if needed
    console.log('Calculating volume discounts for:', cart.item_count, 'items');
  }
};

// Global click handler for AJAX add
document.addEventListener('click', (e) => {
  const addToCartBtn = e.target.closest('[data-stitch-add-to-cart]');
  if (addToCartBtn) {
    e.preventDefault();
    const variantId = addToCartBtn.dataset.variantId;
    const quantity = parseInt(addToCartBtn.dataset.quantity || 1);
    window.stitch.addToCart(variantId, quantity);
  }
});

// Intercept Dawn's cart updates to trigger Stitch refresh
const orgFetch = window.fetch;
window.fetch = function() {
  const arg = arguments;
  if (arg[0] && (arg[0].includes('/cart/add') || arg[0].includes('/cart/change') || arg[0].includes('/cart/update'))) {
    return orgFetch.apply(this, arguments).then(res => {
      window.stitch.refreshCart();
      return res;
    });
  }
  return orgFetch.apply(this, arguments);
};
