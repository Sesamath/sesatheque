/**
 * Ce script passe en revue les ressources j3p (dans la base) pour vérifier que les graphes sont valides
 */
'use strict'

const log = require('an-log')('sesatheque-cli')
const flow = require('an-flow')
const { hasProp, stringify } = require('sesajstools')
const { application: { baseUrl } } = require('../config')

function getNbSectionNodes (graphe) {
  return graphe.filter(node => node.length === 3 && node[1] !== 'fin').length
}

/**
 * Fonction getNormalizedGraphe de j3p (methodesmodele au 14/05/2020) dont on a juste modifié les lignes de log
 * Retourne un graphe normalisé (id en string, nn et snn aussi, fin en minuscule, nœuds fin ajoutés avec nn et snn toujours des id, jamais fin)
 * Retournera null en cas de pb. Attention, graphe peut être modifié également.
 * @param {Ressource} ressource
 * @return {Graphe} Le graphe (avec 1er elt vide) normalisé
 */
function getNormalizedGraphe (ressource) {
  if (!ressource || typeof ressource !== 'object') return log.error(Error('pas de ressource'))
  const { type, oid, parametres } = ressource
  const url = `${baseUrl}ressource/modifier/${oid}`
  const grapheOriginal = stringify(parametres && parametres.g)
  const logError = (message) => log.error(`Erreur ${url} : ${message}`, graphe ? grapheOriginal : '')
  if (type !== 'j3p') return logError('pas de type j3p')
  if (!parametres || typeof parametres !== 'object') return logError('pas de graphe')
  const graphe = parametres.g

  // la suite est la fct d'origine où seuls les logs sont modifiés
  try {
    if (!Array.isArray(graphe)) throw Error(`graphe invalide (pas un array : ${typeof graphe}) : ${stringify(parametres)}`)
    if (!graphe.length) throw Error('graphe vide')
    // chaque élément suivant du graphe est un nœud, il doit être un array avec
    // - le numéro du nœud en string en 1er
    // - un nombre variable de branchements, des object (nombre éventuellement nul, mais à priori au moins un nœud fin)
    // - en dernier un objet avec le paramétrage du nœud
    const cleanGraphe = []
    graphe.forEach(function (noeud, index) {
      // on vire les éléments non Array
      if (!Array.isArray(noeud)) {
        throw Error('noeud d’index ' + index + ' invalide (pas un array)')
      }
      // on ajoute le 1er élément vide s'il n'y était pas, ça devrait devenir inutile depuis qu'on a des id et index clairement distincts,
      // mais il reste du code qui utilise l'id comme index de tableau
      if (index === 0) {
        cleanGraphe.push([])
        // si y'avait déjà le nœud vide en 0, on arrête là
        if (!noeud.length) return
      }
      // on accepte un number pour le nodeId (nodeNuméro) => cast en string
      if (typeof noeud[0] === 'number') noeud[0] = String(noeud[0])
      // le 2e doit être le nom de la section ou fin ou Fin
      // on nettoie d'abord les nœuds fin, car on peut trouver du [null] pour les options
      const isFin = typeof noeud[1] === 'string' && noeud[1].toLowerCase() === 'fin'
      if (isFin) {
        // on fixe en minuscule si c'est pas le cas
        if (noeud[1] !== 'fin') noeud[1] = 'fin'
        // et on vire le reste qui sert à rien
        while (noeud.length > 2) noeud.pop()
      }
      if (
        noeud[0] &&
        typeof noeud[0] === 'string' &&
        noeud[1] &&
        typeof noeud[1] === 'string' &&
        // si y'a un 3e elt ça doit être un tableau d'objet
        (
          isFin ||
          (Array.isArray(noeud[2]) && noeud[2].every(function (elt) { return elt && typeof elt === 'object' }))
        )
      ) {
        // le cast des nn & snn en strings se fait avec l'ajout des nœuds fin, juste après
        cleanGraphe.push(noeud)
      } else {
        logError('noeud d’index ' + index + ' invalide')
      }
    })

    // on regarde si tous les branchements pointent qq part, et on ajoute les nœuds fin éventuels (tous les nn & snn seront bien des ids)
    const ids = []
    let nextNum = 1
    let id
    const sectionsNodes = cleanGraphe.filter(function (noeud, index) {
      if (index === 0) return false
      ids.push(noeud[0])
      if (noeud[0] >= nextNum) nextNum = Number(noeud[0]) + 1
      return noeud[1] !== 'fin'
    })
    sectionsNodes.forEach(function (node) {
      const numNode = node[0]
      // le dernier est éventuellement le paramétrage, mais pas forcément (il peut ne pas y avoir de paramétrage)
      const nbParams = Array.isArray(node[2]) && node[2].length
      if (nbParams) {
        node[2].forEach(function (br, i) {
          if (br.pe === '>=0') {
            logError('branchement avec la condition pe >= 0 qui est à éviter (si pe n’est pas numérique ça plante, et sinon ça revient au même que sans condition)')
            delete br.pe
            br.score = 'sans+condition'
          }
          if (typeof br.nn === 'number') br.nn = String(br.nn)
          if (typeof br.nn === 'string') {
            if (br.nn.toLowerCase() === 'fin') {
              // on ajoute un nœud fin
              id = String(nextNum)
              nextNum++
              br.nn = id
              cleanGraphe.push([id, 'fin'])
              ids.push(id)
            } else if (ids.indexOf(br.nn) === -1) {
              logError('Le branchement d’index ' + i + ' du nœud n° ' + numNode + ' pointe vers ' + br.nn + ' qui n’existe pas')
            } else {
              // on vérifie aussi que la condition existe
              if (!hasProp(br, 'pe') && !hasProp(br, 'score')) logError('Le branchement d’index ' + i + ' du nœud n° ' + numNode + ' n’a pas de condition (ni pe ni score)')
            }
          } else if (i !== nbParams - 1) { // le dernier elt peut être le paramétrage
            logError('Le branchement d’index ' + i + ' du nœud n° ' + numNode + ' est invalide : ' + stringify(br))
          }
          // idem pour snn
          if (typeof br.snn === 'number') br.snn = String(br.snn)
          if (typeof br.snn === 'string') {
            if (br.snn.toLowerCase() === 'fin') {
              // on ajoute un nœud fin
              id = String(nextNum)
              nextNum++
              br.snn = id
              cleanGraphe.push([id, 'fin'])
              ids.push(id)
            } else if (ids.indexOf(br.snn) === -1) {
              logError('Le branchement sinon d’index ' + i + ' du nœud n° ' + numNode + ' pointe vers ' + br.snn + ' qui n’existe pas')
            }
          }
        })
      } else {
        // on plante pas mais on le signale
        logError('nœud n° ' + node[0] + ' sans branchement')
      }
    })
    if (getNbSectionNodes(cleanGraphe) < 1) throw Error('graphe sans section')
    return cleanGraphe
  } catch (error) {
    logError(error.message)
    return null
  }
} // getNormalizedGraphe

