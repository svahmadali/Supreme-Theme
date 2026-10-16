Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

function getFocusableElements(wrapper) {
  if (!wrapper) return [];

  const focusableSelectors = `
    a[href],
    area[href],
    input:not([disabled]),
    select:not([disabled]),
    textarea:not([disabled]),
    button:not([disabled]),
    iframe,
    [tabindex]:not([tabindex="-1"]),
    [contenteditable]
  `;

  const allElements = Array.from(wrapper.querySelectorAll(focusableSelectors));

  // filter only visible elements
  const visibleElements = allElements.filter(el => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      el.offsetParent !== null // ensures element is in the layout
    );
  });

  return visibleElements;
}

const trapFocusHandlers = {};
var focusElement = "";


function trapFocusElements(wrapper) {
  removeTrapFocus(); // optional, removes previous trap

  const elements = getFocusableElements(wrapper);
  if (!elements.length) return;

  const first = elements[0];
  const last = elements[elements.length - 1];
 

  first.focus();

  trapFocusHandlers.keydown = (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  document.addEventListener("keydown", trapFocusHandlers.keydown);
}


function removeTrapFocus() {
  document.removeEventListener("keydown", trapFocusHandlers.keydown);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
    this.settings = null;
  }

  connectedCallback() {
    this.initSlider();
  }

  initSlider() {
    if (this.slider) {
      this.slider.destroy(true, true);
    }

    try {
      this.settings = JSON.parse(this.dataset.settings || '{}');

      const mergedSettings = {
        ...this.settings,
        on: {
          init: () => {
            this.disableTabindexInClones();
            this.handleArrowKeyControl();
          },
          slideChange: () => {
            this.disableTabindexInClones();
          }
        }
      };

      this.slider = new Swiper(this, mergedSettings);
    } catch (error) {
      console.error('Invalid Swiper settings:', this.dataset.settings, error);
    }
  }

  disableTabindexInClones() {
    const clonedSlides = this.querySelectorAll('.swiper-slide-duplicate');

    clonedSlides.forEach((slide) => {
      const focusables = slide.querySelectorAll('[tabindex], button, a, input, select, textarea');
      focusables.forEach((el) => el.setAttribute('tabindex', '-1'));
    });
  }

  handleArrowKeyControl() {
   const section = this.closest('.shopify-section');

  let next = this.querySelector('.swiper-button-next')
          || (section ? section.querySelector('.swiper-button-next') : null)
          || (this.settings?.navigation?.nextEl
                ? document.querySelector(this.settings.navigation.nextEl)
                : null);

  let prev = this.querySelector('.swiper-button-prev')
          || (section ? section.querySelector('.swiper-button-prev') : null)
          || (this.settings?.navigation?.prevEl
                ? document.querySelector(this.settings.navigation.prevEl)
                : null);
    [next, prev].forEach((btn, index) => {
      if (!btn) return;

      btn.setAttribute('tabindex', '0');
      btn.setAttribute('role', 'button');

      btn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (index === 0 && this.slider) {
            this.slider.slideNext();
          } else if (index === 1 && this.slider) {
            this.slider.slidePrev();
          }
        }
      });
    });
  }

  selectSlide(index) {
    if (this.slider) {
      this.slider.slideToLoop(index);
    }
  }

  disconnectedCallback() {
    if (this.slider) {
      this.slider.destroy(true, true);
      this.slider = null;
    }
  }

  static get observedAttributes() {
    return ['data-settings'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-settings' && oldValue !== newValue) {
      this.initSlider();
    }
  }
}

customElements.define('slider-component', SliderComponent);





class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    this.video = null;
    this.isLoaded = false;

    if (this.classList.contains("autoplay-false")) {
      this.playButton = this.closest(".shopify-section")?.querySelector(".play-button");

      if (this.playButton) {
        this.playButton.addEventListener("click", () => {
          if (!this.isLoaded) {
            this.loadContent();
          } else {
            this.togglePlayPause();
          }
        });
      }
    } else {
      this.addObserver();
    }
  }

  addObserver() {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadContent();
            observer.unobserve(this);
          }
        });
      },
      { rootMargin: "0px 0px 1000px 0px" }
    );

    observer.observe(this);
  }

  loadContent() {
    const template = this.querySelector("template");
    if (!template) return;

    const content = template.content.firstElementChild.cloneNode(true);
    this.appendChild(content);

    this.video = this.querySelector("video");
    if (this.video) {
      this.video.play();
    } else {
      this.playButton?.classList.add("button-hide");
    }

    this.isLoaded = true;
  }

  togglePlayPause() {
    if (!this.video) return;
    if (this.video.paused) {
      this.video.play();
      this.playButton?.classList.add("playing");

    } else {
      this.video.pause();
      this.playButton?.classList.remove("playing");
    }
  }
}

customElements.define("deferred-media", DeferredMedia);



// class ComparisonSlide extends HTMLElement {
//   constructor() {
//     super();
//     this.cursor = this.querySelector("[data-compare-drag]");
//     if (!this.cursor) return; // If no cursor element is found, stop initialization

//     this.imageWrapper = this;
//     this.parentSection = this.closest(".shopify-section");

//     if (this.imageWrapper && this.parentSection) {
//       this.setupImageComparison();
//     }
//   }

//   connectedCallback() {
//     this.attachEventListeners();
//   }

//   disconnectedCallback() {
//     this.removeEventListeners();
//   }

//   setupImageComparison() {
//     this.isDragging = false;

//     // Touch and Mouse Events
//     this.startDrag = this.startDrag.bind(this);
//     this.endDrag = this.endDrag.bind(this);
//     this.moveSlider = this.moveSlider.bind(this);
//   }

//   attachEventListeners() {
//     // Mouse events
//     this.cursor.addEventListener("mousedown", this.startDrag);
//     this.parentSection.addEventListener("mouseup", this.endDrag);
//     this.parentSection.addEventListener("mouseleave", this.endDrag);
//     this.parentSection.addEventListener("mousemove", this.moveSlider);

//     // Touch events for mobile devices
//     this.cursor.addEventListener("touchstart", this.startDrag);
//     this.cursor.addEventListener("touchend", this.endDrag);
//     this.parentSection.addEventListener("touchmove", this.moveSliderForTouch.bind(this));
//   }

//   removeEventListeners() {
//     this.cursor.removeEventListener("mousedown", this.startDrag);
//     this.parentSection.removeEventListener("mouseup", this.endDrag);
//     this.parentSection.removeEventListener("mouseleave", this.endDrag);
//     this.parentSection.removeEventListener("mousemove", this.moveSlider);

//     this.cursor.removeEventListener("touchstart", this.startDrag);
//     this.cursor.removeEventListener("touchend", this.endDrag);
//     this.parentSection.removeEventListener("touchmove", this.moveSliderForTouch.bind(this));
//   }

//   startDrag() {
//     this.isDragging = true;
//   }

//   endDrag() {
//     this.isDragging = false;
//   }

//   moveSlider(event) {
//     if (!this.isDragging) return;
//     // Adjust event for touch devices
//     const pageX = event.pageX || event.touches[0].pageX;
//     const bounding = this.imageWrapper.getBoundingClientRect();
//     const x = pageX - bounding.left;

//     this.updateDragPosition(x);
//   }

//   moveSliderForTouch(event) {
//     this.moveSlider(event);
//   }

//   updateDragPosition(x) {
//     const imageWrapperWidth = this.imageWrapper.clientWidth;
//     const maxPosition = imageWrapperWidth - 30;  // Prevent sliding too far

//     // Calculate percentage based on position
//     const percentage = (Math.max(30, Math.min(x, maxPosition)) / imageWrapperWidth) * 100;

//     // Update CSS variable to control the slider
//     this.imageWrapper.style.setProperty("--percentage", `${percentage}%`);
//   }
// }

// customElements.define("comparison-slide", ComparisonSlide);
class ComparisonSlide extends HTMLElement {
  constructor() {
    super();
    this.cursor = this.querySelector("[data-compare-drag]");
    if (!this.cursor) return;

    this.imageWrapper = this;
    this.parentSection = this.closest(".shopify-section");

    if (this.imageWrapper && this.parentSection) {
      this.setupImageComparison();
    }
  }

  connectedCallback() {
    this.attachEventListeners();

    // Make cursor focusable for keyboard
    this.cursor.setAttribute("tabindex", "0");
    this.cursor.setAttribute("role", "slider");
    this.cursor.setAttribute("aria-valuemin", "0");
    this.cursor.setAttribute("aria-valuemax", "100");
    this.cursor.setAttribute("aria-valuenow", "50");
    this.cursor.setAttribute("aria-label", "Image comparison slider");
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  setupImageComparison() {
    this.isDragging = false;
    this.currentPercentage = 50;

    this.startDrag = this.startDrag.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.moveSlider = this.moveSlider.bind(this);
    this.keyMoveSlider = this.keyMoveSlider.bind(this);
  }

  attachEventListeners() {
    // Mouse
    this.cursor.addEventListener("mousedown", this.startDrag);
    this.parentSection.addEventListener("mouseup", this.endDrag);
    this.parentSection.addEventListener("mouseleave", this.endDrag);
    this.parentSection.addEventListener("mousemove", this.moveSlider);

    // Touch
    this.cursor.addEventListener("touchstart", this.startDrag);
    this.cursor.addEventListener("touchend", this.endDrag);
    this.parentSection.addEventListener("touchmove", this.moveSliderForTouch.bind(this));

    // Keyboard
    this.cursor.addEventListener("keydown", this.keyMoveSlider);
  }

  removeEventListeners() {
    this.cursor.removeEventListener("mousedown", this.startDrag);
    this.parentSection.removeEventListener("mouseup", this.endDrag);
    this.parentSection.removeEventListener("mouseleave", this.endDrag);
    this.parentSection.removeEventListener("mousemove", this.moveSlider);

    this.cursor.removeEventListener("touchstart", this.startDrag);
    this.cursor.removeEventListener("touchend", this.endDrag);
    this.parentSection.removeEventListener("touchmove", this.moveSliderForTouch.bind(this));

    this.cursor.removeEventListener("keydown", this.keyMoveSlider);
  }

  startDrag() {
    this.isDragging = true;
  }

  endDrag() {
    this.isDragging = false;
  }

  moveSlider(event) {
    if (!this.isDragging) return;
    const pageX = event.pageX || (event.touches && event.touches[0].pageX);
    const bounding = this.imageWrapper.getBoundingClientRect();
    const x = pageX - bounding.left;
    this.updateDragPosition(x);
  }

  moveSliderForTouch(event) {
    this.moveSlider(event);
  }

  keyMoveSlider(event) {
    const step = 5; // % per key press
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      if (event.key === "ArrowRight") {
        this.currentPercentage = Math.min(100, this.currentPercentage + step);
      } else if (event.key === "ArrowLeft") {
        this.currentPercentage = Math.max(0, this.currentPercentage - step);
      }
      this.updatePercentage(this.currentPercentage);
    }
  }

  updateDragPosition(x) {
    const imageWrapperWidth = this.imageWrapper.clientWidth;
    const maxPosition = imageWrapperWidth;
    const percentage = (Math.max(0, Math.min(x, maxPosition)) / imageWrapperWidth) * 100;
    this.updatePercentage(percentage);
  }

