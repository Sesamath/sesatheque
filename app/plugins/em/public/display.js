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

import 'client-react/styles/display.scss'

const dom = require('sesajstools/dom')
const log = require('sesajstools/utils/log')

const fixResult = require('./fixResult')
const swf = require('../../../client/display/swf')

let isLoaded, isResultatSent

function getResultatCallback (ressource, options, next) {
  const params = ressource.parametres
  let completeResultReceived = 0

  return function emResultatCallback (result) {
    try {
      log('resultatCallback em reçoit', result)
      // les exos em envoient un 1er résultat quasi vide au chargement, on fait pas suivre
      if (options.startDate && (new Date()).getTime() - options.startDate.getTime() < 500) return

      // on récupère les anomalies éventuelles
      const resultFixed = fixResult(result)
      const resultMod = {
        reponse: resultFixed.reponse,
        nbq: result.nbq || params.nbq_defaut,
        fin: (result.fin === 'o'),
        original: result
      }
      // on ajoute la version corrigée si ≠
      if (result.score !== resultFixed.score) resultMod.original.scoreFixed = resultFixed.score
      if (result.reponse !== resultFixed.reponse) resultMod.original.reponseFixed = resultFixed.reponse
      // on notifie pas les incohérences, y'en a trop, on passera une commande cli sur les résultats si on les veux
      if (resultFixed.errors.length) resultMod.original.errors = resultFixed.errors

      // ça c'est pour les erreurs qui seront envoyées à bugsnag
      const errors = []

      // on regarde quand même si nbq n'est pas foireux
      if (resultMod.reponse.length > resultMod.nbq) {
        errors.push(`nbq ${resultMod.nbq} < longueur de ${resultMod.reponse} (${resultMod.reponse.length})`)
        resultMod.nbq = resultMod.reponse.length
      }

      // raccourcis
      const nbq = resultMod.nbq
      const nbr = result.reponse.length

      // calcul du score, faudrait chiffrer (avec réponse), mais j3p veut pouvoir l'intercepter
      const score = Math.max(result.score, resultFixed.score)
      if (score >= 0 && score < 11) resultMod.score = score / nbq

      // check fin
      if (!resultMod.fin) {
        if (nbr < nbq) {
          // on ajoute des b à reponse si c'est pas la dernière question
          resultMod.reponse += 'b'.repeat(nbq - result.reponse.length)
        } else if (resultFixed.reponse.substr(-1) !== 'j') {
          // pas fin, mais pourtant la réponse contient le nb de questions et la dernière n'est pas j

          // les exos mep modele 2 envoient 2× le dernier résultat (d'abord sans fin=o
          // puis après clic sur suite et affichage du message de fin, avec fin=o)
          // On impose toujours fin true sinon ça peut bloquer une séquence ordonnée
          // si l'élève ne clique pas sur suite.
          resultMod.fin = true
          // Invonvénient, ça zappe l'affichage du score 4s après le 1er envoi…
          // pour indiquer à labomep de pas fermer tout de suite et laisser le temps de lire le bilan ou cliquer sur suite
          resultMod.$resetDelay = 30
          completeResultReceived++
          const mepLevel = ressource.parametres.mep_modele.substr(2, 1)
          if (mepLevel >= completeResultReceived) {
            // donc mep2 à la deuxième réponse complète (envoyée au clic sur suite à la fin)
            // ou mep1 à la 1re réponse complète
            errors.push(`résultat em incohérent, fin = "o" manquant avec la réponse ${result.reponse} pour ${result.nbq} questions (${ressource.rid} ${ressource.parametres.mep_modele})`)
          }
        }
        // sinon, si la réponse est complète, sans fin, et que la dernière réponse est j,
        // on sait pas quoi faire => on fait rien (l'élève devra changer d'exo tout seul,
        // mais s'il clique pas sur suite en ayant un j en dernier (faux à la dernière question
        // qui ne prenait qu'un essai), il pourra jamais passer à l'exo suivant si la séquence est ordonnée.
      }

      isResultatSent = true

      options.resultatCallback(resultMod)
      // on regarde s'il faut notifier une anomalie
      /* global bugsnagClient */
      if (errors.length && typeof bugsnagClient !== 'undefined') {
        // rid et type y sont déjà, mais on vérifie quand même
        if (!bugsnagClient.metaData.exo) {
          bugsnagClient.metaData.exo = {}
          const message = 'bugsnagClient.metaData.exo n’existait pas'
          console.error(new Error(message))
          errors.push(message)
        }
        bugsnagClient.metaData.exo.resultat = resultMod
        bugsnagClient.metaData.exo.errors = errors
        const error = new Error(errors[0])
        bugsnagClient.notify(error)
      }
    } catch (error) {
      next(error)
    }
  }
} // getResultatCallback

