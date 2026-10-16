(function () {
  var root = document.querySelector('[data-custom-build-configurator]');
  if (!root) return;

  var backgroundImageUrl = root.getAttribute('data-configurator-bg');
  if (backgroundImageUrl) {
    root.style.backgroundImage = 'url("' + backgroundImageUrl + '")';
  }

  var pillButtons = Array.prototype.slice.call(root.querySelectorAll('[data-configurator-pill]'));
  var continueButton = root.querySelector('[data-configurator-continue]');
  var twoPiecePanel = root.querySelector('[data-two-piece-panel]');
  var twoPieceViewer = root.querySelector('[data-two-piece-viewer]');
  var modelViewer = root.querySelector('.configurator-model-viewer');
  var modelLoader = root.querySelector('[data-configurator-model-loader]');
  var mobileMenuToggle = root.querySelector('[data-configurator-mobile-menu-toggle]');
  var mobileMenuBackdrop = root.querySelector('[data-configurator-mobile-menu-backdrop]');
  var mobileBreakpoint = window.matchMedia('(max-width: 768px)');
  if (!pillButtons.length) return;

  function setModelLoadingState(isLoading) {
    root.classList.toggle('is-model-loading', isLoading);
    if (modelLoader) {
      modelLoader.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    }
  }

  function isModelReady() {
    if (!modelViewer) return true;
    return !!(modelViewer.model || modelViewer.loaded);
  }

  function syncModelLoadingState() {
    if (!modelViewer || !twoPieceViewer || twoPieceViewer.hidden) {
      setModelLoadingState(false);
      return;
    }

    setModelLoadingState(!isModelReady());
  }

  function isMobileViewport() {
    return mobileBreakpoint.matches;
  }

  function setMobileMenuState(isOpen) {
    root.classList.toggle('is-mobile-menu-open', isOpen);
    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function updateViewState() {
    var selected = pillButtons[selectedIndex()];
    if (!selected) return;

    // Only Type (2/3 piece) selection should drive the 2-piece/3-piece view toggle.
    // Other submenu pills (Fit/Style/Fabric) share the same pill component, so we ignore those.
    var selectedText = selected.textContent.replace(/\s+/g, ' ').trim();
    var isTwoPieceView = selectedText.indexOf('TWO PIECE SUIT') === 0;
    var isThreePieceView = selectedText.indexOf('THREE PIECE SUIT') === 0;

    if (!isTwoPieceView && !isThreePieceView) return;

    root.classList.toggle('is-two-piece-view', isTwoPieceView);

    if (!isTwoPieceView) {
      setMobileMenuState(false);
    }

    if (twoPiecePanel) {
      twoPiecePanel.hidden = !isTwoPieceView;
    }

    if (twoPieceViewer) {
      twoPieceViewer.hidden = !isTwoPieceView;
    }

    syncModelLoadingState();
  }

  function setSelected(index, focusButton) {
    pillButtons.forEach(function (button, idx) {
      var isSelected = idx === index;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (focusButton && isSelected) {
        button.focus();
      }
    });

    updateViewState();
  }

  function selectedIndex() {
    var selected = pillButtons.findIndex(function (button) {
      return button.classList.contains('is-selected');
    });
    return selected === -1 ? 0 : selected;
  }

  pillButtons.forEach(function (button, index) {
    button.addEventListener('click', function () {
      setSelected(index, false);
    });

    button.addEventListener('keydown', function (event) {
      var current = selectedIndex();
      var next = current;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          next = (current + 1) % pillButtons.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          next = (current - 1 + pillButtons.length) % pillButtons.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = pillButtons.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      setSelected(next, true);
    });
  });

  if (continueButton) {
    continueButton.addEventListener('click', function () {
      var selected = pillButtons[selectedIndex()];
      if (!selected) return;
      root.dispatchEvent(
        new CustomEvent('configurator:continue', {
          bubbles: true,
          detail: {
            selectedLabel: selected.textContent.trim(),
            selectedIndex: selectedIndex()
          }
        })
      );
    });
  }

  // Submenu handling
  var sideMenuItems = Array.prototype.slice.call(root.querySelectorAll('[data-configurator-side-item]'));
  var submenus = Array.prototype.slice.call(root.querySelectorAll('[data-configurator-submenu]'));
  var sidePanelMiddle = root.querySelector('.configurator-side-panel-middle');
  var submenuKeyMap = {
    'TYPE': 'type',
    'FIT': 'fit',
    'STYLE': 'style',
    'SHOULDER PAD': 'shoulder-pad',
    'FABRIC': 'fabric',
    'LAPEL STYLE': 'lapel-style',
    'LAPEL BUTTON HOLE': 'lapel-button-hole',
    'JACKET BUTTON STYLE / COLOR': 'jacket-button-style',
    'SLEEVE BUTTON': 'sleeve-button',
    'JACKET POCKETS': 'jacket-pockets',
    'JACKET VENTS': 'jacket-vents',
    'ADD PICKSTITCH': 'add-pickstitch',
    'PICKSTITCH COLOR': 'pickstitch-color',
    'LINING MATERIAL': 'lining-material',
    'MONOGRAM': 'monogram'
  };

  function showSubmenu(submenuKey) {
    submenus.forEach(function (submenu) {
      var isTarget = submenu.getAttribute('data-configurator-submenu') === submenuKey;
      submenu.hidden = !isTarget;
    });
    // Show the middle panel when a submenu is displayed
    if (sidePanelMiddle) {
      sidePanelMiddle.classList.add('is-active');
    }
  }

  function hideAllSubmenus() {
    submenus.forEach(function (submenu) {
      submenu.hidden = true;
    });
    // Hide the middle panel when all submenus are hidden
    if (sidePanelMiddle) {
      sidePanelMiddle.classList.remove('is-active');
    }
  }

  // Initialize: hide all submenus on page load
  hideAllSubmenus();

  sideMenuItems.forEach(function (item) {
    item.addEventListener('click', function () {
      // Update active state for left menu
      sideMenuItems.forEach(function (i) {
        i.classList.remove('is-active');
      });
      item.classList.add('is-active');

      // Show corresponding submenu
      var label = item.querySelector('.configurator-side-panel-item-label');
      if (!label) return;
      var itemText = label.textContent.trim();
      var submenuKey = submenuKeyMap[itemText];
      if (submenuKey) {
        showSubmenu(submenuKey);
      }
    });
  });

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function () {
      if (!isMobileViewport() || !root.classList.contains('is-two-piece-view')) return;
      var isOpen = root.classList.contains('is-mobile-menu-open');
      setMobileMenuState(!isOpen);
    });
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', function () {
      setMobileMenuState(false);
    });
  }

  if (mobileBreakpoint.addEventListener) {
    mobileBreakpoint.addEventListener('change', function (event) {
      if (!event.matches) {
        setMobileMenuState(false);
      }
    });
  } else if (mobileBreakpoint.addListener) {
    mobileBreakpoint.addListener(function (event) {
      if (!event.matches) {
        setMobileMenuState(false);
      }
    });
  }

  if (modelViewer) {
    modelViewer.addEventListener('load', function () {
      setModelLoadingState(false);
    });

    modelViewer.addEventListener('error', function () {
      setModelLoadingState(false);
    });
  }

  syncModelLoadingState();

})();

