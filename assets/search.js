class searchDrawerTrigger extends HTMLElement {
constructor() {
    super();
    this.searchDrawer = document.querySelector('#search-drawer-model');

    if (!this.searchDrawer) return;
     this.focusElement = null;
    this.addEventListener("click", this.openDrawer.bind(this));
    this.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.openDrawer(event);
      }
    });
  }

  openDrawer(event) {
    this.searchDrawer.classList.add("is-visible");
    document.body.classList.add("overflow-hidden");

    // Wait for the drawer to actually render and be focusable
    const tryFocus = () => {
      const input = this.searchDrawer.querySelector('input[type="search"], input[type="text"]');
      if (input) {
        input.focus();
        // Optional: select the input content
        input.select?.();
      } else {
        // Retry after a bit, if input isn't ready yet
        setTimeout(tryFocus, 50);
      }
    };

    // Try to focus after rendering
    requestAnimationFrame(() => {
      setTimeout(tryFocus, 100); // Adjust if you have transition delays
    });

    // Optional: trap focus for accessibility
    //trapFocusElements?.(this.searchDrawer);
    setTimeout(() => {
        this.focusElement = event.target;
        if (this.searchDrawer && typeof trapFocusElements === "function") {
          trapFocusElements(this.searchDrawer);
        }
      }, 300);
  }

}

customElements.define("search-drawer", searchDrawerTrigger);

class searchModalDialog extends HTMLElement{
      constructor() {
        super();
        this.closeBtns = this.querySelectorAll('[data-drawer-close]');
        this.suggestionsContent = this.querySelector('[data-suggestion-content]');
        this.resultsContainer = this.querySelector('[data-predictive-search-body]');
        this.loadingContainer = this.querySelector('[data-loading-content]');
        this.clear = this.querySelector('[data-clear-input]');
        if(this.closeBtn){
          this.closeBtn.addEventListener("click",this.closeDrawer.bind(this))
        }
        Array.from(this.closeBtns).forEach(function(closeBtn){
          closeBtn.addEventListener("click",function(event){
            event.preventDefault();
            this.closeDrawer();
          }.bind(this))
        }.bind(this))
        this.input = this.querySelector('input[type="search"]');

        if (this.input) {
          this.input.addEventListener(
            'input',
            this.debounce((event) => {
              this.onChange(event);
            }, 300).bind(this)
          );
          if (this.clear) {
          this.clear.addEventListener(
            'click',function(){
             this.input.value = ''; 
              this.input.dispatchEvent(new Event("input", { bubbles: true }));
               // Wait for the drawer to actually render and be focusable
              const tryFocus = () => {
                const input = this.input;
                if (input) {
                  input.focus();
                  // Optional: select the input content
                  input.select?.();
                } else {
                  // Retry after a bit, if input isn't ready yet
                  setTimeout(tryFocus, 50);
                }
              };
          
              // Try to focus after rendering
              requestAnimationFrame(() => {
                setTimeout(tryFocus, 100); // Adjust if you have transition delays
              });
            }.bind(this));
        }
        }
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
      }
    
      closeDrawer(){
        this.classList.remove("is-visible");
        document.querySelector("body").classList.remove("overflow-hidden");
        const searchItem = document.querySelector("search-drawer")
        if(searchItem){
           searchItem.focus()
        }
        removeTrapFocus();
      }
  
       handleKeyDown(event) {
        if (event.key === 'Escape') {
          this.closeDrawer(event); // Call closeDrawer when Escape is pressed
        }
      }
    
      debounce(fn, delay) {
        var timer = null;
        return function () {
          var context = this,
            args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fn.apply(context, args);
          }, delay);
        };
      }

      
      onChange() { 
     this.searchTerm = this.input.value.trim();
    if (this.searchTerm == '') {
       if (this.resultsContainer) {
              this.resultsContainer.classList.add('hidden');
             this.resultsContainer.innerHtml = '';
            }
            if (this.loadingContainer) {
              this.loadingContainer.classList.add('hidden');
            }
     if(this.suggestionsContent){
       this.suggestionsContent.classList.remove('hidden');
    }
      
    } else {
     if(this.suggestionsContent){
     this.suggestionsContent.classList.add('hidden');
    }
    if(this.loadingContainer){
      this.loadingContainer.classList.remove('hidden');
    }
      this.getSearchResults();
    }
  }

    
      getSearchResults() {
        const queryKey = this.searchTerm.replace(' ', '-').toLowerCase();
        fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(this.searchTerm)}&section_id=predictive-search`)
          .then((response) => {
            if (!response.ok) {
              console.log('error');
            }
            return response.text();
          })
          .then((text) => {
            
            const resultsMarkup = new DOMParser()
              .parseFromString(text, 'text/html').querySelector('[data-result-wrapper]').innerHTML;
            this.resultsContainer.innerHTML = resultsMarkup;
            if (this.resultsContainer) {
              this.resultsContainer.classList.remove('hidden');
            }
            if (this.loadingContainer) {
              this.loadingContainer.classList.add('hidden');
            }
          })
          .catch((error) => {
            if (error?.code === 20) {
              return;
            }
            throw error;
          });
      }

     
    }
customElements.define("search-modal-dialog", searchModalDialog );

class predictiveSearchTab extends HTMLElement{
  constructor() {
    super();
    this.searchDrawerModel = this.closest('#search-drawer-model');
    if(!this.searchDrawerModel) return ;
    this.activeTab = this.searchDrawerModel.querySelector('.predictive-search-tab.is-active');
    this.activeTabContent = this.searchDrawerModel.querySelector('.predictive-search-tab-item.active');
    this.tabs = this.querySelectorAll('.predictive-search-tab');
    Array.from(this.tabs).forEach(function(tab){
      if(tab.classList.contains('is-active')) return false;
      tab.addEventListener("click",function(event){
        event.preventDefault();
        this.tabContent = this.searchDrawerModel.querySelector(tab.dataset.tab);
        if(this.tabContent){
          this.closeExisting();
          tab.classList.add('is-active');
          this.tabContent.classList.add('is-active');
          this.tabContent.style.display = 'block';
          this.activeTab = tab;
          this.activeTabContent = this.tabContent;
        }
      }.bind(this))
    }.bind(this))
    if(this.tabs.length > 0){
      this.tabs[0].click();
    }
  }
  closeExisting(){
    if(this.activeTab){
      this.activeTab.classList.remove('is-active')
    }
    if(this.activeTabContent){
      this.activeTabContent.classList.remove('is-active');
      this.activeTabContent.style.display = 'none';
    }
  }
}

customElements.define("predictive-search-tab", predictiveSearchTab);

