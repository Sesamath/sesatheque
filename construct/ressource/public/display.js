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
 *
 * Son chargement ajoute en global les méthodes addCss, addElement, getElement, setError, hideTitle
 * et log (qui ne fait rien sauf si on appelle init avec options.isDev à true), log.error affiche toujours
 *
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
    function isFunction(arg) {
      return (typeof arg === 'function');
    }

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
     * Récupère un paramètre de l'url courante
     * Inspiré de http://stackoverflow.com/a/11582513
     * Attention, les + sont transformés en espace (RFC 1738), les %20 aussi (RFC 3986),
     * pour récupérer des + faut qu'ils soient correctement encodés en %2B
     * @param name Le nom du paramètre
     * @returns Sa valeur (ou null s'il n'existait pas)
     */
    function getURLParameter(name) {
      var regexp = new RegExp('[?|&]' + name + '=([^&#]+?)(&|#|$)');
      var param = regexp.exec(window.location.search);
      if (param) {
        param = decodeURIComponent(param[1].replace(/\+/g, '%20'));
      }
      return param;
    }

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
          jstree   : vendorsBaseUrl + '/jstree/dist/jstree.min',
          lodash   : vendorsBaseUrl + '/lodash/lodash.min',
          swfobject: vendorsBaseUrl + '/swfobject/swfobject.2.2',
          // un module pour charger un swf, qui contient swfobject, avec une méthode load(container, url, options, next)
          sesaswf  : vendorsBaseUrl + '/sesamath/swf',
          sesalog  : vendorsBaseUrl + '/sesamath/log',
          Resultat : vendorsBaseUrl + '/sesamath/Resultat',
          Arbre    : vendorsBaseUrl + '/sesamath/Arbre',
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

    /**
     * Ajoute une méthode saveResultat aux options si besoin
     * @param {object}          options      L'objet sur lequel on ajoutera la methode saveResultat
     * @param {string|function} traiteResult L'url vers laquelle poster, ou une fct de callback
     * @param {function}        Resultat     Le constructeur Resultat
     */
    function addSaveResultat(options, traiteResult, Resultat) {
      /*global XMLHttpRequest*/
      /** Le conteneur du picto enregistrement */
      var divFeedback = window.document.getElementById('pictoFeedback');

      /** Éteint le feedback */
      function feedbackOff() {
        if (divFeedback) divFeedback.className = 'feedbackOff';
      }

      /** Allume le feedback OK pour 4s */
      function feedbackOk() {
        if (divFeedback) {
          divFeedback.className = 'feedbackOk';
          setTimeout(feedbackOff, 4000);
        }
      }

      /** Allume le feedback KO pour 4s */
      function feedbackKo() {
        if (divFeedback) {
          divFeedback.className = 'feedbackKo';
          setTimeout(feedbackOff, 4000);
        }
      }

      // vérif minimale
      if (traiteResult && !isFunction(traiteResult) && !isString(traiteResult)) {
        throw new Error("option de traitement du score incorrecte.");
      }
      if (isString(traiteResult) && traiteResult.substr(0, 4) !== 'http') {
        throw new Error("Il faut fournir une url absolue pour envoyer des résultats.");
      }

      /**
       * Envoi un résultat en ajax (ou à la callback) pour sauvegarde
       * @param result       {object}   Le résultat à envoyer
       * @param [retourUser] {function} La fonction à rappeler avec le retour de l'appel ajax
       */
      options.saveResultat = function (result, retourUser) {
        /**
         * Gère l'affichage du feedback
         * @param retour Le retour de l'envoi du score
         */
        function feedback(retour) {
          log('feedback', retour);
          if (retour && retour.ok && retour.ok === true) {
            feedbackOk();
          } else {
            if (retour && retour.error) w.setError(retour.error);
            feedbackKo();
          }
          // et on appelle retourUser si on nous l'a fourni
          if (retourUser) retourUser(retour);
        }

        log("saveResultat display a reçu", result);
        var resultat = new Resultat(result);
        // on regarde si on nous a demandé d'ajouter des paramètres utilisateur au résultat
        ["sesatheque", "userOrigine", "userId"].forEach(function (paramName) {
          var paramValue = getURLParameter(paramName) || options[paramName];
          if (paramValue) resultat[paramName] = paramValue;
        });
        // @todo ajouter des vérifs minimales

        // si on nous a passé une fct on lui envoie le résultat
        if (isFunction(traiteResult)) {
          log('on envoie ce résultat à la fct qui nous a été passé en param', resultat);
          traiteResult(resultat);
        } else {
          log("on va poster ce résultat vers " + traiteResult, resultat);
          // c'est une url, on gère l'envoi
          if (typeof XMLHttpRequest === "undefined") {
            // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
            throw new Error("Le navigateur ne supporte pas les appels ajax, impossible d'envoyer des résultats");
          }
          // cf https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
          var xhr = new XMLHttpRequest();
          // pour que le navigateur envoie les cookies
          xhr.withCredentials = true;


          xhr.timeout = ajaxTimeout;
          // les différentes callback
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 400) {
              try {
                var retour = JSON.parse(xhr.responseText);
                feedback(retour);
              } catch (error) {
                feedback({error: "La réponse de l'enregistrement du résultat est invalide"});
              }
            } else {
              // On a une réponse mais c'est une erreur
              feedback({
                error: "La réponse de l'enregistrement du résultat est une erreur " +
                       xhr.status + ' : ' + xhr.responseText
              });
            }
          };

          xhr.onerror = function () {
            // Pb de connexion au serveur
            feedback({error: "Impossible d'envoyer le résultat (à " + traiteResult + ")"});
          };

          xhr.ontimeout = function () {
            feedback({
              error: "Pas de réponse de l'enregistrement du résultat après " +
                     Math.floor(ajaxTimeout / 1000) + "s d'attente."
            });
          };

          // et on envoie
          xhr.open('POST', traiteResult, true);
          xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          try {
            xhr.send(JSON.stringify(resultat));
          } catch (error) {
            feedback({error: "Impossible de convertir (donc d'envoyer) le résultat renvoyé par la ressource."});
          }
        } // fin else ajax
      }; // fin définition options.saveResultat
    } // addSaveResultat

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
      if (!parent || !parent.appendChild) throw new Error("parent n'est pas un HTMLElement " + parent);
      var elt = w.getElement(tag, attrs, content);
      parent.appendChild(elt);

      return elt;
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
     * log une erreur avec console.error si ça existe, en prod comme en dev (utiliser log pour le dev seulement)
     * @param … autant qu'on veut (console.error appelée une fois par argument)
     */
    window.log.error = function () {
      if (console && console.error) {
        for (var i = 0; i < arguments.length; i++) {
          console.error(arguments[i]);
        }
      }
    };

    /**
     * Affiche un texte d'erreur dans errorsContainer (écrase l'éventuel message précédent)
     * @param {string|Error} error Le message à afficher
     */
    window.setError = function (error) {
      var errorMsg = (error instanceof Error) ? "Une erreur est survenue (voir la console pour les détails)" : error;
      if (errorsContainer) {
        // on ajoute un peu de margin à ce div qui n'en avait pas
        if (!errorsContainer.style) errorsContainer.style = {};
        errorsContainer.style.margin = "0.2em";
        errorsContainer.textContent = errorMsg;
        log(error);
      } else {
        log("errorsContainer n'existe pas, impossible d'afficher une erreur dedans " + errorMsg);
      }
    };

    try {
      // deux raccourcis
      var w = window;
      var wd = window.document;
      /** Le chemin racine de la sésathèque, avec slash de fin */
      var rootPah = '/';
      /** Le préfixe à utiliser pour charger des éléments dans le dossier du plugin (sans slash final) */
      var pluginsBaseUrl;
      /** Le conteneur html pour afficher la ressource */
      var container = window.document.getElementById('display');
      /** Le conteneur html pour afficher d'éventuelles erreurs */
      var errorsContainer = window.document.getElementById('errors');
      /** Un flag pour savoir si l'init a déjà été fait */
      var isInitDone = false;
      /**
       * Le timeout des requêtes ajax. 10s c'est bcp mais certains clients ont des BP catastrophiques
       * @type {number}
       */
      var ajaxTimeout = 10000;
      /**
       * Et notre module js que l'on exportera
       */
      var displayModule = {};


      /**
       * Initialise les chemins des librairies pour les require des plugins, ainsi que les containers html
       * @param options
       */
      displayModule.init = function (options) {
        rootPah = options.sesathequeBase || '/';
        // on ajoute le slash de fin s'il manque
        if (rootPah.substr(-1) !== '/') rootPah += '/';
        pluginsBaseUrl = options.baseUrl || options.pluginsBaseUrl || (rootPah + 'plugins');
        // on vire l'éventuel slash de fin
        if (pluginsBaseUrl.substr(-1) === '/') pluginsBaseUrl = pluginsBaseUrl.substr(0, pluginsBaseUrl.length - 1);

        options.pluginsBaseUrl = pluginsBaseUrl;
        options.vendorsBaseUrl = options.vendorsBaseUrl || (rootPah + 'vendors');
        options.sesathequeBase = rootPah;

        // en dev on active la fct de log
        if (options.isDev) w.log = log;
        // on vérifie que l'on a nos containers et on les créé sinon
        if (!errorsContainer) errorsContainer = w.addElement(wd.getElementsByTagName('body')[0], 'div',
                                                             {id: 'errors', class: 'error'});
        if (!container) container = w.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'display'});
        // et on ajoute ces deux éléments aux options
        options.container = container;
        options.errorsContainer = errorsContainer;
        // reste la conf de require
        initRequire(pluginsBaseUrl, options.vendorsBaseUrl);
        isInitDone = true;
      };

      /**
       * Charge une ressource et le plugin qui la gère, puis appelle la methode display du plugin
       * @param ressource
       * @param {} [options]
       * @param {function} [next] Fct appelée à la fin du chargement avec une erreur ou undefined
       */
      displayModule.load = function (ressource, options, next) {
        w.log('display.load avec la ressource', ressource);
        w.log('et les options', options);
        // init du dom
        if (!isInitDone) {
          displayModule.init(options);
          w.log('options après init', options);
        }

        // ajoute de la css commune à toutes les ressources ici
        w.addCss(rootPah + 'styles/ressourceDisplay.css');

        // tente de charger le plugin du type de ressource
        var name = ressource.typeTechnique;
        var modules = [name];
        // pour envoyer les résultats, on regarde si on nous fourni une url
        var traiteResultat = getURLParameter("urlScoreCallback") || options.urlScoreCallback;
        // ou une fct de callback à qui l'envoyer
        if (!traiteResultat && options.saveResultat) traiteResultat = options.saveResultat;
        if (traiteResultat) modules.push('Resultat');

        require(modules, function (plugin, Resultat) {
          try {
            if (typeof plugin === 'undefined') throw new Error('Le chargement du plugin ' + name + ' a échoué');
            if (typeof plugin.display !== 'function') throw new Error('Le plugin ' + name + " n'a pas de méthode display");
            w.log('plugin ' + name + ' chargé');
            container.innerHTML = '';
            errorsContainer.innerHTML = '';

            // On vire le titre si on nous le demande via les options ou un param dans l'url
            if (options.hasOwnProperty('showTitle') && !options.showTitle || /\?.*showTitle=0/.test(wd.URL)) {
              w.hideTitle();
            }
            // on file au plugin une référence vers sa base
            options.baseUrl = pluginsBaseUrl + '/' + name + '/';
            // on regarde s'il faut ajouter une fct de sauvegarde des résultats
            if (Resultat) addSaveResultat(options, traiteResultat, Resultat);
            // on peut afficher
            plugin.display(ressource, options, function (error) {
              if (error) {
                log("le display a terminé mais renvoyé l'erreur", error);
                w.setError(error);
              } else {
                w.log("le display a terminé sans erreur");
              }
              if (next) next(error);
            });
          } catch (error) {
            w.setError(error.toString());
          }
        });
      };

      return displayModule;

    } catch (error) {
      if (errorsContainer) errorsContainer.innerHTML = error.toString();
      else alert('Une erreur est survenue : ' + error.toString());
      log(error);
    }
  });
}