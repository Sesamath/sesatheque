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
 * Script autonome pour ajouter en global les méthodes addCss, addElement, getElement, addError, hideTitle
 * et log (qui ne fait rien sauf si on appelle init avec options.verbose à true), log.error affiche toujours
 */
/* global window */
(function () {
  "use strict";
  /**
   * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
   * Sera mis en global par init si on est en dev (sinon la fonction existera mais ne fera rien)
   *
   * Déclaré par init (dès son chargement) avec une fonction vide
   * puis remplacé par celle qui bosse si init() est appelé avec options.verbose
   * @private
   * @param {...*} arguments Nombre variable d'arguments, chacun sera passé à console.log ou console.error si c'est une erreur
   */
  function log() {
    var arg;
    try {
      for (var i = 0; i < arguments.length; i++) {
        arg = arguments[i];
        if (arg instanceof Error) console.error(arg);
        else console.log(arg);
      }
    } catch (e) {
      // rien, fallait un navigateur décent...
    }
  }

  if (typeof window === 'undefined') {
    if (typeof console !== "undefined" && console.error)
      console.error(new Error("Ce déclare des fonctions globales pour les plugins sesatheque, il est prévu pour fonctionner dans un navigateur"));
  } else {
    var w = window;
    var wd = w.document;
    if (typeof w.sesamath === "undefined") w.sesamath = {};
    /**
     * Namespace window.sesamath, pour y mettre toutes nos fonctions globales génériques
     * @namespace sesamath
     */
    var S = w.sesamath;

    /**
     * Flag pour savoir si log() est bavard ou muet
     * @private
     * @type {boolean}
     */
    var isLogEnable = false;

    /**************************************
     * Méthodes globales
     *
     * On ajoute les fcts addCss, addElement, getElement en global
     * la fct log est ajouté par init (dépend du contexte)
     */

    /**
     * Ajoute une css dans le <head> de la page
     *
     * Déclaré par init (dès son chargement)
     * @name addCss
     * @memberOf sesamath
     * @param {string}  file Chemin du fichier css (mis dans href tel quel)
     */
    S.addCss = function (file) {
      var head = wd.getElementsByTagName("head")[0];
      var links = head.getElementsByTagName("link");
      var dejala = false;
      for (var i = 0; i < links.length; i++) {
        if (links[i].href === file) {
          dejala = true;
          break;
        }
      }

      if (dejala) {
        S.log(file +" était déjà présent, on ne l'ajoute pas");
      } else {
        var elt = wd.createElement("link");
        elt.rel = "stylesheet";
        elt.type = "text/css";
        elt.href = file;
        head.appendChild(elt);
      }
    };

    /**
     * Ajoute un élément html de type tag à parent
     *
     * Déclaré par init (dès son chargement)
     * @name addElement
     * @memberOf sesamath
     * @param {Element} parent
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {Element} L'élément ajouté
     */
    S.addElement = function (parent, tag, attrs, content) {
      var elt = S.getElement(tag, attrs, content);
      parent.appendChild(elt);

      return elt;
    };

    /**
     * Ajoute un élément html juste après element
     * @param {Element} element
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {Element} L'élément ajouté
     */
    S.addElementAfter = function (element, tag, attrs, content) {
      var newElt = S.getElement(tag, attrs, content);
      var parent = element.parentNode;
      // pas de insertAfter, si nextSibling est null ça le mettra à la fin, cf https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
      if (parent) parent.insertBefore(newElt, element.nextSibling);
      else S.log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'ajouter l'élément"));

      return newElt;
    };

    /**
     * Ajoute un élément html juste avant element
     * @param {Element} element
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {Element} L'élément ajouté
     */
    S.addElementBefore = function (element, tag, attrs, content) {
      var newElt = S.getElement(tag, attrs, content);
      var parent = element.parentNode;
      if (parent) parent.insertBefore(newElt, element);
      else S.log.error(new Error("Navigateur incompatible (pas de parentNode), impossible d'insérer l'élément"));

      return newElt;
    };

    /**
     * Ajoute un élément html comme premier enfant de parent
     * @param {Element} parent
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {Element} L'élément ajouté
     */
    S.addElementFirstChild = function (parent, tag, attrs, content) {
      var newElt = S.getElement(tag, attrs, content);
      parent.insertBefore(newElt, parent.firstChild);

      return newElt;
    };

    /**
     * Ajoute un élément html comme frère aîné de elementRef
     * @param {Element} elementRef
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} content
     * @returns {Element} L'élément ajouté
     */
    S.addElementFirstSibling = function (elementRef, tag, attrs, content) {
      var newElt = S.getElement(tag, attrs, content);
      elementRef.parentNode.insertBefore(newElt, elementRef.parentNode.firstChild);

      return newElt;
    };

    /**
     * Ajoute du texte dans un élément
     *
     * Déclaré par init (dès son chargement)
     * @name addText
     * @memberOf sesamath
     * @param {Element} elt
     * @param {string} text
     */
    S.addText = function (elt, text) {
      elt.appendChild(wd.createTextNode(text));
    };

    /**
     * Vide un élément html de tous ses enfants
     *
     * Déclaré par init (dès son chargement)
     * @name empty
     * @memberOf sesamath
     * @param {Element} element
     */
    S.empty = function (element) {
      if (element && element.firstChild) {
        while (element.firstChild) element.removeChild(element.firstChild);
      }
    };

    /**
     * Récupère un paramètre de l'url courante
     * Inspiré de http://stackoverflow.com/a/11582513
     * Attention, les + sont transformés en espace (RFC 1738), les %20 aussi (RFC 3986),
     * pour récupérer des + faut qu'ils soient correctement encodés en %2B
     * @name getURLParameter
     * @memberOf sesamath
     * @param {string}  name              Le nom du paramètre
     * @param {boolean} [noPlusTransform] Passer true pour conserver les "+" dans le retour,
     *                                      sinon ils seront transformés en espace (un + devrait être encodé %2B)
     * @returns Sa valeur (ou null s'il n'existait pas)
     */
    S.getURLParameter = function (name, noPlusTransform) {
      var regexp = new RegExp('[?|&]' + name + '=([^&#]+?)(&|#|$)');
      var param = regexp.exec(window.location.search);
      if (param) {
        var component = noPlusTransform ? param[1] : param[1].replace(/\+/g, '%20');
        param = decodeURIComponent(component);
      }
      return param;
    };

    /**
     * Retourne true si l'argument est un Array
     * @name isArray
     * @memberOf sesamath
     * @param arg
     * @returns {boolean}
     */
    S.isArray = function (arg) {
      return (arg instanceof Array);
    };

    /**
     * Retourne true si l'argument est une fonction
     * @name isFunction
     * @memberOf sesamath
     * @param arg
     * @returns {boolean}
     */
    S.isFunction = function (arg) {
      return (typeof arg === 'function');
    };

    /**
     * Retourne true si l'argument est une string
     * @name isString
     * @memberOf sesamath
     * @param arg
     * @returns {boolean}
     */
    S.isString = function (arg) {
      return (typeof arg === 'string');
    };

    /**
     * Retourne un élément html de type tag (non inséré dans le dom)
     *
     * Déclaré par init (dès son chargement)
     * @name getElement
     * @memberOf sesamath
     * @param {string} tag
     * @param {Object=} attrs Les attributs
     * @param {string=} txtContent
     */
    S.getElement = function (tag, attrs, txtContent) {
      var elt = wd.createElement(tag);
      var attr;
      try {
        if (attrs) for (attr in attrs) {
          if (attrs.hasOwnProperty(attr)) {
            if (attr === 'class') elt.className = attrs.class;
            else if (attr === 'style') S.setStyles(elt, attrs.style);
            else elt.setAttribute(attr, attrs[attr]);
          }
        }
      } catch (error) {
        S.log("plantage dans getElement " +tag +" avec les attributs ", attrs, error);
      }

      if (txtContent) S.addText(elt, txtContent);

      return elt;
    };

    /**
     * Retourne un id qui n'existe pas encore dans le dom (mais ne le créé pas)
     *
     * Déclaré par init (dès son chargement)
     * @name getNewId
     * @memberOf sesamath
     */
    S.getNewId = (function () {
      // une closure pour conserver la valeur de cette variable privée entre 2 appels
      var lastId = 0;
      return function () {
        var id;
        var found = false;
        while (!found && lastId < 10000) { // au dela de 10000 id dans un dom y'a un pb !
          found = !wd.getElementById('sesa' + lastId);
          lastId++;
        }
        if (found) id = 'sesa' + lastId;

        return id;
      };
    })();

    /**
     * Un console.log qui plante pas sur les anciens IE (ou d'autres navigateurs qui n'auraient pas de console.log)
     *
     * Déclaré par initGlobal dès son chargement avec une fonction vide, puis remplacé éventuellement par une sortie
     * en console si un init() est appelé avec options.verbose
     * @name log
     * @memberOf sesamath
     * @param {...*} arguments Nombre variable d'arguments, chacun sera passé à console.log ou console.error si c'est une erreur
     */
    S.log = function () {
      if (isLogEnable) log.apply(this, arguments);
    };

    /**
     * Rend log() muet
     * @name log.disable
     * @memberOf sesamath
     */
    S.log.disable = function () {
      isLogEnable = false;
    };

    /**
     * Rend log() bavard
     * @name log.disable
     * @memberOf sesamath
     */
    S.log.enable = function () {
      isLogEnable = true;
    };

    /**
     * log une erreur avec console.error si ça existe, en prod comme en dev (utiliser log pour le dev seulement)
     * @private
     * @param {...Error} arguments autant qu'on veut (console.error appelée une fois par argument)
     */
    S.log.error = function () {
      if (console && console.error) {
        for (var i = 0; i < arguments.length; i++) {
          console.error(arguments[i]);
        }
      }
    };

    /**
     * Affecte des styles à un élément html (on peut pas affecter elt.style directement car read only, faut faire du elt.style.foo = bar)
     * sans planter en cas de pb (on le signale juste en console)
     *
     * Déclaré par init (dès son chargement)
     * @name setStyles
     * @memberOf sesamath
     * @param {Element} elt
     * @param {string|object} styles
     */
    S.setStyles = function (elt, styles) {
      try {
        if (elt) {
          if (!elt.style) elt.style = {};
          if (typeof styles === 'string') {
            styles = styles.split(';');
            styles.forEach(function (paire) {
              paire = /([\w]+):(.+)/.exec(paire);
              if (paire && paire.length === 3) {
                var key = paire[1];
                elt.style[key] = paire[2];
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

    /****************
     * Namespace sesatheque
     */
    if (!S.sesatheque) S.sesatheque = {};
    /**
     * Namespace window.sesamath.sesatheque, pour y mettre toutes des fonctions globales
     * et les modules s'ils sont chargés sans require ni exports
     * @namespace sesamath.sesatheque
     */
    var ST = S.sesatheque;

    /**
     * Ajoute un texte d'erreur dans errorsContainer (#errors ou #error ou #warnings) ET dans console.error (si ça existe)
     * L'existence de cette fonction est testée par init.js pour savoir si on doit être chargé.
     *
     * Déclaré par init (dès son chargement)
     * @name addError
     * @memberOf sesamath.sesatheque
     * @param {string|Error} error Le message à afficher
     * @param {number} [delay] Un éventuel délai d'affichage en secondes
     */
    ST.addError = function (error, delay) {
      S.log.error(error);
      var errorsContainer = wd.getElementById('errors') || wd.getElementById('error') || wd.getElementById('warnings');
      var errorMsg = (error instanceof Error) ? error.toString() : error;
      if (/^TypeError:/.test(errorMsg)) {
        // on envoie qqchose de plus compréhensible
        errorMsg = "Une erreur est survenue (voir la console pour les détails)";
      }
      if (errorsContainer) {
        // on ajoute un peu de margin à ce div s'il n'en a pas
        if (errorsContainer.style && !errorsContainer.style.margin) errorsContainer.style.margin = "0.2em";
        var errorBlock = S.addElement(errorsContainer, 'p', {class: "error"}, errorMsg);
        if (delay) {
          setTimeout(function () {
            errorsContainer.remove(errorBlock);
          }, delay * 1000);
        }
      } else {
        log.error(new Error("errorsContainer n'existe pas, impossible d'afficher une erreur dedans " + errorMsg));
      }
    };

    /**
     * Cache le #titre (en global pour que les plugins puissent le faire)
     *
     * Déclaré par init (dès son chargement)
     * @name hideTitle
     * @memberOf sesamath.sesatheque
     */
    ST.hideTitle = function () {
      try {
        var titre = wd.getElementById('titre');
        if (titre && titre.style) titre.style.display = "none";
        S.log(titre ? "titre masqué" : "demande de masquage mais titre non trouvé");
        var picto = wd.getElementById('pictoFeedback');
        if (picto && picto.style) picto.style.display = "none";
        S.log(picto ? "picto feedback masqué" : "demande de masquage mais picto feedback non trouvé");
      } catch (e) {
        /* tant pis */
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
  } // else window existe
})();
