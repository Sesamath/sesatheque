'use strict';
/*global lassi*/

/**
 * Notre plugin principal (qui exporte le layout et surcharge le rendu)
 * @constructor
 */
var mainPlugin = lassi.Plugin()
  .initialize(function() {

    // Définition du layout "page" pour les réponses "html".
    this.defineLayout('page', 'html', 'layout-page');

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
     */
    this.application.renderers.html.helper('dump', function (chunk, context, bodies, params) {
      var js_beautify = require('js-beautify').js_beautify;
      return chunk.write('<pre class="debug">' + js_beautify(JSON.stringify(params)) + '</pre>');
    });
  });

mainPlugin.dump = function(title, obj) {
  console.log(title);
  if (obj) console.log(obj);
};

module.exports = mainPlugin;

/**
 *
 * @param render une objet qui contient notamment
 * application
 * body : le corp du post (sinon vide)
 * headers
 * method
 * next (fct)
 * originalUrl
 * params
 * query
 * res, res.req
 * route.path, route.stack, route.methods
 * session.cookie
 * sessionID
 * statusCode
 * url
 * /
Main.prototype.onRender = function(render) {
  console.log("event onRender");
  return this;
  render.next();
  //return render.res;
  //console.log(render.res.req);
  //render.res.write("on ajoute ça au onRender");
};
/* */

// module.exports = Main;
