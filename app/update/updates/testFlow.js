'use strict'
// un exemple pour mettre en évidence un bug qq part dans l'usage de an-flow
// avec le (gros) arbre en exemple testFlow.json, on a
// `node ./testFlow.js`
//    => traitement de 318 arbres puis `RangeError: Maximum call stack size exceeded` sur “Racines” (318)
// `node --stack-size=2048 ./testFlow.js`
//    => traitement de 17 enfants (dernier "") puis arrêt silencieux

const flow = require('an-flow')
const dataSrc = require('./testFlow.json')
const log = require('sesajstools/utils/log')

let nb = 0

/**
 * Nettoie les enfants d'un arbre de leur aliasOf invalide d'après les infos de ridToClean
 * @param {Ressource} arbre
 */
function cleanArbre (arbre, next) {
  let hasChanged = cleanItem(arbre)
  nb++
  const trace = `“${arbre.titre}” (${nb})`
  log(`cleanArbre ${trace}`)

  // les enfants
  if (arbre.enfants && arbre.enfants.length) {
    flow(arbre.enfants).seqEach(function (enfant) {
      if (enfant.type === 'arbre') {
        cleanArbre(enfant, this)
      } else {
        hasChanged = cleanItem(enfant) || hasChanged
        this()
      }
    }).seq(function () {
      let msg = `fin des enfants de ${trace}`
      msg += hasChanged ? ' (il a été modifié)' : ' (intact)'
      log(msg)
      next(null, arbre)
    }).catch(next)

  // on est une ref à un autre arbre
  } else if (arbre.aliasOf) {
    // faut le charger pour le nettoyer
    log(`skip alias ${arbre.aliasOf}`)
    next(null, arbre)

  // un item arbre sans enfants ni aliasOf, pas très normal…
  } else {
    log.error(`arbre ${trace} sans enfants ni aliasOf`)
    next(null, arbre)
  }
}

function cleanItem (item) {
  let hasChanged = false
  // par sécurité on ne change que l'aspect public des arbres
  // (au cas où un corrigé se serait glissé dans un arbre sesamath)
  if (item.type === 'arbre') {
    if (item.hasOwnProperty('restriction')) {
      if (item.restriction) {
        hasChanged = true
        item.restriction = 0
      }
    } else if (item.hasOwnProperty('public')) {
      if (!item.public) {
        hasChanged = true
        item.public = true
      }
    }
  } else if (item.hasOwnProperty('public') && !item.public) {
    // log.error('item privé dans un arbre sesamath', item)
  }
  return hasChanged
}

log.enable()
flow().seq(function () {
  cleanArbre(dataSrc, this)
}).seq(function () {
  log(`fin du traitement de l’arbre de test, on a chargé ${nb} sous-arbres`)
}).catch(function (error) {
  console.error(error)
})
