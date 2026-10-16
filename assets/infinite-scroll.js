class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.onClickHandler = this.onClickHandler.bind(this);
    this.handleIntersection = this.handleIntersection.bind(this);

  }
  connectedCallback() {
    // Check if the mode is click or load
    const mode = this.getAttribute('mode') || 'on-click'; 

    if (mode === 'on-click') {
      
      this.addEventListener('click', this.onClickHandler);
      this.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.onClickHandler();
        }
      });
    } else if (mode === 'on-load') {
      
      this.observer = new IntersectionObserver(this.handleIntersection, {
        root: null,
        threshold: 1.0,
      });
      this.observer.observe(this);
    }
  }

  disconnectedCallback() {
    const mode = this.getAttribute('mode') || 'on-click';

    if (mode === 'on-click') {
    
      this.removeEventListener('click', this.onClickHandler);
    } else if (mode === 'on-load') {
      
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }
onClickHandler() {
  if (this.classList.contains('loading') || this.classList.contains('disabled')) {
    return; // Prevent multiple triggers
  }

  this.classList.add('loading', 'disabled');

  const url = this.dataset.url;
  if (url) {
    InfiniteScroll.renderSectionFetch(url).finally(() => {
      this.classList.remove('loading', 'disabled');
    });
  }
}
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.classList.contains('loading')) {
        this.onClickHandler();
      }
    });
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-card-container').dataset.id,
      }
    ];
  }

static renderSectionFetch(url) {
  return fetch(url) // ← return the fetch Promise
    .then(response => response.text())
    .then(responseText => {
      InfiniteScroll.renderPagination(responseText);
      InfiniteScroll.renderProductGridContainer(responseText);
    })
    .catch(e => {
      console.error(e);
    });
}

  static renderPagination(html) {
    const container = document.getElementById('result-products-container').querySelector('.pagination-wrapper');
    const pagination = new DOMParser().parseFromString(html, 'text/html').getElementById('result-products-container').querySelector('.pagination-wrapper');
    if (pagination) {
      container.innerHTML = pagination.innerHTML;
    } else {
      container.remove();
    }
  }

  static renderProductGridContainer(html) {
    const productsContainer = document.getElementById('product-card-container');
    const products = new DOMParser().parseFromString(html, 'text/html').getElementById('product-card-container');
    productsContainer.insertAdjacentHTML('beforeend', products.innerHTML);
  }
}

customElements.define('infinite-scroll', InfiniteScroll);


