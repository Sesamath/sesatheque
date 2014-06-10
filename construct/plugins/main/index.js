/**
 * Un constructeur du module qui ne fait rien, pour ajouter à son prototype un écouteur sur onInitialize
 * @constructor
 */
function Main() {}

/**
 * On ajoute un dust.helper à l'initialisation du framework
 */
Main.prototype.onInitialize = function(application) {
  /**
   * context contient les propriétés stack,global,blocks,templateName,
   *     on peut récupérer les paramètres passés à la vue avec context.get('param')
   * bodies contient block
   * params liste les attributs passé au helper avec {@helper attrName1=...}
   * @see https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#Writing_a_dust_helper
   */
  application.engine.helper('dump', function(chunk, context, bodies, params) {
    return chunk.write(context.get('title').toString()); // chunk.write(bodies.toJSON);
  });
  application.engine.helper('debugList', function(chunk, context, bodies, params) {
    var attrs = [], p;
    for (p in bodies.block) {
      if (bodies.block.hasOwnProperty(p)) {
        attrs.push(p);
      }
    }
    return chunk.write(bodies.block.toString()); // chunk.write(bodies.toJSON);
  });
  // ajout du panneau de debug, qui plante
  /*
  var express = require('express');
  var app = express();
  if (app.get('env') === 'development') {
    require('express-debug')(app, {extra_panels: ['nav']});
  } */
}

module.exports = Main;