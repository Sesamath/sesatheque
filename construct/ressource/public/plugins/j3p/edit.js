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
 * @file Édite une ressource j3p, en filant la ressource à j3p:/editgraphes/lanceur_graphique.html?callback=initEditJ3p en iframe
 * qui rappellera initEditJ3p(initCallback) quand il sera chargé pour qu'on lui renvoie les params avec
 * initCallback(ressource, resultatCallback)
 */
try {
  define(["jquery"], function ($) {
    /* jshint jquery:true */
    "use strict";

    // nos fcts internes
    /**
     * Ajoute l'iframe d'editgraphe
     * @private
     * @param {string} urlEditGraphe
     */
    function addEditGraphe(urlEditGraphe, container) {
      S.log("addEditGraphe avec " +urlEditGraphe);
      var args = {src: urlEditGraphe, id:"editgraphe"};
      var editgraphe = S.addElement(container, 'iframe', args, "Si vous lisez ce texte, votre navigateur ne supporte pas les iframes");
      $editgraphe = $(editgraphe);
      autosize();
      return editgraphe.contentWindow;
    }

    /**
     * Appelle resizeIframe et le colle comme comportement au resize de la fenêtre
     * @private
     */
    function autosize() {
      // on redimensionne dès que jQuery est prêt
      $(resizeIframe);
      // et à chaque changement de la taille de la fenêtre
      $(window).resize(resizeIframe);
    }

    /**
     * Modifie la taille de l'iframe pour le maximiser sur l'espace visible
     * @private
     */
    function resizeIframe() {
      var tailleDispo = Math.floor(window.innerHeight);
      if (tailleDispo < 300) tailleDispo = 300;
      $editgraphe.height(tailleDispo);
      S.log('resize iframe height à ' + tailleDispo);
      tailleDispo = $editgraphe.width();
      if (tailleDispo < 300) $editgraphe.width(300);
      else $editgraphe.css("width", '100%');
      $editgraphe.scrollTop(0);
    }

    /**
     * Met dans le textarea la string json de l'objet passé en param
     * @param {object} parametres
     */
    function saveParametres(parametres) {
      try {
        var paramString = JSON.stringify(parametres);
        $textarea.val(paramString);
      } catch (error) {
        ST.addError("editgraphe a renvoyé un objet malformé", 5);
      }
    }

    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    // raccourcis
    var w = window;
    var wd = w.document;
    var S = window.sesamath;
    var ST = S.sesatheque;

    var $editgraphe, $textarea;

    return {
      init: function (ressource, options) {
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        var textarea = wd.getElementById('parametres');
        if (!textarea) throw new Error("Pas de textarea #parametres trouvé dans cette page");
        $textarea = $(textarea);
        // le container pour l'iframe
        var container = wd.getElementById('groupParametres');
        if (!container) {
          S.log("pas trouvé de #formRessource, on prend le parent du textarea");
          container = textarea.parentNode();
        }
        var urlEditGraphe = "http://j3p.";
        if (options.isDev) urlEditGraphe += "dev";
        urlEditGraphe += "sesamath.net/editgraphes/lanceur_graphique.html";
        //urlEditGraphe = "http://j3p.local/editgraphes/lanceur_graphique.html";
        $textarea.hide();
        var egWindow = addEditGraphe(urlEditGraphe, container);
        // Un écouteur sur le message editGrapheReady que nous enverra editGraphe avec une action de callback pour charger le graphe
        window.addEventListener("message", function (event) {
          S.log("Message reçu dans l'édition de la ressource", event);
          // on teste pas event.origin, on accepte d'être embarqué par tout le monde
          if (event.data && event.data.action === "editGrapheReady") {
            if (!event.data.loadCallback) ST.addError("editgraphe n'a pas fourni de fonction pour charger le graphe");
            else egWindow.postMessage({action:"load", ressource:ressource}, "*");
          }
        });
        window.j3pEditgrapheCallback = function (initEditgraphe) {
          initEditgraphe(ressource, saveParametres);
        };
      }
    };
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
