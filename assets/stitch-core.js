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
    const res = await fetch('/cart.js');
    const cart = await res.json();
    
    // Update progress bar in drawer if it exists
    const progressBar = document.querySelector('.stitch-gift-bar .animate-progress');
    const remainingText = document.querySelector('.stitch-gift-bar text'); // simplified for example
    
    // This logic is mostly handled by liquid on re-render, 
    // but we can add manual triggers here if needed.
  }
};

// Global click handler for AJAX add
document.addEventListener('click', (e) => {
  const addToCartBtn = e.target.closest('[data-stitch-add-to-cart]');
  if (addToCartBtn) {
    e.preventDefault();
    const variantId = addToCartBtn.dataset.variantId;
    const quantity = addToCartBtn.dataset.quantity || 1;
    window.stitch.addToCart(variantId, quantity);
  }
});
