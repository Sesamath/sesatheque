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
  define(function () {
    'use strict';
    /*global head*/
    /**
     * Module pour afficher les ressources ecjs (exercices calculatice en javascript)
     * @plugin ecjs
     */
    var ecjs = {};
    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;

    // charger_options et enregistrer_score exportées dans le dom global par display

    /**
     * Affiche la ressource dans l'élément d'id mepRess
     * inspiré de http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
     * @memberOf ecjs
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Possibilité de passer ecjsBase pour modifier http://ressources.sesamath.net/replication_calculatice/javascript
     * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
     */
    ecjs.display = function (ressource, options, next) {
      // pour utiliser le serveur de calculatice mettre http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript
      var ecjsBase = S.getURLParameter("ecjsBase") || options.ecjsBase || "http://ressources.sesamath.net/replication_calculatice/javascript";
      // On réinitialise le conteneur
      S.empty(options.container);
      // une fct pour récupérer les résultats
      window.enregistrer_score = function (datasCalculatice) {
        if (options && options.resultatCallback) {
          S.log("résultats reçus", datasCalculatice);
          options.resultatCallback({reponse: datasCalculatice});
        }
      };

      // d'après {ecjsBase}/api/clc-api.main.js
      // celui-là détruit notre style et semble ne rien apporter dans les exos
      //"http://calculatice.ac-lille.fr/calculatice/squelettes/css/clear.css",
      S.addCss(ecjsBase + "/lib-externes/jquery/css/start/jquery-ui-1.10.4.custom.min.css");
      S.addCss(ecjsBase + "/clc/css/clc.css");
      require([ecjsBase + "/lib-externes/jquery.all.min.js"], function () {
        // on a toujours en console ReferenceError: Raphael is not defined à son exécution
        //S.addElement(options.container, 'script', {type:"application/javascript", src:ecjsBase + "/lib-externes/raphael.all.min.js"});
        // apparemment Raphael veut que require soit undefined :-/
        require([
            ecjsBase + "/lib-externes/modernizr.custom.59181.js",
            ecjsBase + "/lib-externes/svgjs.all.min.js",
            ecjsBase + "/lib-externes/raphael.all.min.js",
            ecjsBase + "/lib-externes/big.all.min.js",
            ecjsBase + "/clc/js/clc.dev.1.js"
        ], function () {
          /*global CLC, $*/
          var $container = $(options.container);
          // les options et le nom de l'exo
          var optionsClc = ressource.parametres.options || "default";
          var nomExo = ressource.parametres.fichierjs;
          var cheminExo = ecjsBase + "/exercices/";

          // cree un exo de maniere asynchrone
          var reqExo  = CLC.loadExo(cheminExo+nomExo,optionsClc);

          // quand l'exo est pret on le met dans la div et on l'affiche avec une dialog jquery
          // Attention l'id de la div est ici "cntExo", changer si besoin.
          reqExo.done(function(exercice){
            S.log("exo clc", exercice);
            $container.width(775);
            $container.html(exercice);
            if (!options.isFormateur) {
              //$container.ready(function () {
              $(function () {
                $("#display button.parametrer").hide();
                S.log("paramétrage caché");
              });
            }
          });
        });

      });
    };

    return ecjs;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
