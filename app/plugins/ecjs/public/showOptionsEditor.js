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

const log = require('sesajstools/utils/log')

// helper de display pour afficher l'éditeur des options calculatice
module.exports = function showOptionsEditor ($, {exoClc, ressource, options}) {
  // on a pas de méthode pour afficher les options (le paramétrage),
  // faut utiliser jQuery pour cliquer sur la roue crantée à la place de l'utilisateur,

  // itérations pour rechercher nos éléments
  const maxIterations = 300
  const delayMs = 10
  const maxWait = maxIterations * delayMs / 1000

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

  // on lance la bascule du mode d'affichage
  goToEditorMode().then(() => {
    options.onLoadEditorCb(null)
  }).catch(options.onLoadEditorCb)
}
