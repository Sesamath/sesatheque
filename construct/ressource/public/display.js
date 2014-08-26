/**
 * Le chargeur générique pour l'affichage de toutes les ressources
 * appelé avant les plugins (c'est sa fct load qui chargera le bon)
 */
/* global window, define, require */

// deux raccourcis
var w = window;
var wd = window.document;

/**
 * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
 * @param msg Le message à afficher
 * @param obj Un objet éventuel dont on veut le dump en console
 */
function log(msg, obj) {
  if (!console || !console.log) return;
  console.log(msg);
  if (obj) console.log(obj);
}

/**
 * Ajoute une css dans le <head> courant
 * @param file le chemin du fichier css relatif au dossier du plugin
 */
window.addCss = function (file) {
  var elt = window.document.createElement("link");
  elt.rel = "stylesheet";
  elt.type = "text/css";
  elt.href = '{pluginBaseUrl}/' + file;
  wd.getElementsByTagName("head")[0].appendChild(elt);
}

/**
 * Ajoute un élément html de type tag à parent
 * @param {HTMLElement} parent
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} content
 */
window.addElt = function (parent, tag, attrs, content) {
  var elt = w.getElt(tag, attrs, content)
  parent.appendChild(elt);
}

/**
 * Retourne un élément html de type tag
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} txtContent
 */
window.getElt = function (tag, attrs, txtContent) {
  var elt = wd.createElement(tag);
  var attr
  if (attrs) for (attr in attrs) {
    if (attrs.hasOwnProperty(attr)) elt[attr] = attrs[attr]
  }
  if (txtContent) elt.appendChild(wd.createTextNode(txtContent));
  return elt;
}

/** Le conteneur html pour afficher la ressource */
window.container = window.document.getElementById('display');
/** Le conteneur html pour afficher d'éventuelles erreurs */
window.errorsContainer = window.document.getElementById('errors');

define({
  load: function (options, ressource) {
    log('init display', options)
    init(options)
    // tente de charger le plugin du type de ressource
    var name = options.pluginName;
    require([name], function (plugin) {
      try {
        if (typeof plugin === 'undefined') throw new Error('Le chargement du plugin ' +name +' a échoué');
        if (typeof plugin.display !== 'function') throw new Error('Le plugin ' +name +" n'a pas de méthode display");
        w.container.innerHTML = '';
        var cbName = w.frameElement && w.frameElement.getAttribute &&
            w.frameElement.getAttribute('data-resultCallbackName')
        if (typeof w[cbName] === 'function') plugin.display(ressource, w.container, w[cbName]);
        else plugin.display(ressource, w.container);
      } catch(error) {
        w.errorsContainer.innerHTML = error.toString();
      }
    });
  }
});

/**
 * Initialise les chemins des librairies pour require
 * @param options
 * @private
 */
function init(options) {
  var vbu = options.vendorsBaseUrl;
  // on exporte aux plugins ces fcts que l'on met dans de dom global
  /** en prod on envoie rien en console */
  if (options.isDev) w.log = log;
  else w.log = function () { return; };
  w.baseUrl = options.pluginBaseUrl;
  // on vérifie que l'on a nos containers et on les créé sinon
  if (!w.errorsContainer) {
    w.errorsContainer = w.getElt('div', {id:'errors', class:'error'});
    w.addElt(wd.getElementsByName('body')[0], w.errorsContainer)
  }
  if (!w.container) {
    w.container = w.getElt('div', {id:'display'})
    wd.getElementsByName('body')[0].appendChild(w.container)
  }
  // et on configure requireJs avec une liste de librairies que l'on met à dispo des plugins
  require.config({
    baseUrl     : options.baseUrl,
    paths: {
      Resultat    : vbu +'/sesamath/Resultat',
      head        : vbu +'/headjs/head.1.0',
      head10      : vbu +'/headjs/head.1.0',
      head_load   : vbu +'/headjs/head.load.1.0',
      head_load10 : vbu +'/headjs/head.load.1.0',
      jquery      : vbu +'/jquery/jquery-2.1.1.min',
      jquery211   : vbu +'/jquery/jquery-2.1.1.min',
      swfobject   : vbu +'/swfobject/swfobject.2.2',
      sesaswf     : vbu +'/sesamath/swf',
      sesalog     : vbu +'/sesamath/log',
      underscore  : vbu +'/underscore/underscore.1.6',
      underscore16: vbu +'/underscore/underscore.1.6',
      jqueryUi    : vbu +'/jqueryUi/jquery-ui-1.11.1/jquery-ui.min',
      jqueryUi1111: vbu +'/jqueryUi/jquery-ui-1.11.1/jquery-ui.min'
    }
  });
}