  updatePercentage(percentage) {
    this.imageWrapper.style.setProperty("--percentage", `${percentage}%`);
    this.cursor.setAttribute("aria-valuenow", Math.round(percentage));
    this.currentPercentage = percentage;
  }
}

customElements.define("comparison-slide", ComparisonSlide);


class CountdownCounterTimer extends HTMLElement {
  constructor() {
    super();

    // Initialize endTime from the attribute, or set to null
    const endTimeAttr = this.getAttribute("end-date");
    this.endTime = endTimeAttr ? new Date(endTimeAttr) : null;

    // Initialize the intervalId and state for countdown completion
    this.intervalId = null;
    this.isCountdownFinished = false;

    // Cache DOM elements
    this.card = this.querySelector('.countdown-counter--wrapper');
    this.daysEl = this.querySelector('.days');
    this.hoursEl = this.querySelector('.hour');
    this.minutesEl = this.querySelector('.minutes');
    this.secondsEl = this.querySelector('.seconds');
  }

  // Lifecycle method when the element is connected to the DOM
  connectedCallback() {
    if (!this.isValidEndTime()) {
      return;
    }

    if (this.hasCountdownExpired()) {
      this.setZero();
      this.hideCountdownCard();
      return;
    }

    this.startTimer();
  }

  // Lifecycle method when the element is removed from the DOM
  disconnectedCallback() {
    if (this.intervalId) {
      cancelAnimationFrame(this.intervalId);
    }
  }

  // Validate the 'end-time' attribute
  isValidEndTime() {
    return this.endTime instanceof Date && !isNaN(this.endTime.getTime());
  }

  // Check if the countdown time has already expired
  hasCountdownExpired() {
    return this.endTime <= new Date();
  }

  // Start the countdown timer loop
  startTimer() {
    const update = () => {
      this.updateTimer();
      if (!this.isCountdownFinished) {
        this.intervalId = requestAnimationFrame(update);
      }
    };
    update();
  }

  // Update the timer every second
  updateTimer() {
    const now = new Date();
    const timeLeft = this.endTime - now;

    if (timeLeft <= 0) {
      this.handleCountdownEnd();
      return;
    }

    const { days, hours, minutes, seconds } = this.calculateTimeLeft(timeLeft);
    this.updateCountdownDisplay(days, hours, minutes, seconds);
  }

  // Calculate the remaining time
  calculateTimeLeft(timeLeft) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  // Handle when the countdown finishes
  handleCountdownEnd() {
    this.setZero();
    this.hideCountdownCard();
    this.isCountdownFinished = true;
  }

  // Update the DOM with the countdown values
  updateCountdownDisplay(days, hours, minutes, seconds) {
    this.daysEl.textContent = days;
    this.hoursEl.textContent = String(hours).padStart(2, "0");
    this.minutesEl.textContent = String(minutes).padStart(2, "0");
    this.secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  // Set the countdown values to zero
  setZero() {
    this.daysEl.textContent = "00";
    this.hoursEl.textContent = "00";
    this.minutesEl.textContent = "00";
    this.secondsEl.textContent = "00";
  }

  // Hide the countdown card element
  hideCountdownCard() {
    if (this.card) {
      this.card.style.display = 'none';
    }
  }
}

customElements.define("countdown-counter-timer", CountdownCounterTimer);


class CustomTabs extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Ensure event listeners are added when the element is added to the DOM
    this.addEventListeners();
  }

  addEventListeners() {
    const tabs = this.querySelectorAll('[data-tab-head]');
    const contents = this.querySelectorAll('[data-tab-content]');

    const activateTab = index => {
      // Remove active class from all tabs and contents
      tabs.forEach(tab => tab.classList.remove('is-active'));
      contents.forEach(content => content.classList.remove('is-active'));

      // Add active class to the selected tab and its corresponding content
      tabs[index].classList.add('is-active');
      contents[index].classList.add('is-active');
    };

    // Add both hover and click events to each tab
    tabs.forEach((tab, index) => {
      tab.addEventListener('mouseover', () => activateTab(index));
      tab.addEventListener('click', () => activateTab(index));
    });
  }
}

// Define the custom element
customElements.define('custom-tabs', CustomTabs);


class CustomTabsClick extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListeners();
  }

  addEventListeners() {
    const tabs = this.querySelectorAll('[data-tab-head]');
    const contents = this.querySelectorAll('[data-tab-content]');
    const multicontent = this.querySelectorAll('[data-multi-content] [data-tab-content]');

    const activateTab = (index) => {
      // Remove active class from all tabs and content
      tabs.forEach(tab => tab.classList.remove('is-active'));
      contents.forEach(content => content.classList.remove('is-active'));
      multicontent.forEach(content => content.classList.remove('is-active'));

      // Activate selected tab and its content
      tabs[index].classList.add('is-active');
      contents[index].classList.add('is-active');
      if (multicontent.length !== 0 && multicontent[index]) {
        multicontent[index].classList.add('is-active');
      }


      const swiperContainers = contents[index].querySelectorAll('.swiper');
      swiperContainers.forEach(container => {
        if (container.swiper) {
          container.swiper.update();
        }
      });

    };

    // Attach event listeners to all tabs
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', event => {
        event.preventDefault();
        activateTab(index);
      });
    });
  }
}

// Register the custom element
customElements.define('custom-tabs-click', CustomTabsClick);

class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      input: this.querySelector('input[name="language_code"], input[name="country_code"]'),
      button: this.querySelector('button'),
      panel: this.querySelector('ul'),
    };
    this.elements.button.addEventListener('click', this.openSelector.bind(this));
    this.elements.button.addEventListener('focusout', this.closeSelector.bind(this));
    this.addEventListener('keyup', this.onContainerKeyUp.bind(this));

    this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
  }

  hidePanel() {
    this.elements.button.setAttribute('aria-expanded', 'false');
    this.elements.panel.setAttribute('hidden', true);
  }

  onContainerKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    this.hidePanel();
    this.elements.button.focus();
  }

  onItemClick(event) {
    event.preventDefault();
    const form = this.querySelector('form');
    this.elements.input.value = event.currentTarget.dataset.value;
    if (form) form.submit();
  }

  openSelector() {
    this.elements.button.focus();
    this.elements.panel.toggleAttribute('hidden');
    this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
  }

  closeSelector(event) {
    const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === 'BUTTON';
    if (event.relatedTarget === null || shouldClose) {
      this.hidePanel();
    }
  }
}

customElements.define('localization-form', LocalizationForm);

class ProductBundle extends HTMLElement {
  constructor() {
    super();
    this.bundle = [];
    this.cartApiUrl = "/cart/add.js";
    this.cart = document.querySelector('cart-drawer');
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.totalPriceElement = this.querySelector(".product-bundle-count p");
    this.progressBar = this.querySelector(".progressbar");
    this.addToCartButton = this.querySelector(".product-bundle--button .button");
    this.productItems = this.querySelectorAll(".product-bundle-item");
    this.bundleLimit = parseInt(this.querySelector(".product-bundle-grid").getAttribute("data-bundle-count"), 10);

    this.productItems.forEach((item) => {
      const buttons = item.querySelectorAll(".product-bundle-button .button");
      const addButton = buttons[0];
      const removeButton = buttons[1];
      const priceElement = item.querySelector(".product-actual-price");
      const titleElement = item.querySelector(".product-card-title a");

      if (addButton && removeButton && priceElement && titleElement) {
        const product = {
          name: titleElement.textContent.trim(),
          price: parseFloat(priceElement.getAttribute("data-price").replace(/,/g, "")),
          element: item,
          addButton,
          removeButton
        };

        addButton.addEventListener("click", () => this.addToBundle(product));
        removeButton.addEventListener("click", () => this.removeFromBundle(product));
      }
    });

    if (this.addToCartButton) {
      this.addToCartButton.addEventListener("click", (event) => this.handleAddToCart(event));
    }
  }

  addToBundle(product) {
    if (!this.bundle.some(p => p.name === product.name)) {
      this.bundle.push(product);
      this.updateBundleUI();
      product.addButton.classList.add("hidden");
      product.removeButton.classList.remove("hidden");
      product.element.classList.add("active-bundle");
    }

    if (this.bundle.length >= this.bundleLimit) {
      this.productItems.forEach((item) => {
        if (!item.classList.contains("active-bundle")) {
          const addBtn = item.querySelector(".product-bundle-button .button");
          addBtn.classList.add("disabled");

        }
      });
    }
  }

  removeFromBundle(product) {
    this.bundle = this.bundle.filter(p => p.name !== product.name);
    this.updateBundleUI();
    product.removeButton.classList.add("hidden");
    product.addButton.classList.remove("hidden");
    product.element.classList.remove("active-bundle");

    this.productItems.forEach((item) => {
      const addBtn = item.querySelector(".product-bundle-button .button");
      if (!item.classList.contains("active-bundle")) {
        addBtn.classList.remove("disabled");

      }
    });
  }

  updateBundleUI() {
    const totalPrice = this.bundle.reduce((sum, item) => sum + item.price, 0);
    if (this.totalPriceElement) {
      this.totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
    }

    const progressPercentage = (this.bundle.length / this.bundleLimit) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = `${progressPercentage}%`;
    }

    if (this.addToCartButton) {
      this.addToCartButton.disabled = this.bundle.length === 0;
    }
  }

  handleAddToCart(event) {
    if (this.bundle.length === 0) return;

    // Re-query to ensure the elements are available
    const btnText = this.querySelector("[data-addtobutton-text]");
    const btnLoader = this.querySelector(".loading--spinner");

    btnText?.classList.add("hidden");
    btnLoader?.classList.remove("hidden");

    const items = this.bundle.map(product => {
      const variantId = product.element.getAttribute("data-variant-id");
      return {
        id: variantId,
        quantity: 1
      };
    });

    if (items.length === 0) return;

    fetch(this.cartApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ items: items }),
    })
      .then((response) => {
        btnText?.classList.remove("hidden");
        btnLoader?.classList.add("hidden");

        if (!response.ok) {
          this.handleError("Failed to add bundle to cart.");
          throw new Error("Failed to add bundle to cart");
        }

        return response.json();
      })
      .then((cartData) => {
        btnText?.classList.remove("hidden");
        btnLoader?.classList.add("hidden");
        if (this.cart?.openCartDrawer) {
          this.cart.openCartDrawer(event);
          const itemCountElement = document.querySelector("[data-item-count]");
          const totalQuantity = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
          if (itemCountElement) {
            itemCountElement.classList.remove("hidden");

            if (totalQuantity == 0) {
              itemCountElement.classList.add("hidden");
            } else if (totalQuantity < 100) {
              itemCountElement.textContent = totalQuantity;
            } else {
              itemCountElement.textContent = '99+';
            }
          }
          this.cart.classList.add("is-visible");
          document.body.classList.add("overflow-hidden");
        } else {
          window.location = window.routes.cart_url;
        }
      })
      .catch(error => {
        console.error("Error adding to cart:", error);
        alert("Sorry, something went wrong.");
      });
  }

  handleError(errorMessage = false) {
    if (this.hideErrors) return;
    this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form-error-message-wrapper');
    if (!this.errorMessageWrapper) return;
    this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form-error-message');
    this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
    if (errorMessage && this.errorMessage) {
      this.errorMessage.textContent = errorMessage;
    }
  }
}

