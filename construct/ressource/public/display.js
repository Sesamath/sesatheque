/**
 * Le chargeur générique pour l'affichage de toutes les ressources
 * appelé avant les plugins (c'est sa fct load qui chargera le bon)
 */
/* global window, define, require */

// deux raccourcis
var w = window;
var wd = window.document;
/** Le préfixe à utiliser pour charger des éléments dans le dossier du plugin (sans slash final) */
var baseUrl;
/** Le conteneur html pour afficher la ressource */
var container = window.document.getElementById('display');
/** Le conteneur html pour afficher d'éventuelles erreurs */
var errorsContainer = window.document.getElementById('errors');

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
 * @param {string}   file              le chemin du fichier css relatif au dossier du plugin
 * @param {boolean=} [isRootRel=false] passer true si le chemin ne doit pas être préfixé par le dossier du plugin
 */
window.addCss = function (file, isRootRel) {
  var elt = window.document.createElement("link");
  elt.rel = "stylesheet";
  elt.type = "text/css";
  elt.href = (isRootRel ? '' : baseUrl) +'/' + file;
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


define({
  load: function (ressource, options) {
    log('init display', options)
    // init du dom
    init(options)

    // tente de charger le plugin du type de ressource
    var name = options.pluginName;
    require([name], function (plugin) {
      try {
        if (typeof plugin === 'undefined') throw new Error('Le chargement du plugin ' +name +' a échoué');
        if (typeof plugin.display !== 'function') throw new Error('Le plugin ' +name +" n'a pas de méthode display");
        container.innerHTML = '';
        errorsContainer.innerHTML = '';
        var displayOptions = {
          baseUrl : options.baseUrl,
          vendorsBaseUrl : options.vendorsBaseUrl,
          container : container,
          errorsContainer: errorsContainer
        };
        // on regarde si on nous file un saveResult dans l'attribut data-resultCallbackName de notre iframe
        var cbName = w.frameElement && w.frameElement.getAttribute &&
            w.frameElement.getAttribute('data-resultCallbackName')
        if (cbName && typeof w[cbName] === 'function') displayOptions.resultCallback = w[cbName];
        displayOptions.resultCallback = log; // pour debug
        // on peut afficher
        plugin.display(ressource, displayOptions);
      } catch(error) {
        errorsContainer.innerHTML = error.toString();
      }
    });
  }
});

/**
 * helper de load, initialise les chemins des librairies pour les require des plugins
 * @param options
 * @private
 */
function init(options) {
  baseUrl = options.baseUrl;
  var vbu = options.vendorsBaseUrl;
  // on exporte aux plugins ces fcts que l'on met dans de dom global
  /** en prod on envoie rien en console */
  if (options.isDev) w.log = log;
  else w.log = function () { return; };
  // on vérifie que l'on a nos containers et on les créé sinon
  if (!errorsContainer) {
    errorsContainer = w.getElt('div', {id:'errors', class:'error'});
    w.addElt(wd.getElementsByName('body')[0], errorsContainer)
  }
  if (!container) {
    container = w.getElt('div', {id:'display'})
    wd.getElementsByName('body')[0].appendChild(container)
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
      jquery171   : vbu +'/jquery/jquery-1.7.1.min',
      jquery211   : vbu +'/jquery/jquery-2.1.1.min',
      swfobject   : vbu +'/swfobject/swfobject.2.2',
      // un module pour charger un swf, qui contient swfobject, avec une méthode load(container, url, options, next)
      sesaswf     : vbu +'/sesamath/swf',
      sesalog     : vbu +'/sesamath/log',
      underscore  : vbu +'/underscore/underscore.1.6',
      underscore16: vbu +'/underscore/underscore.1.6',
      jqueryUi    : vbu +'/jqueryUi/jquery-ui-1.11.1/jquery-ui.min',
      jqueryUi1111DialogRedmond : vbu +'/jqueryUi/jquery-ui-1.11.1.dialogRedmond/jquery-ui.min',
      jqueryUi1111: vbu +'/jqueryUi/jquery-ui-1.11.1/jquery-ui.min'
    }
    // pour jQueryUi faut charger les css, on pourrait créer un miniModule qui s'en charge pour chaque version
    // mais c'est assez lourd, faut lui passer le chemin toussa, on laisse celui qui charge s'en occuper
    /*
    , shim :{
      jqueryUi    : {
        deps : [vbu +'/jqueryUi/jquery-ui-1.11.1/loadCss']
      }
    } /* */
  });
}
