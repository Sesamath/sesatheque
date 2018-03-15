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

/**
 * Rectifie d'éventuels résultats incohérents pour les exos mathenpoche
 */
module.exports = function fixResult (result) {
  // vérif de base
  if (!result) throw new Error('Aucun résultat à envoyer')
  let {score, reponse} = result
  const errors = []
  if (typeof reponse !== 'string') {
    if (reponse) errors.push('réponse invalide')
    else errors.push('pas de réponse')
    reponse = ''
  }
  if (typeof score !== 'number') {
    if (score) {
      errors.push(`score n’est pas un nombre : ${typeof score}`)
      score = Math.round(Number(score))
    } else {
      score = 0
    }
  }
  if (score < 0 || score > 10) {
    errors.push(`score invalide : ${score} => 0`)
    score = 0
  }
  const cleanResult = {reponse, score, errors}
  // on calcule un score d'après le nb de v & p
  const nbRepOk = reponse.replace(/[^vp]/g, '').length
  // le j doit être normalement compris comme faux (r), mais ça déconne parfois
  if (reponse.includes('j')) {
    if (nbRepOk === score) {
      // cas "normal", les j doivent être interprétés comme r
      if (/j$/.test(reponse)) {
        // sauf le dernier si ça se termine par j
        cleanResult.reponse = reponse.substring(0, reponse.length - 1).replace(/j/g, 'r') + 'j'
      } else {
        cleanResult.reponse = reponse.replace(/j/g, 'r')
      }
    } else {
      const scoreAvecJ = reponse.replace(/[^vpj]/g, '').length
      // on regarde si les j doivent être interprétés comme v
      if (scoreAvecJ === score) {
        cleanResult.reponse = reponse.replace(/j/g, 'v')
        cleanResult.score = scoreAvecJ
      } else {
        // on en sait rien, on laisse la réponse intacte et on prend le meilleur score
        // entre celui qu'on a calculé et celui renvoyé
        cleanResult.score = Math.max(nbRepOk, score)
        cleanResult.errors.push('réponse incohérente avec le score')
      }
    }
  } else if (nbRepOk !== score) {
    // pas de j mais réponse incohérente quand même
    cleanResult.score = Math.max(nbRepOk, score)
    // y'a des swf qui filent des score incohérents avec la réponse ! (sesabibli/3402)
    errors.push('réponse incohérente avec le score')
  }
  return cleanResult
}
