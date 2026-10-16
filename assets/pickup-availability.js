if (!customElements.get("availability-content")) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();
      if (!this.hasAttribute("available")) return;
      this.fetchAvailability(this.dataset.variantId);
     this.focusElement = null;
      // Escape key handler
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.closeDrawer();
    }

    fetchAvailability(variantId) {
      const variantSectionUrl = `${this.dataset.rootUrl}variants/${variantId}/?section_id=pickup-availability`;
      fetch(variantSectionUrl)
        .then((response) => response.text())
        .then((text) => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, "text/html")
            .querySelector(".shopify-section");
          this.renderPreview(sectionInnerHTML);
        });
    }

    renderPreview(sectionInnerHTML) {
      if (!sectionInnerHTML.querySelector("availability-content")) {
        this.removeAttribute("available");
        this.innerHTML = "";
        return;
      }

      this.innerHTML = sectionInnerHTML.innerHTML;
      this.setAttribute("available", "");

      // Drawer now exists in DOM — set reference
      this.drawer = this.querySelector("availability-drawer");

      // Add click handler for drawer open
      const drawerTrigger = this.querySelector("[data-drawer-main-head]");
      if (drawerTrigger) {
        drawerTrigger.addEventListener("click", this.openDrawer.bind(this));
      }

      // Set up close buttons
      this.closeDrawer();
    }

    openDrawer(event) {
      event.preventDefault();
      const drawer = this.drawer;
      if (!drawer) return;
      drawer.classList.add("is-visible");
      document.querySelector("body").classList.add("overflow-hidden")

   setTimeout(() => {
        this.focusElement = event.target;
        if (drawer && typeof trapFocusElements === "function") {
          trapFocusElements(drawer);
        }
      }, 300);      
    }

    closeDrawer() {
      const drawer = this.drawer;
      if (drawer) {
        const closeElements = drawer.querySelectorAll('[data-drawer-close]');
        closeElements.forEach((el) => {
          el.addEventListener("click", (event) => {
            event.preventDefault();
            this._closeDrawer(drawer);
          if (this.focusElement) {
            this.focusElement.focus();
          }
            this.focusElement = null;
          });
        });
      }
    }

    _closeDrawer(drawer) {
      drawer.classList.remove("is-visible");
       document.querySelector("body").classList.remove("overflow-hidden")
    }

    handleKeyDown(event) {
      if (event.key === 'Escape' && this.drawer?.classList.contains("is-visible")) {
        this._closeDrawer(this.drawer);
      }
    }
  }
  customElements.define("availability-content", PickupAvailability);
}