customElements.define("product-bundle", ProductBundle);



class BestSellingProducts extends HTMLElement {
  constructor() {
    super();

    this.openButton = this.querySelector("[data-open-section]");
    this.closeButton = this.querySelector("[data-close-section]");
    this.openSection = this.querySelector("#BestSellingProducts");
    if (this.openButton) {
      this.openButton.addEventListener("click", (event) => this.openMenu(event));
    }
    if (this.closeButton) {
      this.closeButton.addEventListener("click", (event) => this.closeMenu(event));
    }


  }

  openMenu(event) {
    event.preventDefault();
    this.openSection.classList.add("is-active");
  }

  closeMenu(event) {
    event.preventDefault();
    this.openSection.classList.remove("is-active");
  }
}

customElements.define("best-selling-products", BestSellingProducts);

class CustomAccordionDes extends HTMLElement {
  constructor() {
    super();
    this.duration = 400;
    this.easing = "ease";
  }

  connectedCallback() {
    const detailsList = this.querySelectorAll(".accordion-details");

    detailsList.forEach((details) => {
      const summary = details.querySelector("summary");
      const content = details.querySelector(".accordion-details-content");
      if (!content) return; // Skip if no content

      // Initialize closed state
      if (!details.open) {
        content.style.height = "0px";
        content.style.overflow = "hidden";
      }

      // Per-item animating state
      details._animating = false;

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        if (details._animating) return;

        if (details.open) {
          this.close(details, content);
        } else {
          this.closeOthers(detailsList, details);
          this.open(details, content);
        }
      });
    });
  }

  closeOthers(all, current) {
    all.forEach((details) => {
      if (details !== current && details.open) {
        const content = details.querySelector(".accordion-details-content");
        if (content) this.close(details, content);
      }
    });
  }

  open(details, content) {
    details._animating = true;
    details.open = true;

    const startHeight = content.offsetHeight;
    const endHeight = content.scrollHeight;

    content.style.overflow = "hidden";

    const animation = content.animate(
      [{ height: startHeight + "px" }, { height: endHeight + "px" }],
      { duration: this.duration, easing: this.easing }
    );

    animation.onfinish = () => {
      content.style.height = "auto";
      details._animating = false;
    };
  }

  close(details, content) {
    details._animating = true;

    const startHeight = content.offsetHeight;

    const animation = content.animate(
      [{ height: startHeight + "px" }, { height: "0px" }],
      { duration: this.duration, easing: this.easing }
    );

    animation.onfinish = () => {
      content.style.height = "0px";
      details.open = false;
      details._animating = false;
    };
  }
}

customElements.define("custom-accordion-des", CustomAccordionDes);


class CustomAccordion extends HTMLElement {
  constructor() {
    super();
    this.isAnimating = false;
    // Configuration
    this.duration = 400; // Animation speed in ms
    this.easing = 'ease-in-out'; // Animation curve
  }

  connectedCallback() {
    // Select all details elements within this component
    const detailsElements = this.querySelectorAll('details');

    detailsElements.forEach((details) => {
      const summary = details.querySelector('summary');

      summary.addEventListener('click', (e) => {
        e.preventDefault(); // 1. Stop default instant toggle

        // Prevent clicking while animation is running (stops glitching)
        if (this.isAnimating) return;

        if (details.open) {
          // If open, close it
          this.shrink(details);
        } else {
          // If closed, close others first, then open this one
          this.closeOthers(details, detailsElements);
          this.expand(details);
        }
      });
    });
  }

  // Closes all other details elements that are currently open
  closeOthers(currentDetails, allDetails) {
    allDetails.forEach((details) => {
      if (details !== currentDetails && details.open) {
        this.shrink(details);
      }
    });
  }

  expand(details) {
    this.isAnimating = true;

    // 1. Apply open to calculate dimensions (content is visible but invisible to user)
    details.open = true;
    details.style.overflow = 'hidden'; // Prevent content spill

    // 2. Measure heights
    const startHeight = `${details.querySelector('summary').offsetHeight}px`;
    const endHeight = `${details.scrollHeight}px`;

    // 3. Animate
    const animation = details.animate(
      { height: [startHeight, endHeight] },
      { duration: this.duration, easing: this.easing }
    );

    // 4. Cleanup when done
    animation.onfinish = () => {
      details.style.height = ''; // Reset to auto
      details.style.overflow = ''; // Allow scrolling if needed
      this.isAnimating = false;
    };
  }

  shrink(details) {
    this.isAnimating = true;

    // 1. Measure heights
    const startHeight = `${details.offsetHeight}px`;
    const endHeight = `${details.querySelector('summary').offsetHeight}px`;

    // 2. Lock overflow to hide content as it moves up
    details.style.overflow = 'hidden';

    // 3. Animate
    const animation = details.animate(
      { height: [startHeight, endHeight] },
      { duration: this.duration, easing: this.easing }
    );

    // 4. Cleanup when done
    animation.onfinish = () => {
      details.open = false; // Actually remove the attribute now
      details.style.height = '';
      details.style.overflow = '';
      this.isAnimating = false;
    };
  }
}

customElements.define('custom-accordion', CustomAccordion);


class VideoSection extends HTMLElement {
  constructor() {
    super();
    this.targetWidth = 100; // Default width in vw
    this.animationFrameId = null;
  }

  connectedCallback() {
    this.targetElement = this.querySelector(".video-media");
    this.stickyContainer = this.querySelector(".video-main--box");
    this.videoHeadingElement = this.querySelector(".video-overlay-title");


    if (!this.targetElement || !this.stickyContainer) {
      console.error("Required elements not found in the custom element.");
      return;
    }

    this.handleScroll = this.handleScroll.bind(this);
    this.animateWidth = this.animateWidth.bind(this);

    window.addEventListener("scroll", this.handleScroll);
    this.handleScroll(); // Run initially in case already at the top
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  animateWidth() {
    const currentWidth = parseFloat(this.targetElement.style.width) || 100;

    if (Math.abs(currentWidth - this.targetWidth) < 1) { // Stop animation when close
      this.targetElement.style.width = `${this.targetWidth}vw`;
      cancelAnimationFrame(this.animationFrameId);
      return;
    }

    const step = (this.targetWidth > currentWidth) ? 5 : -5; // Increase step size for speed
    this.targetElement.style.width = `${currentWidth + step}vw`;

    this.animationFrameId = requestAnimationFrame(this.animateWidth);
  }

  handleScroll() {
    const containerRect = this.stickyContainer.getBoundingClientRect();
    // If the section reaches the top, shrink width to 50vw
    this.targetWidth = (containerRect.top <= 0) ? 50 : 100;
    if (containerRect.top <= 0) {
      this.videoHeadingElement.classList.add("content-shrink"); // Apply font size and position changes
    } else {
      this.videoHeadingElement.classList.remove("content-shrink");
    }

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.animateWidth);
  }
}

customElements.define("video-section", VideoSection);


class ScrollingContent extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this.sections = [];
    this.currentIndex = 0;
  }

  connectedCallback() {
    // Wait until everything is rendered
    window.requestAnimationFrame(() => this.initSwiper());
    window.addEventListener("scroll", () => this.syncSwiperWithScroll());
  }

  initSwiper() {
    const container = this.querySelector(".swiper-container");
    if (!container) {
      console.error("Swiper container not found inside <scrolling-content>");
      return;
    }

    // Initialize Swiper
    this.swiper = new Swiper(container, {
      direction: "horizontal",
      slidesPerView: 1,
      spaceBetween: 0,
      allowTouchMove: false,
      speed: 700,
    });

    // Select content sections
    this.sections = this.querySelectorAll(".scrolling-content--item");

    if (this.sections.length === 0) {
      console.warn("No .scrolling-content--item found.");
    }
  }

  syncSwiperWithScroll() {
    if (!this.swiper || typeof this.swiper.slideTo !== "function") {
      console.warn("Swiper is not ready or invalid:", this.swiper);
      return;
    }

    const scrollTop = window.scrollY;
    const lastSection = this.sections[this.sections.length - 1];
    const mainSection = this.querySelector(".section-scrolling-content");

    this.sections.forEach((section, index) => {
      const sectionTop = section.getBoundingClientRect().top;

      if (sectionTop <= 5 && sectionTop > -section.clientHeight) {
        if (this.currentIndex !== index) {
          this.currentIndex = index;
          this.swiper.slideTo(index);
          this.updateActiveSection(index);
        }
      }
    });

    if (lastSection && scrollTop >= lastSection.offsetTop) {
      this.sections[0]?.classList.remove("first-section");
    }
  }

  updateActiveSection(index) {
    this.sections.forEach((sec) =>
      sec.classList.remove("active-section", "first-section")
    );
    this.sections[index]?.classList.add("active-section");

    if (index === 0) {
      this.sections[index]?.classList.add("first-section");
    }
  }
}

customElements.define("scrolling-content", ScrollingContent);


class SVGButtonElement extends HTMLElement {
  constructor() {
    super();
    this.path = null;
    this.svg = null;
    this.length = 0;
  }

  connectedCallback() {
    // Initialize after element is rendered
    requestAnimationFrame(() => this.initButton());
  }

  initButton() {
    const span = this.querySelector('span');
    if (!span) return;

    const width = Math.round(this.getBoundingClientRect().width);
    const height = Math.round(this.getBoundingClientRect().height);
    const spanWidth = span.getBoundingClientRect().width;

    this.svg = this.querySelector("svg");
    this.path = this.querySelector('rect');

    if (!this.svg || !this.path) return;

    // Set SVG and rect attributes
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.path.setAttribute('width', width);
    this.path.setAttribute('height', height);
    this.path.setAttribute('rx', 10);
    this.path.setAttribute('ry', 10);
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    this.path.setAttribute('fill', 'none');
    this.svg.classList.add('dark');
    this.svg.classList.remove("hidden");

    // Wait until the SVG is rendered to get total length
    requestAnimationFrame(() => {
      try {
        this.length = this.path.getTotalLength();
        this.path.style.strokeDasharray = `${this.length} ${this.length + 1}`;
        this.path.style.strokeDashoffset = this.length;

        // Add hover/focus events
        this.addEventListener('mouseenter', () => this.animateStroke(0, 750));
        this.addEventListener('mouseleave', () => this.animateStroke(this.length, 750));
        this.addEventListener('focus', () => this.animateStroke(0, 750));
        this.addEventListener('blur', () => this.animateStroke(this.length, 750));
      } catch (e) {
        console.warn("SVG path not rendered yet:", e);
      }
    });
  }

  animateStroke(targetOffset, duration) {
    let start = null;
    const initialOffset = parseFloat(this.path.style.strokeDashoffset) || this.length;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const currentOffset = initialOffset + progress * (targetOffset - initialOffset);
      this.path.style.strokeDashoffset = currentOffset;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}

// Define the custom element
customElements.define('svg-button', SVGButtonElement);











function parallaxContentMedia(section = document) {
  if (document.querySelector('[data-parallax-media]')) {
    new universalParallax().init({
      speed: 6
    });
  }
}



class CustomPopup extends HTMLElement {
  constructor() {
    super();
    this.focusElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.addEventListeners();
  }

