'use strict';

/**
 * Notre component principal (qui défini le layout et le rendu)
 * @constructor
 */
var mainComponent = lassi.Component()

mainComponent.initialize = function(next) {
  // Définition du layout "page" pour les réponses "html" (qui utilise l'engine dust et le tpl layout-page.dust).
  this.application.transports.html.on('layout', function(useLayout) {
    if (useLayout.context.status) {
      switch(useLayout.context.status) {
        case 404: useLayout(component, 'layout-page404'); break;
        case 403: useLayout(component, 'layout-page403'); break;
        default: useLayout(component, 'layout-page-error');
      }
    } else if (useLayout.context.action == lassi.action.ressource.display) {
      // le layout sans navigation ni header
      useLayout(component, 'layout-iframe');
    } else {
      useLayout(component, 'layout-page');
    }
  });

  next()

  /**
   * On ajoute un dust.helper à l'initialisation du framework
   * Cf https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   *
   * context contient les propriétés stack,global,blocks,templateName,
   *     on peut récupérer les paramètres passés à la vue avec context.get('param')
   * bodies contient block
   * params liste les attributs passé au helper avec {@helper attrName1=...}
   * @see https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   * this.application.templateEngines.dust existe plus /
  this.application.templateEngines.dust.helper('dump', function (chunk, context, bodies, params) {
    var js_beautify = require('js-beautify').js_beautify;
    return chunk.write('<pre class="debug">' + js_beautify(JSON.stringify(params)) + '</pre>');
  }); /**/
}

module.exports = mainComponent;
