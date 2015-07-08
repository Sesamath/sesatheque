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
 * Script d'init générique pour ajouter en global les méthodes addCss, addElement, getElement, setError, hideTitle
 * et log (qui ne fait rien sauf si on appelle init avec options.isDev à true), log.error affiche toujours
 */
/* global window, define, require, alert */
if (typeof define === 'undefined' || typeof require === 'undefined') {
  alert("requireJs doit être chargé avant ce fichier");
} else if (typeof window === 'undefined') {
  throw new Error("Ce module est un module requireJs prévu pour fonctionner dans un navigateur");
} else {
  // on peut définir notre module
  define(function () {
    "use strict";
    /********************
     * Fonctions privées
     */

    /**
     * Retourne true si l'argument est une string
     * @param arg
     * @returns {boolean}
     */
    function isString(arg) {
      return (typeof arg === 'string');
    }

    /**
     * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
     * Sera mis en global par init si on est en dev (sinon la fonction existera mais ne fera rien)
     * @param ... Nombre variable d'arguments, tous seront passé à console.log (ou console.error si c'est une erreur)
     */
    function log() {
      var arg;
      try {
        for (var i = 0; i < arguments.length; i++) {
          arg = arguments[i];
          if (arg instanceof Error) console.error.call(console, arg);
          else console.log.call(console, arg);
        }
      } catch (e) {
        // rien, fallait un navigateur décent...
      }
    }

    /**
     * log une erreur avec console.error si ça existe, en prod comme en dev (utiliser log pour le dev seulement)
     * @param … autant qu'on veut (console.error appelée une fois par argument)
     */
    log.error = function () {
      if (console && console.error) {
        for (var i = 0; i < arguments.length; i++) {
          console.error(arguments[i]);
        }
      }
    };

    /**
     * Helper de init pour initialise les chemins de require
     * @param pluginsBaseUrl
     * @param vendorsBaseUrl
     */
    function initRequire(pluginsBaseUrl, vendorsBaseUrl) {
      // et on configure requireJs avec une liste de librairies que l'on met à dispo des plugins
      // et les plugins eux-même, mais sans affecter baseUrl pour pas perturber un appelant qui
      // aurait déjà require avec son baseUrl
      // faut donc lister tous nos modules ici...
      var requireConfig = {
        paths: {
          am       : pluginsBaseUrl + '/am/am',
          arbre    : pluginsBaseUrl + '/arbre/arbre',
          calkc    : pluginsBaseUrl + '/calkc/calkc',
          ec2      : pluginsBaseUrl + '/ec2/ec2',
          em       : pluginsBaseUrl + '/em/em',
          j3p      : pluginsBaseUrl + '/j3p/j3p',
          mental   : pluginsBaseUrl + '/mental/mental',
          url      : pluginsBaseUrl + '/url/url',
          // et les modules de vendors
          head     : vendorsBaseUrl + '/headjs/head.1.0',
          head_load: vendorsBaseUrl + '/headjs/head.load.1.0',
          jquery   : vendorsBaseUrl + '/jquery/dist/jquery.min',
          jquery1  : vendorsBaseUrl + '/jquery/jquery-1.11.3.min',
          jqueryUi : vendorsBaseUrl + '/jqueryUi/jquery-ui-1.11.1/jquery-ui.min',
          jqueryUiRedmond : vendorsBaseUrl + '/jqueryUi/jquery-ui-1.11.1.dialogRedmond/jquery-ui.min',
          jstree   : vendorsBaseUrl + '/jstree/dist/jstree.min',
          lodash   : vendorsBaseUrl + '/lodash/lodash.min',
          swfobject: vendorsBaseUrl + '/swfobject/swfobject.2.2',
          // un module pour charger un swf, qui contient swfobject, avec une méthode load(container, url, options, next)
          sesaswf  : vendorsBaseUrl + '/sesamath/swf',
          sesalog  : vendorsBaseUrl + '/sesamath/log',
          Resultat : vendorsBaseUrl + '/sesamath/Resultat',
          Arbre    : vendorsBaseUrl + '/sesamath/Arbre',
          // d'autres trucs à nous
          jstreeConverter : vendorsBaseUrl + '/sesamath/tools/jstreeConverter'
        }
        // pour jQueryUi faut charger les css, on pourrait créer un miniModule qui s'en charge pour chaque version
        // mais c'est assez lourd, faut lui passer le chemin toussa, on laisse celui qui nous charge s'en occuper
        /*
         , shim :{
         jqueryUi    : {
         deps : [vbu +'/jqueryUi/jquery-ui-1.11.1/loadCss']
         }
         } /* */
      };
      w.log('la conf passée à require', requireConfig);
      require.config(requireConfig);
    }

    /**************************************
     * Méthodes globales
     *
     * On ajoute les fcts addCss, addElement, getElement en global
     * la fct log est ajouté par init (dépend du contexte)
     */

    /**
     * Ajoute une css dans le <head> courant
     * @param {string}   file              le chemin du fichier css relatif au dossier du plugin
     * @param {boolean=} [isPluginDirRelative=false] passer true si le chemin ne doit pas être préfixé par le dossier du plugin
     */
    window.addCss = function (file, isPluginDirRelative) {
      var elt = window.document.createElement("link");
      elt.rel = "stylesheet";
      elt.type = "text/css";
      elt.href = (isPluginDirRelative ? pluginsBaseUrl + '/' : '') + file;
      wd.getElementsByTagName("head")[0].appendChild(elt);
    };

    /**
     * Ajoute un élément html de type tag à parent
     * @param {HTMLElement} parent
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {HTMLElement}
     * @throws {Error} Si le parent n'est pas un HTMLElement
     */
    window.addElement = function (parent, tag, attrs, content) {
      if (!parent || !parent.appendChild) throw new Error("parent n'est pas un HTMLElement");
      var elt = w.getElement(tag, attrs, content);
      parent.appendChild(elt);

      return elt;
    };

    /**
     * Vide un élément html de tous ses enfants
     * @param {HTMLElement} element
     */
    window.empty = function (element) {
      if (element && element.firstChild) {
        while(element.firstChild) element.removeChild(element.firstChild);
      }
    };

    /**
     * Retourne un élément html de type tag (non inséré dans le dom)
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} txtContent
     */
    window.getElement = function (tag, attrs, txtContent) {
      if (!isString(tag)) throw new Error("tag n'est pas une string " + tag);
      var elt = wd.createElement(tag);
      var attr;
      if (attrs) for (attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          if (attr === 'class') elt.className = attrs[attr];
          else if (attr === 'style') w.setStyles(elt, attrs[attr]);
          else elt[attr] = attrs[attr];
        }

      }
      if (txtContent) elt.appendChild(wd.createTextNode(txtContent));

      return elt;
    };

    /**
     * Retourne un id qui n'existe pas encore dans le dom (mais ne le créé pas)
     */
    window.getNewId = (function () {
      // une closure pour conserver la valeur de cette variable privée entre 2 appels
      var lastId = 0;
      return function () {
        var id;
        var found = false;
        while (!found && lastId < 10000) { // au dela de 10000 id dans un dom y'a un pb !
          found = !wd.getElementById('sesa' +lastId);
          lastId++;
        }
        if (found) id = 'sesa' +lastId;

        return id;
      };
    })();

    /**
     * Cache le titre (en global pour que les plugins puissent le faire)
     */
    window.hideTitle = function () {
      try {
        var titre = wd.getElementById('titre');
        if (titre && titre.style) titre.style.display = "none";
        w.log(titre ? "titre masqué" : "demande de masquage mais titre non trouvé");
      } catch (e) { /* tant pis */ }
    };

    /**
     * Une fonction de log qui ne fait rien tant qu'on a pas appelé init avec isDev
     * (dans ce cas c'est un console.log qui accepte un 2e argument facultatif, un objet à mettre en console aussi)
     */
    window.log = function () {};

    /**
     * Affiche un texte d'erreur dans errorsContainer (écrase l'éventuel message précédent)
     * @param {string|Error} error Le message à afficher
     * @param {number} [delay] Un éventuel délai d'affichage en secondes
     */
    window.setError = function (error, delay) {
      var errorMsg = (error instanceof Error) ? error.toString() : error;
      if (/^TypeError:/.test(errorMsg)) {
        // on envoie qqchose de plus compréhensible
        errorMsg = "Une erreur est survenue (voir la console pour les détails)";
      }
      if (!errorsContainer) {
        errorsContainer = window.document.getElementById('errors') || window.document.getElementById('error') || window.document.getElementById('warnings');
        log("errorContainer n'existait pas, on l'a recherché dans le dom", errorsContainer);
      }
      if (errorsContainer) {
        // on ajoute un peu de margin à ce div qui n'en avait pas
        if (!errorsContainer.style) errorsContainer.style = {margin : "0.2em"};
        if (delay) {
          var tmpSpan = w.addElement(errorsContainer, 'span', null, errorMsg);
          setTimeout(function () {
            errorsContainer.remove(tmpSpan);
          }, delay *1000);
        } else {
          errorsContainer.textContent = errorMsg;
        }
        log.error(error);
      } else {
        log.error(new Error("errorsContainer n'existe pas, impossible d'afficher une erreur dedans " + errorMsg));
      }
    };

    /**
     * Affecte des styles à un élément html (on peut pas affecter elt.style directement car read only)
     * sans planter en cas de pb (on le signale juste en console)
     * @param {HTMLElement} elt
     * @param {string|object} styles
     */
    window.setStyles = function(elt, styles) {
      try {
        if (elt) {
          if (!elt.style) elt.style = {};
          if (typeof styles === 'string') {
            styles = styles.split(';');
            styles.forEach(function (paire) {
              paire = /([\w]+):(.+)/.exec(paire);
              if (paire && paire.length === 3) {
                var key = paire[0];
                elt.style[key] = paire[1];
              }
            });
          } else if (typeof styles === 'object') {
            for (var prop in styles) {
              if (styles.hasOwnProperty(prop)) {
                elt.style[prop] = styles[prop];
              }
            }
          }
        }
      } catch (error) {
        log.error(error);
      }
    };

    // on ajoute également du forEach sur les Array si le navigateur connait pas
    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function (fn) { // jshint ignore:line
        for (var i = 0; i < this.length; i++) {
          // on passe en argument (eltDuTableau, index, tableau)
          fn(this[i], i, this);
        }
      };
    }

    try {
      // deux raccourcis
      var w = window;
      var wd = window.document;
      /** Le chemin racine de la sésathèque, avec slash de fin */
      var rootPath = '/';
      /** Le préfixe à utiliser pour charger des éléments dans le dossier du plugin (sans slash final) */
      var pluginsBaseUrl;
      /** Le conteneur html pour afficher la ressource */
      var container = window.document.getElementById('display');
      /** Le conteneur html pour afficher d'éventuelles erreurs */
      var errorsContainer = window.document.getElementById('errors');

      /**
       * Notre module js que l'on exportera, une seule fonction
       *
       * Initialise les chemins des librairies pour les require des plugins, ainsi que les containers html
       * Complète options si besoin
       * @param options
       */
      var init = function (options) {
        log('init avec les options', options);
        rootPath = options.sesathequeBase || '/';
        // on ajoute le slash de fin s'il manque
        if (rootPath.substr(-1) !== '/') rootPath += '/';
        pluginsBaseUrl = options.baseUrl || options.pluginsBaseUrl || (rootPath + 'plugins');
        // on vire l'éventuel slash de fin
        if (pluginsBaseUrl.substr(-1) === '/') pluginsBaseUrl = pluginsBaseUrl.substr(0, pluginsBaseUrl.length - 1);

        options.pluginsBaseUrl = pluginsBaseUrl;
        options.vendorsBaseUrl = options.vendorsBaseUrl || (rootPath + 'vendors');
        options.sesathequeBase = rootPath;

        // en dev on active la fct de log
        if (options.isDev) {
          w.log = log;
        } else {
          // en prod elle fait rien
          w.log = function () {};
          // mais log.error garde son comportement normal
          w.log.error = log.error;
        }
        // on vérifie que l'on a nos containers et on les créé sinon
        if (!errorsContainer) errorsContainer = w.addElement(wd.getElementsByTagName('body')[0], 'div',
                                                             {id: 'errors', class: 'error'});
        if (!container) container = w.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'display'});
        // et on ajoute ces deux éléments aux options
        options.container = container;
        options.errorsContainer = errorsContainer;
        // reste la conf de require
        initRequire(pluginsBaseUrl, options.vendorsBaseUrl);
      };

      return init;

    } catch (error) {
      if (errorsContainer) errorsContainer.innerHTML = error.toString();
      else alert('Une erreur est survenue : ' + error.toString());
      log(error);
    }
  });
}