  addEventListeners() {
    const openButton = this.querySelector('[data-popup-head]');
    const closeButton = this.querySelector('[data-popup-close]');

    if (openButton) {
      openButton.addEventListener('click', () => this.openPopup(openButton));
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closePopup());
    }
  }

  openPopup(openButton) {
    const content = this.querySelector('[data-popup-content]');
    if (!content) return;

    content.classList.add('is-active');
    content.classList.remove('hide');
    document.body.classList.add("overflow-hidden");

    this.focusElement = openButton;

    // trap focus
    document.addEventListener("keydown", this.handleKeyDown, true);

    // Move initial focus inside popup
    setTimeout(() => {
      const focusable = this.getFocusableElements(content);
      if (focusable.length) {
        focusable[0].focus();
      } else {
        content.setAttribute("tabindex", "-1");
        content.focus();
      }
    }, 50);
  }

  closePopup() {
    const content = this.querySelector('[data-popup-content]');
    if (!content) return;

    document.body.classList.remove("overflow-hidden");
    content.classList.remove('is-active');
    content.classList.add('hide');

    document.removeEventListener("keydown", this.handleKeyDown, true);

    // Restore focus back to the opener
    if (this.focusElement) {
      this.focusElement.focus();
    }
  }

  handleKeyDown(e) {
    const content = this.querySelector('[data-popup-content]');
    if (!content) return;

    const focusable = this.getFocusableElements(content);
    if (!focusable.length) return;

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    // ESC closes
    if (e.key === "Escape") {
      e.preventDefault();
      this.closePopup();
      return;
    }

    // TAB trap
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstEl || document.activeElement === content) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  getFocusableElements(container) {
    return [...container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(el => el.offsetParent !== null); // only visible
  }
}

customElements.define('custom-popup-click', CustomPopup);


class VariantsSetOption extends HTMLElement {
  constructor() {
    super(),
      this.section = this.closest("section"),
      this.colors = this.querySelectorAll("[variant-item]"),
      this.type = this.dataset.type,
      this.hideOption = this.dataset.unavailable,
      this.hidesoldOut = this.dataset.soldout,
      this.preorderStatus = this.dataset.preorder,
      this.addEventListener("change", this.variantChanges)
     this.variantChanges();
  
  }

  variantChanges(event) {
    this.errorTextUpdate();
    this.updateOptions();
    this.updateProductVariantId();
    this.updateVariantStatuses();

    const isQuickView = this.closest("quick-view-drawer");
    const isProductCard = this.closest("product-card");
    if (this.currentVariant) {
      if (!isQuickView) {
        this.updateUrl();

      }
      this.updateVariantInfo();
      if (isProductCard) {
        this.renderCardData();
    
        this.updateCardMedia(event);
      } else {
        this.updatePickupAvailability();
        this.renderProductInfo();
      }
    } else {
      
         if (!isProductCard) {
            this.executeAddToCart(true, "");
         }else{
          this.setUnavailableCardButton();
         }
          
    }
    if (!isProductCard) {
      this.updateMedia();
    }
  }


  renderCardData() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection || this.dataset.section;
    const sectionProductId = this.dataset.originalSection || this.dataset.section;
    const productID = this.dataset.product;
    let url = this.dataset.url;
    if (url && url.includes('?')) {
      url = url.split("?")[0];
    }

    fetch(`${url}?variant=${requestedVariantId}`)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(responseText, "text/html");
        const newAddButton = html.querySelector(`[data-add-to-cart-main]`);
        const currentAddButton = document.querySelector(`[data-card-id="add-to-cart-${sectionId}-${this.dataset.product}"]`);
        const htmlVariantOption = html.querySelectorAll(`.main-product-variant-selector .product-select--box`);
        if (htmlVariantOption.length > 0) {
          htmlVariantOption.forEach((option, index) => {
            const attributeValue = option.querySelector("[data-type-name]")?.getAttribute("data-type-name");
            const attributeName = option.querySelector("[data-option-name]").getAttribute("data-option-name");
            const selector = `[data-product-item="${productID}-${sectionId}"] .product-selected[data-type="${attributeValue}"]`
            const targetElement = document.querySelector(selector);
            if (targetElement) {
              targetElement.textContent = attributeName;
            }
          });
        }
        if (newAddButton && currentAddButton) {
          if (newAddButton.hasAttribute("disabled")) {
            currentAddButton.setAttribute("disabled", "disabled");
          } else {
            currentAddButton.removeAttribute("disabled");
          }
        }

        // Update the price wrapper content
        const priceWrapperSource = html.getElementById(`price-title-wrapper-${this.dataset.section}-${this.dataset.product}`);
        const priceWrapperDestination = document.getElementById(`price-title-wrapper-${this.dataset.section}-${this.dataset.product}`);

