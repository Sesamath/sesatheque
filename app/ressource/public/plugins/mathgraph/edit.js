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
  define(["tools/formEditor", "jquery"], function (formEditor, $) {
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

    return {
      init: function (ressource) {
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        var parametres = ressource.parametres;
        var groupParametres = wd.getElementById('groupParametres');
        if (!groupParametres) throw new Error("Pas de conteneur #groupParametres trouvé dans cette page");
        var width = parametres.width || 500;
        var height = parametres.height || 500;
        formEditor.addInputText(
          groupParametres,
          {name:"parametres[width]", size:5, value:width, placeholder:"largeur"},
          {label:"largeur", remarque:"(en pixels)"}
        );
        formEditor.addInputText(
            groupParametres,
            {name:"parametres[height]", size:5, value:height, placeholder:"hauteur", class:"center"},
            {label:"hauteur", remarque:"(en pixels)"}
        );
        // ajout applet
        var figureWrapper = formEditor.addFormGroup(groupParametres, "after");
        var figure = S.addElement(figureWrapper, 'input', {name:"parametres[figure]", type:"hidden", value:ressource.parametres.figure});
        var appletName = "mtgApplet";
        var appletWidth = Math.max(figureWrapper.offsetWidth || 0, 800);
        var applet = formEditor.addElement(
            figureWrapper,
            'applet',
            {
              name: appletName,
              code: "mathgraph32.MtgFrame.class",
              archive: "MathGraph32Applet.jar",
              codebase: "http://www.mathgraph32.org/webstart/4.9.9/",
              width: appletWidth,
              height: Math.round(appletWidth*0.75)
            },
            {label:"Figure mathgraph"}
        );
        S.addElement(applet, 'param', {name:"initialFigure", value:"orthonormalFrame"});
        S.addElement(applet, 'param', {name:"allowLeftToolbar", value:"true"});
        S.addElement(applet, 'param', {name:"allowTopToolbar", value:"true"});
        S.addElement(applet, 'param', {name:"allowRightToolbar", value:"true"});
        S.addElement(applet, 'param', {name:"allowToolsChoice", value:"true"});
        S.addElement(applet, 'param', {name:"allowMenuBar", value:"true"});
        S.addElement(applet, 'param', {name:"allowFileMenu", value:"true"});
        S.addElement(applet, 'param', {name:"allowOptionsMenu", value:"true"});
        S.addElement(applet, 'param', {name:"language", value:"true"});
        S.addElement(applet, 'param', {name:"level", value:"3"});
        S.addText(applet, "Ceci est une appliquette MathGraph32. Il semble que Java ne soit pas installé sur votre ordinateur. Aller sur");
        S.addElement(applet, 'a', {href:"http://www.java.com"}, "java.com");
        S.addText(applet, " pour installer java.");
        $("form#formRessource").submit(function () {
          var newFigure = document.mtgApplet.getScript();
          S.log("on récupère " +newFigure);
          if (newFigure) figure.value = newFigure;

          return true;
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
