/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

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

/** Le conteneur du picto enregistrement */
var divFeedback = window.document.getElementById('pictoFeedback');
function feedbackOff() {
  divFeedback.className = 'feedbackOff'
}
function feedbackOk() {
  divFeedback.className = 'feedbackOk'
  setTimeout(feedbackOff, 4000);
}
function feedbackKo() {
  divFeedback.className = 'feedbackKo'
  setTimeout(feedbackOff, 4000);
}

/**
 * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
 * @type {number}
 */
var ajaxTimeout = 10000;

/**
 * On ajoute les fcts addCss, addElement, getElement en global
 * log est ajouté par init (dépend du contexte)
 */


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
window.addElement = function (parent, tag, attrs, content) {
  var elt = w.getElement(tag, attrs, content)
  parent.appendChild(elt);
}

/**
 * Retourne un élément html de type tag
 * @param {string} tag
 * @param {Object=} attrs Les attributs
 * @param {string=} txtContent
 */
window.getElement = function (tag, attrs, txtContent) {
  var elt = wd.createElement(tag);
  var attr
  if (attrs) for (attr in attrs) {
    if (attrs.hasOwnProperty(attr)) {
      if (attr === 'class') elt.className = attrs[attr]
      else elt[attr] = attrs[attr]
    }

  }
  if (txtContent) elt.appendChild(wd.createTextNode(txtContent));

  return elt;
}

/**
 * Affiche un texte d'erreur dans errorsContainer (écrase l'éventuel message précédent)
 * @param errorMsg {string} Le message à afficher
 */
window.setError = function (errorMsg) {
  // on ajoute un peu de margin à ce div qui n'en avait pas
  if (!errorsContainer.style) errorsContainer.style = {};
  errorsContainer.style.margin = "0.2em"
  errorsContainer.textContent = errorMsg;
}

/**
 * Cache le titre (en global pour que les plugins puissent le faire)
 */
window.hideTitle = function () {
  var titre = wd.getElementById('titre');
  if (titre) titre.style = "display: none";
  /* log(titre ? "titre masqué" : "demande de masquage mais titre non trouvé");
  log(titre); */
}

/**
 * Ces fonctions sont celles de notre module js
 */

define({
  /**
   * Charge une ressource et le plugin qui la gère, puis appelle la methode display du plugin
   * @param ressource
   * @param options
   */
  load: function (ressource, options) {
    log('display.load avec la ressource', ressource)
    log('et les options', options);
    // init du dom
    init(options);

    // tente de charger le plugin du type de ressource
    var name = options.pluginName;
    var modules = [name];
    var urlResultat = getURLParameter("urlScoreCallback");
    if (urlResultat) modules.push('Resultat');
    require(modules, function (plugin, Resultat) {
      try {
        if (typeof plugin === 'undefined') throw new Error('Le chargement du plugin ' +name +' a échoué');
        if (typeof plugin.display !== 'function') throw new Error('Le plugin ' +name +" n'a pas de méthode display");
        container.innerHTML = '';
        errorsContainer.innerHTML = '';

        // On vire le titre si on nous le demande via un param dans l'url
        if (/\?.*showTitle=0/.test(wd.URL)) {
          w.hideTitle();
        }

        var displayOptions = {
          baseUrl : options.baseUrl,
          vendorsBaseUrl : options.vendorsBaseUrl,
          container : container,
          errorsContainer: errorsContainer
        };
        if (options.isDev) displayOptions.isDev = options.isDev;
        // on regarde s'il faut ajouter une fct de sauvegarde des résultats
        if (Resultat) addSaveResultat(displayOptions, urlResultat, Resultat);
        // on peut afficher
        plugin.display(ressource, displayOptions, function (arg) {
          log("le display a terminé et a renvoyé", arg);
        });
      } catch(error) {
        w.setError(error.toString());
      }
    });
  }
});

/**
 * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
 * Sera mis en global par init si on est en dev (sinon la fonction existera mais ne fera rien)
 * @param msg Le message à afficher
 */
function log(msg) {
  if (console && console.log) {
    console.log(msg);
    for (var i = 1; i < arguments.length; i++) {
      console.log(arguments[i]);
    }
  }
}

/**
 * Récupère un paramètre de l'url courante
 * Inspiré de http://stackoverflow.com/a/11582513
 * @param name Le nom du paramètre
 * @returns Sa valeur (ou null s'il n'existait pas)
 */
