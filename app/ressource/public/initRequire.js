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
 * Script concaténé avec le require.js de sesatheque (par scripts/jsCompil) pour lister tous nos modules,
 * avec une base mise par défaut à /, qui doit donc être appelé seul avant tout autre module en cas de cross-domain
 * pour indiquer la base.
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
   * Idem Sesamath.addCss, qui n'est pas encore déclaré
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
    if (typeof Sesamath !== "undefined" && Sesamath.Sesatheque && Sesamath.Sesatheque.base) base = Sesamath.Sesatheque.base;
    if (base.substring(-1) !== "/") base += "/";

    var requireConfig = {
      paths: {
        // nos modules "globaux"
        apiClient : base +'apiClient',
        display : base + 'display',
        initGlobal : base +'initGlobal',
        // un module pour charger un swf, qui contient swfobject, avec une méthode load(container, url, options, next)
        "tools/swf": base + 'vendors/sesamath/tools/swf',
        // autres modules génériques sesamath
        "tools/jstreeConverter" : base + 'vendors/sesamath/tools/jstreeConverter',
        "tools/filters" : base + 'vendors/sesamath/tools/filters',
        "tools/formEditor" : base + 'vendors/sesamath/tools/formEditor',
        "tools/xhr" : base + 'vendors/sesamath/tools/xhr',
        Alias: base + 'vendors/sesamath/Alias',
        Arbre: base + 'vendors/sesamath/Arbre',
        Resultat: base + 'vendors/sesamath/Resultat',
        Ressource: base + 'vendors/sesamath/Ressource',
        jsonMulti: base + 'vendors/sesamath/jsonMulti/jsonMulti',
        mqEditor: base + 'vendors/sesamath/mqEditor/mqEditor',
        multiEditor: base + 'vendors/sesamath/multiEditor/multiEditor',
        // module npm recopié là par jsCompil
        sesathequeClient : base +'../vendors/sesamath/sesathequeClient',
        // les modules de vendors
        ckeditor: base + 'vendors/ckeditor/ckeditor',
        ckeditorJquery : base +'vendors/ckeditor/adapters/jquery',
        head: base + 'vendors/headjs/head.1.0',
        head_load: base + 'vendors/headjs/head.load.1.0',
        jquery: base + 'vendors/jquery/jquery-1.11.3.min',
        jquery18: base + 'vendors/jquery/jquery-1.8.3.min',
        jqueryUi: base + 'vendors/jqueryUi/1.11.1/jquery-ui.min',
        jqueryUiDialog: base + 'vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min',
        jsoneditor : base + 'vendors/jsoneditor/dist/jsoneditor.min',
        jstree: base + 'vendors/jstree/dist/jstree.min',
        lodash: base + 'vendors/lodash/lodash.min',
        mathjax: base + 'vendors/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured&amp;dummy',
        mathquill: base + 'vendors/mathquill-0.9.4/mathquill.min',
        pluginDetect : base +'vendors/pluginDetect/javaFlashDetect.min.js',
        swfobject: base + 'vendors/swfobject/swfobject.2.2'
      },
      shim: {
        jquery: {
          export: "$"
        },
        // pour jQueryUi faut charger les css
        jqueryUi: {
          deps : ["jquery"],
          //init: function () {
          //  console.log("On ajoute la css de jQueryUi dans shim");
          //  addCss(base + 'vendors/jqueryUi/1.11.1/jquery-ui.min.css');
          //}
        },
        jqueryUiDialog: {
          deps : ["jquery"], // marche pas en ajoutant "css!" ou "text!" +base + 'vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css'
          // cette fct init n'est jamais appelée
          //init: function () {
          //  console.log("On ajoute la css de jQueryUiDialog dans shim");
          //  addCss(base + 'vendors/jqueryUi/1.11.4.dialogRedmond/jquery-ui.min.css');
          //}
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
    ["am", "arbre", "ato", "calkc", "coll_doc", "ec2", "ecjs", "em", "j3p", "iep", "lingot", "mathgraph", "mental", "tep", "testd", "url"].forEach(function (plugin) {
      requireConfig.paths[plugin] = base + 'plugins/' + plugin + '/' + plugin;
    });
    //console.log("la conf de requireJs", requireConfig);

    return requireConfig;
  }

  function setBase(base) {
    if (!base) base = "/";
    else if (base.substr(-1) !== "/") base += "/";
    // on l'ajoute aussi dans le dom global pour que les modules puissent le retrouver
    // sans avoir à le repréciser
    if (typeof window.Sesamath === "undefined") window.Sesamath = {};
    if (!window.Sesamath.Sesatheque) window.Sesamath.Sesatheque = {};
    window.Sesamath.Sesatheque.base = base;
    require.config(getConfig(base));
    // ça c'est pour savoir si on a déjà chargé initRequire ou s'il faut le faire (parce que l'on veut donner une base différente en cross domain)
    window.Sesamath.Sesatheque.requireBase = base;
  }

  // NE PAS EFFACER ni modifier ces lignes avec CUT, ça sert à concaténer ce qui précède avec notre require.min.js)
  // Cf scripts/jsCompil
  // BEGIN CUT
  if (typeof require !== "undefined" && typeof define !== "undefined") {
    // conf par défaut dès l'exécution
    var base;
    try {
      base = window.Sesamath.Sesatheque.base;
    } catch (error) {
      base = "/";
    }
    setBase(base);
    // on exporte une fonction de conf avec comme seul argument l'url de la sésathèque
    // pour que qqun d'autre puisse reconfigurer require.js avec une autre base absolue
    // pour les modules de la sésathèque (en cas de cross-domain c'est obligatoire,
    // et ça permet de continuer à utiliser son propre require sur son domaine pour ses modules)
    define(function () {
      return setBase;
    });
  }
  // END CUT
  // IF CUT setBase("/");
})();
