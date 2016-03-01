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
'use strict'

var page = require('../../page')
var dom = require('../../tools/dom')
var log = require('../../tools/log')
var multiEditor = require('../../editors/multiEditor')

var $ = window.jQuery /* jshint jquery:true */

/**
 * Édite une ressource url, ses parametres ont les propriétés
 * adresse : l'url à afficher
 * question_option Les options de la consigne after|before|off|while
 * consigne        La consigne
 * answer_option   Les options de la réponse after|off|question|while
 * answer_editor   Quel type d'éditeur pour la réponse (textarea, ckeditor, ckeditorTex), cette propriété n'existait pas dans labomep1
 * @service plugins/url/edit
 * @param ressource
 * @param options
 */
module.exports = function edit(ressource, options) {
  /**
   * Vérifie que l'adresse est correctement formatée et n'est pas un domaine interdit, ajoute éventuellement http://
   */
  function adresseOnChange() {
    // vérification : est-ce que l'adresse comporte http://
    var url = $adresse.val()
    if (url && !/https?:\/\//.exec(url)) {
      url = "http://" +url
      $adresse.val(url)
    }
    // vérif exclus
    exclus.forEach(function (domain) {
      if (url.indexOf(domain) > -1) {
        window.alert(domain +" a explicitemenent refusé que ses pages puissent être intégrées")
        $adresse.val("")
        url = ""
        return false
      }
    })
    linkAdresseElt.href = url
    iframeApercu.src = url
    log("On change d'adresse vers " +url)
    if (url) {
      $adresseAlert.hide()
      $(linkAdresseElt).show()
      $apercu.show()
    } else {
      $(linkAdresseElt).hide()
      $apercu.hide()
    }
  } // adresseOnChange

  /**
   * Ajoute les boutons d'options sur la consigne et la réponse
   * @param blocParam
   * @param parametres
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
      var id = dom.getNewId()
      var args = {type:"radio", name:"parametres[" +name +"]", id:id, value:value, style:{"line-height":"1.3em","vertical-align":"middle"}}
      if (parametres[name] === value) args.checked = "checked"
      var radio = dom.addElement(parent, 'input', args)
      if (onClick) $(radio).click(onClick)

      dom.addElement(parent, 'label', {htmlFor:id,style:{"line-height":"1.3em","vertical-align":"middle", margin:"0 1em 0 0.2em"}}, label)
    }

    var containerConsigne = dom.addElement(blocParam, "div", {style:{"border":"#000 thin solid", padding:"1em"}})
    dom.addElement(containerConsigne, "span", {style:{"font-weight":"bold"}}, "Consigne :")
    var consigne = parametres.consigne || ''
    var divConsigneOptions = dom.addElement(containerConsigne, 'div')
    var divConsigne = dom.addElement(containerConsigne, 'div')
    var $divConsigne = $(divConsigne); // un div autour du textarea pour afficher / masquer
    addOption(divConsigneOptions, "question_option", "aucune", "off", function () {$divConsigne.hide();})
    addOption(divConsigneOptions, "question_option", "avant", "before", function () {$divConsigne.show();})
    addOption(divConsigneOptions, "question_option", "pendant", "while", function () {$divConsigne.show();})
    addOption(divConsigneOptions, "question_option", "après", "after", function () {$divConsigne.show();})
    dom.addText(divConsigneOptions, " (l'affichage de la page)")

    var editor = dom.addElement(divConsigne, 'textarea', {name:"parametres[consigne]", id:"editor",style:{"min-width":"50%"}}, consigne)
    var editorConfig = {
      editor: parametres.question_editor,
      mathquill: "full",
      optionsName: "parametres[question_editor]"
    }

    multiEditor.init(editor, editorConfig)

    var containerReponse = dom.addElement(blocParam, "div", {style:{"border":"#000 thin solid", padding:"1em", "margin-top":"1em"}})
    dom.addElement(containerReponse, "span", {style:{"font-weight":"bold"}}, "Réponse :")
    var divReponseOptions = dom.addElement(containerReponse, 'div')
    addOption(divReponseOptions, "answer_option", "aucune", "off")
    addOption(divReponseOptions, "answer_option", "avant", "before")
    addOption(divReponseOptions, "answer_option", "pendant", "while")
    addOption(divReponseOptions, "answer_option", "après", "after")
    dom.addText(divReponseOptions, " (l'affichage de la page)")
    dom.addElement(divReponseOptions, 'br')
    dom.addText(divReponseOptions, " Type d'éditeur pour la réponse : ")
    addOption(divReponseOptions, "answer_editor", "zone de texte", "simple")
    addOption(divReponseOptions, "answer_editor", "texte enrichi", "ckeditor")
    addOption(divReponseOptions, "answer_editor", "éditeur d'équation simplifié", "mathquill")
  } // addOptions

  /**
   * Initialise le dom et les comportements
   * @param parametres
   * @param options
   */
  function initDom(parametres, options) {
    // Ajout css, si on a pas tant pis pour le css mais ça va être moche
    //if (options.vendorsBaseUrl) dom.addCss(options.vendorsBaseUrl + '/editUrl.css')
    // nos éléments html
    var blocParam = window.document.getElementById('parametres')
    if (!blocParam) throw new Error("Élément #parametres manquant")
    var instructions = dom.addElement(blocParam, 'div', {}, "Adresse Internet de votre page externe")
    var url = parametres.adresse || ''
    if (url === "undefined") url = ''
    linkAdresseElt = dom.addElement(instructions, 'a', {target:"_blank", href:url}, "Voir dans un nouvel onglet")
    var adresseAlert = dom.addElement(instructions, 'div', {"class":"error"}, "Il faut entrer une adresse")
    $adresseAlert = $(adresseAlert)
    $adresseAlert.hide()
    var adresseElt = dom.addElement(instructions, 'input', {name:"parametres[adresse]",size:100, value:url})
    if (!url) $(linkAdresseElt).hide()
    $adresse = $(adresseElt)
    log("$adresse affecté dans initDom")
    $adresse.change(adresseOnChange)
    var apercu = dom.addElement(instructions, 'div',{width:"300", height:"200"})
    dom.addElement(apercu, 'p',{style:{float:"right", margin:"3em 1em"}}, "Cet aperçu miniature permet de vérifier que " +
        "le site autorise l'affichage incrusté (dans une iframe).")
    var divTaille = dom.addElement(apercu, 'div')
    dom.addText(divTaille, "Vous pouvez forcer une dimension d'affichage (déconseillé pour une page, mieux vaut laisser " +
        "vide et laisser le navigateur s'adapter, mais cela peut être utile pour une image).")
    dom.addElement(divTaille, 'br')
    dom.addElement(divTaille, 'label', {htmlFor:"largeur", style:{margin:"0 0.2em 0 0"}}, "largeur (en pixels)")
    dom.addElement(divTaille, 'input', {id:"largeur", name:"parametres[largeur]",size:4, value: parseInt(parametres.largeur, 10) || ""})
    dom.addElement(divTaille, 'label', {htmlFor:"hauteur", style:{margin:"0 0.2em 0 1em"}}, "hauteur (en pixels)")
    dom.addElement(divTaille, 'input', {id:"hauteur", name:"parametres[hauteur]",size:4, value: parseInt(parametres.hauteur, 10) || ""})

    iframeApercu = dom.addElement(apercu, 'iframe',{id:"iframeApercu", width:"300", height:"200"})
    $apercu = $(apercu)
    dom.addElement(instructions, 'br')
    dom.addText(instructions, "Il est possible d'accompagner la page internet d'une consigne et même de demander " +
        "à l'élève de saisir un texte dans une zone de réponse.")
    dom.addElement(instructions, 'br')
    dom.addText(instructions, "Choisissez le paramétrage que vous souhaitez parmi ceux proposés ci-dessous.")
    //dom.addText(instructions, "Le symbole ")
    //dom.addElement(instructions, 'img', {src: options.pluginBaseUrl +"images/forward.png"})
    //dom.addText(instructions, " indique que les affichages seront proposés successivements et non simultanément.")
    addOptions(blocParam, parametres, options)

    // on empêche la soumission sans url de page
    $("#formRessource").submit(function () {
      if (!$adresse.val()) {
        $adresseAlert.show()
        return false
      }
    })
  } // initDom

  /**
   * Initialise les parametres avec des valeurs par défaut
   * @param parametres
   */
  function initParam(parametres) {
    log("on a au départ les params", parametres)
    if (!parametres.question_option) parametres.question_option = "before"
    if (!parametres.question_editor) parametres.question_editor = "simple"
    if (!parametres.answer_option) parametres.answer_option = "off"
    if (!parametres.answer_editor) parametres.answer_editor = "simple"
    log("après init", parametres)
  }

  /**
   * MAIN
   */
  try {
    var exclus = ["euler.ac-versailles.fr"]
    // les containers (variables locales au module), qui seront affectés par initDom()
    var iframeApercu, linkAdresseElt, $adresse, $adresseAlert, $apercu
    var container = options.container || window.document.getElementById('formRessource')
    if (!container) throw new Error("Il faut passer le container dans les options")
    if (!ressource || !ressource.parametres) throw new Error("Il faut passer une ressource à éditer")
    initParam(ressource.parametres)
    initDom(ressource.parametres, options)
  } catch (error) {
    page.addError(error)
  }
}
