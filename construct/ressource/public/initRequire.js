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
 * @file requireConfig.js
 * Configuration de requireJs avec la liste des librairies et plugin utilisés
 *
 * Script concaténé avec le require.js de sesatheque (par scripts/jsCompil), mais qui doit être appelé seul avant tout autre module en cas de cross-domain
 *
 * Pour être utilisé en cross-domain, peut importe que le require.js vienne de la sésathèque ou du domaine concerné,
 * il faut charger ce module et l'appeler avec en argument l'url absolue de la sésathèque avant de charger
 * un module de la sésathèque par son nom.
 */
(function () {
  "use strict";
  // Configuration de requireJs avec une liste de librairies que l'on met à dispo des plugins
  // et les plugins eux-même, mais sans affecter baseUrl pour pas perturber un appelant qui
  // aurait déjà require avec son baseUrl
  // Faut donc lister tous nos modules ici
  // Ça permet aussi de les désigner par un nom court sans se préoccuper du chemin

  /**
   * Idem sesamath.addCss, qui n'est pas encore déclaré
   * @param file
   */
  function addCss(file) {
    var elt = document.createElement("link");
    elt.rel = "stylesheet";
    elt.type = "text/css";
    elt.href = file;
    document.getElementsByTagName("head")[0].appendChild(elt);
  }

  /**
   * Retourne la conf à passer à require.config()
   * @private
   * @param {string} [base] Url de base de la sésathèque
   * @returns {Object} seulement paths
   */
  function getConfig (base) {
    if (typeof base !== "string") base = "/";
    if (typeof sesamath !== "undefined" && sesamath.sesatheque && sesamath.sesatheque.base) base = sesamath.sesatheque.base;
    if (base.substring(-1) !== "/") base += "/";

    var requireConfig = {
      paths: {
        // nos modules "globaux"
        apiClient : base +'apiClient',
        display : base + 'display',
        initGlobal : base +'initGlobal',
        // les modules de vendors
        ckeditor: base + 'vendors/ckeditor/ckeditor',
        ckeditorJquery : base +'vendors/ckeditor/adapters/jquery',
        head: base + 'vendors/headjs/head.1.0',
        head_load: base + 'vendors/headjs/head.load.1.0',
        jquery: base + 'vendors/jquery/jquery-1.11.3.min',
        jquery18: base + 'vendors/jquery/jquery-1.8.3.min',
        jqueryUi: base + 'vendors/jqueryUi/1.11.1/jquery-ui.min',
        jqueryUiDialog: base + 'vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min',
        jstree: base + 'vendors/jstree/dist/jstree.min',
        lodash: base + 'vendors/lodash/lodash.min',
        mathjax: base + 'vendors/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured&amp;dummy',
        mathquill: base + 'vendors/mathquill-0.9.4/mathquill.min',
        mqEditor: base + 'vendors/sesamath/mqEditor/mqEditor',
        multiEditor: base + 'vendors/sesamath/multiEditor/multiEditor',
        swfobject: base + 'vendors/swfobject/swfobject.2.2',
        // un module pour charger un swf, qui contient swfobject, avec une méthode load(container, url, options, next)
        "tools/swf": base + 'vendors/sesamath/tools/swf',
        // autres modules génériques sesamath
        "tools/jstreeConverter" : base + 'vendors/sesamath/tools/jstreeConverter',
        "tools/filters" : base + 'vendors/sesamath/tools/filters',
        Resultat: base + 'vendors/sesamath/Resultat',
        Ressource: base + 'vendors/sesamath/Ressource',
        Arbre: base + 'vendors/sesamath/Arbre'
      },
      shim: {
        jquery: {
          export: "$"
        },
        // pour jQueryUi faut charger les css
        jqueryUi: {
          deps : ["jquery"],
          init: function () {
            addCss(base + 'vendors/jqueryUi/1.11.1/jquery-ui.min.css');
          }
        },
        jqueryUiDialog: {
          deps : ["jquery"],
          init: function () {
            addCss(base + 'vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css');
          }
        },
        mathjax: {
          exports: "MathJax",
          init: function () {
            //MathJax.Hub.Config({ /* Your configuration here */ });
            //MathJax.Hub.Startup.onload();
            return MathJax;
          }
        },
        mathquill : {
          // attention, mathquill marche bcp moins bien en jQuery 1.9 (impossible de donner le focus par ex)
          deps : ["jquery18"],
          init: function () {
            addCss(base + 'vendors/mathquill-0.9.4/mathquill.css');
          }
        }
      }
    };
    // on ajoute nos plugins
    ["am", "arbre", "ato", "calkc", "coll_doc", "ec2", "em", "j3p", "lingot", "mental", "tep", "testd", "url"].forEach(function (plugin) {
      requireConfig.paths[plugin] = base + 'plugins/' + plugin + '/' + plugin;
    });

    return requireConfig;
  }

  if (typeof require !== "undefined" && typeof define !== "undefined") {
    // conf par défaut dès l'exécution
    require.config(getConfig());
    // on exporte une fonction de conf avec comme seul argument l'url de la sésathèque
    // pour que qqun d'autre puisse reconfigurer require.js avec une autre base absolue
    // pour les modules de la sésathèque (en cas de cross-domain c'est obligatoire,
    // et ça permet de continuer à utiliser son propre require sur son domaine pour ses modules)
    define(function () {
      return function (sesathequeBase) {
          if (!sesathequeBase) sesathequeBase = "/";
          else if (sesathequeBase.substr(-1) !== "/") sesathequeBase += "/";
          // on l'ajoute aussi dans le dom global pour que les modules puissent le retrouver
          // sans avoir à le repréciser
          if (typeof window.sesamath === "undefined") window.sesamath = {};
          if (!window.sesamath.sesatheque) window.sesamath.sesatheque = {};
          window.sesamath.sesatheque.base = sesathequeBase;
          require.config(getConfig(sesathequeBase));
      };
    });
  }
})();
