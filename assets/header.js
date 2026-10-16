class MainHeader extends HTMLElement {
      constructor() {
        super();
        this.currentScrollTop = 0;
        if(this.classList.contains('on_scroll_up')){
          window.addEventListener('scroll', this.onScroll.bind(this), false);
        }
  
        window.addEventListener('scroll', this.announcementHeightCal.bind(this), false);
        window.addEventListener('scroll', this.transparentHeader.bind(this), false);
        this.addEventListener('mouseover', this.transparentHeaderAdd.bind(this), false);
        this.addEventListener('mouseout', this.transparentHeaderRemove.bind(this), false);
      }
      
      
      onScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.headerHeight = this?.getBoundingClientRect().height.toFixed(2) || 0;
        if (scrollTop > 100) {
          if (scrollTop > this.currentScrollTop) {
            this.classList.add('header-sticky-hide');
            document.body.style.setProperty('--header-height', `0px`);
          } else {
            this.classList.remove('header-sticky-hide');
            document.body.style.setProperty('--header-height', `${this.headerHeight}px`); 
          }
        } else {
          this.classList.remove('header-sticky-hide');
          document.body.style.setProperty('--header-height', `${this.headerHeight}px`);
        }
        
        this.currentScrollTop = scrollTop;
      }
       announcementHeightCal(){
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          document.body.style.setProperty('--announcement-height', `${Math.max((this.announcementHeight - scrollTop),0)}px`);
          
        }
       headerHeightupdate() {
          this.announcementHeight = document.querySelector('.announcement-bar')?.getBoundingClientRect().height.toFixed(2) || 0;
          this.headerHeight = this.getBoundingClientRect().height.toFixed(2) || 0;
          document.body.style.setProperty('--announcement-height', `${this.announcementHeight}px`);
          document.body.style.setProperty('--header-height', `${this.headerHeight}px`);
      }
       transparentHeader() {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          if(this.classList.contains('transparent')){
            if (scrollTop > 110) {
                this.classList.add('background-header-color')
            } else {
                this.classList.remove('background-header-color')
            }
          }
          
          this.currentScrollTop = scrollTop;
        }
        transparentHeaderAdd(){        
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
           if (scrollTop <= 110 && this.classList.contains('transparent') && !this.classList.contains('background-header-color')) {
              this.classList.add('background-header-color')
           }
        }
        transparentHeaderRemove(){        
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
           if (scrollTop <= 110 && this.classList.contains('transparent') && this.classList.contains('background-header-color')) {
              this.classList.remove('background-header-color')
           }
        }
  
    }

customElements.define('main-header', MainHeader);
class HeaderDrawerMenu extends HTMLElement {
  constructor() {
    super();
    this.headerSection = this.closest('.main-header-section');
    this.closeBtns = this.querySelectorAll('[data-close-drawer]');
    this.drawerBtns = this.headerSection?.querySelectorAll('[data-drawer-head]') || [];
    this.lastFocusedElement =""
    // Attach close events
    this.closeBtns.forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => this.closeDrawer());
    });

    // Attach toggle events to each drawer button
    this.drawerBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.toggleDrawer(e,btn));
    });

    this.subMenuEvents();
  } 

  toggleDrawer(event,clickedBtn) {
    const isActive = this.classList.contains('is-visible');

    if (isActive) {
      this.closeDrawer();
    } else {
      this.openDrawer(event,clickedBtn);
       
    }
  }

  openDrawer(event,clickedBtn) {
    document.body.classList.add('overflow-hidden');
    this.classList.add('is-visible');
    this.drawerBtns.forEach(btn => btn.classList.add('is-active'));
    this.lastFocusedElement = clickedBtn;
    setTimeout(() => {
        focusElement = event.target;
        trapFocusElements(this);
      }, 300);
    
  }

  closeDrawer() {
    document.body.classList.remove('overflow-hidden');
    this.classList.remove('is-visible');
    this.drawerBtns.forEach(btn => btn.classList.remove('is-active'));
    const menuelement = document.querySelector("header-drawer button")

    // Close submenus after short delay (for animations)
    setTimeout(() => {
      this.querySelectorAll('[data-submenu-wrapper].is-active').forEach(subMenu => {
        subMenu.classList.remove('is-active');
      });

      this.querySelectorAll('[data-grand-submenu-wrapper].is-active').forEach(grandMenu => {
        grandMenu.classList.remove('is-active');
      });
    }, 400);
 
      setTimeout(() => {
       menuelement.focus();
        this.lastFocusedElement = '';
      }, 500);
  }

