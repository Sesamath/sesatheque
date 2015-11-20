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
 * @file Édite les paramètres d'une ressource ecjs
 */
try {
  define(["jquery"], function ($) {
    /* jshint jquery:true */
    "use strict";

    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    // raccourcis
    var w = window;
    var wd = w.document;
    var S = window.sesamath;
    var ST = S.sesatheque;

    var $textarea;

    // récupérer cette liste avec (sur le site ressources)
    // ls -1 replication_calculatice/javascript/exercices/|tr '\n' ','|sed -e 's/,/", "/g'
    // et virer complement et lang
    var typesEc = ["addiclic",
      "approximationsomme",
      "balance",
      "balanceadd",
      "basketmath",
      "basketmath2p",
      "basketmath3p",
      "bocal",
      "bouleetboule",
      "bouleetbouledecimaux",
      "calculdiffere",
      "carre",
      "chocolat1",
      "chocolat2",
      "cibles",
      "complement",
      "croupier",
      "decollage",
      "diviclic",
      "elephants",
      "estimation",
      "frise",
      "grenouille",
      "lacaisse",
      "lebanquier",
      "lesbornes",
      "mbrique",
      "memory",
      "mistral",
      "multiclic",
      "nombresympathique",
      "numbercrushdecimaux",
      "oiseauaddition",
      "oiseaumultiplication",
      "operationsatrous",
      "planeteaddition",
      "quadricalc",
      "quadricalcinv",
      "recette",
      "rectangle",
      "sommeenligne",
      "supermarche",
      "surfacebleue",
      "tableattaque",
      "tapisdecarte",
      "train",
      "viaduc"
    ];

    function addSelect(ressource, options) {
      var select = S.getElement("select");
      S.addElement(select, 'option', {id:'selectFichier', value:0}, "Choisir un type d'exercice");
      typesEc.forEach(function (typeEc) {
        S.addElement(select, 'option', {value:typeEc}, typeEc);
      });
      $textarea.before(select);
      $textarea.hide();
      // code piqué dans http://calculatice.ac-lille.fr/calculatice/bibliotheque/javascript/api/
      var $select = $(select);
      $select.on("change", function() {
        var sExo = $select.val();
        if (sExo) {
          if (!ressource.parametres) ressource.parametres = {};
          ressource.parametres.fichierjs = sExo;
          $select.hide();
          $textarea.show();
          displayOptions(ressource, options);
        }
      });
    }

    function displayOptions(ressource, options) {
      require(['display'], function (display) {
        var submitAsked = false;
        var submitDone = false;
        var $form = $("#formRessource");
        $form.submit(function () {
          if (!submitDone) {
            submitAsked = true;
            $('button.tester-parametre').click();
            setTimeout(function () {
              if (!submitDone) {
                S.log("On a pas récupéré les options après 2s d'attente, on poste tel quel");
                submitDone = true;
                $form.submit();
              }
            }, 2000);
          }

          return submitDone;
        });
        options.optionsClcCallback = function (optionsClc) {
          S.log("dans edit on récupère les options", optionsClc);
          try {
            var parametres = JSON.parse($textarea.val());
            if (!parametres) {
              S.log.error("parametres vide quand on voulait affecter options (il devrait y avoir fichierjs)");
              parametres = {};
            }
            if (!parametres.fichierjs && ressource.parametres.fichierjs) parametres.fichierjs = ressource.parametres.fichierjs;
            parametres.options = optionsClc;
            // sans le setTimeout, le $textarea.val(string) ne change rien dans le html, aucune idée du pourquoi...
            setTimeout(function () {
              $textarea.val(JSON.stringify(parametres, null, 2));
              if (submitAsked) {
                submitDone = true;
                S.log("on lance le submit avec " + $textarea.val());
                $form.submit();
              }
            }, 0);
          } catch (error) {
            ST.addError("la modification des paramètres a échoué");
          }
        };
        display(ressource, options, function (error) {
          if (error) ST.addError(error);
        });
      });
    }

    return {
      init: function (ressource, options) {
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        var textarea = wd.getElementById('parametres');
        if (!textarea) throw new Error("Pas de textarea #parametres trouvé dans cette page");
        $textarea = $(textarea);
        S.log("les options dans ecjs/edit.init", options);
        if (!ressource.parametres.fichierjs) {
          addSelect(ressource, options);
        } else {
          displayOptions(ressource, options);
        }
      }
    };
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
