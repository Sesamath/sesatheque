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

    function addApplet(isFullSize) {
      if (isFullSize) {
        width = Math.max(appletContainer.offsetWidth || 0, width);
        height = Math.max(height, Math.round(width * 0.75));
      }
      var appletName = "mtgApplet";
      // faut d'abord créer un élément html complet avant de le mettre dans le dom,
      // sinon il peut lancer le jar avant d'avoir tous les params
      var applet = S.getElement(
          'applet',
          {
            id:appletName,
            //name: appletName +"name",
            code: "mathgraph32.MtgFrame.class",
            archive: "/plugins/mathgraph/MathGraph32Applet.jar",
            width: width,
            height: height,
            style:"border:#000 solid 1px;"
          },
          {label:"Figure mathgraph"}
      );
      for (var allow in allowDef) {
        if (allowDef.hasOwnProperty(allow)) {
          S.addElement(applet, 'param', {name:"allow" +allow, value:(allowProf.indexOf(allow) > -1)?"true":"false"});
        }
      }
      S.addElement(applet, 'param', {name:"initialFigure", value:"orthonormalFrame"});
      S.addElement(applet, 'param', {name:"language", value:"true"});
      var level = (levelProf === 0) ? levelEleve : levelProf;
      S.addElement(applet, 'param', {name:"level", value:level});
      S.addElement(applet, 'param', {name:"figureData", value: $figureData.val()});

      S.addText(applet, "Ceci est une appliquette MathGraph32. Il semble que Java ne soit pas installé sur votre ordinateur. Aller sur ");
      S.addElement(applet, 'a', {href:"http://www.java.com"}, "java.com");
      S.addText(applet, " pour installer java.");
      // on peut la mettre dans le dom
      S.empty(appletContainer);
      appletContainer.appendChild(applet);
    }

    function hideApplet() {
      try {
        var newFigure = document.mtgApplet.getScript();
        S.log("on récupère " + newFigure);
        // sans le setTimeout, le $textarea.val(string) ne change rien dans le html, aucune idée du pourquoi...
        setTimeout(function () {
          $figureData.val(newFigure);
          $appletContainer.hide();
          $dataContainer.show();
          submitHandler = onSubmitTrue;
        }, 0);
      } catch (error) {
        S.log.error(error);
        ST.addError("Impossible de récupérer la figure de l'applet java, enregistrer de nouveau pour sauvegarder le reste");
      }
    }

    function showApplet() {
      // on rafraîchi nos valeurs d'après le form
      width = parseInt($width.val(), 10) || 600;
      height = parseInt($height.val(), 10) || Math.round(width * 0.75);
      var isFullSize = !!$isFullSize.val();
      addApplet(isFullSize);
      $dataContainer.hide();
      $appletContainer.show();
      // et on récupèrera sa figure à la validation
      S.log("submitHandler = onSubmitGetMgData");
      submitHandler = onSubmitGetMgData;
    }

    function onSubmitGetMgData() {
      S.log("submit avec figure à récupérer dans l'applet");
      var retour = false;
      try {
        var newFigure = document.mtgApplet.getScript();
        S.log("on récupère " + newFigure);
        // sans le setTimeout, le $textarea.val(string) ne change rien dans le html, aucune idée du pourquoi...
        $figureData.val(newFigure);
        setTimeout(function () {
          submitHandler = onSubmitTrue;
          S.log("On va soumettre avec le textarea", $figureData.val());
          $form.submit();
        }, 0);
      } catch (error) {
        S.log.error(error);
        ST.addError("Impossible de récupérer la figure de l'applet java, enregistrer de nouveau pour sauvegarder le reste");
        submitHandler = onSubmitTrue;
      }

      return retour;
    }

    function onSubmitTrue() {
      S.log("submit sans récupération");
      return true;
    }

    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    // raccourcis
    var w = window;
    var wd = w.document;
    var S = window.Sesamath;
    var ST = S.Sesatheque;

    // var globales à notre module (initialisées par init et utilisées par nos fcts)
    var allowProf, levelEleve, levelProf, figureBase64Ini,
        width, height, $width, $height,
        appletContainer,
        $appletContainer, $figureData,
        $isFullSize, $dataContainer, $form;
    // les fonctionnalités dispo
    var allowDef = {
      "MenuBar" : "Barre de menu",
      "LeftToolbar" : "Barre d'outils de gauche",
      "TopToolbar" : "Barre d'outils du haut",
      "RightToolbar" : "Barre d'outils de droite",
      "IndicationArea" : "Zone d'information du bas",
      "ToolsChoice" : "Choix des outils",
      FileMenu : "Menu Fichier",
      OptionsMenu : "Menu Options"
    };
    // le submitHandler, à true par défaut
    // on ne peut appeler $form.submit() qu'une fois puisqu'on lui passe un écouteur,
    // c'est cet écouteur que l'on va modifier si besoin
    var submitHandler = onSubmitTrue;

    return {
      init: function (ressource) {
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        var parametres = ressource.parametres;
        var divParametres = wd.getElementById('parametres');
        if (!divParametres) throw new Error("Pas de conteneur #parametres trouvé dans cette page");

        // param de taille
        width = parametres.width || Math.max(divParametres.offsetWidth || 0, 600);
        height = parametres.height || Math.round(width*0.75);
        var sizeGroup = formEditor.addFormGroup(divParametres);
        var widthInput = formEditor.addInputText(
          sizeGroup,
          {name:"parametres[width]", size:5, value:width, placeholder:"largeur"},
          {label:"largeur", remarque:"(en pixels)"}
        );
        $width = $(widthInput);
        var heightInput = formEditor.addInputText(
          sizeGroup,
          {name:"parametres[height]", size:5, value:height, placeholder:"hauteur", class:"center"},
          {label:"hauteur", remarque:"(en pixels)"}
        );
        $height = $(heightInput);
        formEditor.addCheckboxes(
            sizeGroup,
            "parametres[profFullSize]",
            {label:"exception formateur"},
            [{
              id : "isFullSize",
              label: "maximiser l'éditeur ci-dessous",
              value: true,
              checked: !!parametres.profFullSize
            }]
        );
        $isFullSize = $("#isFullSize");

        var allowFullList = [];
        var allow;
        for (allow in allowDef) {
          if (allowDef.hasOwnProperty(allow)) allowFullList.push(allow);
        }

        // config élève
        var eleveGroup = formEditor.addFormGroup(divParametres);
        levelEleve = parseInt(parametres.levelEleve, 10) || 0;
        var levelEleveSelect = formEditor.addSelect(
          eleveGroup,
          {id:"selectTypeInterface", name:"parametres[levelEleve]"},
          {
            label:"type d'interface élève",
            wrapperAttributes : {style:"max-width:300px;"}
          },
          [
            {value:"0", content:"lecteur seulement*", selected:(levelEleve === 0)},
            {value:"1", content:"éditeur élémentaire", selected:(levelEleve === 1)},
            {value:"2", content:"éditeur collège", selected:(levelEleve === 2)},
            {value:"3", content:"éditeur avancé sans nombres complexes", selected:(levelEleve === 3)},
            {value:"4", content:"éditeur avancé avec nombres complexes", selected:(levelEleve === 4)},
          ]
        );
        S.addElementAfter(levelEleveSelect, 'div', {class:"remarque"},
            "* L'éditeur nécessite java, le lecteur simple est conseillé si vous n'avez pas besoin de récupérer la figure de l'élève");
        var $levelEleveSelect = $(levelEleveSelect);

        var allowEleve = parametres.allowEleve || allowFullList;
        // on remplit ses checkboxes
        var checkboxes = [];
        for (allow in allowDef) {
          if (allowDef.hasOwnProperty(allow)) {
            checkboxes.push({
              label:allowDef[allow],
              value:allow,
              checked:(allowEleve.indexOf(allow) > -1)
            });
          }
        }
        var allowEleveCb = formEditor.addCheckboxes(
            eleveGroup,
            "parametres[allowEleve]",
            {label:"fonctionnalités accessibles aux élèves", remarque:"(ne concerne que l'éditeur)"},
            checkboxes
        );
        var $allowEleveCb = $(allowEleveCb.parentNode);
        if (levelEleve === 0) $allowEleveCb.hide();

        $levelEleveSelect.change(function () {
          levelEleve = parseInt($(this).val()) || 0;
          if (levelEleve === 0) $allowEleveCb.hide();
          else $allowEleveCb.show();
        });

        // param de l'applet d'édition
        var profGroup = formEditor.addFormGroup(divParametres);
        levelProf = parseInt(parametres.levelProf, 10) || 0;
        var isApplet = (levelProf !== -1);
        var levelProfSelect = formEditor.addSelect(
            profGroup,
            {name:"parametres[levelProf]"},
            {label:"type d'interface formateur", remarque:"(utilisée ci-dessous)"},
            [
              {value:"-1", content:"aucune (zone pour coller une figure exportée)", selected:(levelProf === -1)},
              {value:"0", content:"identique aux élèves", selected:(levelProf === 0)},
              {value:"1", content:"éditeur élémentaire", selected:(levelProf === 1)},
              {value:"2", content:"éditeur collège", selected:(levelProf === 2)},
              {value:"3", content:"éditeur avancé sans nombres complexes", selected:(levelProf === 3)},
              {value:"4", content:"éditeur avancé avec nombres complexes", selected:(levelProf === 4)},
            ]
        );
        // fonctions de l'applet d'édition
        allowProf = parametres.allowProf || allowFullList;
        checkboxes = [];
        for (allow in allowDef) {
          if (allowDef.hasOwnProperty(allow)) {
            checkboxes.push({
              label:allowDef[allow],
              value:allow,
              checked:(allowProf.indexOf(allow) > -1)
            });
          }
        }
        var allowProfCb = formEditor.addCheckboxes(
            profGroup,
            "parametres[allowProf]",
            {label:"fonctionnalités formateur", remarque:"(ci-dessous)"},
            checkboxes
        );
        var $allowProfCb = $(allowProfCb.parentNode);

        // ajout figure
        var dataContainer = formEditor.addFormGroup(divParametres);
        $dataContainer = $(dataContainer);
        figureBase64Ini = ressource.parametres.figure || "";
        var figureData = formEditor.addTextarea(
            dataContainer,
            {id:"figure", name:"parametres[figure]", cols:80, rows:5},
            {label: "Figure (encodée en base64)", content: figureBase64Ini}
        );
        $figureData = $(figureData);

        appletContainer = formEditor.addFormGroup(divParametres);
        $appletContainer = $(appletContainer);

        $form = $("form#formRessource");
        $form.submit(function () {
          submitHandler(); // on peut pas passer sa valeur actuelle en argument, faut l'exécuter à chaque fois
        });

        // le hide/show au changement de select
        $(levelProfSelect).change(function () {
          levelProf = parseInt($(this).val(), 10);
          if (levelProf === -1) {
            $allowProfCb.hide();
            hideApplet();
          } else {
            $allowProfCb.show();
            showApplet();
          }
        });

        if (isApplet) showApplet();
        else $allowProfCb.hide(); // pas de hideApplet tant qu'on l'a pas mise
      }
    };
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
