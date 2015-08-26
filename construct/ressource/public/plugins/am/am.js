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
  define(['tools/swf'], function (swf) {
    'use strict';

    /**
     * Plugin am pour les aides mathenpoche (animations flash, sans réponse de l'élève)
     * S'il est appelé directement sans passer par le module display, il faut appeler init avant
     * @plugin am
     */
    var am = {};

    /**
     * Le moment où la ressource a été chargée
     * @private
     */
    var startDate;

    var ressOid;

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;

    /**
     * Affiche une ressource am
     * @memberOf am
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
     */
    am.display = function (ressource, options, next) {
      var baseSwf, swfUrl, swfOpt;
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

      // on enverra le résultat à la fermeture (si y'a eu un chargement, startDate sert de flag)
      if (options.resultatCallback && window.addEventListener) {
        window.addEventListener('unload', function () {
          S.log("unload am");
          var resultat = {
            ressType: 'am',
            ressId: ressource.oid,
            date: startDate,
            duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000),
            score: 1
          };
          if (options.sesatheque) resultat.sesatheque = options.sesatheque;
          if (startDate) options.resultatCallback(resultat);
          // sinon le swf n'a pas été chargé, on envoie rien
        });
      }
      var params = ressource.parametres;

      S.log('start am display avec la ressource', ressource);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !params) {
        throw new Error("Paramètres manquants");
      }
      // init de ressOid en global à ce module (pour les appels ultérieurs de getResultat)
      ressOid = ressource.oid;

      // On réinitialise le conteneur
      S.empty(container);

      // notre base (si ça vient pas de l'interface de développement des exo mathenpoche
      // faudra le préciser via ressource.parametres.baseUrl)
      if (ressource.origine !== 'am' && ressource.parametres.baseUrl) baseSwf = ressource.parametres.baseUrl;
      else baseSwf = "http://mep-col.sesamath.net/dev/aides/" + (params.mep_langue_id ? params.mep_langue_id : 'fr');
      // url du swf
      swfUrl = baseSwf + '/aide' + ressource.idOrigine + ".swf";
      // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
      container.setAttribute("width", 735);
      container.style.width = '735px';

      swfOpt = {
        base: baseSwf + "/",
        largeur: 735,
        hauteur: 450
      };
      swf.load(container, swfUrl, swfOpt, function (error) {
        if (error) next(error);
        else {
          startDate = new Date();
          next();
        }
      });
    };

    return am;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}