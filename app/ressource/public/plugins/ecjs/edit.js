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

    return {
      init: function (ressource, options) {
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        var textarea = wd.getElementById('parametres');
        if (!textarea) throw new Error("Pas de textarea #parametres trouvé dans cette page");
        $textarea = $(textarea);
        $textarea.attr("disabled", "disabled");
        S.log("les options dans ecjs/edit.init", options);
        require(['display'], function (display) {
          var submitAsked = false;
          var submitDone = false;
          var $form = $("#formRessource");
          $form.submit(function () {
            submitAsked = true;
            $('button.tester-parametre').click();
            setTimeout(function () {
              if (!submitDone) {
                S.log("On a pas récupéré les options après 2s d'attente, on poste tel quel");
                $form.submit();
              }
            }, 2000);
          });
          options.optionsClcCallback = function (optionsClc) {
            S.log("dans edit on récupère les options", optionsClc);
            try {
              var parametres = JSON.parse($textarea.text());
              if (parametres && parametres.options) parametres.options = optionsClc;
              $textarea.text(JSON.stringify(parametres));
              if (submitAsked) {
                submitDone = true;
                $form.submit();
              }
            } catch (error) {
              ST.addError("la modification des paramètres a échoué");
            }
          };
          display(ressource, options, function (error) {
            if (error) ST.addError(error);
          });
        });
      }
    };
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
