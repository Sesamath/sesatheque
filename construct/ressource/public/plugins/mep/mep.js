/**
 * Tous les plugins doivent exporter les méthodes display et showResult
 */

/**
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
 *
 * et aussi
 * {Function} define  : utilisé ci-dessus pour définir les méthodes de ce module, ne doit pas être appelé une 2e fois
 */
/*global define, log, addCss, container, errorsContainer, baseUrl, window */
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

/** class utilisée dans notre css */
var cssClass = 'mepRess';

// reste à définir nos méthodes

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource   L'objet ressource tel qu'il sort de la bdd
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 * @param {Function} saveResult [optional] Une méthode à appeler, si elle existe, pour sauvegarder un résultat
 */
function display(ressource, next, saveResult) {
  var params = ressource.parametres;
  var baseMepSwf, swfUrl, largeur, hauteur, flashvars, swfParams, swfAttributes;
  var wd = window.document;
  var htmlElt;
  var divId = 'mepRess'; // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf

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
  if (! /\?.*showTitle=0/.test(wd.URL)) {
    htmlElt = wd.createElement("div");
    htmlElt.className = 'titre';
    htmlElt.appendChild(wd.createTextNode(ressource.titre));
    container.appendChild(htmlElt);
  }

  // le message en attendant le chargement
  htmlElt = wd.createElement("div");
  htmlElt.id = divId;
  htmlElt.appendChild(wd.createTextNode("Chargement de la ressource " +ressource.id +" en cours."));
  container.appendChild(htmlElt);

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
      // faut nommer cette fonction et la rendre accessible au swf dans le dom
      window.saveResult = saveResult
      flashvars.nomFonctionCallback = 'saveResult';
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
 * @param {Object}      result Le résultat tel qu'il a été passé à saveResult au préalable
 * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
 */
function showResult(result, elt) {
  log('showResult', result)
  log("dans l'élément", elt)
}
