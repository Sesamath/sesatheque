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

try {
  define(["jquery1"], function () {
    "use strict";
    /* jshint jquery:true */

    /**
     * Ajoute l'iframe (ou un div si c'est un swf directement)
     * @private
     */
    function addPage(params, next) {
      S.log("addPage avec les params", params);
      var page = S.addElement(container, 'div', {id: "page"});
      var args = {src: params.adresse};
      // l'iframe, mais on fait un cas particulier pour les urls en swf qui ne renvoient pas un DOMDocument
      // ff aime pas et sort une erreur js Error: Permission denied to access property 'toString'
      // chrome râle aussi parce que c'est pas un document
      if (/^[^?]+.swf(\?.*)?$/.test(url)) { // faut pas prendre les truc.php?toto=truc.swf
        S.log("C'est un swf, on ajoute un div et pas une iframe");
        var swfContainer = S.addElement(page, 'div', args);
        require(['tools/swf'], function (swf) {
          var swfId = 'swf' + (new Date()).getTime();
          var options = {
            id: swfId,
            hauteur: params.hauteur || Math.floor(window.innerHeight - 60),
            largeur: params.largeur || Math.floor(window.innerWidth - 40)
          };
          if (isBasic) options.hauteur -= 60;
          if (options.hauteur < 100) options.hauteur = 100;
          if (options.largeur < 100) options.largeur = 100;
          S.log("On charge " + url + " dans #page avec", options);
          swf.load(swfContainer, url, options, function () {
            if (!options.hauteur && !options.largeur) autosize(params);
            // on est appelé quand swfobject a mis l'object dans le dom, mais le swf est pas forcément chargé
            // on regarde la hauteur pour savoir si c'est fait
            var $swfId = $('#' + swfId);
            if ($swfId.innerHeight() > 10) next();
            else $swfId.on('load', function () {
              next();
            }); // ne pas passer directement next en cb sinon il sera appelé avec un argument, qui sera interprété comme une erreur
          });
          /* */
        });
      } else if (/^[^?]+.(png|jpe?g|gif)(\?.*)?$/.test(url)) {
        if (params.hauteur > 100) args.height = params.hauteur;
        if (params.largeur > 100) args.width = params.largeur;
        S.log("c'est une image, pas d'iframe mais un tag img", args, params);
        S.addElement(page, 'img', args);
        next();
      } else {
        S.addElement(page, 'iframe', args, "Si vous lisez ce texte," +
            " votre navigateur ne supporte probablement pas les iframes");
        // url source (non cliquable) en footer
        autosize(params);
        next();
      }
      S.addElement(page, 'p', {id: 'urlSrc'}, "source : " + params.adresse);
    }

    function autosize() {
      // on redimensionne dès que jQuery est prêt
      $(resizePage);
      // et à chaque changement de la taille de la fenêtre
      $(window).resize(resizePage);
    }

    /**
     * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
     */
    function resizePage() {
      var $page = $("#page");
      var occupe = 0;
      ["#errors", "#warnings", "#titre", "#entete", "#urlSrc"].forEach(function (selector) {
        occupe += $(selector).outerHeight(true);
      });
      var tailleDispo = Math.floor(window.innerHeight - occupe);
      if (tailleDispo < 300) tailleDispo = 300;
      $("#display").css("height", tailleDispo + 'px');
      S.log('resize iframe à ' + tailleDispo);
      // pour l'iframe de l'url, faut retirer ce que l'on utilise pour consigne & co
      if (!isBasic) tailleDispo -= $('#entete').innerHeight();
      $page.css("height", tailleDispo + 'px');
      // et la largeur de l'iframe
      tailleDispo = $(container).innerWidth() - 4; // 2px de marge dans le css
      if (tailleDispo < 300) tailleDispo = 300;
      S.log('resize largeur à ' + tailleDispo);
      $page.css("width", tailleDispo + 'px');
    }

    function sendResultat(reponse) {
      var resultat = {
        score: 1,
        ressId: ressId,
        ressType: 'url',
        date: startDate,
        duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
      };
      if (reponse) resultat.reponse = reponse;
      resultatCallback(resultat);
    }

    /** notre module exporté avec sa méthode display */
    var url = {};

    // raccourcis, si ça plante le catch gère
    var S = window.Sesamath;
    var container, errorsContainer, isBasic, ressId, resultatCallback, startDate;

    /**
     * Affiche la ressource url, en créant une iframe dans le container (ou un div si l'url est un swf)
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
     */
    url.display = function (ressource, options, next) {
      S.log('url.display avec les options', options);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse) throw new Error("Ressource incomplète");
      ["sesathequeBase", "pluginBase", "container", "errorsContainer"].forEach(function (param) {
        if (!options[param]) throw new Error("Paramètre " + param + " manquant");
      });

      // init de nos var globales
      container = options.container;
      errorsContainer = options.errorsContainer;
      if (typeof options.resultatCallback === 'function') resultatCallback = options.resultatCallback;
      ressId = ressource.oid;
      startDate = new Date();

      // raccourcis
      var params = ressource.parametres;
      url = params.adresse;

      // init
      S.addElement(container, 'p', {id: "loading"}, "Chargement en cours...");
      S.addCss(options.pluginBase + '/url.css');

      var hasConsigne = (params.question_option && params.question_option !== 'off');
      var hasReponse = (params.answer_option && params.answer_option !== 'off');
      var isBasic = !hasConsigne && !hasReponse;
      // ni question ni réponse
      if (isBasic) {
        addPage(params, next);
        if (resultatCallback) {
          // un listener pour envoyer "affiché" comme score (i.e. un score de 1 avec une durée)
          $('body').on('unload', sendResultat);
        } // sinon rien à faire
      } else {
        /**
         * Ajout des comportements pour la gestion des panneaux Consigne et Réponse avec jQueryUi
         */
        var dependances = [options.pluginBase + '/urlUi.js', "jqueryUiDialog"];
        var hasCkeditor = (params.answer_editor && params.answer_editor.indexOf('ckeditor') === 0);
        var hasMqEditor = (params.answer_editor === 'mqEditor');
        if (hasCkeditor) dependances.push('ckeditor');
        else if (hasMqEditor) dependances.push("mqEditor");
        require(dependances, function (urlUi, jqUi, editor) {
          function sendReponse() {
            if (!isResultatSent) {
              var reponse = $(textarea).val();
              sendResultat(reponse, function (retour) {
                if (retour) isResultatSent = true;
              });
            }
          }

          // on ajoute tous nos div même si tous ne serviront pas (car urlUi les cherche dans la page)
          var entete = S.addElement(container, 'div', {id: 'entete'});
          S.addElement(entete, 'div', {id: 'lienConsigne'}, 'Consigne');
          S.addElement(entete, 'div', {id: 'lienReponse'}, 'Réponse');
          S.addElement(entete, "div", {id: "filariane"});
          S.addElement(entete, 'div', {id: "information", class: "invisible"});
          var divConsigne = S.addElement(entete, 'div', {id: "consigne", class: "invisible"});
          var divReponse = S.addElement(entete, 'div', {id: "reponse", class: "invisible"});
          if (hasConsigne) {
            if (params.consigne) $(divConsigne).html(params.consigne);
            else S.log.error("Pas de consigne alors que question_option vaut " + params.question_option);
          }
          if (hasReponse) {
            var form = S.addElement(divReponse, 'form', {action: ""});
            var textarea = S.addElement(form, 'textarea', {id: "answer", cols: "50", rows: "10"});
            if (hasCkeditor) {
              /* global CKEDITOR */
              if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) CKEDITOR.tools.enableHtml5Elements(document);
              CKEDITOR.config.height = 150;
              CKEDITOR.config.width = 'auto';
              if (params.answer_editor == 'ckeditorTex') {
                CKEDITOR.config.extraPlugins = 'mathjax';
                CKEDITOR.config.mathJaxLib = "/vendors/mathjax/2.2/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
              }
              CKEDITOR.replace('answer', {
                toolbarGroups: [
                  {name: 'clipboard', groups: ['clipboard', 'undo']},
                  {name: 'editing', groups: ['find', 'selection']},
                  {name: 'insert'},
                  {name: 'forms'},
                  {name: 'tools'},
                  {name: 'document', groups: ['mode', 'document', 'doctools']},
                  {name: 'others'},
                  '/',
                  {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
                  {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi']},
                  {name: 'styles'},
                  {name: 'colors'},
                  {name: 'about'}
                ],
                removeButtons: 'Styles,Source',
                customConfig: '' // on veut pas charger le config.js
              });
            } else if (hasMqEditor) {
              editor(form, params.mqEditorConfig, options);
            }
            if (resultatCallback) {
              var isResultatSent = false;
              S.addElement(form, 'br');
              var boutonReponse = S.addElement(form, 'button', {id: "envoi"}, "Enregistrer cette réponse");
              // on ajoute l'envoi de la réponse sur le bouton et à la fermeture
              $(boutonReponse).click(sendReponse);
              $('body').on("unload", sendReponse);
              $(textarea).change(function () {
                isResultatSent = false;
              });
            } else if (options.preview) {
              S.addElement(form, 'p', null, "Réponse attendue mais pas d'envoi possible en prévisualisation");
            } else {
              S.addElement(form, 'p', {class: "error"}, "Une réponse est attendue mais aucune destination n'a été fournie pour l'envoyer");
            }
            addPage(params, function () {
              urlUi(ressource, options, function () {
                $("#loading").empty();
                next();
              });
            });
          }
        });
      } // fin question-réponse
    };

    return url;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