        if (priceWrapperSource && priceWrapperDestination) {
          priceWrapperDestination.innerHTML = priceWrapperSource.innerHTML;
        }


      });
  }


  setUnavailableCardButton(){
        const sectionId = this.dataset.originalSection || this.dataset.section;
     const currentAddButton = document.querySelector(`[data-card-id="add-to-cart-${sectionId}-${this.dataset.product}"]`);
    currentAddButton.setAttribute("disabled", "disabled");

  }
  updateMedia() {
    if (!this.currentVariant || !this.currentVariant?.featured_media) return;
    this.productMedia = this.section.querySelector("product-gallery-media");
    if (this.productMedia) {
      const mediaGalleries = document.querySelector(`[id^="productmedia-${this.dataset.section}"]`);
      const mediaWrapper = mediaGalleries.querySelector("[data-main-product-media]");
      let mediaVariant = mediaGalleries.querySelector("#product-media-" + this.currentVariant.featured_media.id);
      if (mediaVariant && mediaWrapper) {
        if (this.productMedia.classList.contains("slider-enable")) {
          const slideIndex = parseInt(mediaVariant.getAttribute("data-swiper-slide-index"));
          if (!isNaN(slideIndex)) {
            this.productMedia.selectedSlide(slideIndex);
          }
        } else {
          let childCount = mediaWrapper.children.length;
          let firstChild = mediaWrapper.firstChild;
          if (childCount > 1) {
            mediaWrapper.insertBefore(mediaVariant, firstChild);
          }
        }
      }
    }

  }
  updateCardMedia(event){
     if (!this.currentVariant) return;
     this.productCardMedia = this.closest("product-card").querySelector(".main-card-image");
     if(event && event.target.closest(".swatch-color")){
      const updateMediaScript = event.target.closest(".swatch-color").querySelector('script')
       if (this.productCardMedia && updateMediaScript) {
         let swatchMedia = new DOMParser().parseFromString(JSON.parse(updateMediaScript.textContent), "text/html").querySelector('.media-image-variant');
          this.productCardMedia.innerHTML = swatchMedia.innerHTML;
      }
     }

  }
  updateUrl() {
    if (this.closest("main-product")) {
      this.dataset.page == "product" && (!this.currentVariant || this.dataset.updateUrl === "false" || window.history.replaceState({}, "", `${this.dataset.url}?variant=${this.currentVariant.id}`))
    }

  }
  updateVariantInfo() {
    document.querySelectorAll(`#product-form-${this.dataset.section},#quick-view-product-form-${this.dataset.section},
        #product-form-${this.dataset.product}${this.dataset.section}`).forEach(productForm => {
      const input = productForm.querySelector('input[name="id"]');

      input.value = this.currentVariant.id, input.dispatchEvent(new Event("change", {
        bubbles: !0
      }))
    })
  }
  executeAddToCart(disable, textcontent) {
   
    this.productForm = document.getElementById(`product-form-${this.dataset.section}`) ||
      document.getElementById(`product-form-${this.dataset.product}${this.dataset.section}`) ||
      document.getElementById(`quick-view-product-form-${this.dataset.section}-${this.dataset.product}`);

    if (!this.productForm) return;
    this.buttonContent = textcontent;
    const addToCartButton = this.productForm.querySelector('[name="add"]');
    const addButtonText = this.productForm.querySelector('[name="add"] > [data-add-to-cart-text]');


    const inventoryData = this.section.querySelector('[type="application/json"][data-name="product-inventories"]');
    this.productvariantInventory = JSON.parse(inventoryData.textContent);


    const stickyAddToCartText = this.closest("section").querySelector(`#sticky-add-to-cart-${this.dataset.section}`);
    if (this.currentVariant) {
      this.variantInventory = this.productvariantInventory.find((variant) => variant.id == this.currentVariant.id);
    }
    if (!addToCartButton) return;

    if (disable) {
     
    addToCartButton.setAttribute("disabled", "disabled");
      if (this.currentVariant) {
        if (this.buttonContent && addButtonText) {
          addButtonText.innerHTML = this.buttonContent;
        }
        const priceWrapper = document.getElementById(`price-${this.dataset.section}`);
        if (priceWrapper) priceWrapper.classList.remove("hidden");
        const pickupAvailability = document.getElementById(`pickup-availability-${this.dataset.section}`);
        if (pickupAvailability) pickupAvailability.classList.remove("hidden");
        
      } else {
        
        // Variant is unavailable
        if (addButtonText) {
          addButtonText.innerHTML = `<span class="button-text">${window.variantStrings.unavailable}</span>`;
        }
   
        if (stickyAddToCartText) {
          stickyAddToCartText.setAttribute("disabled", "disabled");
        }

        const priceWrapper = document.getElementById(`price-${this.dataset.section}`);
        if (priceWrapper) priceWrapper.classList.add("hidden");

        const pickupAvailability = document.getElementById(`pickup-availability-${this.dataset.section}`);
        if (pickupAvailability) pickupAvailability.classList.add("hidden");
      }
    } else {
      addToCartButton.removeAttribute("disabled");
      if (this.preorderStatus !== "false" && this.variantInventory && this.variantInventory.inventory_policy === "continue" &&
        this.variantInventory.inventory_quantity <= 0) {
        addButtonText.innerHTML = this.buttonContent;
      } else if (addButtonText) {
        addButtonText.innerHTML = this.buttonContent;
      }
      if (stickyAddToCartText) {
        stickyAddToCartText.removeAttribute("disabled");
      }
    }
  }

 updateOptions() {
  this.options = Array.from(
    this.closest(".product-information--wrapper")
      .querySelectorAll("fieldset.product-variant--picker"),
    (fieldset) => {
      const input = fieldset.querySelector(
        'input[type="radio"]:checked:not(:disabled)'
      );
      return input ? input.value : null;
    }
  );
  if (this.type == "dropdown") {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => {
        const option = select.querySelector(
          'option:checked:not(:disabled)'
        );
        return option ? option.value : null;
      }
    );
  }
}

  updateProductVariantId() {
 
    if (this.getVariantData()) {
      this.currentVariant = this.getVariantData().find(variant => {
        if (!variant.options || variant.options.length != this.options.length) {
          return false;
        }
        return this.options.every(opt => variant.options.includes(opt)) &&
          variant.options.every(opt => this.options.includes(opt));
      });

    }
  }

 

  setUnavailable(elementList, unavailableValuesList) {
   
    let selectedElement = null;
    if (elementList && unavailableValuesList) {
      if (elementList.forEach(element => {
        const value = element.getAttribute("value"),
          availableElement = unavailableValuesList.includes(value);
        element.tagName === "INPUT" ? (availableElement ? element.parentNode.classList.contains("hidden") && element.parentNode.classList.remove("hidden") : element.parentNode.classList.add("hidden"), element.type === "radio" && element.checked && element.parentNode.classList.contains("hidden") && (selectedElement = element)) : element.tagName === "OPTION" && (availableElement ? (element.classList.contains("hidden") && element.classList.remove("hidden"), element.classList.contains("disabled")) : element.classList.add("hidden"), element.classList.contains("hidden") || (selectedElement = element))
      }), selectedElement) {
        let clicked = !1;
        for (let i = 0; i < elementList.length; i++) {
          const element = elementList[i];
          if (element.tagName === "INPUT" && element.type === "radio" && !element.parentNode.classList.contains("hidden")) {
            element.click(), clicked = !0;
            break
          }
          if (element.tagName === "OPTION" && !element.classList.contains("hidden")) {
            const selectElement = element.closest("select");
            if (selectElement) {
              const previouslySelected = selectElement.querySelector("option[selected]");
              previouslySelected && previouslySelected !== element && previouslySelected.removeAttribute("selected"), element.setAttribute("selected", "selected"), element.click(), clicked = !0;
              break
            }
          }
          clicked || console.log("No available radio buttons found to click.")
        }
      }
    }

  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
  if (!this.variantData) return;

  const inputWrappers = [...this.querySelectorAll(".product-variant--picker")];

inputWrappers.forEach((optionWrapper, index) => {
  const optionInputs = [
    ...optionWrapper.querySelectorAll(
      'input[type="radio"], select.options-select option'
    )
  ];

  // FIRST OPTION (base availability)
  if (index === 0) {
    const availableValues = this.variantData
      .filter(variant => variant.available)
      .map(variant => variant.options[index]);

    this.setInputAvailability(optionInputs, availableValues);
    return;
  }

  // PREVIOUS SELECTED VALUE (radio OR select)
  const previousWrapper = inputWrappers[index - 1];
  const previousSelected =
    previousWrapper.querySelector('input[type="radio"]:checked')?.value ||
    previousWrapper.querySelector('select.options-select')?.value;

  if (!previousSelected) return;

  // FILTER VARIANTS
  const filteredVariants = this.variantData.filter(
    variant => variant[`option${index}`] === previousSelected
  );

  const availableValues = filteredVariants
    .filter(variant => variant.available)
    .map(variant => variant[`option${index + 1}`]);

  const allValues = filteredVariants.map(
    variant => variant[`option${index + 1}`]
  );

  // APPLY AVAILABILITY
  this.setInputAvailability(optionInputs, availableValues);

  if (this.hideOption === "true") {
    this.setUnavailable(optionInputs, allValues);
  }
});

}

  setInputAvailability(listOfOptions, listOfAvailableOptions) {


    listOfOptions.forEach((input) => {

      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        if (input.tagName === "OPTION") {
          input.innerText = input.getAttribute("value");
            input.disabled = false;
        } else if (input.tagName === "INPUT") {
          input.classList.remove("disabled");
        }
      } else {
        if (input.tagName === "OPTION") {
          input.innerText = input.getAttribute("value")
           input.disabled = true;
        } else if (input.tagName === "INPUT") {
          input.classList.add("disabled");
        }
      }
    });
  }
  renderProductInfo() {
    const requestedVariantId = this.currentVariant?.id;
    const sectionId = this.dataset.originalSection || this.dataset.section;
    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${sectionId}`)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(responseText, "text/html");
        const productPriceSource = html.getElementById(`product-price-list-${sectionId}`);
        const productPriceDestination = document.getElementById(`product-price-list-${this.dataset.section}`);
        if (productPriceSource && productPriceDestination) {
          productPriceDestination.innerHTML = productPriceSource.innerHTML;
        }

        const updateSlectedOptions = html.querySelectorAll("[data-slected-value]");
        Array.from(updateSlectedOptions).forEach(function (updateSlectedOption, index) {
          document.querySelectorAll(`.selected-value-${sectionId}-${index + 1}`).forEach(function (updateSlecteddata) {
            updateSlecteddata.innerText = updateSlectedOption.innerText
          })
        })

        const productskuSource = html.getElementById(`product-sku-${sectionId}`);
        const productskuDestination = document.getElementById(`product-sku-${this.dataset.section}`);
        if (productskuSource && productskuDestination) {
          productskuDestination.innerHTML = productskuSource.innerHTML;
        }

        // Sticky add to cart Button
        const stickyaddTocartDestination = document.querySelector(`sticky-bar-product`);
        const stickyaddTocartSource = html.querySelector(`sticky-bar-product`);
        if (stickyaddTocartSource && stickyaddTocartDestination) {
          stickyaddTocartDestination.innerHTML = stickyaddTocartSource.innerHTML;
        }

        // card update
        const productPriceListSource = html.getElementById(`product-price-list-${this.dataset.product}-${sectionId}`);
        const productPriceListDestination = document.getElementById(`product-price-list-${this.dataset.product}-${this.dataset.section}`);
        if (productPriceListSource && productPriceListDestination) {
          productPriceListDestination.innerHTML = productPriceListSource.innerHTML;
        }

        const variantsDestination = document.getElementById(`products-variants-${this.dataset.section}-${this.dataset.product}`);
        const variantsSource = html.getElementById(`products-variants-${this.dataset.section}-${this.dataset.product}`);
        // Update variant swatches
        if (variantsSource && variantsDestination) {
         
          variantsDestination.innerHTML = variantsSource.innerHTML;
        }

        // Update selected color name
        const colorNameDestination = this.querySelector(`[data-selected-variant=${this.dataset.section}-${this.dataset.product}]`);
        const colorNameSource = html.querySelector(`[data-selected-variant=${this.dataset.section}-${this.dataset.product}]`);
        if (colorNameSource && colorNameDestination) {
          colorNameDestination.innerText = colorNameSource.innerText;
        }

        // Unhide price section if available
        const price = document.getElementById(`price-title-wrapper-${this.dataset.section}`);
        if (price) {
          price.classList.remove("hidden");
        }


        // Determine if the "Add to Cart" button should be disabled
        const updatedAddButton = html.querySelector(`[data-add-to-cart-main]`);
        const cartbuttonContent = updatedAddButton.querySelector(`[data-add-to-cart-text]`).innerHTML;
        const shouldDisable = updatedAddButton ? updatedAddButton.hasAttribute("disabled") : true;
        // Call Add to Cart logic
        this.executeAddToCart(shouldDisable, cartbuttonContent);
      });
  }
  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("availability-content");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }
  getVariantData() {
    if (this.variantData) return this.variantData;
    const container = this.closest("[data-product-info]");
    if (!container) return null;

    const jsonScript = container.querySelector('[type="application/json"]');
    if (!jsonScript || !jsonScript.textContent) return null;

    try {
      this.variantData = JSON.parse(jsonScript.textContent);
      return this.variantData;
    } catch (e) {
      console.error("Failed to parse variant data JSON:", e);
      return null;
    }
  }
  errorTextUpdate() {
    const errorFields = document.querySelectorAll(".product-form--error-message");
    errorFields.forEach(field => {
      field.textContent = ""; 
    });
  }
}
customElements.define("variant-set-option", VariantsSetOption);

class QuantityElement extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );

    this.input.addEventListener('focus', this.onInputFocus.bind(this));
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  onInputFocus() {
    this.input.select();
  }
}

customElements.define("quantity-element", QuantityElement);

class ProductGalleryMedia extends HTMLElement {
  constructor() {
    super();
    this.dataid = this.dataset.id;
    this.slidePerView = 1;
    this.pagination = false;
    if (this.hasAttribute('data-quick-view')) {
      this.slidePerView = 2;
      this.pagination = true;
    }
  }

  connectedCallback() {
    this.thumbnailsMedia();
    if (!this.dataid) return;
    const slideItem = this.querySelector(`[data-product-media-${this.dataid}]`);
    if (slideItem) {
      new ResizeObserver(() => this.thumbnailsMedia()).observe(slideItem);
    }
    this.init();
  }

  thumbnailsMedia() {
    const slideItem = this.querySelector(`[data-product-media-${this.dataid}]`);
    if (slideItem) {
      requestAnimationFrame(() => {
        this.mainItemheight = slideItem.getBoundingClientRect().height;
        const thumbmedia = this.querySelector(
          `[data-product-thumbs-${this.dataid}] .swiper-slide`
        );
        if (thumbmedia) {
          thumbmedia.style.setProperty("--thumb_height", `${this.mainItemheight}px`);
        }
      });
    }
  }

  updatePagination() {
    if (!this.el) return;

    const swiperCounter = this.el.querySelector('.swiper-counter');
    const slides = this.el.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
    const totalSlides = slides.length;
    const currentIndex = this.realIndex + 1;

    const formattedCurrent = currentIndex < 10 ? `0${currentIndex}` : `${currentIndex}`;
    const formattedTotal = totalSlides < 10 ? `0${totalSlides}` : `${totalSlides}`;

    if (swiperCounter) {
      swiperCounter.innerHTML = `
        <span class="count">${formattedCurrent}</span>/
        <span class="total">${formattedTotal}</span>
      `;
    }
  }

  init() {
    this.thumbnailEnable = this.dataset.thumbnailEnable;
    if (this.thumbnailEnable == "true") {
      this.productThumbs = new Swiper(`[data-product-thumbs-${this.dataid}]`, {
        loop: true,
        speed: 300,
        direction: "horizontal",
        slideToClickedSlide: true,
        slidesPerView: 4,
        spaceBetween: 20,
        freeMode: false,
        breakpoints: {
          768: { direction: "vertical" },
        },
      });
    }

    this.productImages = new Swiper(`[data-product-media-${this.dataid}]`, {
      loop: true,
      speed: 300,
      slidesPerView: this.slidePerView,
      spaceBetween: 2,
      pagination: {
        enabled: this.pagination,
        el: `.swiper-pagination-${this.dataid}`,
        type: "bullets",
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        enabled: true,
        nextEl: `.swiper-button-next-${this.dataid}`,
        prevEl: `.swiper-button-prev-${this.dataid}`,
      },
      on: {
        init: () => {
          this.updatePagination();
          this.handleArrowKeyControl(); // 👈 init keyboard handling
        },
        slideChange: this.updatePagination
      },
      breakpoints: {
        768: {
          spaceBetween: 10,
          navigation: {
            enabled: true,
            nextEl: `.swiper-button-next-${this.dataid}`,
            prevEl: `.swiper-button-prev-${this.dataid}`,
          }
        },
      },
      thumbs: { swiper: this.productThumbs },
    });

    this.customEvents();
  }

  selectedSlide(index) {
    if (this.productImages) this.productImages.slideToLoop(index);
    if (this.productThumbs) this.productThumbs.slideToLoop(index);
  }

  handleArrowKeyControl() {
    const next = document.querySelector(`.swiper-button-next-${this.dataid}`);
    const prev = document.querySelector(`.swiper-button-prev-${this.dataid}`);

    [[next, "next"], [prev, "prev"]].forEach(([btn, type]) => {
      if (!btn) return;

      btn.setAttribute("tabindex", "0");
      btn.setAttribute("role", "button");

      btn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (this.productImages) {
            type === "next"
              ? this.productImages.slideNext()
              : this.productImages.slidePrev();
          }
        }
      });
    });
  }

  customEvents() {
    if (this.productImages) {
      this.productImages.on("slideChange", function (event) {
        this.section = document.querySelector(
          `[id="shopify-section-${this.el.dataset.section}"]`
        );
        this.previousSlide = this.slides[event.previousIndex];
        this.activeSlide = this.slides[event.activeIndex];

        if (this.previousSlide) {
          this.previousSlide.querySelectorAll("video").forEach((video) => video.pause());

          this.previousSlide.querySelectorAll(".product-media-youtube").forEach((video) => {
            video.contentWindow.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}', "*"
            );
          });

          this.previousSlide.querySelectorAll(".product-media-vimeo").forEach((video) => {
            video.contentWindow.postMessage('{"method":"pause"}', "*");
          });

          this.previousSlide.querySelector("product-model")?.pauseModel();
        }

        if (this.activeSlide) {
          this.activeSlide.querySelector("product-model")?.pauseModel();
        }
      });
    }
  }
}

customElements.define("product-gallery-media", ProductGalleryMedia);



class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("recommendations-product");
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
            this.closest(".shopify-section").classList.remove("hidden");
            customOptionsCollection();
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 100px 0px",
    }).observe(this);
  }
}
customElements.define("recommendations-product", ProductRecommendations);




if (!customElements.get("product-content-element")) {
  class CustomContentElement extends HTMLElement {
    constructor() {
      super();
      this.focusElement = null;
      this.openDrawer = this.openDrawer.bind(this);
    }

    connectedCallback() {
      this.querySelectorAll("[data-drawer-head]").forEach(el => {
        el.addEventListener("click", this.openDrawer);
      });
    }

    openDrawer(event) {
      event.preventDefault();
      const clickedEl = event.currentTarget;

      const template = this.querySelector('[data-product-content-main]');
      if (!template) return;

      const templateContent = template.content.cloneNode(true);
      document.body.appendChild(templateContent);

      const blockid = this.getAttribute('data-id');

      setTimeout(() => {
        const drawer = document.querySelector(`#${blockid}`);
        if (drawer) {
          drawer.classList.add("is-visible");
          document.body.classList.add("overflow-hidden");
          this.addEscapeListener(drawer);

          // Handle active states
          document.querySelectorAll("[data-drawer-head].active").forEach(el =>
            el.classList.remove("is-active")
          );
          clickedEl.classList.add("is-active");

          const href = clickedEl.getAttribute("href");
          if (href?.startsWith("#")) {
            const targetId = href.slice(1);

            this.querySelectorAll(".tab-link.is-active").forEach(el =>
              el.classList.remove("is-active")
            );
            document.querySelector(`[data-id="${targetId}"]`)?.classList.add("is-active");

            this.querySelectorAll(".drawer-tab--text.is-active").forEach(el =>
              el.classList.remove("is-active")
            );
            document.getElementById(targetId)?.classList.add("is-active");

          }
        }
        setTimeout(() => {
          this.focusElement = event.target;
          if (drawer && typeof trapFocusElements === "function") {
            trapFocusElements(drawer);
          }
        }, 700)
        this.closeDrawer(blockid);
      }, 500);




    }

    closeDrawer(blockid) {
      const drawer = document.querySelector(`#${blockid}`);
      if (!drawer) return;

      drawer.querySelectorAll('[data-drawer-close]').forEach(closeElement => {
        closeElement.addEventListener("click", (event) => {
          event.preventDefault();
          this._closeDrawer(drawer);
          if (this.focusElement) {
            this.focusElement.focus();
          }
          this.focusElement = null;
        });
      });
    }

    _closeDrawer(drawer) {
      drawer.classList.remove("is-visible");
      document.body.classList.remove("overflow-hidden");
      setTimeout(() => {
        drawer.remove();
      }, 500);
    }

    addEscapeListener(drawer) {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          this._closeDrawer(drawer);
          document.removeEventListener('keydown', handleKeyDown);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
    }
  }

  customElements.define("product-content-element", CustomContentElement);
}



