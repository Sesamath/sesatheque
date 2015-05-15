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
 * Tous les plugins doivent exporter la méthode display
 *
 * Tout ce qui est dans ce fichier est privé,
 * spécifique à ce plugin sans collision possible avec le DOM de la page courante
 *
 * this est ce module (donc on a this.display et this.showResult), avec dans notre scope les variables
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js
 * {Function}    log             : un console.log qui ne fait rien en prod, ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument pour ajouter son dump en console
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
/*global define, log, addCss, container, baseUrl, window */
//'use strict';



define(['sesaswf'], function (sesaswf) {
  "use strict";
  /** Module avec la méthode display */
  var calkc = {};

  /** contient l'historique des réponses de chaque question (utilisé par window.com_calkc_resultat que le swf appelle) */
  var histoReponses = [];

  /**
   * Affiche la ressource dans l'élément d'id mepRess
   * @param {Object}   ressource   L'objet ressource tel qu'il sort de la bdd
   * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
   */
  calkc.display = function (ressource, next) {
    var swfUrl, options;

    log('start calkc display avec la ressource', ressource)
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.xml) {
      throw new Error("Paramètres manquants");
    }

    // On réinitialise le conteneur
    container.innerHTML = '';
    // Ajout css
    addCss(baseUrl + '/calkc.css');

    // callback de réponse (toujours appelée par le swf) exportée dans le dom (nom en dur dans le swf)
    if (options.saveResultat) {
      /**
       * Appelée par calkc.swf à la validation d'une opération
       * elle a pour but d'enregistrer le resultat en base
       */
      window.com_calkc_resultat = function (nombrequestions, numeroquestion, reponse) {
        // reponse est de la forme 1#+#1#egal#2#|13|ok
        // reponse comporte la liste des touches tapées|le temps écoulé|ok/suite/tard
        histoReponses.push([nombrequestions, reponse]);
        options.saveResultat({reponse : histoReponses});
      }
    } else {
      window.com_calkc_resultat = function () {};
    }

    // url du swf
    swfUrl = baseUrl + '/calkc.swf';
    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    container.setAttribute("width", 589);
    options = {
      largeur  : 589,
      hauteur  : 393,
      flashvars: {
        parametres_xml: ressource.parametres.xml.replace('\\n', '').replace('\n', '')
      }
    }
    log('appel swfobject avec', options)
    sesaswf.load(container, swfUrl, options, next);
  };

  return calkc;
});

