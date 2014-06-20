/**
 * Notre plugin principal qui déclare le layout et surcharge le rendu
 * @constructor
 */
function Main(application) {
  application.on('initialize', function () {
    // On se met en écoute de l'évènement qui précède le rendu (dust)
    // des données sur le gestionnaire de vues.
    application.views.on('render', function (request, data) {
      // On peut ici ajouter des trucs à data pour tous les rendus
      if (!data.debug) data.debug = {};
    });

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
    application.engine.helper('dump', function (chunk, context, bodies, params) {
      var js_beautify = require('js-beautify').js_beautify;
      return chunk.write('<pre class="debug">' + js_beautify(JSON.stringify(params)) + '</pre>');
    });
    // ajout du panneau de debug, qui plante
    /* * /
     var express = require('express');
     var app = express();
     if (app.get('env') === 'development') {
     require('express-debug')(app, {extra_panels: ['nav']});
     } /* */
    //console.log('env : ' + application.get('env'));
  });
}

Main.debug = function(args) {
  console.log('fct debug');
  console.log(args);
};

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

module.exports = Main;