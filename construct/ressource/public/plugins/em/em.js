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
 * @module em
 * Cf ../README.md pour plus d'info sur l'écriture de plugins
 */
/*global define, log, addCss, window */

// pour le plugin mep, on a besoin de swfobject, que l'on indique ici comme dépendance
define(['swfobject'], function () {
  "use strict";
  // le require de swfobject a ajouté la variable swfobject dans l'espace de nom global et ne nous la renvoie pas
  /*global swfobject*/

  /** Notre module exporté avec sa méthode display */
  var em = {};

  // nos vars globales
  var ressId;
  var ressType = 'em';
  var startDate;

  /**
   * Affiche la ressource dans l'élément html passé dans les options
   * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
   * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
   *                              et éventuellement resultCallback)
   * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
   */
  em.display = function (ressource, options, next) {
    var container = options.container;
    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");
    var errorsContainer = options.errorsContainer;
    if (!errorsContainer) throw new Error("Il faut passer dans les options un conteneur html pour les erreurs");

    /** class utilisée dans notre css */
    var cssClass = 'mepRess';
    var params = ressource.parametres;
    var baseMepSwf, idSwf, swfUrl, largeur, hauteur, flashvars, swfParams, swfAttributes;
    // raccourcis
    var w = window;
    var wd = window.document;
    // l'id du div html que l'on créé, qui sera remplacé par un tag object pour le swf
    var divId = 'mepRess' + (new Date()).getTime();
    ressId = ressource.oid

    log('start mep display avec la ressource (+options)', ressource, options)
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !params) {
      throw new Error("Paramètres manquants");
    }

    // Ajout css
    if (options.baseUrl) addCss('mep.css'); // si on a pas tant pis pour le css
    container.className = cssClass;

    // le message en attendant le chargement
    w.addElement(container, "div", {id: divId}, "Chargement de la ressource " + ressource.oid + " en cours.");

    // notre base
    if (ressource.origine !== 'em' && ressource.baseUrl) baseMepSwf = ressource.baseUrl;
    else if (options.isDev) baseMepSwf = "http://mep-col.devsesamath.net/dev/swf";
    else baseMepSwf = "http://mep-col.sesamath.net/dev/swf";
    // id du swf
    idSwf = Number(params.swf_id ? params.swf_id : ressource.idOrigine);
    // url du swf
    swfUrl = baseMepSwf + '/exo' + idSwf + ".swf";
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
    if (container.style) container.style.width = largeur + 'px';
    else container.setAttribute("width", largeur + 'px'); // marche pas avec chrome ou ff

    /** @see http://redmine.sesamath.net/projects/alibaba/wiki/ExosMep pour les flashvars à passer */
      // les flashvars pour le swf obligatoires à tous
    flashvars = {
      idMep            : Number(ressource.idOrigine),
      modeleMep        : (params.mep_modele === "mep1") ? "1" : "2",
      abreviationLangue: params.mep_langue_id,
      idSwf            : idSwf,
      // si n on a pas de chiffrement de la réponse qui sera une string au format "vrrp..."
      // (sinon c'est un nombre qui correspond à cette réponse chiffrée)
      // et la propriété score est ajoutée (un entier donnant le nb de bonnes réponses)
      ch               : options.ch || 'n'
    };
    // ensuite le facultatif si présent
    if (params.suite_formateur) flashvars.isBoutonSuite = params.suite_formateur;
    if (params.aide_id) flashvars.idAide = Number(params.aide_id);
    if (params.aide_formateur) flashvars.isBoutonAide = params.aide_formateur;
    // 0 ressources publiques en 2013-11, mais qq unes dans MEPS pas publiées
    if (params.nb_wnk) flashvars.mep_nb_wnk = params.nb_wnk;

    // traitement du résultat éventuel (il faudra que l'appelant passe un idUtilisateur)
    if (options.saveResultat) {
      // faut une fonction qui va transformer le résultat au format attendu
      // et la pour rendre accessible au swf dans son dom
      window.saveResultat = function (resultat) {
        options.saveResultat({
          reponse : resultat.reponse,
          nbq     : params.nbq_defaut,
          // le score sera calculé d'après la réponse juste avant enregistrement en bdd
          // (après déchiffrement coté serveur)
          ressId  : ressId,
          ressType: ressType,
          date    : startDate,
          duree   : Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000)
        });
      }
      flashvars.nomFonctionCallback = 'saveResultat';
    }

    // les params pour le player
    swfParams = {
      "base"             : baseMepSwf + "/",
      "menu"             : "false",
      "wmode"            : "window",
      "allowScriptAccess": "always" // important pour que le swf puisse communiquer avec le js de cette page
    };
    // et les attributs pour le loader swfobject.embedSWF
    swfAttributes = {
      id  : divId,
      name: divId
    };
    // pour debug
    log('flashvars', flashvars);
    // swfobject.embedSWF (swfUrl, htmlId, largeur, hauteur, version_requise,
    //    expressInstallSwfurl, flashvars, params, attributes, callbackFn)
    swfobject.embedSWF(swfUrl, divId, largeur, hauteur, "8", null, flashvars, swfParams, swfAttributes, callbackFn);

    /**
     * Callback du chargement
     * @param e objet avec id,success,ref
     */
    function callbackFn(e) {
      var retour, htmlElt;
      if (e.success) {
        startDate = new Date();
        log("Chargement de " + swfUrl + " ok");
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
  };

  return em;
});
