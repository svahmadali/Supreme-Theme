const selectors = {
    customerAddresses: 'body',
    addressCountrySelect: '[data-address-country-selector]',
    addressContainer: '[data-form-address]',
    toggleAddressButton: 'button[aria-expanded]',
    deleteAddressButton: 'button[data-confirm-message]'
  };
  
  const attributes = {
    expanded: 'aria-expanded',
    confirmMessage: 'data-confirm-message'
  };
  
  class CustomerAddresses {
    constructor() {
      this.elements = this._getElements();
      if (Object.keys(this.elements).length === 0) return;
      this._setupCountries();
      this._setupEventListeners();
    }
  
    _getElements() {
      const container = document.querySelector(selectors.customerAddresses);
      return container ? {
        container,
        addressContainer: container.querySelectorAll(selectors.addressContainer),
        toggleButtons: document.querySelectorAll(selectors.toggleAddressButton),
        deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
        countrySelects: container.querySelectorAll(selectors.addressCountrySelect)
      } : {};
    }
  
    _setupCountries() {

      if (Shopify && Shopify.CountryProvinceSelector) {
        new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
          hideElement: 'AddressProvinceContainerNew'
        });
        this.elements.countrySelects.forEach((select) => {
          const formId = select.dataset.formId;   
          console.log(formId)
          new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
            hideElement: `AddressProvinceContainer_${formId}`
          });
        });
      }
    }
  
    _setupEventListeners() {
      this.elements.toggleButtons.forEach((element) => {
        element.addEventListener('click', this._handleAddEditButtonClick);
      });
      this.elements.deleteButtons.forEach((element) => {
        element.addEventListener('click', this._handleDeleteButtonClick);
      });
    }
  
    _toggleExpanded(target) {
      this.elements = this._getElements();
      console.log(  this.elements  )
      this._setupCountries();
      this._setupEventListeners();
    }
  
    _handleAddEditButtonClick = ({ currentTarget }) => {
      this._toggleExpanded(currentTarget);
    }
    _handleDeleteButtonClick = ({ currentTarget }) => {
      // eslint-disable-next-line no-alert
         console.log(currentTarget);
      if (confirm(currentTarget.getAttribute(attributes.confirmMessage))) {
        Shopify.postLink(currentTarget.dataset.target, {
          parameters: { _method: 'delete' },
        });
      }
    }
  }

class AddressHead extends HTMLElement {
  constructor(){
       super();
       this.querySelector("[data-sidedrawer-button]").addEventListener("click",this.openDrawer.bind(this));
    }
    openDrawer(event){
      event.preventDefault();
      let drawerMainId = this.querySelector("[data-sidedrawer-button]").getAttribute("href");
      if(document.querySelector(drawerMainId)){
        document.querySelector(drawerMainId).classList.add("is-visible");
        document.querySelector("body").classList.add("overflow-hidden");
        trapFocusElements(document.querySelector(drawerMainId));
      }
      this.closeDrawer(drawerMainId)
    }
   closeDrawer(drawerMainId){
       const drawer =document.querySelector(drawerMainId);
      if(drawer){
        const closeElements  = drawer.querySelectorAll('[data-drawer-close]');
        Array.from(closeElements).forEach(function(closeElement){
          closeElement.addEventListener("click",function(event){
             event.preventDefault();
             drawer.classList.remove("is-visible");
             document.querySelector("body").classList.remove("overflow-hidden");
            removeTrapFocus();
             this.focus();
          }.bind(this))
        }.bind(this))  
        
       document.addEventListener('keydown', function(event){
        if (event.key === 'Escape') {
             drawer.classList.remove("is-visible");
             document.querySelector("body").classList.remove("overflow-hidden");
            removeTrapFocus();
             this.focus();
        }
       }.bind(this));
      }
  }
}
  customElements.define("address-head", AddressHead);


  