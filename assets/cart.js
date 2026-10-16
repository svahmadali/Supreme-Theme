class CartRemoveItem extends HTMLElement {
  constructor() {
    super();

    this.removeBtn = this.querySelector('a'); // The remove button
    this.loader = this.querySelector('.cart-remove-loader'); // Optional: a loader element inside

    this.removeBtn.addEventListener('click', (event) => {
      event.preventDefault();

      this.handleRemove();
    });
  }

  async handleRemove() {
    this.removeBtn.classList.add('hidden');
    if (this.loader) {
      this.loader.classList.remove('hidden');
    }
    const cartItems = this.closest('cart-items-data');
    if (!cartItems || typeof cartItems.updateQuantity !== 'function') {
      console.error('cart-items-data or updateQuantity method not found.');
      this.resetUI();
      return;
    }
    try {
      await cartItems.updateQuantity(this.dataset.index, 0); // async remove
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      this.resetUI(); // Restore UI if error
    }
  }

  resetUI() {
    this.removeBtn.classList.remove('hidden');
    if (this.loader) {
      this.loader.classList.add('hidden');
    }
  }
}

customElements.define('cart-remove-item', CartRemoveItem);


class CartItemsUpdate extends HTMLElement {
  constructor() {
    super();
    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);
    this.addEventListener('change', debouncedOnChange.bind(this));
  }
  cartUpdateUnsubscriber = undefined;
  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items-data') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }
  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  onCartUpdate() {
    if (this.tagName === 'CART-ITEMS-DATA') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-items-data'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
            
              trapFocusElements(document.querySelector("cart-drawer"));
      
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const cartItems = html.querySelector('cart-grid');
          this.innerHTML = cartItems.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        section:document.getElementById('cart-drawer')?.id,
        selector: 'cart-drawer'
      },
      {
        id: 'main-cart',
        section: document.getElementById('main-cart')?.dataset.id,
        selector: '.cart-form-content',
      }
   
    ];
  }

  updateQuantity(line, quantity, name) {
    const body = JSON.stringify({ line, quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const resultState = JSON.parse(state);
        const quantityElement = document.getElementById(`cart-quantity-${line}`) || document.getElementById(`drawer-quantity-${line}`)
        if (resultState.errors) {
            quantityElement.value = quantityElement.getAttribute('value');
            this.updateLiveRegions(line, resultState.errors);
            return;
        }
        
        this.getSectionsToRender().forEach((section) => {
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(resultState.sections[section.section],section.selector);
          freeShippingBarProgress(resultState.total_price);
           if (document.querySelector('cart-drawer') && section.selector == 'cart-drawer') {
             document.querySelector('cart-drawer').setupDialogEvents()
              elementToReplace.querySelectorAll('[data-drawer-close]').forEach((button) =>
                button.addEventListener('click', function(){
               if(document.querySelector("cart-drawer").classList.contains("is-visible")){
                document.querySelector("cart-drawer").classList.remove("is-visible");
                 document.querySelector("body").classList.remove("overflow-hidden");
              }
            })
            );
             trapFocusElements(document.querySelector("cart-drawer"));
            

           }
           let totalCount=resultState.item_count;
             
        
           const itemCountElement = document.querySelector("[data-item-count]");
            if (itemCountElement) {
              itemCountElement.classList.remove("hidden");
    
              if (totalCount == 0) {
                itemCountElement.classList.add("hidden");
              } else if (totalCount < 100) {
                itemCountElement.textContent = totalCount;
              } else {
                itemCountElement.textContent = '99+';
              }
            }
          
        });
    
        this.updateLiveRegions(line, message);
         
      })
      .catch(() => {
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('cartDrawerErrors');
      })
      .finally(() => { 
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError = document.getElementById(`cart-line-item-error-${line}`) || document.getElementById(`CartDrawer-Line-item-error-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item-error').innerHTML = message;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  
}

customElements.define('cart-items-data', CartItemsUpdate);


class GiftWrapping extends HTMLElement {
  constructor() {
    super();
    
    this.giftWrapId = this.dataset.giftWrapId;
    this.giftWrapping = this.dataset.giftWrapping;
    this.cartItemsSize = parseInt(this.getAttribute('cart-items-size'));
    this.giftWrapsInCart = parseInt(this.getAttribute('gift-wraps-in-cart'));
    this.itemsInCart = parseInt(this.getAttribute('items-in-cart'));
    const giftInput = this.querySelector('[add-gift-product]');
    if (giftInput) {
      // Normal change event
      giftInput.addEventListener("change", () => {
        this.setGiftWrap();
      });

      // Trigger on Enter key
      giftInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {

          event.preventDefault(); // stop form submit
          this.setGiftWrap();
          giftInput.checked = true;

        }
      });
    }

  }

  setGiftWrap() {
    const sections = this.getSectionsToRender().map((section) => section.section);
    const body = JSON.stringify({
      updates: {
        [this.giftWrapId]: this.itemsInCart
      },
      attributes: {
        'gift-wrapping': true
      },
      sections: sections,
      sections_url: window.location.pathname
    });

    fetch(`${window.routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((response) => {
         const resultState = JSON.parse(response);
        this.getSectionsToRender().forEach((section) => {
          if(document.getElementById(section.id)){
          const elementToReplace = document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            resultState.sections[section.section],
            section.selector
          );
             freeShippingBarProgress(resultState.total_price);
          }
          if(document.getElementById(section.id) == document.querySelector("cart-drawer")){
              trapFocusElements(document.querySelector("cart-drawer"));
              this.closeDrawer();
          }

        });
       
      })
      .catch((e) => {
        console.error(e);
      });
  }
  getSectionsToRender() {
    let maincartID="#main-cart";
    let maincartfooter="#main-cart";
    if(document.getElementById('main-cart')){
      maincartID=document.getElementById('main-cart').dataset.id
    }
    return [
      {
        id: 'cart-drawer',
        section:document.getElementById('cart-drawer')?.id,
        selector: 'cart-drawer'
      },
      {
        id: 'main-cart',
        section: document.getElementById('main-cart')?.dataset.id,
        selector: '.cart-form-content',
      }
    ];
  }
    getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
  closeDrawer(){
    document.querySelectorAll('[data-drawer-close]').forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelector("cart-drawer").classList.remove("is-visible");
      });
    });
  }
}
customElements.define('gift-wrapping-content', GiftWrapping);


