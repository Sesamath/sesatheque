/**
 * Affiche une ressource de type url, avec post de la réponse ou simplement de la durée d'affichage
 *
 * Cf ../README.md pour plus d'info sur l'écriture de plugins
 */
/*global define, log, addCss, window */
//'use strict';

// pour le plugin mep, on a besoin de swfobject, que l'on indique ici comme dépendance
define(['swfobject'], function () {
  /*global swfobject*/
  // le require de swfobject a ajouté la variable swfobject dans l'espace de nom global
  // on peut retourner maintenant les méthodes que l'on doit exporter
  return {
    display   : display,
    showResult: showResult
  }
});


// reste à définir nos méthodes

var ressId;
var ressType = 'em';
var startDate

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
 * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
 *                              et éventuellement resultCallback)
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, options, next) {
  var container = options.container;
  if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
  var baseUrl = options.baseUrl; // si on a pas tant pis pour le css
  var saveResult;
  if (options.resultCallback) saveResult = options.resultCallback;
  /** class utilisée dans notre css */
  var cssClass = 'mepRess';
  var params = ressource.parametres;
  var baseMepSwf, swfUrl, largeur, hauteur, flashvars, swfParams, swfAttributes;
  // raccourcis
  var w = window;
  var wd = window.document;
  var htmlElt;
  // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
  var divId = 'mepRess' +(new Date()).getTime();
  ressId = ressource.id

  log('start mep display avec la ressource', ressource)
  //les params minimaux
  if (!ressource.id || !ressource.titre || !params) {
    throw new Error("Paramètres manquants");
  }


  // On réinitialise le conteneur
  container.innerHTML = '';
  // Ajout css
  addCss(baseUrl + '/mep.css');
  container.className = cssClass;

  // On insère le titre, sauf si on le refuse expressément via un param dans l'url
  if (! /\?.*showTitle=0/.test(wd.URL)) w.addElt(container, "div", {class:'titre'}, ressource.titre);

  // le message en attendant le chargement
  w.addElt(container, "div", {id:divId}, "Chargement de la ressource " +ressource.id +" en cours.");

  // notre base
  if (ressource.origine !== 'mep' && ressource.baseUrl) baseMepSwf =  ressource.baseUrl;
  else baseMepSwf = "http://mep-col.sesamath.net/dev/swf";
  // url du swf
  if (params.swf_id)  swfUrl = baseMepSwf +'/exo' +params.swf_id +".swf";
  else swfUrl = baseMepSwf +'/exo' +ressource.id +".swf";
  /**
   * Lance le chargement avec swfobject
   */
  if (params.mep_modele === 'mep2lyc') {
    largeur = 959;
    hauteur = 618;
  } else {
    largeur = 735;
    hauteur = 450;
  }
  // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
  if (container.style) container.style.width = largeur +'px';
  else container.setAttribute("width", largeur +'px'); // marche pas avec chrome ou ff

  /** @see http://redmine.sesamath.net/projects/alibaba/wiki/ExosMep pour les flashvars à passer */
    // les flashvars pour le swf obligatoires à tous
  flashvars = {
    idMep: ressource.id,
    modeleMep : params.mep_modele,
    abreviationLangue: params.mep_langue_id,
    idSwf : (params.swf_id) ? params.swf_id : ressource.id
  };
    // ensuite le facultatif si présent
    if (params.suite_formateur) flashvars.isBoutonSuite = params.suite_formateur;
    if (params.aide_id) flashvars.idAide = params.aide_id;
    if (params.aide_formateur) flashvars.isBoutonAide = params.aide_formateur;
    // 0 ressources publiques en 2013-11, mais qq unes dans MEPS pas publiées
    if (params.nb_wnk) flashvars.mep_nb_wnk = params.nb_wnk;

    // traitement du résultat éventuel (il faudra que l'appelant passe un idUtilisateur)
    if (saveResult && typeof saveResult === "function") {
      // faut une fonction qui va transformer le résultat au format attendu
      // et la pour rendre accessible au swf dans son dom
      window.resultCb = function (result) {
        log('le swf renvoie le résultat', result)
        saveResult({
          reponse:result,
          ressId : ressId,
          ressType:ressType,
          date : startDate,
          duree : Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
        })
      }
      flashvars.nomFonctionCallback = 'resultCb';
    }

    // les params pour le player
    swfParams = {
      "base" : baseMepSwf + "/",
      "menu" : "false",
      "wmode": "window",
      "allowScriptAccess": "always" // important pour que le swf puisse communiquer avec le js de cette page
    };
    // et les attributs pour le loader swfobject.embedSWF
    swfAttributes = {
      id: divId,
      name: divId
    };

    // swfobject.embedSWF (swfUrl, htmlId, largeur, hauteur, version_requise,
    //    expressInstallSwfurl, flashvars, params, attributes, callbackFn)
    swfobject.embedSWF(swfUrl, divId, largeur, hauteur, "8", null, flashvars, swfParams, swfAttributes, callbackFn);

    function callbackFn(e) {
      var retour
      if (e.success) {
        startDate = new Date();
        log("Chargement de " + swfUrl, e);
      } else {
        htmlElt = wd.createElement("p");
        htmlElt.appendChild(wd.createTextNode("Javascript fonctionne" +
            " mais votre navigateur ne supporte pas les éléments Adobe Flash, impossible d'afficher cette ressource."));
        errorsContainer.appendChild(htmlElt)
        retour = new Error('Le chargement de ' + swfUrl + ' a échoué');
      }
      if (next && typeof next === "function") {
        next(retour);
      }
    }
}

/**
 * Affiche un résultat sauvegardé préalablement
 * @todo convertir la chaine vvrvb et rectangles vert rouges et bleus
 * @param {Resultat} Un résultat à afficher
 * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
 */
function showResult(result, elt) {
  log('showResult', result)
  log("dans l'élément", elt)
}
