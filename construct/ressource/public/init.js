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
 * Script d'init générique pour ajouter dans notre namespace global les méthodes générique (addCss, addElement, getElement, addError…)
 * si cela n'a pas déjà été fait, activer log ou pas et étoffer options si besoin
 * Appellera aussi initRequire si on nous passe une sesathequeBase (et qu'il n'a pas déjà été configuré avec cette base)
 */
/* global window, define, require, alert, sesamath */
if (typeof window === 'undefined') {
  throw new Error("Ce module est un module requireJs prévu pour fonctionner dans un navigateur");
} else if (typeof define === 'undefined' || typeof require === 'undefined') {
  alert("requireJs doit être chargé avant ce fichier");
} else {
  // on peut définir notre module sans dépendances (on a pas encore les path)
  define(function () {
    "use strict";
    // raccourcis
    var w = window;
    var wd = window.document;
    if (typeof w.sesamath === "undefined") w.sesamath = {};
    var S = window.sesamath;
    if (!S.sesatheque) S.sesatheque = {};
    var ST = S.sesatheque;

    /**
     * Notre module js que l'on exporte, une seule fonction.
     * Complète les options si besoin avec sesathequeBase, container, errorsContainer qui seront créés si besoin,
     * et ajoute aux options "urlResultatCallback", "userOrigine", "userId" si elles n'y sont pas et sont dans l'url
     * @param {initOptions}   options
     * @param {errorCallback} next
     * @service init
     */
    return function (options, next) {

      // on vérifie que initGlobal a bien été chargé, sinon on le fait
      function checkGlobal() {
        if (typeof sesamath === "undefined" || !sesamath.sesatheque || !sesamath.sesatheque.addError) require(['initGlobal'], initDom);
        else initDom();
      }

      // on peut passer à l'init du dom et des options
      function initDom() {
        S.log('init avec les options', options);

        // active la fct de log si on le demande
        if (options.verbose) S.log.enable();
        else S.log.disable();

        // on vérifie que l'on a nos containers et on les créé sinon
        /**
         * Le conteneur html pour afficher la ressource, passé en options ou pris dans le dom si #display
         * @type {Element}
         */
        var container = options.container || wd.getElementById('display');
        /**
         * Le conteneur html pour afficher d'éventuelles erreurs, passé en options ou pris dans le dom si #errors
         * @type {Element}
         */
        var errorsContainer = options.errorsContainer || wd.getElementById('errors');
        if (!errorsContainer) errorsContainer = S.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'errors'});
        if (!container) container = S.addElement(wd.getElementsByTagName('body')[0], 'div', {id: 'display'});
        // et on ajoute ces deux éléments aux options
        options.container = container;
        options.errorsContainer = errorsContainer;

        // on regarde si d'autres options ont été passé en GET
        var paramGet;
        ["urlResultatCallback", "userOrigine", "userId"].forEach(function (param) {
          paramGet = S.getURLParameter(param);
          if (!options[param] && paramGet) options[param] = paramGet;
        });
        paramGet = S.getURLParameter("showTitle");
        if (paramGet === "0" || paramGet === "false") options.showTitle = false;

        // terminé
        next();
      }

      try {
        if (!options) options = {};
        if (!next) next = function () {};
        // on appelle la conf de require si ça n'a pas été fait, en cross domain si on est appelé avec sesathequeBase
        // ça devrait marcher (sinon ça risque pas), car on complète avec le chemin absolu du fichier js
        var base = options.sesathequeBase || "/";
        if (base.substr(-1) !== "/") base += "/";
        // tant que l'init a pas été fait require va chercher en relatif à la page courante, faut donc préciser en absolu
        var initRequireName = base +"initRequire.js";
        if (!ST.base || (options.sesathequeBase && options.sesathequeBase !== ST.base)) {
          // jamais appelé ou on a changé de base depuis l'appel
          require([initRequireName], function (initRequire) {
            initRequire(base);
            options.sesathequeBase = ST.base;
            checkGlobal();
          });
        } else {
          checkGlobal();
        }
      } catch (error) {
        if (console && console.error) console.error(error);
        // pb de chargement probable, on explicite
        var err = new Error("Problème de chargement probable, en cross-domain il faut passer options.sesathequeBase (" +error.toString() +")");
        next(err);
      }

    };
  });
}

/**
 * Options à passer à init() ou à display(), les autres propriétés seront laissées intactes
 * @typedef initOptions
 * @type {Object}
 * @property {string}  [sesathequeBase=/] Le préfixe de chemin vers la racine de la sésathèque.
 *                                        Il faut passer un chemin http://… complet si ce module est utilisé sur un autre domaine que la sésathèque
 *                                        Inutile si l'info a déjà été donnée à requireConfig avant
 * @property {Element} [container]        L'élément html qui servira de conteneur au plugin pour afficher sa ressource, créé si non fourni
 * @property {Element} [errorsContainer]  L'élément html pour afficher des erreurs éventuelles, créé si non fourni
 * @property {boolean} [verbose=false]      Passer true pour ajouter des log en console
 */

/**
 * Options à passer à une méthode display d'un plugin
 * @typedef displayOptions
 * @type {Object}
 * @property {string}           sesathequeBase        Le préfixe de chemin vers la racine de la sésathèque (chemin http absolu en cas d'appel d'un autre domaine)
 * @property {string}           pluginBase            Le préfixe de chemin vers le dossier du plugin (mis par display)
 * @property {Element}          container             L'élément html qui servira de conteneur au plugin pour afficher sa ressource
 * @property {Element}          errorsContainer       L'élément html pour afficher des erreurs éventuelles
 * @property {boolean}          [verbose=false]       Passer true pour ajouter des log en console
 * @property {boolean}          [isDev=false]         Passer true pour initialiser le dom source en devsesamath (pour certains plugins)
 * @property {string}           [urlResultatCallback] Une url vers laquelle poster le résultat (idem si la page de la ressource contient ?urlScoreCallback=http…)
 * @property {resultatCallback} [resultatCallback]    Une fonction pour recevoir un objet Resultat (si y'a pas de urlScoreCallback)
 * @property {string}           [sesatheque]          Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page),
 *                                                      le nom de la sésathèque pour un client qui récupère des résultats de plusieurs sésatheques
 * @property {boolean}          [showTitle=true]      Passer "0" ou "false" via l'url ou false via options pour cacher le titre
 * @property {string}           [userOrigine]         Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {string}           [userId]              Sera ajoutée en propriété du résultat (peut être passé en param du GET de la page)
 * @property {object}           [flashvars]           Pour les plugins qui chargent du swf, sera passé en flashvars en plus
 */

/**
 * @callback resultatCallback
 * @param {Resultat} Un objet Resultat
 */

/**
 * Un élément du Dom HTML
 * @typedef Element
 * @type {Object}
 * @see https://developer.mozilla.org/fr/docs/Web/API/Element
 */