subMenuEvents() {
  // Toggle Submenu
  this.querySelectorAll('[data-submenu-open]').forEach(subMenu => {
    subMenu.addEventListener('click', () => {
      const wrapper = subMenu.closest('[data-menu-link]');
      const subMenuWrapper = wrapper?.querySelector('[data-submenu-wrapper]');

      // Close other submenu wrappers and remove active from other wrappers and triggers
      this.querySelectorAll('[data-submenu-wrapper].is-active').forEach(el => {
        if (el !== subMenuWrapper) el.classList.remove('is-active');
      });

      this.querySelectorAll('[data-submenu-open].is-active').forEach(el => {
        if (el !== subMenu) el.classList.remove('is-active');
      });

      this.querySelectorAll('[data-menu-link].is-active').forEach(el => {
        if (el !== wrapper) el.classList.remove('is-active');
      });

      // Toggle current submenu and add active class to trigger and parent
      subMenuWrapper?.classList.toggle('is-active');
      subMenu.classList.toggle('is-active');
      wrapper?.classList.toggle('is-active');
    });
  });

  // Toggle Grand Submenu
  this.querySelectorAll('[data-grand-submenu-toggle]').forEach(grandToggle => {
    grandToggle.addEventListener('click', () => {
      const wrapper = grandToggle.closest('[data-submenu-link]');
      const grandWrapper = wrapper?.querySelector('[data-grand-submenu-wrapper]');

      // Close other grand submenu wrappers and remove active from others
      this.querySelectorAll('[data-grand-submenu-wrapper].is-active').forEach(el => {
        if (el !== grandWrapper) el.classList.remove('is-active');
      });

      this.querySelectorAll('[data-grand-submenu-toggle].is-active').forEach(el => {
        if (el !== grandToggle) el.classList.remove('is-active');
      });

      this.querySelectorAll('[data-submenu-link].is-active').forEach(el => {
        if (el !== wrapper) el.classList.remove('is-active');
      });

      // Toggle current grand submenu and add active class to trigger and parent
      grandWrapper?.classList.toggle('is-active');
      grandToggle.classList.toggle('is-active');
      wrapper?.classList.toggle('is-active');
    });
  });
}

}

customElements.define('header-menu-drawer', HeaderDrawerMenu);


class MobileHamburgerMenu extends HTMLElement {
  constructor() {
    super();
    this.body = document.body;
    this.header = document.querySelector("header");
    this.mobileHamburgerElements = document.querySelectorAll("[data-hamburger-mobile]");
    this.mobileMenus = document.querySelectorAll(".mobile-menus-item");
    this.backToNavElements = document.querySelectorAll("[data-backtonav-items], [data-subbacktonav-items]");
    this.closeElements = document.querySelectorAll("[data-mobile-menu-close]");
    this.lastFocusedElement = ""
  }

  connectedCallback() {
    this.initHamburgerMenu();
    this.initMobileMenuItems();
    this.initMenuCloseTriggers();
    this.handleResize();
  
  }

  initHamburgerMenu() {
    this.mobileHamburgerElements.forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        const drawerSelector = element.getAttribute("href");
        const contentDrawerContainer = document.querySelector(drawerSelector);

        if (element.classList.contains("active")) {
          this.closeMenu(element, contentDrawerContainer);
        } else {
          element.classList.add("active");
          this.body.classList.add("overflow-hidden", "mobile-menu-active");
          contentDrawerContainer.classList.add("is-active");
        }
        
        setTimeout(() => {
           focusElement = event.target;
            trapFocusElements(contentDrawerContainer);
          }, 300);
      });
    });
  }

  initMenuCloseTriggers() {
    this.closeElements.forEach((closeBtn) => {
      closeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const drawerSelector = closeBtn.getAttribute("data-mobile-menu-close");
        const contentDrawerContainer = document.querySelector(drawerSelector);
        this.mobileHamburgerElements.forEach(el => el.classList.remove("active"));
        this.body.classList.remove("mobile-menu-active", "overflow-hidden");
        if (contentDrawerContainer) {
          contentDrawerContainer.classList.remove("is-active");
        }
        setTimeout(() => {
          focusElement.focus();
        this.lastFocusedElement = '';
      }, 300);
      });
    });
  }

  initMobileMenuItems() {
    this.mobileMenus.forEach((menuItem) => {
      menuItem.addEventListener("click", () => {
        const container = menuItem.closest("[data-child-items]");
        if (container) {
          container.classList.add("active");
        }
      });
    });

    this.backToNavElements.forEach((backItem) => {
      backItem.addEventListener("click", (event) => {
        const details = event.target.closest("details[open]");
        const activeChild = event.target.closest("[data-child-items].active");

        if (details) details.removeAttribute("open");
        if (activeChild) activeChild.classList.remove("active");
      });
    });
  }

  handleResize() {
    window.addEventListener("resize", () => {
      if (window.innerWidth > 991 && this.body.classList.contains("mobile-menu-active")) {
        this.body.classList.remove("mobile-menu-active", "overflow-hidden");
        document.querySelectorAll("[data-hamburger-mobile]").forEach(el => el.classList.remove("active"));
        document.querySelectorAll("[data-mobile-drawer-content]").forEach(drawer => drawer.classList.remove("is-active"));
      }
    });
  }

  closeMenu(triggerElement, drawerElement) {
    this.body.classList.remove("overflow-hidden", "mobile-menu-active");
    triggerElement.classList.remove("active");
    if (drawerElement) {
      drawerElement.classList.remove("is-active");
    }
    
     
  }
}

customElements.define("mobile-hamburger-menu", MobileHamburgerMenu);












