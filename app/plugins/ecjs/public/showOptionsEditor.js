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

const page = require('../../../client/page/index')
const log = require('sesajstools/utils/log')

// helper de display pour afficher l'éditeur des options calculatice
module.exports = function showOptionsEditor ($, {exoClc, ressource, options}) {
  // on a pas de méthode pour afficher les options (le paramétrage),
  // faut utiliser jQuery pour cliquer sur la roue crantée à la place de l'utilisateur,
  // (puis sur valider quand on voudra les valeurs, et il faudra alors chercher de nouveau
  // le bouton pour repasser en mode édition du paramétrage

  // clc a un event pour la validation des options, mais
  // on veut pas ajouter un nouveau listener à chaque fois qu'on nous demande
  // les paramètres, donc on en met un seul avec une liste d'attente de cb
  const listeners = []
  exoClc.on('validationOption', null, function (event, options) {
    if (options) {
      ressource.parametres.options = options
      // si y'a des listener on les appelle (et les vire)
      while (listeners.length) listeners.pop()(ressource.parametres)
    } else {
      page.addError(Error('La validation des options calcul@tice ne renvoie rien'))
    }
  })

  // itérations pour rechercher nos éléments
  const maxIterations = 300
  const delayMs = 10
  const maxWait = maxIterations * delayMs / 1000
  // le bouton valider qui sera initialisé à chaque affichage des options
  let $buttonValidate

  const goToEditorMode = () => new Promise((resolve, reject) => {
    // clique sur le bouton paramétrage (la roue crantée)
    function tryClicOptions () {
      if (i < maxIterations) {
        let $button = $('button.parametrer')
        if ($button.length > 0) {
          if ($button.length > 1) {
            log.error("On a plusieurs boutons qui répondent au sélecteur 'button .bouton.parametrer'")
            $button = $button.first()
          }
          log(`on a trouvé le bouton options après ${i * delayMs}ms d’attente`)
          $button.show()
          $button.click()
          resolve()
        } else {
          i++
          setTimeout(tryClicOptions, delayMs)
        }
      } else {
        reject(Error(`Pas trouvé le bouton paramétrer après ${maxWait}s`))
      }
    }
    let i = 0
    tryClicOptions()
  }).then(() => new Promise((resolve, reject) => {
    // récupère puis cache le bouton valider
    function getAndHideValidate () {
      if (i < maxIterations) {
        let $button = $('button.tester-parametre')
        if ($button.length > 0) {
          if ($button.length > 1) {
            log.error("On a plusieurs boutons qui répondent au sélecteur 'button.tester-parametre'")
            $button = $button.first()
          }
          log(`on a trouvé le bouton valider après ${i * delayMs}ms d’attente`)
          $button.hide()
          $buttonValidate = $button
          resolve()
        } else {
          i++
          setTimeout(getAndHideValidate, delayMs)
        }
      } else {
        reject(Error(`Pas trouvé le bouton Valider après ${maxWait}s`))
      }
    }
    let i = 0
    getAndHideValidate()
  }))

  // on crée une fct pour récupérer ces paramètres
  const getParametres = () => new Promise((resolve, reject) => {
    if (!$buttonValidate) return goToEditorMode().then(getParametres)
    const timerId = setTimeout(
      () => reject(Error('Impossible de récupérer les options de cet exercice calcul@tice')),
      1000
    )
    // on ajoute un listener sur les options
    listeners.push((parametres) => {
      clearTimeout(timerId)
      resolve(parametres)
      // le clic fait repasser en affichage standard, faut revenir aux options
      // mais faut laisser jQuery faire le reste d'abord
      setTimeout(() => goToEditorMode().catch(page.addError), 0)
    })
    // et on réclame
    $buttonValidate.click()
  })

  // on lance la bascule du mode d'affichage
  goToEditorMode().then(() => {
    // et on file cette fct getParametres à celui qui la voulait
    options.onLoadEditorCb(null, getParametres)
  }).catch(options.onLoadEditorCb)
}