if (!customElements.get("product-info-drawer")) {
  class ProductInfoDrawer extends HTMLElement {
    constructor() {
      super();
      this.focusElement = null;
      this.handleTabClick = this.handleTabClick.bind(this);
    }

    connectedCallback() {
      // Delegate tab clicks
      this.querySelectorAll(".tab-link").forEach(tab => {
        tab.addEventListener("click", this.handleTabClick);
      });
    }

    disconnectedCallback() {
      // Clean up listeners if the drawer is removed
      this.querySelectorAll(".tab-link").forEach(tab => {
        tab.removeEventListener("click", this.handleTabClick);
      });
    }

    handleTabClick(event) {
      event.preventDefault();
      const clickedTab = event.currentTarget;

      // Get target tab content ID from href
      const targetId = clickedTab.getAttribute("href")?.substring(1);
      if (!targetId) return;

      // Remove active class from all tabs
      this.querySelectorAll(".tab-link").forEach(tab =>
        tab.classList.remove("is-active")
      );

      // Set active class on clicked tab
      clickedTab.classList.add("is-active");

      // Hide all tab contents
      this.querySelectorAll(".drawer-tab--text").forEach(content =>
        content.classList.remove("is-active")
      );

      // Show matching tab content
      const targetContent = this.querySelector(`#${targetId}`);
      if (targetContent) {
        targetContent.classList.add("is-active");
      }
    }
  }

  customElements.define("product-info-drawer", ProductInfoDrawer);
}


if (!customElements.get("size-guide")) {
  class SizeGuide extends HTMLElement {
    constructor() {
      super();
      this.focusElement = null;

      const trigger = this.querySelector("[data-drawer-head]");
      if (trigger) {
        trigger.addEventListener("click", this.openDrawer.bind(this));
      }

      document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    openDrawer(event) {
      event.preventDefault();

      const template = this.querySelector("[data-sizeguide-content]");
      if (!template) return;

      const templateContent = template.content.cloneNode(true);
      document.body.appendChild(templateContent);

      setTimeout(() => {
        const drawer = document.querySelector(".drawer-sizeChart");
        if (drawer) {
          drawer.classList.add("is-visible");
          document.body.classList.add("overflow-hidden");
        }
      }, 50);

      setTimeout(() => {
        this.focusElement = event.target;
        const drawer = document.querySelector(".drawer-sizeChart");
        if (drawer && typeof trapFocusElements === "function") {
          trapFocusElements(drawer);
        }
      }, 300);

      this.closeDrawer();
    }

    closeDrawer() {
      const drawer = document.querySelector(".drawer-sizeChart");
      if (!drawer) return;

      const closeElements = drawer.querySelectorAll("[data-drawer-close]");
      closeElements.forEach((closeEl) => {
        closeEl.addEventListener("click", (e) => {
          e.preventDefault();
          this._closeDrawer(drawer);
        });
      });
    }

    _closeDrawer(drawer) {
      drawer.classList.remove("is-visible");

      if (this.focusElement) {
        this.focusElement.focus();
      }
      this.focusElement = null;

      if (typeof removeTrapFocus === "function") {
        removeTrapFocus();
      }

      setTimeout(() => {
        drawer.remove();
      }, 400);
      document.body.classList.remove("overflow-hidden");
    }

    handleKeyDown(event) {
      if (event.key === "Escape") {
        const drawer = document.querySelector(".drawer-sizeChart");
        if (drawer && drawer.classList.contains("is-visible")) {
          this._closeDrawer(drawer);
        }
      }
    }
    refreshDrawerContent(newHtml) {
      const drawer = document.querySelector(".drawer-sizeChart");
      if (drawer) {
        const form = drawer.querySelector("modal-dialog-form");
        if (form) {
          form.innerHTML = newHtml;
        }
      }
    }
  }

  customElements.define("size-guide", SizeGuide);
}

class StickyBarProduct extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.observeElements();
  }

  observeElements() {
    const formElement = document.getElementById(`product-form-${this.dataset.section}`);
    const footerElement = document.querySelector("footer");

    if (!formElement || !footerElement) return;

    this.hasScrolledPastForm = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === footerElement) {
          if (entry.intersectionRatio > 0) {
            this.classList.remove("is-visible");
          } else if (entry.intersectionRatio === 0 && this.hasScrolledPastForm) {
            this.classList.add("is-visible");
          }
        }

        if (entry.target === formElement) {
          const formRect = formElement.getBoundingClientRect();
          const scrolledPast = entry.intersectionRatio === 0 && window.scrollY > formRect.top + formRect.height;

          if (scrolledPast) {
            this.hasScrolledPastForm = true;
            this.classList.add("is-visible");
          } else if (entry.intersectionRatio === 1) {
            this.hasScrolledPastForm = false;
            this.classList.remove("is-visible");
          }
        }
      });
    }, {
      threshold: [0, 1]
    });

    observer.observe(formElement);
    observer.observe(footerElement);
  }
}

customElements.define("sticky-bar-product", StickyBarProduct);

class QuickView extends HTMLElement {
  constructor() {
    super();
    this.init()
  }

  init() {
    if (this.querySelector("[data-quickview-button]")) {
      this.querySelector("[data-quickview-button]").addEventListener('click', (event) => {
        event.preventDefault();
        this.lastFocusedElement = ""
        const drawer = document.querySelector('#quickView-drawer');
        if (drawer) {
          this.setupEventListener(event, drawer)
        }
        else if (this.dataset.productUrl) {
          window.location.href = this.dataset.productUrl;
        }
      });

    }

  }
  setupEventListener(event, drawer) {
 
    const selector = '#quickView-drawer';
    const drawerContent = this.querySelector(selector);
    const drawerSelector = document.querySelector("#quickView-drawer");
    drawerSelector.classList.add("loading");
    const quickView = this.querySelector("[data-quickview-button]")
    quickView.classList.add("loading")
    quickView.querySelector(".quick-view-main-icon").classList.add("hidden")
    quickView.querySelector(".loading--spinner").classList.remove("hidden")
    drawerSelector.innerHTML = '';
    const productUrl = this.dataset.productUrl.split('?')[0];
    const sectionUrl = `${productUrl}`;
    this.lastFocusedElement = quickView;
    trapFocusElements(drawer);
    fetch(sectionUrl)
      .then(response => response.text())
      .then(responseText => {
        const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
        const productElement = responseHTML.querySelector(selector);
        drawerSelector.classList.remove("loading")

        drawerSelector.innerHTML = productElement.innerHTML;
        drawer.classList.add("is-visible")
        document.querySelector("body").classList.add("overflow-hidden");
        quickView.classList.remove("loading")
        quickView.querySelector(".quick-view-main-icon").classList.remove("hidden")
        quickView.querySelector(".loading--spinner").classList.add("hidden")
        if (window.Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();

          setTimeout(() => {
            focusElement = event.target;
            trapFocusElements(drawer);
          }, 500);
          this.closeDrawer();

          if (window.ProductModel) window.ProductModel.loadShopifyXR();
          pauseVideo();
          onYouTubeIframeAPIReady();
        }


      })
      .catch(e => {
        console.error(e);
      });
  }