if (!customElements.get('cart-note-content')) {
  customElements.define(
    'cart-note-content',
    class CartNote extends HTMLElement {
      constructor() {
        super();
        this.addEventListener('change',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}
class ShippingCalculator extends HTMLElement {
  constructor() {
    super();
    this.section = this.dataset.section;
    this.setupCountries();
    this.zip = this.querySelector('[data-address-zip]');
    this.country = this.querySelector('[data-address-country-select]');
    this.province = this.querySelector('[data-address-province-select]');
    this.button = this.querySelector('button');
    this.errors = this.querySelector('#shippingErrors');
    this.success = this.querySelector('#shippingSuccess');
    this.button.addEventListener('click', this.onSubmitHandler.bind(this));
  }

  setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      new Shopify.CountryProvinceSelector(`shippingCountry-${this.section}`, `shippingProvince-${this.section}`, {
        hideElement: `shipping-state-${this.section}`
      });
    }
  }
  onSubmitHandler(event) {
    event.preventDefault();
    console.log(event)
    this.errors.classList.add('hidden');
    this.success.classList.add('hidden');
    this.zip.classList.remove('invalid');
    this.country.classList.remove('invalid');
    this.province.classList.remove('invalid');
    this.button.classList.add('loading');
    this.button.setAttribute('disabled', true);

    const body = JSON.stringify({
      shipping_address: {
        zip: this.zip.value,
        country: this.country.value,
        province: this.province.value
      }
    });
    let sectionUrl = `${window.routes.cart_url}/shipping_rates.json`;
    sectionUrl = sectionUrl.replace('//', '/');

    fetch(sectionUrl, { ...fetchConfig('javascript'), body })
      .then((response) => response.json())
      .then((result) => {
        if (result.shipping_rates) {
          if(result.shipping_rates.length > 0){
               this.success.classList.remove('hidden');
              this.success.innerHTML = '';
              result.shipping_rates.forEach((rate) => {
                const child = document.createElement('p');
                child.innerHTML = `${rate.name}: ${rate.price} ${Shopify.currency.active}`;
                this.success.appendChild(child);
          });
          }else{
               this.errors.classList.remove('hidden');
               this.errors.innerHTML = '';
              this.errors.textContent = 'Cart shippings rates not available';
          }
       
        }
        else {
          let errors = [];
          Object.entries(result).forEach(([attribute, messages]) => {
            errors.push(`${attribute.charAt(0).toUpperCase() + attribute.slice(1)} ${messages[0]}`);
          });

          this.errors.classList.remove('hidden');
          this.errors.querySelector('.errors').innerHTML = errors.join('; ');
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.button.classList.remove('loading');
        this.button.removeAttribute('disabled');
      });
  }
}

customElements.define('cart-shipping-content', ShippingCalculator);