/**
 * afficher les ressource em (exercices mathenpoche, en flash)
 * Cf mep-col:/dev/html/lib/html_exov1.htm et mep-col:/dev/html/lib/html_exov2.htm
 * @service plugins/em/display
 * @param {Ressource}      ressource  L'objet ressource
 * @param {displayOptions} options    Les options après init
 * @param {errorCallback}  next       La fct à appeler quand le swf sera chargé
 */
module.exports = function display (ressource, options, next) {
  try {
    let {container} = options
    if (!container) throw new Error('Il faut passer dans les options un conteneur html pour afficher cette ressource')
    const errorsContainer = options.errorsContainer
    if (!errorsContainer) throw new Error('Il faut passer dans les options un conteneur html pour les erreurs')

    /** class utilisée dans notre css */
    const cssClass = 'mepRess'
    const params = ressource.parametres
    let baseMepSwf, idSwf, swfUrl, largeur, hauteur, flashvars

    log('start display em avec la ressource (+options)', ressource, options)
    // les params minimaux
    if (!ressource.oid || !ressource.titre || !params) {
      throw new Error('Paramètres manquants')
    }

    // Ajout css
    if (options.baseUrl) dom.addCss(`${options.pluginBase}mep.css`) // si on a pas tant pis pour le css
    container.className = cssClass

    // le message en attendant le chargement
    dom.empty(container)
    const loadingElt = dom.addElement(container, 'p', {}, 'Chargement de la ressource ' + ressource.oid + ' en cours.')

    // notre base
    if (ressource.origine !== 'em' && ressource.baseUrl) baseMepSwf = ressource.baseUrl
    else baseMepSwf = 'https://mep-col.sesamath.net/dev/swf'
    // id du swf
    idSwf = Number(params.swf_id ? params.swf_id : ressource.idOrigine)
    // url du swf
    swfUrl = baseMepSwf + '/exo' + idSwf + '.swf'
    /**
     * Lance le chargement avec swfobject
     */
    if (params.mep_modele === 'mep2lyc') {
      largeur = 959
      hauteur = 618
    } else {
      largeur = 735
      hauteur = 450
    }
    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    if (container.style) container.style.width = largeur + 'px'
    else container.setAttribute('width', largeur + 'px') // marche pas avec chrome ou ff

    /** @see http://redmine.sesamath.net/projects/alibaba/wiki/ExosMep pour les flashvars à passer */
    flashvars = options.flashvars || {}
    // ces flashvars pour le swf sont obligatoires et on les impose ici
    flashvars.idMep = Number(ressource.idOrigine)
    flashvars.modeleMep = (params.mep_modele === 'mep1') ? '1' : '2'
    flashvars.abreviationLangue = params.mep_langue_id
    flashvars.idSwf = idSwf
    // si n on a pas de chiffrement de la réponse qui sera une string au format 'vrrp...'
    // (sinon c'est un nombre qui correspond à cette réponse chiffrée)
    // et la propriété score est ajoutée (un entier donnant le nb de bonnes réponses)
    flashvars.ch = options.ch || 'n'
    // ensuite le facultatif si présent
    if (params.aide_id) flashvars.idAide = Number(params.aide_id)
    // pour les profs (passer les questions et voir l'aide)
    if (options.isFormateur) {
      log("affichage par un formateur, on désactive le score et regarde si on peut activer le bouton suite et l'aide (suivant ressource)")
      // à l'import on ne met pas ces valeurs si c'est o (valeur par défaut)
      if (params.suite_formateur) flashvars.isBoutonSuite = params.suite_formateur
      else flashvars.isBoutonSuite = 'o'
      if (params.aide_formateur) flashvars.isBoutonAide = params.aide_formateur
      else flashvars.isBoutonAide = 'o'
    }
    // config vers un xml devenu inutile
    // 0 ressources publiques en 2013-11, mais qq unes dans MEPS pas publiées
    if (params.nb_wnk) flashvars.mep_nb_wnk = params.nb_wnk

    // traitement du résultat éventuel
    if (options.resultatCallback && !options.isFormateur) {
      // faut une fonction qui va transformer le résultat au format attendu
      // et la pour rendre accessible au swf dans son dom
      flashvars.nomFonctionCallback = 'resultatCallback'
      window.resultatCallback = getResultatCallback(ressource, options, next)

      // on ajoute un envoi au unload si rien n'a été envoyé avant
      window.addEventListener('unload', function () {
        if (isLoaded && !isResultatSent) {
          isResultatSent = true
          options.resultatCallback({deferSync: true})
        }
        // sinon le swf n'a pas été chargé ou il a déjà envoyé une réponse et on envoie rien au unload
      })
    }

    const swfOptions = {
      flashvars,
      largeur,
      hauteur,
      flashversion: 8,
      base: baseMepSwf + '/'
    }
    // pour debug
    log('flashvars', flashvars)
    swf.load(container, swfUrl, swfOptions, function (error) {
      isLoaded = !error
      log(`chargement du swf ${error ? 'KO' : 'ok'}`)
      container.removeChild(loadingElt)
      next(error)
    })
  } catch (error) {
    next(error)
  }
}
