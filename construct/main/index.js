'use strict';

/**
 * Notre component principal (qui défini le layout et le rendu)
 * @constructor
 */
var mainComponent = lassi.Component()

function setLayout(useLayout) {
  var ctx = useLayout.context
  if (ctx.status) {
    switch(ctx.status) {
      case 404: useLayout(mainComponent, 'layout-page404'); break;
      case 403: useLayout(mainComponent, 'layout-page403'); break;
      default: useLayout(mainComponent, 'layout-page-error');
    }
  } else if (ctx.forceLayout) {
    useLayout(mainComponent, ctx.forceLayout);
  } else {
    useLayout(mainComponent, 'layout-page');
  }
}

mainComponent.initialize = function(next) {
  // un écouteur pour l'affectation du bon layout aux réponses "html"
  this.application.transports.html.on('layout', setLayout);
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
    return chunk.write('<pre class="debug">' + JSON.stringify(params, null, 2) + '</pre>');
  }); /**/
}

/**
 * Ajoute un message flash en session (qui sera affiché au prochain rendu html du layout page)
 * @param ctx
 * @param message
 * @param level
 */
mainComponent.addFlashMessage = function(ctx, message, level) {
  if (!ctx || !ctx.session) return
  if (!level) level = 'notice'
  if (!ctx.session.flash) ctx.session.flash = {}
  if (!ctx.session.flash[level]) ctx.session.flash[level] = []
  ctx.session.flash[level].push(message)
}

module.exports = mainComponent;
