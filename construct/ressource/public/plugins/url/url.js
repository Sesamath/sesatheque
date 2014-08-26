/**
 * Affiche une ressource de type url, avec post de la réponse ou simplement de la durée d'affichage
 *
 * Cf ../README.md pour plus d'info sur l'écriture de plugins
 */

/*global define, log, addCss, container, baseUrl, window */
'use strict';

var $;
var w = window;

define(['jquery', 'jqueryUi'], function () {
  // l'objet $ a été ajouté au scope, mais au cas où de prochaine versions n'exporteraient que jQuery
  // on le fait ici
  $ = window.jQuery

  return {
    display   : display,
    showResult: showResult
  }
});
/* global $ */

// reste à définir nos méthodes
var ressId;
var startDate;
var isBasic;

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource   L'objet ressource tel qu'il sort de la bdd
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, saveResult) {
  log('start url display avec la ressource', ressource)
  //les params minimaux
  if (!ressource.id || !ressource.titre || !ressource.parametres || !ressource.parametres.adresse) {
    throw new Error("Paramètres manquants");
  }
  var params = ressource.parametres;
  var elt, elt2, elt3;

  // init
  addCss(baseUrl + '/url.css');
  container.setAttribute("height", '100%');

  // un div pour la partie hors iframe
  elt = w.getElt('div', {id:'head'});
  isBasic = (!params.question_option || (params.question_option === 'off' && params.answer_option === 'off'))
  if (isBasic && saveResult) {
    // un listener pour envoyer "affiché" comme score (i.e. un score de 1 avec une durée)
    $('body').on('unload', function() {
      saveResult({
        score  : 1,
        ressId : ressId,
        ressType:'url',
        date : startDate,
        duree : Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
      })
    })
  } else if (!isBasic) {
    w.addElt(elt, "div", {id: "lienreponse"}, "Réponse");
    w.addElt(elt, "div", {id: "lienconsigne"}, "Consigne");
    w.addElt(elt, "div", {id: "filariane"}, "Étape 1 : lecture de la consigne >> " +
        "étape 2 : visualisation de la page >> étape 3 : réponse à la consigne");
    w.addElt(elt, "div", {id: "information", class: "invisible"},
        "Ici les informations concernant le déroulement de l'activité");

    // la consigne
    elt2 = w.getElt('div', {id: 'consigne', class: 'invisible'});
    // elle peut contenir du html
    elt2.innerHTML = params.consigne;
    elt.appendChild(elt2);

    // la réponse
    elt2 = w.getElt('div', {id: 'reponse', class: 'invisible'});

    // avec son form éventuel
    if (params.answer_option !== 'off') {
      // la ressource attend une réponse
      if (saveResult) {
        elt3 = w.getElt('form', {post:"#"}, "Ta réponse ici :");
        w.addElt(elt3, 'br');
        w.addElt(elt3, 'textarea', {id: 'answer', name: 'champ_answer', cols: 50, rows: 10});
        w.addElt(elt3, 'br');
        w.addElt(elt3, 'button', {id: 'envoi', value: 'Enregistrer cette réponse'});
        elt2.appendChild(elt3);
      } else {
        // on a une consigne mais rien pour l'enregistrer, c'est louche
        log("La ressource url " +ressId +
            " possède consigne et question mais aucune fonction n'a été fournie pour enregistrer la réponse");
        // on affiche une explication
        w.addElt(elt2, 'p', "Il y a une réponse attendue mais le contexte actuel ne permet pas de l'enregistrer" +
            " (vous n'êtes pas authentifié ou l'application qui affiche cette ressource" +
            " ne gère pas l'enregistrement de ce type de réponse)")
      }
    }
    elt.appendChild(elt2);


  } // fin question-réponse
  container.appendChild(elt)

  // la gestion des réponses (fallait attendre que les éléments soient dans le dom pour ajouter l'écouteur)
  if (saveResult && params.answer_option !== 'off') {
    // on ajoute l'envoi de la réponse sur le bouton
    $('#envoi').on('click', function () {
      var reponse = $('#answer').val();
      saveResult({
        score  : 1,
        reponse:reponse,
        ressId : ressId,
        ressType:'url',
        date : startDate,
        duree : Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
      })
    })
  }

  // l'iframe
  w.addElt(container, 'iframe', {src:params.adresse, id:'page'}, "Si vous lisez ce texte," +
      " votre navigateur ne supporte probablement pas les iframes");

  // url source (non cliquable) en footer
  w.addElt(container, 'p', {id:'urlSrc'}, "url source : " +ressource.parametres.adresse);
  // on redimensionne tout de suite
  resizeIframe()
  // et à chaque changement de la taille de la fenêtre
  $(window).resize(resizeIframe)

  // et les comportements
  if (!isBasic) require(['main'], function(main) {
    main.start(params.question_option, params.answer_option);
  })
}

/**
 * Affiche un résultat sauvegardé préalablement
 * @param {Object}      result Le résultat tel qu'il a été passé à saveResult au préalable
 * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
 */
function showResult(result, elt) {
  log('showResult', result)
  log("dans l'élément", elt)
}

/**
 * Modifie la taille de l'iframe pour lui donner tout l'espace restant de container
 */
function resizeIframe() {
  return
  var tailleDispo = Math.floor(window.innerHeight - $("#head").outerHeight(true) - $("#urlSrc").outerHeight(true));
  if (tailleDispo < 300) tailleDispo = 300;
  log('resize hauteur à ' +tailleDispo)
  $("#display").css("height", tailleDispo +'px');
  // pour l'iframe de l'url, faut retirer ce que l'on utilise pour consigne & co
  if (!isBasic) tailleDispo -= $('#head').innerHeight()
  $("#page").css("height", tailleDispo +'px');
  // et la largeur de l'iframe
  tailleDispo = $(container).innerWidth()
  if (tailleDispo < 300) tailleDispo = 300;
  log('resize largeur à ' +tailleDispo)
  $("#page").css("width", tailleDispo +'px');
}
