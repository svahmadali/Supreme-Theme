
class PriceRangeSlider extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    let rangeslider = this.querySelector('.range-slider'),
      amounts = this.querySelector('.facets-price-ranges'),
      args = {
        start: [parseFloat(rangeslider.dataset.minValue), parseFloat(rangeslider.dataset.maxValue)],
        connect: true,
        step: 1,
        range: {
          'min': parseFloat(rangeslider.dataset.min),
          'max': parseFloat(rangeslider.dataset.max)
        }
      },
      
      event = new CustomEvent('input'),
      form = this.closest('factes-filter') || document.querySelector('factes-filter');
      if (rangeslider.classList.contains('noUi-target')) {
        rangeslider.noUiSlider.destroy();
      }
      noUiSlider.create(rangeslider, args);

    rangeslider.noUiSlider.on('update', function (values) {
      amounts.querySelector('.field__input_min').value = values[0];
      amounts.querySelector('.field__input_max').value = values[1];
    });
    rangeslider.noUiSlider.on('change', function (values) {
      form.querySelector('form').dispatchEvent(event);
    });
  }
}
customElements.define('price-range-bar', PriceRangeSlider);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const form = this.querySelector("factes-filter") || document.querySelector('factes-filter');
      console.log(form)
      form.onActiveFilterClick(event);
    });
  }
}
customElements.define('facet-remove', FacetRemove);

class SidebarSort extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const dropdownBtn = this.querySelector('#facets-dropdown');
      const collectionList = this.querySelector('#collection-facets-list');

      if (!dropdownBtn || !collectionList) return;
        dropdownBtn.addEventListener('click', (event) => {
          event.preventDefault();
          collectionList.classList.toggle('is-active');
        });

      document.addEventListener('click', (event) => {
        if (!this.contains(event.target)) {
          collectionList.classList.remove('is-active');
        }
      });
    }
  }

  // Register the custom element
customElements.define('sidebar-sort', SidebarSort);

class FacetFilterForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
    this.onSubmitHandler(event); 
    }, 500);
    
    if (window.innerWidth < 768 ) {
      if( this.querySelector('form').getAttribute("id") == 'filter-facets-form' ||  this.querySelector('form').getAttribute("id") == 'filter-facets-sort-form'){
         this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
      }
    }else{
      
       this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
  
    }
   
  }


  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFilterForm.searchParamsInitial;
      if (searchParams === FacetFilterForm.searchParamsPrev) return;
      FacetFilterForm.renderPage(searchParams, null, false);
    }
    window.addEventListener('popstate', onHistoryChange);
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFilterForm.searchParamsPrev = searchParams;
    const sections = FacetFilterForm.getSections();
    if( document.getElementById('result-products-container').querySelector('.product-card-list')){
      document.getElementById('result-products-container').querySelector('.product-card-list').classList.add('loading');
    }
   
    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const facetDataUrl = element => element.url === url;
        FacetFilterForm.filterData.some(facetDataUrl) ?
        FacetFilterForm.renderSectionFromCache(facetDataUrl, event) :
        FacetFilterForm.renderSectionFromFetch(url, event);
    });
    if (updateURLHash) FacetFilterForm.updateURLHash(searchParams);
    document.dispatchEvent(new CustomEvent('collection:reloaded'));
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFilterForm.filterData = [...FacetFilterForm.filterData, { html, url }];
        FacetFilterForm.renderFilters(html, event);
        FacetFilterForm.renderProductGridContainer(html);
        FacetFilterForm.renderProductCount(html);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static renderSectionFromCache(facetDataUrl, event) {
    const html = FacetFilterForm.filterData.find(facetDataUrl).html;
    FacetFilterForm.renderFilters(html, event);
    FacetFilterForm.renderProductGridContainer(html);
   FacetFilterForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById('result-products-container').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('result-products-container').innerHTML;
   updateContent();
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('facet-product-count').innerHTML
    const container = document.getElementById('facet-product-count');
    if (container) {
      container.innerHTML = count;
    }
  
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElements = parsedHTML.querySelectorAll('#facets-content-filter .js-filter');
    const matchesIndex = (element) => { 
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);
    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
     
    });
    if(parsedHTML.querySelector("[data-facet-sort]")){
      const getSortValue = parsedHTML.querySelector("input[name='sort_by']:checked");
      const value = getSortValue ? getSortValue.getAttribute("data-name") : null;
       document.querySelector('[data-facet-sort]').innerHTML = `<strong>${value}</strong>`;
    }

    FacetFilterForm.renderActiveFacets(parsedHTML);
    filtertabUpdate();
    
  }

  static renderActiveFacets(html) {
      const activeFacetElementSelectors = ['.active-facet'];
      activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })
  }

  static updateURLHash(searchParams) {
    history.pushState({ }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('result-products-container').dataset.id,
      }
    ]
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData);
  }

  mergeSearchParams(form, searchParams) {
    const params = this.createSearchParams(form);
    params.forEach((value, key) => {
      searchParams.append(key, value);
    });
    return searchParams;
  }

  onSubmitForm(searchParams, event) {
    FacetFilterForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const currentForm = event.target.closest('form');
    let searchParams = new URLSearchParams();
    const sortFilterForms = document.querySelectorAll('factes-filter form');
      sortFilterForms.forEach((form) => {
      if(form.id === 'filter-facets-form' || form.id === 'filter-facets-sort-form' ) {
        searchParams = this.mergeSearchParams(form, searchParams);
      }
    });
      
    this.onSubmitForm(searchParams.toString(), event);
    
  }

  onActiveFilterClick(event) {
    event.preventDefault();
     FacetFilterForm.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }
}
FacetFilterForm.filterData = [];
FacetFilterForm.searchParamsInitial = window.location.search.slice(1);
FacetFilterForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('factes-filter', FacetFilterForm);
FacetFilterForm.setListeners();


