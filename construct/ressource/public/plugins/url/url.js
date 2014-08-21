/**
 * Tous les plugins doivent exporter les méthodes display et showResult
 *
 * Le plugin est dans une page contenant seulement deux div, #errors et #display
 *
 * Tout ce qui est dans ce fichier est privé, spécifique à ce plugin et sans collision possible avec le DOM
 * de la page courante (qui ne contient de toute façon pas grand chose de plus que ce que l'on demande)
 *
 * this est ce module (donc on a par exemple les méthodes this.display et this.showResult, mais pas this.document),
 * avec dans notre scope
 * {Function}    define          : à utiliser une fois pour définir les librairies que l'on veut avoir à disposition
 *                                 avant de renvoyer l'export de ce module
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js (dans notre dossier)
 * {Function}    log             : un console.log qui ne fait rien en prod, ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument
 * {Function}    addCss          : ajoute une css dans le head de la page courante
 *                                 (lui passer le fichier relativement à ce dossier)
 * {HTMLElement} container       : le conteneur pour l'affichage (div#display)
 * {HTMLElement} errorsContainer : un conteneur pour afficher d'éventuelles erreurs (div#errors au dessus du display)
 * {String}      baseUrl         : le préfixe vers ce dossier à utiliser dans d'éventuels href (sans le / de fin)
 *                                 (pour des médias ou autres fichiers à charger)
 * {Object}      window          : l'objet window
 * {Object}      post            : le post éventuel (sinon un objet vide)
 */

/*global define, log, addCss, container, baseUrl, window */
'use strict';

define(['jquery', 'jqueryUi'], function () {
  return {
    display   : display,
    showResult: showResult
  }
});
/* global $ */

// reste à définir nos méthodes

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
  var wd = window.document;
  var params = ressource.parametres;
  var elt, elt2, elt3, elt4;

  /**
   * Ajoute un élément html de type tag à parent
   * @param {HTMLElement} parent
   * @param {string} tag
   * @param {Object=} attrs Les attributs
   * @param {string=} content
   */
  function addElt(parent, tag, attrs, content) {
    var elt = getElt(tag, attrs, content)
    parent.appendChild(elt);
  }

  /**
   * Retourne un élément html de type tag
   * @param {string} tag
   * @param {Object=} attrs Les attributs
   * @param {string=} txtContent
   */
  function getElt(tag, attrs, txtContent) {
    var elt = wd.createElement(tag);
    var attr
    if (attrs) for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) elt[attr] = attrs[attr]
    }
    if (txtContent) elt.appendChild(wd.createTextNode(txtContent));
    return elt;
  }

  // init
  addCss(baseUrl + '/url.css');
  container.setAttribute("height", '100%');

  // un div pour la partie hors iframe
  elt = getElt('div', {id:'head'});
  if (params.question_option || (params.question_option === 'off' && params.answer_option === 'off')) {
    addElt(container, 'script', {type : "text/javascript"},
            'var question_option = "' +params.question_option +'";\n' +
            'var answer_option =  "' +params.question_option +'";\n' +
            'var datas = {type_tag:"url", origine: "' +ressource.origine +'", node_type:"url", idres:' +
                ressource.id +'};\n');
    addElt(elt, "div", {id:"lienreponse"}, "Réponse");
    addElt(elt, "div", {id:"lienconsigne"}, "Consigne");
    addElt(elt, "div", {id:""}, "");
    addElt(elt, "div", {id:"filariane"}, "Étape 1 : lecture de la consigne >> " +
        "étape 2 : visualisation de la page >> étape 3 : réponse à la consigne");
    addElt(elt, "div", {id:"information", class:"invisible"},
        "Ici les informations concernant le déroulement de l'activité");
    // la consigne
    elt2 = getElt('div', {id:'consigne', class:'invisible'});
    addElt(elt2, 'div', {id:'ccorps'}, params.consigne);
    elt.appendChild(elt2);
    // la réponse
    elt2 = getElt('div', {id:'reponse', class:'invisible'});
    // avec son form éventuel
    if (params.answer_option !== 'off') {
      elt3 = getElt('form', {name:'formulaire'}, "Ta réponse ici :");
      addElt(elt3, 'br');
      addElt(elt3, 'textarea', {id:'answer', name:'champ_answer', cols:50, rows:10});
      addElt(elt3, 'br');
      addElt(elt3, 'input', {type:'button', name:'envoyer', id:'envoi', value:'Enregistrer cette réponse'})
      elt2.appendChild(elt3);
    }
    elt.appendChild(elt2);
    // le script de gestion des réponses
    addElt(container, 'script', {type:'text/javascript', src:baseUrl +'/main.js'})
  }
  container.appendChild(elt)

  // l'iframe
  addElt(container, 'iframe', {src:params.adresse,id:'page'}, "Si vous lisez ce texte," +
      " votre navigateur ne supporte probablement pas les iframes");

  // url source en footer
  // url source (non cliquable)
  addElt(container, 'p', {id:'urlSrc'}, "url source : " +ressource.parametres.adresse);
  // on redimensionne tout de suite
  resizeIframe()
  // et à chaque changement de la taille de la fenêtre
  $(window).resize(resizeIframe)
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
  var taille = Math.floor(window.innerHeight - $("#head").outerHeight(true) - $("#urlSrc").outerHeight(true));
  log('resize hauteur à ' +taille)
  $("#display").css("height", taille +'px');
  $("#page").css("height", taille +'px');
  taille = $(container).innerWidth()
  log('resize largeur à ' +taille)
  $("#page").css("width", taille +'px');
}