function getURLParameter(name) {
  // log("getURLParameter(" +name +") sur " +window.location.search);
  var regexp = new RegExp('[?|&]' + name + '=([^&#]+?)(&|#|$)');
  var param = regexp.exec(window.location.search)
  if (param) {
    param = decodeURIComponent(param[1].replace(/\+/g, '%20'));
  }
  return param;
}

/**
 * helper de load, initialise les chemins des librairies pour les require des plugins
 * @param options
 * @private
 */
function init(options) {
  // le ctx.metas.addCss('styles/ressourceDisplay.css') marche pas, on ajoute notre css ici
  w.addCss('styles/ressourceDisplay.css', true);
  baseUrl = options.baseUrl;
  var vbu = options.vendorsBaseUrl;
  // on exporte aux plugins ces fcts que l'on met dans de dom global
  /** en prod on envoie rien en console */
  if (options.isDev) w.log = log;
  else w.log = function () { };
  // on vérifie que l'on a nos containers et on les créé sinon
  if (!errorsContainer) {
    errorsContainer = w.getElement('div', {id:'errors', class:'error'});
    w.addElement(wd.getElementsByName('body')[0], errorsContainer)
  }
  if (!container) {
    container = w.getElement('div', {id:'display'})
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

/**
 * Ajoute une méthode saveResultat aux options si besoin
 * @param options     {object}   L'objet sur lequel on ajoutera la methode saveResultat
 * @param urlResultat {string}   L'url vers laquelle poster
 * @param Resultat    {function} Le constructeur Resultat
 */
function addSaveResultat(options, urlResultat, Resultat) {
  /*global XMLHttpRequest*/
  if (!urlResultat || urlResultat.substr(0, 4) !== 'http') {
    log("Il faut fournir une url absolue pour envoyer des résultats");
  } else if (typeof XMLHttpRequest === "undefined") {
    log("Le navigateur ne supporte pas les appels ajax, impossible d'envoyer des résultats");
      // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  } else {
    /**
     * Envoi un résultat en ajax pour sauvegarde
     * @param result       {object}   Le résultat à envoyer
     * @param [retourUser] {function} La fonction à rappeler avec le retour de l'appel ajax
     */
    options.saveResultat = function (result, retourUser) {
      log("saveResultat", result);
      // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
      ["biblioName", "userOrigine", "userId"].forEach(function (paramName) {
        var paramValue = getURLParameter(paramName);
        if (paramValue) result[paramName] = paramValue;
      });
      var resultat = new Resultat(result);
      // @todo ajouter des vérifs minimales

      // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
      var request = new XMLHttpRequest();
      // pour que le navigateur envoie les cookies
      request.withCredentials = true;

      // la fct de retour est facultative, mais on affiche toujours le picto
      function feedback(retour) {
        log('feedback', retour);
        if (retour && retour.result && retour.result === 'ok') feedbackOk();
        else {
          if (retour && retour.error) w.setError(retour.error);
          feedbackKo();
        }
        // et on appelle retourUser si on nous l'a fourni
        if (retourUser) retourUser(retour);
      }

      request.timeout = ajaxTimeout;
      // les différentes callback
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          try {
            var retour = JSON.parse(request.responseText);
            feedback(retour);
          } catch (error) {
            feedback({error:"La réponse de l'enregistrement du résultat est invalide"});
          }
        } else {
          // On a une réponse mais c'est une erreur
          feedback({error:"La réponse de l'enregistrement du résultat est une erreur " +
              request.status + ' : ' + request.responseText});
        }
      };

      request.onerror = function () {
        // Pb de connexion au serveur
        feedback({error:"Impossible d'envoyer le résultat (à " +urlResultat +")"});
      };

      request.ontimeout = function () {
        feedback({error:"Pas de réponse de l'enregistrement du résultat après " +
            Math.floor(ajaxTimeout/1000) +"s d'attente."});
      };

      // et on envoie
      log("on poste à " +urlResultat, resultat);
      request.open('POST', urlResultat, true);
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      try {
        request.send(JSON.stringify(resultat));
      } catch (error) {
        feedback({error:"Impossible de convertir (donc d'envoyer) le résultat renvoyé par la ressource."});
      }
    }
  }
}
