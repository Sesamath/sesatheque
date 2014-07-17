'use strict';

/**
 * Notre component principal (qui défini le layout et le rendu)
 * @constructor
 */
var mainComponent = lassi.Component();

mainComponent.onInitialize = function(next) {
  // Définition du layout "page" pour les réponses "html" (qui utilise l'engine dust et le tpl layout-page.dust).
  this.application.transports.html.defineLayout('page', this, 'layout-page');
  next()

  /* On se met en écoute de l'évènement qui précède le rendu (dust)
   * des données sur le gestionnaire de vues.
  this.application.controllers.on('renderLayout', function(data) {
    // On peut ici ajouter des trucs à data pour tous les rendus
    // mais data vaut undefined...
    // if (!data.debug) data.debug = {};
  }); /* */

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
