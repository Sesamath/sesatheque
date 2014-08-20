/**
 * Tous les plugins doivent exporter les méthodes display et showResult
 *
 * Tout ce qui est dans ce fichier est privé,
 * spécifique à ce plugin sans collision possible avec le DOM de la page courante
 *
 * this est ce module (donc on a this.display et this.showResult), avec dans notre scope les variables
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js
 * {Function}    log             : un console.log qui ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument
 * {Function}    addCss          : ajoute une css dans le head de la page
 *                                 (lui passer le fichier relativement à ce dossier)
 * {HTMLElement} container       : le conteneur pour affichage
 * {HTMLElement} errorsContainer : un conteneur pour afficher d'éventuelles erreurs
 * {String}      baseUrl         : le préfixe vers ce dossier à utiliser dans d'éventuels href
 *                                 (pour des médias ou autres fichiers à charger)
 * {Object}      window          : l'objet window
 * {Object}      post            : le post éventuel (sinon un objet vide)
 *
 * et aussi
 * {Function} define  : utilisé ci-dessus pour définir les méthodes de ce module, ne doit pas être appelé une 2e fois
 */
/*global define, log, addCss, container, baseUrl, window */
//'use strict';

define(['jquery', 'jqueryUi'], function () {
  return {
    display   : display,
    showResult: showResult
  }
});

// reste à définir nos méthodes

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource   L'objet ressource tel qu'il sort de la bdd
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, next) {
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
   * @param {string=} content
   */
  function getElt(tag, attrs, content) {
    var elt = wd.createElement(tag);
    var attr
    if (attrs) for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) elt[attr] = attrs[attr]
    }
    if (content) elt.appendChild(wd.createTextNode(content));
    return elt;
  }

  // init
  container.innerHTML = '';
  addCss(baseUrl + '/url.css');
  container.setAttribute("width", '100%');
  // url source (non cliquable)
  addElt(container, 'p', {id:'urlSrc'}, "url source : " +ressource.parametres.url);
  if (params.question_option || (params.question_option === 'off' && params.answer_option === 'off')) {
    addElt(container, 'script', {type : "text/javascript"},
            'var question_option = "' +params.question_option +'";\n' +
            'var answer_option =  "' +params.question_option +'";\n' +
            'var datas = {type_tag:"url", origine: "' +ressource.origine +'", node_type:"url", idres:' +
                ressource.id +'};\n');
    addElt(container, "div", {id:"lienreponse"}, "Réponse");
    addElt(container, "div", {id:"lienconsigne"}, "Consigne");
    addElt(container, "div", {id:""}, "");
    addElt(container, "div", {id:"filariane"}, "Étape 1 : lecture de la consigne >> " +
        "étape 2 : visualisation de la page >> étape 3 : réponse à la consigne");
    addElt(container, "div", {id:"information", class:"invisible"},
        "Ici les informations concernant le déroulement de l'activité");
    // la consigne
    elt = getElt('div', {id:'consigne', class:'invisible'});
    addElt(elt, 'div', {id:'ccorps'}, params.consigne);
    container.appendChild(elt);
    // la réponse
    elt = getElt('div', {id:'reponse', class:'invisible'});
    // avec son form éventuel
    if (params.answer_option !== 'off') {
      elt2 = getElt('form', {name:'formulaire'}, "Ta réponse ici :");
      addElt(elt2, 'br');
      addElt(elt2, 'textarea', {id:'answer', name:'champ_answer', cols:50, rows:10});
      addElt(elt2, 'br');
      addElt(elt2, 'input', {type:'button', name:'envoyer', id:'envoi', value:'Enregistrer cette réponse'})
      elt.appendChild(elt2);
      container.appendChild(elt);
    }
    // le script de gestion des réponses
    addElt(container, 'script', {type:'text/javascript', src:baseUrl +'/main.js'})
  }
  // et l'iframe dans un div (pourquoi le div ?)
  elt = getElt('div', {id:'divpage', display:'none'})
  addElt(elt, 'iframe', {src:params.adresse}, "Si vous lisez ce texte," +
      " votre navigateur ne supporte probablement pas les iframes");
  container.appendChild(elt);

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
