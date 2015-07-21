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
 * @file Édite une ressource url
 * Ses parametres ont les propriétés
 * adresse : l'url à afficher
 * question_option Les options de la consigne after|before|off|while
 * consigne        La consigne
 * answer_option   Les options de la réponse after|off|question|while
 * answer_editor   Quel type d'éditeur pour la réponse (textarea, ckeditor, ckeditorTex), cette propriété n'existait pas dans labomep1
 */
try {
  define(['jquery1', 'mqEditor'], function (none, mqEditor) {
    /* jshint jquery:true */
    /* global alert,CKEDITOR */
    //"use strict";

    // nos fcts internes
    /**
     * Vérifie que l'adresse est correctement formatée et n'est pas un domaine interdit, ajoute éventuellement http://
     */
    function adresseOnChange() {
      // vérification : est-ce que l'adresse comporte http://
      var url = $adresse.val();
      if (url && !/https?:\/\//.exec(url)) {
        url = "http://" +url;
        document.editRessource.parametres.adresse.value = url;
      }
      // vérif exclus
      exclus.forEach(function (domain) {
        if (url.indexOf(domain) > -1) {
          alert(domain +" a explicitemenent refusé que ses pages puissent être intégrées");
          document.editRessource.parametres.adresse.value = "";
          url = "";
          return false;
        }
      });
      if (url) iframeApercu.href = url;
    }

    function addOptions(blocParam, parametres, options) {
      function addLabel(id, label) {
        w.addElement(blocParam, 'label', {for:id}, label);
      }
      function addOption(name, txt, value, onclick) {
        var id = w.getNewId();
        var args = {type:"radio", name:"parametres[" +name +"]", id:id, value:value};
        if (onclick) args.onclick = onclick;
        if (parametres[name] === value) args.checked = "checked";
        w.addElement(blocParam, 'input', args);
        addLabel(id, txt);
      }
      w.addText(blocParam, "Consigne : ");
      var editorToggleButton = w.addElement(blocParam, 'button', null, "Éditeur de texte enrichi");
      var consigne = parametres.consigne || '';
      var divConsigne = w.addElement(blocParam, 'div');
      var $divConsigne = $(divConsigne);
      var editor = w.addElement(divConsigne, 'textarea', {name:"parametres[consigne]", id:"editor"}, consigne);
      var $editor = $(editor);
      $editorToggleButton = $(editorToggleButton);
      $editorToggleButton.click(function () {
        function toCk() {
          $divConsigne.hide();
          $editorToggleButton.text("Éditeur d'équation simplifié");
          CKEDITOR.replace('editor', {
            customConfig : '' // on veut pas charger le config.js
          });
          $divConsigne.show();
        }
        if (isMqEditor) {
          if (typeof CKEDITOR === "undefined") {
            require(["ckeditor"], function () {
              if (typeof CKEDITOR === 'undefined') throw new Error('Problème de chargement CKEditor');
              initCKEditor();
              toCk();
            })
          } else {
            toCk();
          }
        } else {
          $divConsigne.hide();
          // on vire le html
          var contenu = $editor.text()
          $editor.text(contenu);
          mqEditor.init(divConsigne, parametres.mqEditorConfig, options);
          $divConsigne.show();
        }
      });
      addOption("question_option", "aucune", "off", $divConsigne.hide);
      addOption("question_option", "avant", "before", $divConsigne.show);
      addOption("question_option", "pendant", "while", $divConsigne.show);
      addOption("question_option", "après", "after", $divConsigne.show);
      w.addText(blocParam, " (l'affichage de la page)");
      w.addElement(blocParam, 'br');
      //initCKEditor();
      mqEditor.init(divConsigne, parametres.mqEditorConfig, options);
      w.addElement(blocParam, 'br');
      w.addText(blocParam, "Réponse :");
      addOption("answer_option", "aucune", "off");
      addOption("answer_option", "avant", "before");
      addOption("answer_option", "pendant", "while");
      addOption("answer_option", "après", "after");
      w.addText(blocParam, " (l'affichage de la page)");
      w.addElement(blocParam, 'br');
      w.addText(blocParam, " Type d'éditeur pour la réponse : ");
      addOption("answer_editor", "zone de texte", "textarea");
      addOption("answer_editor", "texte enrichi", "ckeditor");
      addOption("answer_editor", "texte avec éditeur d'équation simplifié", "mqEditor");
      addOption("answer_editor", "texte enrichi avec LaTeX possible", "ckeditorTex");
    }

    /**
     * Initialise la conf de ckeditor (mais il faudra appeler CKEDITOR.replace ensuite)
     */
    function initCKEditor() {
      if (options.vendorsBaseUrl) w.addCss(options.vendorsBaseUrl + '/ckeditor/contents.css');
      if ( CKEDITOR.env.ie && CKEDITOR.env.version < 9 ) CKEDITOR.tools.enableHtml5Elements( document );
      // The trick to keep the editor in the sample quite small unless user specified own height.
      CKEDITOR.config.height = 150;
      CKEDITOR.config.width = 'auto';
      // on reprend le config.js de base ici pour éviter de le charger
      CKEDITOR.config.toolbarGroups = [
        { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
        { name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
        { name: 'links' },
        { name: 'insert' },
        { name: 'forms' },
        { name: 'tools' },
        { name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
        { name: 'others' },
        '/',
        { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
        { name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
        { name: 'styles' },
        { name: 'colors' },
        { name: 'about' }
      ];
      CKEDITOR.config.removeButtons = 'Underline,Subscript,Superscript,Styles';
      CKEDITOR.config.format_tags = 'p;h1;h2;h3;pre';
      CKEDITOR.config.removeDialogTabs = 'image:advanced;link:advanced';
      // mathedit et eqneditor utilisent des appels à CodeCogs pour faire des images, on laisse tomber
      // @todo s'inspirer de mathedit pour faire un plugin mathquill only
      CKEDITOR.config.extraPlugins = 'mathjax';
      // @see http://ckeditor.com/comment/123266#comment-123266, sauf que ça marche pas, faut aller modifier config.js
      // ou TeX-AMS_HTML ou TeX-AMS-MML_SVG, cf http://docs.mathjax.org/en/latest/configuration.html#loading
      CKEDITOR.config.mathJaxLib = "/vendors/mathjax/2.5/MathJax.js?config=TeX-AMS-MML_HTMLorMML";
      //w.log('ckeditor', CKEDITOR);
    }

    /**
     * Charge l'arbre source, initialise le dom et les comportements 
     * @param options
     */
    function initDom(parametres, options) {
      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      //if (options.vendorsBaseUrl) w.addCss(options.vendorsBaseUrl + '/editUrl.css');
      // nos éléments html
      var blocParam = window.document.getElementById('parametres');
      if (!blocParam) throw new Error("Élément #parametres manquant");
      $blocParam = $(blocParam);
      $blocParam.text("Adresse Internet de votre page externe (par exemple : http://www.sesamath.net)");
      var url = parametres.adresse || '';
      if (url === "undefined") url = '';
      var adresseElt = w.addElement(blocParam, 'input', {name:"parametres[adresse]",size:100, value:url});
      $adresse = $(adresseElt);
      $adresse.change(adresseOnChange);
      w.addElement(blocParam, 'br');
      w.addText(blocParam, "Il est possible d'accompagner la page internet d'une consigne et même de demander à l'élève de saisir un texte dans une zone de réponse.");
      w.addElement(blocParam, 'br');
      w.addText(blocParam, "Choisissez le paramétrage que vous souhaitez parmi ceux proposés ci-dessous.");
      w.addElement(blocParam, 'br');
      //w.addText(blocParam, "Le symbole ");
      //w.addElement(blocParam, 'img', {src: options.pluginBaseUrl +"/images/forward.png"});
      //w.addText(blocParam, " indique que les affichages seront proposés successivements et non simultanément.");
      addOptions(blocParam, parametres, options);
      w.addText(blocParam, "Vous pouvez forcer une dimension d'affichage (déconseillé pour une page, mieux vaut laisser vide et laisser le navigateur s'adapter, mais cela peut être utile pour une image).");
      w.addElement(blocParam, 'br');
      w.addElement(blocParam, 'label', {for:"largeur"}, "largeur (en pixels)");
      w.addElement(blocParam, 'input', {id:"largeur", name:"parametres[largeur]",size:4, value:parametres.largeur});
      w.addElement(blocParam, 'label', {for:"hauteur"}, "hauteur (en pixels)");
      w.addElement(blocParam, 'input', {id:"hauteur", name:"parametres[hauteur]",size:4, value:parametres.hauteur});
      w.addElement(blocParam, 'br');

      w.addElement(blocParam, 'button', {onClick:adresseOnChange}, "Prévisualiser la page");
      iframeApercu = w.addElement(container, 'iframe',{id:"iframeApercu"});
    }


    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    var w = window;
    var exclus = ["euler.ac-versailles.fr"];
    // les containers (variables locales au module), qui seront affectés par initDom()
    var iframeApercu, container, editor;
    // quasi les mêmes jquerifiée
    var $adresse, $blocParam, $editorToggleButton;
    var isMqEditor = true;

    return {
      init: function (ressource, options) {
        container = options.container || w.document.getElementById('formRessource');
        if (!container) throw new Error("Il faut passer le container dans les options");
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        initDom(ressource.parametres, options);
      }
    };
  });
} catch (error) {
  if (typeof window.addError !== 'undefined') window.addError(error);
  if (typeof console !== 'undefined' && console.error) console.error(error);
}