  closeDrawer() {
    const drawer = document.querySelector('.drawer-quick-view');
    const quickView = this.querySelector("[data-quickview-button]")
    if (drawer) {

      const closeDrawerElements = drawer.querySelectorAll('[data-drawer-close]');
      Array.from(closeDrawerElements).forEach(function (closeDrawerElement) {
        closeDrawerElement.addEventListener("click", function (event) {
          event.preventDefault();
          drawer.classList.remove("is-visible");
          document.querySelector("body").classList.remove("overflow-hidden");
          quickView.focus()
          setTimeout(() => {
            if (this.lastFocusedElement) {
              this.lastFocusedElement.focus();
            }
            this.lastFocusedElement = '';
          }, 400);

        })
      })



    }
  }

}
document.addEventListener('DOMContentLoaded', () => {
  const drawerSelector = '#quickView-drawer';
  const drawer = document.querySelector(drawerSelector);
  if (!drawer) return;
  document.addEventListener('click', (event) => {
    if (
      event.target.closest('[data-drawer-close]') || 
      event.target.classList.contains('quick-view-overlay')
    ) {
      closeQuickViewDrawer();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-add-to-cart]')) {
      drawer.dataset.added = 'true';
    }
  });
  function closeQuickViewDrawer() {
    if (!drawer.classList.contains('is-visible')) return;
    drawer.classList.remove('is-visible');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      if (drawer.dataset.added === 'true') {
        drawer.remove();
      } else {
        drawer.innerHTML = '';
      }
      drawer.dataset.added = '';
    }, 400);
  }
});


customElements.define('quick-view', QuickView);

class AccountDrawer extends HTMLElement {
  constructor() {
    super();
    this.drawerId = this.dataset.drawerId;
    this.drawerCloseButtons = this.querySelectorAll("[data-drawer-close]");
    this.loginTitle = this.querySelector('[data-id="#login"]');
    this.recoverTitle = this.querySelector('[data-id="#recover"]');
    this.loginView = this.querySelector("#login");
    this.recoverView = this.querySelector("#recover");

    this.openDrawer = this.openDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
    this.focusElement = null;
  }

  connectedCallback() {
    this.drawerTriggers = document.querySelectorAll(`[data-account-head][data-drawer-id="${this.drawerId}"]`);
    this.drawerTriggers.forEach(trigger => {
      trigger.addEventListener("click", this.openDrawer);
    });

    this.drawerCloseButtons.forEach((btn) => {
      btn.addEventListener("click", this.closeDrawer);
    });

    // 👇 Event bindings to toggle login/recover
    this.querySelector('[data-target-recover]')?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showRecover();
    });

    this.querySelector('[data-target-login]')?.addEventListener("click", (e) => {
      e.preventDefault();
      this.showLogin();
    });

    document.addEventListener("keydown", this.handleEscape);
  }

  openDrawer(event) {
    if (event) event.preventDefault();

    // Close other drawers
    document.querySelectorAll("account-drawer.is-visible").forEach((drawer) => {
      if (drawer !== this) {
        drawer.closeDrawer();
      }
    });

    this.classList.add("is-visible");
    document.body.classList.add("overflow-hidden");
    setTimeout(() => {
      this.focusElement = event.target;
      if (this && typeof trapFocusElements === "function") {
        trapFocusElements(this);
      }
    }, 300);

    // Default to login view
    this.showLogin();
  }

  closeDrawer(event) {
    if (event) event.preventDefault();
    this.classList.remove("is-visible");
    document.body.classList.remove("overflow-hidden");
    if (this.focusElement) {
      this.focusElement.focus();
    }
    this.focusElement = null;

  }

  handleEscape(event) {
    if (event.key === "Escape" && this.classList.contains("is-visible")) {
      this.closeDrawer();
    }
  }



  showLogin() {
    this.loginView.style.display = "block";
    this.recoverView.style.display = "none";
    if (this.loginTitle) this.loginTitle.style.display = "block";
    if (this.recoverTitle) this.recoverTitle.style.display = "none";
  }

  showRecover() {
    this.loginView.style.display = "none";
    this.recoverView.style.display = "block";
    if (this.loginTitle) this.loginTitle.style.display = "none";
    if (this.recoverTitle) this.recoverTitle.style.display = "block";
  }
}

customElements.define("account-drawer", AccountDrawer);



class AgeVerification extends HTMLElement {
  constructor() {
    super();
    this.cookieName = 'fusion:ageverification';
    this.classes = {
      bodyClass: 'age-verification-popup',
      activeClass: 'is-visible',
      closingClass: 'closing',
      hiddenClass: 'hidden'
    };
    this.popup = this;
    this.declineContent = this.querySelector('[data-decline-wrapper]');

    if (!this.getCookie(this.cookieName)) {
      this.init();
    }
    const button = this.querySelector('[data-approve-age-button]');
    if (button) button.addEventListener('click', this.close.bind(this));
    const declineButton = this.querySelector('[data-decline-age-button]');
    if (declineButton) declineButton.addEventListener('click', this.decline.bind(this));
    const backButton = this.querySelector('[data-back-button]');
    if (backButton) backButton.addEventListener('click', this.backToOriginal.bind(this));

  }
  init() {
    this.open();
  }

  open() {
    document.body.classList.remove(this.classes.bodyClass);
    this.popup.classList.add(this.classes.activeClass);
    if (this.popup.dataset.ageverification = 'true') {
      document.body.classList.add(this.classes.bodyClass);
    }
  }

  close() {
    this.popup.classList.add(this.classes.closingClass);
    setTimeout(() => {
      this.popup.classList.remove(this.classes.activeClass);
      this.popup.classList.remove(this.classes.closingClass);
      if (this.popup.dataset.ageverification = 'true') {
        document.body.classList.remove(this.classes.bodyClass);
      }
    }, 500);
    this.setCookie(this.cookieName, this.dataset.expiry);
  }

  decline() {
    this.popup.querySelector("[data-verify-wrapper]").classList.add(this.classes.hiddenClass)
    this.declineContent.classList.remove(this.classes.hiddenClass)
  }
  backToOriginal() {
    this.declineContent.classList.add(this.classes.hiddenClass);
    this.popup.querySelector("[data-verify-wrapper]").classList.remove(this.classes.hiddenClass);
  }
  getCookie(name) {
    const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return match ? match[2] : null;
  }

  setCookie(name, expiry) {
    document.cookie = `${name}=true; max-age=${(expiry * 24 * 60 * 60)}; path=/`;
  }

  removeCookie(name) {
    document.cookie = `${name}=; max-age=0`;
  }
}
customElements.define('age-verification', AgeVerification);

var ytplayerList;
function onPlayerReady(e) {
  var video_data = e.target.getVideoData(),
    label = video_data.video_id + ":" + video_data.title;
  e.target.ulabel = label;
}

function onPlayerError(e) {
  console.log("[onPlayerError]");
}
function onPlayerStateChange(e) {
  var label = e.target.ulabel;
  if (e["data"] == YT.PlayerState.PLAYING) {
    pauseOthersYoutubes(e.target);

  }

  if (e["data"] == YT.PlayerState.PAUSED) {
  }

  if (e["data"] == YT.PlayerState.ENDED) {
  }

  if (e["data"] == YT.PlayerState.BUFFERING) {
    e.target.uBufferingCount
      ? ++e.target.uBufferingCount
      : (e.target.uBufferingCount = 1);
    console.log({
      event: "youtube",
      action: "buffering[" + e.target.uBufferingCount + "]:" + e.target.getPlaybackQuality(),
      label: label

    });

    if (YT.PlayerState.UNSTARTED == e.target.uLastPlayerState) {
      pauseOthersYoutubes(e.target);
    }
  }
  if (e.data != e.target.uLastPlayerState) {
    e.target.uLastPlayerState = e.data;
  }
}

function initYoutubePlayers() {
  ytplayerList = null;
  ytplayerList = [];
  for (var e = document.getElementsByTagName("iframe"), x = e.length; x--;) {
    if (/youtube.com\/embed/.test(e[x].src)) {
      ytplayerList.push(initYoutubePlayer(e[x]));

    }
  }
}

function pauseOthersYoutubes(currentPlayer) {
  if (!currentPlayer) return;
  for (var i = ytplayerList.length; i--;) {
    if (ytplayerList[i] && ytplayerList[i] != currentPlayer) {
      ytplayerList[i].pauseVideo();
    }
  }
  document.querySelectorAll(".product-media-vimeo, iframe[src*='player.vimeo.com']").forEach((video) => {
    if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => {
    if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
    video.pause();
  });
}

function initYoutubePlayer(ytiframe) {
  var ytp = new YT.Player(ytiframe, {
    events: {
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
      onReady: onPlayerReady
    }
  });
  ytiframe.ytp = ytp;
  return ytp;
}

function onYouTubeIframeAPIReady() {
  initYoutubePlayers();
}

var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function pauseVideo(section = document) {
  document.querySelectorAll("video").forEach((video) => {
    video.onplay = function (event) {
      let checkCurrent = event.target
      document.querySelectorAll("iframe[src*='player.vimeo.com']").forEach((video) => {
        if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
        video.contentWindow.postMessage('{"method":"pause"}', "*");
      });
      document.querySelectorAll(".youtube-video,iframe[src*='www.youtube.com']").forEach((video) => {
        if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
        video.contentWindow.postMessage('{"event":"command","func":"' + "pauseVideo" + '","args":""}', "*");
      });
      document.querySelectorAll("video").forEach((video) => {
        if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
        if (checkCurrent != video) {
          video.pause();
        }

      });

    }
  });
  document.querySelectorAll(".product-media-vimeo, iframe[src*='player.vimeo.com']").forEach((video) => {
    var player = new Vimeo.Player(video);
    player.on('play', function (event) {
      let checkCurrent = event.target

      document.querySelectorAll(".product-media-youtube,.youtube-video,iframe[src*='www.youtube.com']").forEach((video) => {
        if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
        video.contentWindow.postMessage('{"event":"command","func":"' + "pauseVideo" + '","args":""}', "*");
      });
      document.querySelectorAll("video").forEach((video) => {
        if (video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
        video.pause();
      });
      if (window.ProductModel) window.ProductModel.loadShopifyXR();
    });
  });
}

function freeShippingBarProgress(totalprice) {
  if (currencyRate != null && shippingStatus == `true`) {
    let shippingText = ''
    let currencyConvertRate = Math.round(currencyRate * (Shopify.currency.rate || 1));
    let getcurrencySymbol = Shopify.currency.active;
    totalprice = totalprice / 100;
    let shippingPrice = currencyConvertRate - totalprice;
    if (shippingPrice > 0) {
      shippingPrice = shippingPrice.toFixed(2)
      let shippingpricemessage = shippingPrice + ' ' + getcurrencySymbol;
      shippingText = shippingmessage.replace('||price||', shippingpricemessage)
    } else {
      shippingText = shippingsuccessmessage;
    }
    let shippingRatePercentage = (totalprice * 100) / currencyConvertRate;
    if (shippingRatePercentage > 10 && shippingRatePercentage < 100) {
      shippingRatePercentage = parseFloat(shippingRatePercentage) - 5
    }
    else if (shippingRatePercentage > 100) {
      shippingRatePercentage = 100
    }
    shippingRatePercentage = Math.trunc(shippingRatePercentage);
    const bars = document.querySelectorAll("[data-main-shipping-bar]");
    if (bars.length > 0) {

      bars.forEach((shippingSelector) => {
        const message = shippingSelector.querySelector(".free-shipping-bar-message");
        const progress = shippingSelector.querySelector(".progress");

        if (message && progress) {
          shippingSelector.classList.remove("hidden");
          message.textContent = shippingText;
          progress.style.setProperty('--progress', `${shippingRatePercentage}%`);
        }
      });
    }
  }
}

function tabUpdate(){
  document.querySelectorAll('.filter-sort-names').forEach(label => {
  const li = label.closest('li');
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const input = li.querySelector('input[type="radio"]') ;
      if (input) {
        input.click();
      }
    }
  });
});

}