function checkGraphes (oid, done) {
  function grab (next) {
    flow().seq(function () {
      log(`traitement des ressources j3p de ${offset} à ${offset + limit} (sur ${nbRess})`)
      EntityRessource.match('type').equals('j3p').sort('dateCreation').grab({limit, offset}, this)
    }).seqEach(function (ress) {
      checkOne(ress, this)
    }).seq(function (results) {
      if (results.length === limit) {
        offset += limit
        process.nextTick(() => grab(next))
      } else {
        next()
      }
    }).catch(next)
  } // grab

  function checkOne (ress, next) {
    const { oid, type, parametres } = ress
    if (type !== 'j3p') {
      log.error(`${oid} n’est pas une ressource j3p`)
      return next()
    }

    if (parametres && parametres.xml) {
      // faut passer par $ressourceRepository pour qu'il convertisse (et sauvegarde la modif en tâche de fond, il ne le faisait pas avant le 13/05/2020)
      log(`Ressource ${oid} avec du xml, on lance la conversion`)
      $ressourceRepository.save(ress, (error, ress) => {
        if (error) log.error(`Pb avec la ressource ${oid}`, error)
        else if (ress) getNormalizedGraphe(ress)
        else log.error(Error(`On a récupéré une ressource via EntityRessource ${oid} que $ressourceRepository ne remonte pas`))
        // faut laisser le temps à mongo d'écrire ça avant de passer à la suite, on attends arbitrairement 500ms
        setTimeout(next, 500)
      })
    } else {
      getNormalizedGraphe(ress)
      next()
    }
  }

  // check préalable & init
  if (typeof oid === 'function') {
    done = oid
    oid = undefined
  }
  if (typeof done !== 'function') throw new Error('Erreur interne, pas de callback de commande')
  let offset = 0
  const limit = 50
  let nbRess = 0
  const EntityRessource = lassi.service('EntityRessource')
  const $ressourceRepository = lassi.service('$ressourceRepository')

  // go
  if (oid) {
    log(`Starting checkGraphes ${oid}`)
    flow().seq(function () {
      EntityRessource.match('oid').equals(oid).grabOne(this)
    }).seq(function (ress) {
      if (!ress) {
        log(`La ressource ${oid} n’existe pas`)
        return done()
      }
      checkOne(ress, this)
    }).seq(function () {
      log(`fin du check de ${oid}`)
      done()
    }).catch(done)
  } else {
    flow().seq(function () {
      EntityRessource.match('type').equals('j3p').count(this)
    }).seq(function (nb) {
      nbRess = nb
      log(`Starting checkGraphes avec ${nb} ressources j3p à analyser`)
      grab(this)
    }).seq(function () {
      log(`fin du check de ${nbRess} ressources j3p`)
      done()
    }).catch(done)
  }
}

checkGraphes.help = function checkGraphesHelp () {
  log('La commande checkGraphes prend un oid en argument pour vérifier le graphe de la ressource, sans argument elle lance la vérification des graphes de toutes les ressources de type j3p')
}

module.exports = {
  checkGraphes
}
