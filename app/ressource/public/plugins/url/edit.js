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
  define(["multiEditor"], function (multiEditor) {
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
    function addOptions(blocParam, parametres) {
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

      var containerConsigne = S.addElement(blocParam, "div", {style:{"border":"#000 thin solid", padding:"1em"}});
      S.addElement(containerConsigne, "span", {style:{"font-weight":"bold"}}, "Consigne :");
      var consigne = parametres.consigne || '';
      var divConsigneOptions = S.addElement(containerConsigne, 'div');
      var divConsigne = S.addElement(containerConsigne, 'div');
      var $divConsigne = $(divConsigne); // un div autour du textarea pour afficher / masquer
      addOption(divConsigneOptions, "question_option", "aucune", "off", function () {$divConsigne.hide();});
      addOption(divConsigneOptions, "question_option", "avant", "before", function () {$divConsigne.show();});
      addOption(divConsigneOptions, "question_option", "pendant", "while", function () {$divConsigne.show();});
      addOption(divConsigneOptions, "question_option", "après", "after", function () {$divConsigne.show();});
      S.addText(divConsigneOptions, " (l'affichage de la page)");

      var editor = S.addElement(divConsigne, 'textarea', {name:"parametres[consigne]", id:"editor",style:{"min-width":"50%"}}, consigne);
      var editorConfig = {
        editor: parametres.question_editor,
        mathquill: "full",
        optionsName: "parametres[question_editor]"
      };

      multiEditor.init(editor, editorConfig);

      var containerReponse = S.addElement(blocParam, "div", {style:{"border":"#000 thin solid", padding:"1em", "margin-top":"1em"}});
      S.addElement(containerReponse, "span", {style:{"font-weight":"bold"}}, "Réponse :");
      var divReponseOptions = S.addElement(containerReponse, 'div');
      addOption(divReponseOptions, "answer_option", "aucune", "off");
      addOption(divReponseOptions, "answer_option", "avant", "before");
      addOption(divReponseOptions, "answer_option", "pendant", "while");
      addOption(divReponseOptions, "answer_option", "après", "after");
      S.addText(divReponseOptions, " (l'affichage de la page)");
      S.addElement(divReponseOptions, 'br');
      S.addText(divReponseOptions, " Type d'éditeur pour la réponse : ");
      addOption(divReponseOptions, "answer_editor", "zone de texte", "simple");
      addOption(divReponseOptions, "answer_editor", "texte enrichi", "ckeditor");
      addOption(divReponseOptions, "answer_editor", "éditeur d'équation simplifié", "mathquill");
    } // addOptions

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
      var instructions = S.addElement(blocParam, 'div', {}, "Adresse Internet de votre page externe");
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
      //S.addElement(instructions, 'img', {src: options.pluginBaseUrl +"images/forward.png"});
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
     * Initialise les parametres avec des valeurs par défaut
     * @param parametres
     */
    function initParam(parametres) {
      "use strict";
      S.log("on a au départ les params", parametres);
      if (!parametres.question_option) parametres.question_option = "before";
      if (!parametres.question_editor) parametres.question_editor = "simple";
      if (!parametres.answer_option) parametres.answer_option = "off";
      if (!parametres.answer_editor) parametres.answer_editor = "simple";
      S.log("après init", parametres);
    }


    /**
     * MAIN
     */
    if (typeof $ === 'undefined') throw new Error('Problème de chargement jQuery');

    // raccourcis
    var w = window;
    if (typeof w.Sesamath === "undefined") w.Sesamath = {};
    var S = window.Sesamath;
    if (!S.Sesatheque) S.Sesatheque = {};
    //var ST = S.Sesatheque;

    var exclus = ["euler.ac-versailles.fr"];
    // les containers (variables locales au module), qui seront affectés par initDom()
    var container, iframeApercu, linkAdresseElt, $adresse, $adresseAlert, $apercu;

    return {
      init: function (ressource, options) {
        container = options.container || w.document.getElementById('formRessource');
        if (!container) throw new Error("Il faut passer le container dans les options");
        if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer");
        initParam(ressource.parametres);
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