function updateContent() {
  const saved = localStorage.getItem('selectedViewOption');
    if (!saved) return;

    const savedClasses = saved.split(' ').filter(Boolean);
    const matchingOption = document.querySelector(`.facets-views-option[data-option="${saved}"]`);
    const gridContainer = document.getElementById('product-card-container');

    if (matchingOption && gridContainer) {
      // Remove previously known classes
      const knownClasses = Array.from(document.querySelectorAll('.facets-views-option'))
        .flatMap(opt => (opt.dataset.option || '').split(' '))
        .filter(Boolean);
      gridContainer.classList.remove(...knownClasses);

      // Apply saved classes
      gridContainer.classList.add(...savedClasses);


    }
}

class FacetsContentView extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('click', this.onOptionClick.bind(this));
    this.restoreSelection();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onOptionClick.bind(this));
  }

  onOptionClick(event) {
    const clicked = event.target.closest('.facets-views-option');
    if (!clicked) return;

    event.preventDefault();
    const newClasses = clicked.dataset.option?.split(' ').filter(Boolean);
    const gridContainer = document.getElementById('product-card-container');

    if (!newClasses || newClasses.length === 0 || !gridContainer) return;

    // Save selected option to localStorage (joined by space)
    localStorage.setItem('selectedViewOption', newClasses.join(' '));

    // Remove all classes from previous selections (optional: define how to detect these)
    const knownClasses = Array.from(this.querySelectorAll('.facets-views-option'))
      .flatMap(opt => (opt.dataset.option || '').split(' '))
      .filter(Boolean);
    gridContainer.classList.remove(...knownClasses);

    // Apply new classes
    gridContainer.classList.add(...newClasses);

    // Update active state
    this.querySelectorAll('.facets-views-option').forEach(option =>
      option.classList.remove('is-active')
    );
    clicked.classList.add('is-active');

  }

  restoreSelection() {
    const saved = localStorage.getItem('selectedViewOption');
    if (!saved) return;

    const savedClasses = saved.split(' ').filter(Boolean);
    const matchingOption = this.querySelector(`.facets-views-option[data-option="${saved}"]`);
    const gridContainer = document.getElementById('product-card-container');

    if (matchingOption && gridContainer) {
      // Remove previously known classes
      const knownClasses = Array.from(this.querySelectorAll('.facets-views-option'))
        .flatMap(opt => (opt.dataset.option || '').split(' '))
        .filter(Boolean);
      gridContainer.classList.remove(...knownClasses);

      // Apply saved classes
      gridContainer.classList.add(...savedClasses);

      // Mark active option
      this.querySelectorAll('.facets-views-option').forEach(option =>
        option.classList.remove('is-active')
      );
      matchingOption.classList.add('is-active');

    }
  }
}

