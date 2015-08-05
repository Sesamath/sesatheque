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
    "use strict";
    /**
     * Module d'affichage des ressources calkc (calculatrice cassée), flash
     * @plugin calkc
     */
    var calkc = {};

    /**
     * contient l'historique des réponses de chaque question (utilisé par window.com_calkc_resultat que le swf appelle)
     * @private
     */
    var histoReponses = [];

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;

    /**
     * Affiche une ressource calkc
     * @memberOf calkc
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand le contenu sera chargé
     */
    calkc.display = function (ressource, options, next) {
      var swfUrl;

      S.log('start calkc display avec la ressource', ressource);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
        throw new Error("Paramètres manquants");
      }
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

      // On réinitialise le conteneur
      S.empty(container);
      // Ajout css
      S.addCss(options.pluginBase +'calkc.css');

      // callback de réponse (toujours appelée par le swf) exportée dans le dom (nom en dur dans le swf)
      if (options.resultatCallback) {
        /**
         * Mis en global par le plugin calkc (ne fait rien si aucune callback de résultat n'est fournie),
         * car appelée par calkc.swf à la validation d'une opération.
         * Renverra le résultat formaté à la callback passée via les options
         * @global
         */
        window.com_calkc_resultat = function (nombrequestions, numeroquestion, reponse) {
          // reponse est de la forme 1#+#1#egal#2#|13|ok
          // reponse comporte la liste des touches tapées|le temps écoulé|ok/suite/tard
          histoReponses.push([nombrequestions, reponse]);
          options.resultatCallback({reponse: histoReponses});
        };
      } else {
        window.com_calkc_resultat = function () {};
      }

      // url du swf
      swfUrl = options.pluginBase + 'calkc.swf';
      // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
      container.setAttribute("width", 589);
      var swfOptions = {
        largeur: 589,
        hauteur: 393,
        flashvars: {
          parametres_xml: ressource.parametres.xml.replace('\\n', '').replace('\n', '')
        }
      };
      S.log('appel swfobject avec', swfOptions);
      swf.load(container, swfUrl, swfOptions, next);
    };

    return calkc;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
