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
 * Tous les plugins doivent exporter les méthodes display et showResult
 */

/**
 * Tout le reste est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
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
/*global define, log */

define(['sesaswf'], function (sesaswf) {
  'use strict';
  /** notre module exporté avec sa méthode display */
  var am = {};

  /** Le moment où ce module a été chargé dans le navigateur */
  var startDate = new Date();
  
  var ressOid;
  
  function getResultat() {
    return {
      ressType : 'am',
      ressOid:ressOid,
      date:startDate,
      duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000),
      score : 1
    }
  }


  /**
   * Affiche la ressource dans l'élément d'id mepRess
   * @param {Ressource} ressource  L'objet ressource (sans forcément son prototype)
   * @param {Object}    options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
   *                               et éventuellement resultCallback)
   * @param {Function}  next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
   */
  am.display = function (ressource, options, next) {
    var baseSwf, swfUrl, swfOpt;
    var container = options.container;
    if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

    // on enverra le résultat à la fermeture
    if (options.resultCallback && container.addEventListener) {
      container.addEventListener('unload', function () {
        var resultat = getResultat();
        options.resultCallback(resultat);
      })
    }
    var params = ressource.parametres;

    log('start am display avec la ressource', ressource)
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !params) {
      throw new Error("Paramètres manquants");
    }
    // init de ressOid en global à ce module (pour les appels ultérieurs de getResultat)
    ressOid = ressource.oid;

    // On réinitialise le conteneur
    container.innerHTML = '';

    // notre base
    if (ressource.origine !== 'am' && ressource.baseUrl) baseSwf =  ressource.baseUrl;
    else baseSwf = "http://mep-col.sesamath.net/dev/aides/" +(params.mep_langue_id ? params.mep_langue_id : 'fr');
    // url du swf
    swfUrl = baseSwf +'/aide' +ressource.idOrigine +".swf";
    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    container.setAttribute("width", 735);
    container.style.width = '735px';

    swfOpt = {
      base    : baseSwf + "/",
      largeur : 735,
      hauteur : 450
    }
    sesaswf.load(container, swfUrl, swfOpt, next);
  };
  
  return am;
});