customElements.define('facets-content-view', FacetsContentView);



class FacetsDrawer extends HTMLElement {
  constructor() {
    super();

    this.focusElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.openDrawer = this.openDrawer.bind(this);
    this.hasScrolledPastForm = false;

    // Open drawer button
    const openBtn = this.querySelector("[data-facet-drawer-head]");
    if (openBtn) {
      openBtn.addEventListener("click", this.openDrawer);
      openBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.openDrawer(e);
        }
      });

      if (!['BUTTON','A'].includes(openBtn.tagName)) {
        openBtn.setAttribute("tabindex", "0");
        openBtn.setAttribute("role", "button");
      }
    }

    // Global Escape key handler
    document.addEventListener("keydown", this.handleKeyDown);
  }

  connectedCallback() {
    this.footerElement = document.querySelector("footer");
    this.formElement = document.querySelector("facets-drawer"); // your drawer container
    this.observeElements();
    this.attachCloseEvents(); // attach close buttons
  }

  openDrawer(event) {
    event?.preventDefault();
    const drawer = document.querySelector("#facets-content-filter");
    if (!drawer) return;

    drawer.classList.add("is-visible");
    document.body.classList.add("overflow-hidden");

    setTimeout(() => {
      this.focusElement = event.target;
      if (drawer && typeof trapFocusElements === "function") {
        trapFocusElements(drawer);
      }
    }, 300);
  }

  closeDrawer() {
    const drawer = document.querySelector("#facets-content-filter");
    if (!drawer) return;

    drawer.classList.remove("is-visible");
    document.body.classList.remove("overflow-hidden");

    if (this.focusElement) {
      this.focusElement.focus();
      this.focusElement = null;
    }
  }

  attachCloseEvents() {
    const drawer = document.querySelector("#facets-content-filter");
    if (!drawer) return;

    const closeElements = drawer.querySelectorAll("[data-close-drawer]");
    closeElements.forEach((el) => {
      // Click to close
      el.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeDrawer();
      });

      // Keyboard support (Enter / Space)
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.closeDrawer();
        }
      });

      // Make focusable if not button or link
      if (!['BUTTON', 'A'].includes(el.tagName)) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
      }
    });
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.closeDrawer();
    }
  }

  observeElements() {
    if (!this.formElement || !this.footerElement) return;

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return; // only for mobile

    this.hasScrolledPastForm = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.footerElement) {
            if (entry.intersectionRatio > 0) {
              this.formElement.classList.add("is-show");
            } else if (entry.intersectionRatio === 0) {
              this.formElement.classList.remove("is-show");
            }
          }

          if (entry.target === this.formElement) {
            const formRect = this.formElement.getBoundingClientRect();
            const scrolledPast =
              entry.intersectionRatio === 0 &&
              window.scrollY > formRect.top + formRect.height;

            if (scrolledPast) {
              this.hasScrolledPastForm = true;
              this.formElement.classList.add("is-show");
            } else if (entry.intersectionRatio === 1) {
              this.hasScrolledPastForm = false;
              this.formElement.classList.remove("is-show");
            }
          }
        });
      },
      { threshold: [0, 1] }
    );

    observer.observe(this.formElement);
    observer.observe(this.footerElement);
  }
}

// Register custom element
customElements.define("facets-drawer", FacetsDrawer);

