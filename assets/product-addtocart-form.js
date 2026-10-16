if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.submitButton = this.querySelector('[type="submit"]');
      this.cart = document.querySelector('cart-drawer');
      this.hideErrors = this.dataset.hideErrors === 'true';
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('disabled') === 'true') return;
      this.handleErrorMessage();
      this.submitButton.setAttribute('disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading--spinner')?.classList.remove('hidden');
      this.submitButton.querySelector('[data-add-to-cart-text]').classList.add('hidden');
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
      
      }
      config.body = formData;
      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {source: 'product-form', productVariantId: formData.get('id'), errors: response.description, message: response.message});
            this.handleErrorMessage(response.description);
            this.submitButton.setAttribute('disabled', true);
            this.error = true;
             const drawerSelector = document.querySelector("#quickView-drawer");
             setTimeout(() => {
              //focusElement = event.target;
              trapFocusElements(drawerSelector);
          }, 500);
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }
          if (!this.error) publish(PUB_SUB_EVENTS.cartUpdate, {source: 'product-form', productVariantId: formData.get('id')});
          this.error = false;
          if(this.cart){
            if(document.querySelector(".product-sticky-bar")){
              document.querySelector(".product-sticky-bar").classList.remove("is-visible")
            }
            this.cart.renderContents(response);
            this.cart.classList.add("is-visible");
            focusElement = this.submitButton;
            document.querySelector("body").classList.add("overflow-hidden");
          
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          this.submitButton.querySelector('[data-add-to-cart-text]').classList.remove('hidden');
          if (this.cart && this.cart.classList.contains('is-empty'))
          this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('disabled');
          this.querySelector('.loading--spinner')?.classList.add('hidden');
       
        });
    }

    handleErrorMessage(errorMessage = false) {
     if (this.hideErrors) return;
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form--error-message-wrapper') || this.closest("product-card").querySelector('.product-form--error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form--error-message') || this.closest("product-card").querySelector('.product-form--error-message-wrapper');
      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}