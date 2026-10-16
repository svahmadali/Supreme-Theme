window.ProductModel = {
  loadShopifyXR() {
    Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: this.setupShopifyXR.bind(this),
      },
      {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: (function() {
              document.querySelectorAll('.product-media-model').forEach((model) => {
                  let model3D = model.querySelector('model-viewer');
                
                  model.modelViewerUI = new Shopify.ModelViewerUI(model3D);
                  model3D.addEventListener('shopify_model_viewer_ui_toggle_play', function(evt) {
                      model.querySelectorAll('.model-button-closeviewon').forEach(el => {
                          el.classList.remove('hidden');
                      });
                      document.querySelectorAll("iframe[src*='www.youtube.com']").forEach((video) => {
                           if(video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
                              video.contentWindow.postMessage('{"event":"command","func":"' + "pauseVideo" + '","args":""}',"*");
                          
                      });
                      document.querySelectorAll("iframe[src*='player.vimeo.com']").forEach((video) => {
                         if(video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
                             video.contentWindow.postMessage('{"method":"pause"}', "*");
                          
                      });
                      document.querySelectorAll("video").forEach((video) => {
                         if(video.getAttribute('data-autoplay') == 'true' || video.hasAttribute('autoplay')) return false;
                              video.pause();
                          
                      });
                  }.bind(this));

                  model3D.addEventListener('shopify_model_viewer_ui_toggle_pause', function(evt) {
                      model.querySelectorAll('.close-product-model').forEach(el => {
                          el.classList.add('hidden');
                      });
                      
                  }.bind(this));

                  model.querySelectorAll('.close-product-model').forEach(el => {
                      el.addEventListener('click', function() {
                          if (model3D) {
                              model.modelViewerUI.pause();
                          }
                      }.bind(this))
                  });

              });

          })
      }
    ]);
  },
  setupShopifyXR(errors) {
    if (errors) return;
    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', () =>this.setupShopifyXR());
      return;
    }
    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
    });
    window.ShopifyXR.setupXRElements();

  }

};

window.addEventListener('DOMContentLoaded', () => { 
  if (window.ProductModel)  window.ProductModel.loadShopifyXR();
});