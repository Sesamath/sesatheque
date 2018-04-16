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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
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
  define(["tools/formEditor", "jquery", "https://www.java.com/js/deployJava.js"], function (formEditor, $) {
    /*global deployJava*/
    /* jshint jquery:true */
    'use strict'

    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery')

    // raccourcis
    var w = window
    var wd = w.document
    var S = window.sesamath
    var ST = S.sesatheque

    return {
      init: function (ressource) {
        S.log("edit mathgraph avec ST", ST)
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer")
        var parametres = ressource.parametres
        var groupParametres = wd.getElementById('groupParametres')
        if (!groupParametres) throw new Error("Pas de conteneur #groupParametres trouvé dans cette page")
        var width = parametres.width || 500
        var height = parametres.height || 500
        formEditor.addInputText(
          groupParametres,
          {name:"parametres[width]", size:5, value:width, placeholder:"largeur"},
          {label:"largeur", remarque:"(en pixels)"}
        )
        formEditor.addInputText(
            groupParametres,
            {name:"parametres[height]", size:5, value:height, placeholder:"hauteur", class:"center"},
            {label:"hauteur", remarque:"(en pixels)"}
        )
        // ajout applet
        var dataContainer = formEditor.addFormGroup(groupParametres.parentNode)
        var figureData = formEditor.addTextarea(
            dataContainer,
            {id:"figure", name:"parametres[figure]"},
            {label: "Figure (encodée en base64)", content: ressource.parametres.figure || ""}
        )
        $(dataContainer).hide()
        var appletContainer = formEditor.addFormGroup(groupParametres.parentNode)
        var appletDiv = S.addElement(appletContainer, 'div', {id:"mtgApplet"})
        var attributes = {
          id:"mtgApplet",
          code:'mathgraph32.MtgFrame.class',
          archive: ST.base +'plugins/mathgraph/MathGraph32Applet.jar',
          width :Math.max(appletDiv.offsetWidth || 0, 800),
          height:height
        }
        var parameters = {
          permissions:'sandbox', // déclenche une alerte de sécurité, puis un plantage java quand on accepte
          initialFigure : "orthonormalFrame",
          allowLeftToolbar:true,
          allowTopToolbar:true,
          allowRightToolbar:true,
          allowToolsChoice:true,
          allowMenuBar:true,
          allowFileMenu:true,
          allowOptionsMenu:true,
          language:true,
          level:3,
        }
        var version = "1.5"
        //deployJava.runApplet(attributes, parameters, version)
        S.log("runApplet", attributes, parameters, version)

        var isSubmitChecked = false
        var $form = $("form#formRessource")
        $form.submit(function () {
          var retour = false
          if (isSubmitChecked) {
            retour = true
          } else {
            try {
              var newFigure = document.mtgApplet.getScript()
              S.log("on récupère " + newFigure)
              // sans le setTimeout, le $textarea.val(string) ne change rien dans le html, aucune idée du pourquoi...
              if (newFigure) {
                setTimeout(function () {
                  $(figureData).val(newFigure)
                  isSubmitChecked = true
                  $form.submit()
                }, 0)
              } else {
                retour = true
              }
            } catch (error) {
              ST.addError("Impossible de récupérer la figure de l'applet java, enregistrer de nouveau pour sauvegarder le reste")
              isSubmitChecked = true
            }
          }

          return false
        })
      }
    }
  })
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module")
    console.error(error)
  }
}
