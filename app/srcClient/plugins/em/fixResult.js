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
  if (!result.reponse) throw new Error('Résultat sans réponse')
  if (!result.score) throw new Error('Résultat sans score')
  if (typeof result.score !== 'number') throw new Error('score n’est pas un nombre')
  if (typeof result.reponse !== 'string') throw new Error('réponse invalide')
  // on peut continuer
  const cleanResult = result
  cleanResult.errors = []
  // on calcule un score d'après le nb de v & p
  const nbRepOk = result.reponse.replace(/[^vp]/g, '').length
  // le j doit être normalement compris comme faux (r), mais ça déconne parfois
  if (result.reponse.includes('j')) {
    if (nbRepOk === result.score) {
      // cas "normal", les j doivent être interprétés comme r
      if (/j$/.test(result.reponse)) {
        // sauf le dernier si ça se termine par j
        cleanResult.reponse = result.reponse.substring(0, result.reponse.length - 1) + 'j'
      } else {
        cleanResult.reponse = result.reponse.replace(/j/g, 'r')
      }
    } else {
      const scoreAvecJ = result.reponse.replace(/[^vpj]/g, '').length
      // on regarde si les j doivent être interprétés comme v
      if (scoreAvecJ === result.score) {
        cleanResult.reponse = result.reponse.replace(/j/g, 'v')
        cleanResult.score = scoreAvecJ
      } else {
        // on en sait rien, on laisse la réponse intacte et on prend le meilleur score
        // entre celui qu'on a calculé et celui renvoyé
        cleanResult.score = Math.max(nbRepOk, result.score)
        cleanResult.errors.push('réponse incohérente avec le score')
      }
    }
  } else if (nbRepOk !== result.score) {
    // pas de j mais réponse incohérente quand même
    cleanResult.score = Math.max(nbRepOk, result.score)
    // y'a des swf qui filent des score incohérents avec la réponse ! (sesabibli/3402)
    cleanResult.errors.push('réponse incohérente avec le score')
  }
  return cleanResult
}
