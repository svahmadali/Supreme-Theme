class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.bindEvents();
    document.addEventListener('keydown', this.handleEscapeKeyPress.bind(this));
  }

  bindEvents() {
    const drawerBtn = document.querySelector("[data-cart-drawer]");
    if (drawerBtn) {
      drawerBtn.addEventListener('click', this.openCartDrawer.bind(this));
    }
    this.querySelectorAll('[data-close-drawer]').forEach((button) =>
      button.addEventListener('click', this.closeDrawer.bind(this))
    );
    this.setupDialogEvents();
    
  }

  setupDialogEvents() {
    let lastFocusedElement = '';
    Array.from(this.querySelectorAll('.modal-dialog-button')).forEach((openBtn) => {
      openBtn.addEventListener('click', (e) => {
        const modalId = openBtn.dataset.modal;
        const dialog = this.querySelector(`cart-dialog#${modalId}`);
        if (dialog) {
          setTimeout(() => {
            dialog.classList.add('is-visible');
            setTimeout(() => {
              lastFocusedElement = openBtn;
              trapFocusElements(dialog);
            }, 600);
          }, 500);
        }
      });
    });
    Array.from(this.querySelectorAll('[data-dialog-close]')).forEach((closeBtn) => {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = closeBtn.closest('cart-dialog');
        dialog.classList.remove('is-visible');
        trapFocusElements(document.querySelector("cart-drawer"));
        setTimeout(() => {
          if (lastFocusedElement) {
            lastFocusedElement.focus();
          }
          lastFocusedElement = '';
        }, 400);
      });
    });
  }

  openCartDrawer(event) {
    event.preventDefault();
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(html => {
        this.innerHTML = this.getSectionHTML(html, 'cart-drawer');
        
        this.classList.add("is-visible");
        document.querySelector("body").classList.add("overflow-hidden");
        this.querySelectorAll('[data-drawer-close]').forEach((button) =>
          button.addEventListener('click', this.closeDrawer.bind(this))
        );
        setTimeout(() => {
        focusElement = event.target;
          trapFocusElements(document.querySelector("cart-drawer"));
        }, 500);

        const totalPrice =  document.querySelector("#cart-drawer-body-content").getAttribute("data-cart-price");
            freeShippingBarProgress(totalPrice);
        console.log(totalPrice,"totaPricetotaPricetotaPrice")
        this.setupDialogEvents();
       
     
      })
      .catch(e => console.error(e));
  }

  renderContents(parsedState) {
    this.getSectionsToRender().forEach((section => {
    
      if (document.getElementById(section.id)) {
        const sectionHTML = this.getSectionHTML(parsedState.sections[section.id], section.selector);
        document.querySelector(section.selector).innerHTML = sectionHTML;

        const totalCount = new DOMParser().parseFromString(parsedState.sections[section.id], 'text/html').querySelector("#cart-drawer-body-content").getAttribute("data-cart-count");
        const priceElement = document.querySelector("[data-cart-price]");
         if (priceElement) {
          const totalPrice = parseInt(priceElement.dataset.cartPrice);
             freeShippingBarProgress(totalPrice);
        }
        const itemCountElement = document.querySelector("[data-item-count]");
        console.log(itemCountElement)
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
          trapFocusElements(document.querySelector("cart-drawer"));
        

        this.setupDialogEvents();
        this.querySelectorAll('[data-drawer-close]').forEach((button) =>
          button.addEventListener('click', this.closeDrawer.bind(this))
        );

      }
    }));
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        section: 'cart-drawer',
        selector: 'cart-drawer'
      }
    ];
  }

  getSectionHTML(html, selector = 'cart-drawer') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector("cart-drawer").innerHTML;
  }

  closeDrawer(event) {
    event.preventDefault();
    if (this.classList.contains("is-visible")) {
      this.classList.remove("is-visible");
      document.querySelector("body").classList.remove("overflow-hidden");
    }
    if (focusElement) {
      focusElement.focus();
    }
    focusElement = '';
    removeTrapFocus();
  }

  handleEscapeKeyPress(event) {
    if (event.key === 'Escape') {
      this.closeDrawer(event);
    }
  }
}

customElements.define('cart-drawer', CartDrawer);
