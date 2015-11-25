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
    /**
     * module pour afficher les ressources mathgraph32 (avec le lecteur js)
     * @plugin mathgraph
     */
    var mathgraph = {};

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;
    var ST = S.sesatheque;

    // Le moment où ce module a été chargé dans le navigateur
    var startDate = new Date();

    /**
     * Affiche une ressource mathgraph
     * @memberOf mathgraph
     * @param {Ressource}      ressource  L'objet ressource (une ressource mathgraph a en parametres soit une propriété url
     *                                      avec l'url du xml soit une propriété xml avec la string xml)
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand l'mathgraph sera chargé (sans argument ou avec une erreur)
     */
    mathgraph.display = function (ressource, options, next) {
      try {
        var container = options.container;
        if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

        // on enverra un résultat seulement à la fermeture
        if (options.resultatCallback && container.addEventListener) {
          container.addEventListener('unload', function () {
            options.resultatCallback({
              ressType: 'mathgraph',
              ressOid: ressource.oid,
              date: startDate,
              duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000),
              score: 1
            });
          });
        }

        S.log('start mathgraph display avec la ressource', ressource);
        //les params minimaux
        if (!ressource.oid || !ressource.titre || !ressource.parametres) {
          throw new Error("Paramètres manquants");
        }
        if (!ressource.parametres.figure) {
          throw new Error("Pas de figure mathgraph en paramètre");
        }
        var dependencies = [
          "http://www.mathgraph32.org/js/4.9.9/mtg32jsmin.js",
          "http://www.mathgraph32.org/js/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full.js"
        ];
        require(dependencies, function () {
          /*global MathJax, mtg32*/
          if (typeof MathJax === "undefined") throw new Error("Mathjax n'est pas chargé");
          if (typeof mtg32 === "undefined") throw new Error("Mathgraph32 n'est pas chargé");
          var width = ressource.parametres.width || container.offsetWidth || 800;
          var height = ressource.parametres.height || width * 0.75 || 600;
          var svgId = "mtg32svg";
          // la consigne éventuelle
          if (ressource.parametres.consigne) S.addElement(container, 'p', null, ressource.parametres.consigne);
          // pour créer le svg, ceci marche pas (il reste à 0 de hauteur), faut passer par createElementNS
          //var svg = S.addElement(container, 'svg', {id:'svg', width:"800px", height:"500px", xmlns:"http://www.w3.org/2000/svg"});
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttributeNS(null, "id", svgId);
          svg.setAttributeNS(null, "width", width);
          svg.setAttributeNS(null, "height", height);
          svg.style.display = "block";
          container.appendChild(svg);
          MathJax.Hub.Config({
            tex2jax: {
              inlineMath: [["$", "$"], ["\\(", "\\)"]]
            },
            jax: ["input/TeX", "output/SVG"],
            TeX: {extensions: ["color.js"]},
            messageStyle: 'none'
          });
          MathJax.Hub.Queue(function () {
            var mtg32App = new mtg32.mtg32App();
            mtg32App.addDoc(svgId, ressource.parametres.figure, true);
            mtg32App.calculateAndDisplayAll();
            if (next) next();
          });
        });
      } catch (error) {
        if (next) next(error);
        else ST.addError(error);
      }

    };

    return mathgraph;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}