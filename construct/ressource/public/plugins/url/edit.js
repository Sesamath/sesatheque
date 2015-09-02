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
  define(["mqEditor"], function (mqEditor) {
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
        $adresse.val(url);
      }
      // vérif exclus
      exclus.forEach(function (domain) {
        if (url.indexOf(domain) > -1) {
          alert(domain +" a explicitemenent refusé que ses pages puissent être intégrées");
          $adresse.val("");
          url = "";
          return false;
        }
      });
      linkAdresseElt.href = url;
      iframeApercu.src = url;
      S.log("On change d'adresse vers " +url);
      if (url) {
        $adresseAlert.hide();
        $(linkAdresseElt).show();
        $apercu.show();
      } else {
        $(linkAdresseElt).hide();
        $apercu.hide();
      }
    } // adresseOnChange

    /**
     * Ajoute les boutons d'options sur la consigne et la réponse
     * @param blocParam
     * @param parametres
     * @param options
     */
    function addOptions(blocParam, parametres, options) {
      /**
       * Ajoute une option dans parent
       * @internal
       * @param parent
       * @param name
       * @param label
       * @param value
       * @param onClick
       */
      function addOption(parent, name, label, value, onClick) {
        var id = S.getNewId();
        var args = {type:"radio", name:"parametres[" +name +"]", id:id, value:value, style:{"line-height":"1.3em","vertical-align":"middle"}};
        if (parametres[name] === value) args.checked = "checked";
        var radio = S.addElement(parent, 'input', args);
        if (onClick) $(radio).click(onClick);

        S.addElement(parent, 'label', {htmlFor:id,style:{"line-height":"1.3em","vertical-align":"middle", margin:"0 1em 0 0.2em"}}, label);
      }

      /**
       * Affiche / masque ckEditor (callback onClic du bouton afficher simple/enrichi)
       * @internal
       * @returns {boolean} toujours false sinon ça valide le form !
       */
      function toggleEditor() {
        function toCk() {
          $divConsigne.hide();
          $editorToggleButton.text("Éditeur d'équation simplifié");
          CKEDITOR.replace('editor', {
            customConfig : '' // on veut pas charger le config.js
          });
          $divConsigne.show();
          // faut pas revenir au simple, marche plus, il valide le form même avec le return false
          // et ensuite le retour à ck marche pas non plus car le replace ne doit être fait qu'une fois, ça soule
          //$editorToggleButton.hide();
          isCk = true;
        }
        function toSimple() {
          $divConsigne.hide();
          $editorToggleButton.text("Éditeur enrichi");
          CKEDITOR.instances.editor.destroy();
          // on vire le html
          var contenu = $editor.val().replace(/<[^<>]+>/ig, "");
          S.log("avant de simplifier l'éditeur on récupère le texte " +contenu);
          $editor.empty();
          $editor.val(contenu);
          $divConsigne.show();
          S.log("et on fini avec " +$editor.text())
          isCk = false;
        }
        //S.log("toggleEditor se lance");
        if (isCk) {
          toSimple();
        } else {
          if (typeof CKEDITOR === "undefined") {
            require(["ckeditor"], function () {
              require(["ckeditorJquery"], function () {
                if (typeof CKEDITOR === 'undefined') throw new Error('Problème de chargement CKEditor');
                initCKEditor();
                toCk();
              });
            });
          } else {
            toCk();
          }
        }

        //S.log("toggleEditor return false");
        return false; // sinon il valide le form, mais même comme ça il valide au 2e clic
      } // toggleEditor

      S.addElement(blocParam, "span", {style:{"font-weight":"bold"}}, "Consigne :");
      var consigne = parametres.consigne || '';
      var divConsigneOptions = S.addElement(blocParam, 'div');
      var divConsigne = S.addElement(blocParam, 'div');
      var editorToggleButton = S.addElement(divConsigne, 'button', {style:{display:"block"}, type:"button"}, "Éditeur enrichi");
      $editorToggleButton = $(editorToggleButton);
      $editorToggleButton.click(toggleEditor);
      var $divConsigne = $(divConsigne);
      addOption(divConsigneOptions, "question_option", "aucune", "off", function () {$divConsigne.hide();});
      addOption(divConsigneOptions, "question_option", "avant", "before", function () {$divConsigne.show();});
      addOption(divConsigneOptions, "question_option", "pendant", "while", function () {$divConsigne.show();});
      addOption(divConsigneOptions, "question_option", "après", "after", function () {$divConsigne.show();});
      S.addText(divConsigneOptions, " (l'affichage de la page)");
      var divConsigneEditor = S.addElement(divConsigne, "div");
      S.addText(divConsigneEditor, " Type d'éditeur : ");
      addOption(divConsigneEditor, "consigne_editeur", "simple", "textarea", toSimple);
      S.addText(divConsigneEditor, " - ");
      addOption(divConsigneEditor, "consigne_editeur", "équation", "mathquill", toMq);
      S.addText(divConsigneEditor, " - ");
      addOption(divConsigneEditor, "consigne_editeur", "texte riche", "ckEditor", toCk);

      var editor = S.addElement(divConsigne, 'textarea', {name:"parametres[consigne]", id:"editor",style:{"min-width":"50%"}}, consigne);
      var $editor = $(editor);
      mqEditor.init(editor, parametres.mqEditorConfig, options);

      // on passe en mode ck d'office si on trouve du <p> dans la consigne
      if (consigne.indexOf("<p>") > -1) toggleEditor();

      S.addElement(blocParam, "span", {style:{"font-weight":"bold"}}, "Réponse :");
      var divReponseOptions = S.addElement(blocParam, 'div');
      addOption(divReponseOptions, "answer_option", "aucune", "off");
      addOption(divReponseOptions, "answer_option", "avant", "before");
      addOption(divReponseOptions, "answer_option", "pendant", "while");
      addOption(divReponseOptions, "answer_option", "après", "after");
      S.addText(divReponseOptions, " (l'affichage de la page)");
      S.addElement(divReponseOptions, 'br');
      S.addText(divReponseOptions, " Type d'éditeur pour la réponse : ");
      addOption(divReponseOptions, "answer_editor", "zone de texte", "textarea");
      addOption(divReponseOptions, "answer_editor", "texte enrichi", "ckeditor");
      addOption(divReponseOptions, "answer_editor", "texte avec éditeur d'équation simplifié", "mqEditor");
      addOption(divReponseOptions, "answer_editor", "texte enrichi avec LaTeX possible", "ckeditorTex");
    } // addOptions

    /**
     * Initialise la conf de ckeditor (mais il faudra appeler CKEDITOR.replace ensuite)
     */
    function initCKEditor() {
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
      //S.log('ckeditor', CKEDITOR);
    } // initCKEditor

    /**
     * Initialise le dom et les comportements
     * @param options
     */
    function initDom(parametres, options) {
      // Ajout css, si on a pas tant pis pour le css mais ça va être moche
      //if (options.vendorsBaseUrl) S.addCss(options.vendorsBaseUrl + '/editUrl.css');
      // nos éléments html
      var blocParam = window.document.getElementById('parametres');
      if (!blocParam) throw new Error("Élément #parametres manquant");
      var instructions = S.addElement(blocParam, 'div', {}, "Adresse Internet de votre page externe (par exemple : http://www.sesamath.net) ");
      var url = parametres.adresse || '';
      if (url === "undefined") url = '';
      linkAdresseElt = S.addElement(instructions, 'a', {target:"_blank", href:url}, "Voir dans un nouvel onglet");
      var adresseAlert = S.addElement(instructions, 'div', {class:"error"}, "Il faut entrer une adresse");
      $adresseAlert = $(adresseAlert);
      $adresseAlert.hide();
      var adresseElt = S.addElement(instructions, 'input', {name:"parametres[adresse]",size:100, value:url});
      if (!url) $(linkAdresseElt).hide();
      $adresse = $(adresseElt);
      S.log("$adresse affecté dans initDom");
      $adresse.change(adresseOnChange);
      var apercu = S.addElement(instructions, 'div',{width:"300", height:"200"});
      S.addElement(apercu, 'p',{style:{float:"right", margin:"3em 1em"}}, "Cet aperçu miniature permet de vérifier que le site autorise l'affichage incrusté (dans une iframe).");
      var divTaille = S.addElement(apercu, 'div');
      S.addText(divTaille, "Vous pouvez forcer une dimension d'affichage (déconseillé pour une page, mieux vaut laisser vide et laisser le navigateur s'adapter, mais cela peut être utile pour une image).");
      S.addElement(divTaille, 'br');
      S.addElement(divTaille, 'label', {htmlFor:"largeur", style:{margin:"0 0.2em 0 0"}}, "largeur (en pixels)");
      S.addElement(divTaille, 'input', {id:"largeur", name:"parametres[largeur]",size:4, value: parseInt(parametres.largeur, 10) || ""});
      S.addElement(divTaille, 'label', {htmlFor:"hauteur", style:{margin:"0 0.2em 0 1em"}}, "hauteur (en pixels)");
      S.addElement(divTaille, 'input', {id:"hauteur", name:"parametres[hauteur]",size:4, value: parseInt(parametres.hauteur, 10) || ""});

      iframeApercu = S.addElement(apercu, 'iframe',{id:"iframeApercu", width:"300", height:"200"});
      $apercu = $(apercu);
      S.addElement(instructions, 'br');
      S.addText(instructions, "Il est possible d'accompagner la page internet d'une consigne et même de demander à l'élève de saisir un texte dans une zone de réponse.");
      S.addElement(instructions, 'br');
      S.addText(instructions, "Choisissez le paramétrage que vous souhaitez parmi ceux proposés ci-dessous.");
      //S.addText(instructions, "Le symbole ");
      //S.addElement(instructions, 'img', {src: options.pluginBaseUrl +"/images/forward.png"});
      //S.addText(instructions, " indique que les affichages seront proposés successivements et non simultanément.");
      addOptions(blocParam, parametres, options);

      // on empêche la soumission sans url de page
      $("#formRessource").submit(function () {
        "use strict";
        if (!$adresse.val()) {
          $adresseAlert.show();
          return false;
        }
      });
    } // initDom


    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    // raccourcis
    var w = window;
    if (typeof w.sesamath === "undefined") w.sesamath = {};
    var S = window.sesamath;
    if (!S.sesatheque) S.sesatheque = {};
    //var ST = S.sesatheque;

    var exclus = ["euler.ac-versailles.fr"];
    // les containers (variables locales au module), qui seront affectés par initDom()
    var container, iframeApercu, linkAdresseElt, $adresse, $adresseAlert, $apercu, $editorToggleButton;
    var isCk = false;

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
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}