function filtertabUpdate(){
  document.querySelectorAll('.double-label,.product-variant--item').forEach(label => {
  const li = label.closest('li');
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const input = li.querySelector('input[type="checkbox"]') ;
      if (input) {
        input.click();
      }
    }
  });
});
const instock = document.querySelector("#facets-availability");
if(instock){
instock.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
     
      if (instock) {
        instock.click();
      }
    }
  });
}

}
document.addEventListener("shopify:section:load", function (section) {
  let sectiontarget = section.target;
  if (sectiontarget.querySelector('[data-parallax-media]')) {
    new universalParallax().init({
      speed: 6
    });
  }
  pauseVideo();
 

});


document.addEventListener("DOMContentLoaded", function (section = document) {

  parallaxContentMedia();
  pauseVideo();
  tabUpdate();
  filtertabUpdate();

  const clearButton = document.querySelector("[data-search-input-clear]");
  const searchInput = document.querySelector("#search-input");

  if (clearButton && searchInput) {
    clearButton.addEventListener("click", function (event) {
      event.preventDefault(); 
      searchInput.value = ""; 
      searchInput.focus();
    });
    searchInput.focus();
  }


});


class MediaGallerySlider extends HTMLElement {
  constructor() {
    super();
    this.dataId = this.dataset.id;
    this.thumbnailEnable = true;
  }

  connectedCallback() {
    if (!this.dataId) return;

    this.mainSliderContainer = this.querySelector(`[data-media-slider-${this.dataId}]`);
    this.thumbSliderContainer = this.querySelector(`[data-media-thumbs-${this.dataId}]`);
    this.socialAccounts = this.querySelectorAll('.media-gallery-social-account');

    if (!this.mainSliderContainer || !this.thumbSliderContainer) return;

    this.initSliders();
    this.bindThumbnailHover();
  }

  initSliders() {
    if (this.thumbnailEnable && this.thumbSliderContainer) {
      this.thumbSwiper = new Swiper(this.thumbSliderContainer, {
        loop: true,
        direction: "horizontal",
        spaceBetween: 10,
        slidesPerView: 6,
        freeMode: true,
        watchSlidesProgress: true,
        breakpoints: {
          768: {
            slidesPerView: 6,
          }
        },
        navigation: {
          nextEl: `.swiper-button-next-${this.dataId}`,
          prevEl: `.swiper-button-prev-${this.dataId}`,
        }
      });
    }

    this.mainSwiper = new Swiper(this.mainSliderContainer, {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 0,
      thumbs: this.thumbnailEnable && this.thumbSwiper ? { swiper: this.thumbSwiper } : undefined
    });
  }

  bindThumbnailHover() {
    if (!this.thumbnailEnable || !this.thumbSliderContainer || !this.thumbSwiper) return;

    const thumbs = this.thumbSliderContainer.querySelectorAll('.swiper-slide');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('mouseenter', () => {
        const realIndex = parseInt(thumb.dataset.swiperSlideIndex, 10);
        if (isNaN(realIndex)) return;

        if (this.mainSwiper.realIndex !== realIndex) {
          this.mainSwiper.slideToLoop(realIndex);
        }

        const slideEl = this.mainSwiper.slides[Number(realIndex)];
        if (!slideEl) return;

        const deferredMedia = slideEl.querySelector('deferred-media');
        if (deferredMedia && !deferredMedia.isLoaded) {
          deferredMedia.loadContent();
        }
      });
    });
  }
}

customElements.define("media-gallery", MediaGallerySlider);

class FooterAccordion extends HTMLElement {
  constructor() {
    super();
    this.mobileBreakpoint = 768;
    this.isMobile = window.innerWidth <= this.mobileBreakpoint;
  }

  connectedCallback() {
    this.setupAccordion();
    window.addEventListener("resize", this.onResize.bind(this));
  }

  onResize() {
    const isMobileNow = window.innerWidth <= this.mobileBreakpoint;
    if (isMobileNow !== this.isMobile) {
      this.isMobile = isMobileNow;
      this.setupAccordion();
    }
  }

  setupAccordion() {
    const headers = this.querySelectorAll("[data-accordian-head]");
    const contents = this.querySelectorAll("[data-accordian-content]");
    headers.forEach(header => {
      const cloned = header.cloneNode(true);
      header.replaceWith(cloned);
    });

    const updatedHeaders = this.querySelectorAll("[data-accordian-head]");
    const updatedContents = this.querySelectorAll("[data-accordian-content]");

    if (!this.isMobile) {
      updatedContents.forEach(content => {
        content.classList.remove("mobile-hidden");
      });
      updatedHeaders.forEach(header => {
        header.classList.remove("is-open");
      });
      return;
    }
    updatedHeaders.forEach(header => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const isAlreadyOpen = header.classList.contains("is-open");

        // Close all others
        updatedContents.forEach(c => c.classList.add("mobile-hidden"));
        updatedHeaders.forEach(h => h.classList.remove("is-open"));

        // Toggle clicked one
        if (!isAlreadyOpen) {
          content.classList.remove("mobile-hidden");
          header.classList.add("is-open");
        }
      });
    });
  }
}

customElements.define("footer-menu", FooterAccordion);

class MarqueeText extends HTMLElement {
  constructor() {
    super();

    // Resize Observer
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this._calculateDuration.bind(this));
      this.resizeObserver.observe(this);
    }

    // Mutation Observer - watch for changes to children or attributes
    this.mutationObserver = new MutationObserver(() => this._calculateDuration([{ target: this }]));
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  _calculateDuration(entries) {
    const scrollingSpeed = parseFloat(this.getAttribute("scrolling-speed") || "5");
    const entry = entries[0];
    const contentWidth = entry.target.clientWidth;
    const span = entry.target.querySelector(".scrolling-text-marquee--slide");

    if (!span) return;

    const spanWidth = span.scrollWidth;

    // Adjust duration based on content and container size
    const slowFactor = 1 + (Math.min(1600, contentWidth) - 375) / 1225;

    const duration = (scrollingSpeed * slowFactor * spanWidth / contentWidth).toFixed(3);

    this.style.setProperty("--duration", `${duration}s`);
  }
}

window.customElements.get("marquee-text") || customElements.define("marquee-text", MarqueeText);

class ProductRecentlyViewed extends HTMLElement {
  constructor() {
    super();
    const productId = parseInt(this.dataset.productId);
    const cookieName = 'fusion-recently-view-products';
    const items = JSON.parse(window.localStorage.getItem(cookieName) || '[]');
    if (!items.includes(productId)) {
      items.unshift(productId);
    }

    window.localStorage.setItem(cookieName, JSON.stringify(items.slice(0, 12)));

  }
}
customElements.define('product-recently-viewed', ProductRecentlyViewed);
class RecentlyViewProducts extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {

    fetch(this.dataset.url + this.getQueryStringData())
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('recently-view-products');
        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
          let totalitem = recommendations.querySelectorAll(".product-card-list ").length;
          if (recommendations.querySelector(".recently-view-products-wrapper").innerHTML.trim().length != 0) {
            this.closest(".shopify-section").classList.remove("hidden");
          }
          customOptionsCollection();
        }
      })
      .catch(e => {
        console.error(e);
      });

  }


  getQueryStringData() {
    const cookieName = 'fusion-recently-view-products';
    const items = JSON.parse(window.localStorage.getItem(cookieName) || "[]")
    if (this.dataset.productId && items.includes(parseInt(this.dataset.productId))) {
      items.splice(items.indexOf(parseInt(this.dataset.productId)), 1);
    }
    return items.map((item) => "id:" + item).slice(0, 10).join(" OR ");
  }
}
customElements.define('recently-view-products', RecentlyViewProducts);


document.addEventListener('DOMContentLoaded', function() {
  let lastIsMobile = null;

  function reorderMobileDivs() {
    const wrapper = document.querySelector('.main-product-wrapper');
    const tabContent = document.querySelector('.main-product-tab-content');
    const gallery = document.querySelector('product-gallery-media');
    const info = document.querySelector('.product-information--wrapper');

    if (!wrapper || !tabContent || !gallery || !info) return;

    const isMobile = window.innerWidth <= 991;
    if (isMobile === lastIsMobile) return;
    lastIsMobile = isMobile;

    if (isMobile) {
      wrapper.appendChild(tabContent);
    
    } else {
      tabContent.remove();
        wrapper.insertBefore(tabContent, wrapper.firstChild);
    }
  }
  reorderMobileDivs();
  window.addEventListener('resize', reorderMobileDivs);
  

});

const drawer = document.getElementById('drawerMobileMenu');

function openDrawer() {
  drawer.classList.add('is-active');
  drawer.setAttribute('aria-hidden', 'false');


  document.querySelectorAll('header, main, footer').forEach(el => {
    el.setAttribute('inert', 'true');  
  });


  trapFocus(drawer);
}


function closeDrawer() {
  drawer.classList.remove('is-active');
  drawer.setAttribute('aria-hidden', 'true');

  
  document.querySelectorAll('header, main, footer').forEach(el => {
    el.removeAttribute('inert');
  });
}


function trapFocus(container) {
  const focusableEls = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableEls.length) return;

  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else { // Tab only
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  });

  
  firstEl.focus();
}
  function customOptionsCollection(){
     const allOptions = document.querySelectorAll(".product-select-option .select-option");
      allOptions.forEach((button) => {
      const parent = button.closest(".product-select-option");
      const list = parent.querySelector(".product-select-list");


      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();

        
          document.querySelectorAll(".product-select-option.is-active").forEach((el) => {
            if (el !== parent) el.classList.remove("is-active");
          });

          parent.classList.toggle("is-active");

          if (parent.classList.contains("is-active")) {
            const focusable = list.querySelector("input, button, [tabindex]:not([tabindex='-1'])");
            if (focusable) focusable.focus();
          }
        }
      });
      document.addEventListener("click", (e) => {
        if (!parent.contains(e.target)) {
          parent.classList.remove("is-active");
        }
      });

      parent.addEventListener("focusout", (e) => {

        setTimeout(() => {
          if (!parent.contains(document.activeElement)) {
            parent.classList.remove("is-active");
          }
        }, 50);
      });
    });
  }
document.addEventListener("DOMContentLoaded", () => {

 customOptionsCollection();
});

function refreshFlexibleCardHeight() {
  var cards = document.querySelectorAll('.section-flexible-content .flexible_card');

  cards.forEach(function (card) {
    // reset before recalculation
    card.style.height = 'auto';

    // outerHeight equivalent (including padding + border)
    var h = card.offsetHeight;

    card.style.height = h + 'px';
  });
}

// Initial run after 1.5 seconds
setTimeout(refreshFlexibleCardHeight, 1500);

// Refresh on window resize (debounced for performance)
var resizeTimeout;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(refreshFlexibleCardHeight, 200);
});