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
 * Affiche une ressource de type url, avec post de la réponse ou simplement de la durée d'affichage
 *
 * Cf ../README.md pour plus d'info sur l'écriture de plugins
 */

/*global define, log, addCss, window */

//define(['jquery171', 'jqueryUi18c'], function () {
// faudra ajouter le css au début de display
define(['jquery1', 'jqueryUiRedmond'], function () {
  'use strict';
  /** notre module exporté avec sa méthode display */
  var url = {};

  // l'objet $ devoir été ajouté au scope comme alias de jQuery, mais au cas où...
  var $ = window.jQuery;
  var w = window;
  var baseUrl;
  var container;
  var errorsContainer;
  var resultCallback;
  var ressId;
  var startDate;
  var isBasic;

  function finalize(params) {
    // url source (non cliquable) en footer
    w.addElement(container, 'p', {id: 'urlSrc'}, "source : " + params.adresse);
    // on redimensionne tout de suite
    resizePage()
    // et à chaque changement de la taille de la fenêtre
    $(window).resize(resizePage)

    // et les comportements
    if (!isBasic) require(['main'], function (main) {
      // on attend que $ ai fini de manipuler le dom
      $(function () {
        main.start(params.question_option, params.answer_option);
      })
    })
  }

  /**
   * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
   */
  function resizePage() {
    var occupe = 0;
    ["#errors", "#titre", "#head", "#urlSrc"].forEach(function (selector) {
      occupe += $(selector).outerHeight(true);
    })
    var tailleDispo = Math.floor(window.innerHeight - occupe);
    if (tailleDispo < 300) tailleDispo = 300;
    $("#display").css("height", tailleDispo +'px');
    log('resize iframe à ' +tailleDispo)
    // pour l'iframe de l'url, faut retirer ce que l'on utilise pour consigne & co
    if (!isBasic) tailleDispo -= $('#head').innerHeight()
    $("#page").css("height", tailleDispo +'px');
    // et la largeur de l'iframe
    tailleDispo = $(container).innerWidth() - 4; // 2px de marge dans le css
    if (tailleDispo < 300) tailleDispo = 300;
    log('resize largeur à ' +tailleDispo)
    $("#page").css("width", tailleDispo +'px');
  }

  /**
   * Affiche la ressource dans l'élément d'id mepRess
   * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
   * @param {Object}   opt        Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
   *                              et éventuellement resultCallback)
   * @param {Function} next       La fct à appeler quand la ressource sera chargée (sans argument ou avec une erreur)
   */
  url.display = function (ressource, opt, next) {
    log('url.display avec les options', opt);
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse)
      throw new Error("Ressource incomplète");
    if (!opt.baseUrl || !opt.container || !opt.errorsContainer) throw new Error("Paramètres manquants");

    // ajout du css de jquery-ui
    addCss(opt.vendorsBaseUrl +'/jqueryUi/jquery-ui-1.11.1.dialogRedmond/jquery-ui.min.css', true);
    //addCss(opt.vendorsBaseUrl +'/jqueryUi/jquery-ui-1.11.1/jquery-ui.structure.min.css', true);

    // init de nos var globales
    baseUrl = opt.baseUrl;
    container = opt.container;
    errorsContainer = opt.errorsContainer;
    if (typeof opt.resultCallback === 'function') resultCallback = opt.resultCallback;
    ressId = ressource.oid;
    startDate = new Date();

    // raccourcis
    var params = ressource.parametres;
    var url = ressource.parametres.adresse;
    var elt, elt2, elt3;

    // init
    addCss(baseUrl + '/url.css');

    // un div pour la partie hors iframe
    elt = w.getElement('div', {id:'head'});
    // ni question ni réponse
    isBasic = ((!params.question_option || params.question_option === 'off') &&
               (!params.answer_option   || params.answer_option === 'off'))
    // s'il faut une réponse
    if (isBasic && resultCallback) {
      // un listener pour envoyer "affiché" comme score (i.e. un score de 1 avec une durée)
      $('body').on('unload', function() {
        resultCallback({
          score  : 1,
          ressId : ressId,
          ressType:'url',
          date : startDate,
          duree : Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
        })
      })
    } else if (!isBasic) {
      // pas seulement la page
      w.addElement(elt, "div", {id: "lienreponse"}, "Réponse");
      w.addElement(elt, "div", {id: "lienconsigne"}, "Consigne");
      w.addElement(elt, "div", {id: "filariane"}, "Étape 1 : lecture de la consigne >> " +
                                                  "étape 2 : visualisation de la page >> étape 3 : réponse à la consigne");
      w.addElement(elt, "div", {id: "information", class: "invisible"},
                   "Ici les informations concernant le déroulement de l'activité");

      // la consigne
      elt2 = w.getElement('div', {id: 'consigne', class: 'invisible'});
      // elle peut contenir du html
      if (params.consigne) elt2.innerHTML = params.consigne;
      elt.appendChild(elt2);

      // la réponse
      elt2 = w.getElement('div', {id: 'reponse', class: 'invisible'});
      // avec son form éventuel
      if (params.answer_option !== 'off') {
        // la ressource attend une réponse
        if (resultCallback) {
          log('aj du form')
          elt3 = w.getElement('div', {}, "Ta réponse ici :"); // form obligatoire ?
          w.addElement(elt3, 'br');
          w.addElement(elt3, 'textarea', {id: 'answer', name: 'answer', cols: 45, rows: 9});
          w.addElement(elt3, 'br');
          w.addElement(elt3, 'button', {id: 'envoi'}, 'Enregistrer cette réponse');
          elt2.appendChild(elt3);
        } else {
          // on a une question qui attend une réponse mais rien pour l'enregistrer, c'est louche
          log("La ressource url " +ressId +
              " possède consigne et question mais aucune fonction n'a été fournie pour enregistrer la réponse");
          // on affiche une explication
          w.addElement(elt2, 'p', "Il y a une réponse attendue mais le contexte actuel ne permet pas de l'enregistrer" +
                                  " (vous n'êtes pas authentifié ou l'application qui affiche cette ressource" +
                                  " ne gère pas l'enregistrement de ce type de réponse)")
        }
      }
      elt.appendChild(elt2);
    } // fin question-réponse
    container.appendChild(elt)

    // la gestion des réponses (fallait attendre que les éléments soient dans le dom pour ajouter l'écouteur)
    if (resultCallback && params.answer_option !== 'off') {
      // on ajoute l'envoi de la réponse sur le bouton
      $('#envoi').click(function () {
        var reponse = $('#answer').val();
        resultCallback({
          score  : 1,
          reponse:reponse,
          ressId : ressId,
          ressType:'url',
          date : startDate,
          duree : Math.floor(((new Date()).getTime() - startDate.getTime()) / 1000)
        })
      })
    }

    // l'iframe, mais on fait un cas particulier pour les urls en swf qui ne renvoient pas un DOMDocument
    // ff aime pas et sort une erreur js Error: Permission denied to access property 'toString'
    // chrome râle aussi parce que c'est pas un document
    if (/^[^?]+.swf(\?.*)?$/.test(url)) { // faut pas prendre les truc.php?toto=truc.swf
      log("C'est un swf, on ajoute un div et pas une iframe")
      require(['sesaswf'], function(sesaswf) {
        var swfContainer = w.getElement('div', {src: params.adresse, id: 'page'});
        var swfId = 'swf' +(new Date()).getTime();
        var options = {
          id : swfId,
          hauteur : Math.floor(window.innerHeight -60),
          largeur : Math.floor(window.innerWidth - 40)
        };
        if (isBasic) options.hauteur -= 60;
        container.appendChild(swfContainer);
        log("On charge " +url +" dans #page avec", options)
        sesaswf.load(swfContainer, url, options, function() {
          finalize(params);
          // on est appelé quand swfobject a mis l'object dans le dom, mais le swf est pas forcément chargé
          // on regarde la hauteur pour savoir si c'est fait
          if ($('#' +swfId).innerHeight() > 10) next();
          else $('#' +swfId).on('load', next)
        }); /* */
      });
    } else {
      w.addElement(container, 'iframe', {src: params.adresse, id: 'page'}, "Si vous lisez ce texte," +
                                                                           " votre navigateur ne supporte probablement pas les iframes");
      $('#page').on('load', next)
      finalize(params);
    }
  };

  return url;
});
