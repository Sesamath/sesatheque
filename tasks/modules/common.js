/**
 * Module avec les méthodes communes de nos différents scripts d'import
 */
'use strict'

var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var request = require('request')
var moment = require('moment')
var flow = require('an-flow')

var sjtObj = require('sesajstools/utils/object')
var sjt = require('sesajstools')
var CounterMulti = require('../../app/tools/CounterMulti')

// conf de l'appli
var confSesatheque = require('../../_private/config')
var urlApi = 'http://'
urlApi += (confSesatheque.$server && confSesatheque.$server.hostname) || 'localhost'
urlApi += ':'
urlApi += (confSesatheque.$server && confSesatheque.$server.port) || '3000'
urlApi += '/api'
var urlBibli = urlApi + '/ressource'
var apiTokenEncoded = encodeURIComponent(confSesatheque.apiTokens[0])

// conf ressource
// conf des ressources
var confRessource = require('../../app/ressource/config')
// constantes
var tdCode = confRessource.constantes.typeDocumentaires
var tpCode = confRessource.constantes.typePedagogiques
var catCode = confRessource.constantes.categories

/**
 * La conf par défaut de ce module, modifié par setOptions
 */
var opt = {
  /** timeout en ms */
  timeout: 6000,
  /** Le nb max de requetes vers l'api en attente de réponse */
  maxLaunched: 1,
  /** pour logguer les relations en console */
  logRelations: false,
  /** pour loguer les résultat des appels de l'api */
  logApiCalls: false,
  logProcess: false
}

/**
 * Nos variables globales à ce module
 */
// pour passer à l'étape suivante ou pas
var nbLaunched = 0
/** la liste des ids de ressources en attente */
var waitingRessource = []
/** le timer pour arrêter l'import si on a pas de réponse pendant timeout s */
var timerId
/** la pile de callbacks */
var callbacks = []
/** La callback a appeler quand toutes les ressources ont été postées et que l'on a les réponses (ou timeout) */
var afterAllCb = function () {
  throw new Error('il fallait appeler setAfterAllCb avant de lancer des enregistrements')
}

// les ids traités
var idsToRec = new CounterMulti()
var idsRec = new CounterMulti()
var errors = {length: 0}
var pendingRelations = {}
/** liste idComb:oid */
var oids = {}

// le moment du lancement de ce module
var topDepart = (new Date()).getTime()

/**
 * Notre module, collection de méthodes pour les imports
 * @static
 */
var common = {}

/**
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un exo interactif
 * @param ressource
 */
common.addCatExoInteractif = function (ressource) {
  ressource.categories = [catCode.exerciceInteractif]
  ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
  ressource.typeDocumentaires = [tdCode.interactif]
}

/**
 * Ajoute une personne via l'api
 * @param personne
 * @param next
 */
common.addPersonne = function (personne, next) {
  var options = {
    url: urlBibli.replace('ressource', 'personne') + '/add',
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    body: personne
  }
  request.post(options, function (error, response, body) {
    if (error || body.error || !body.oid) {
      log('error, on avait envoyé', options.body)
      var errorString = 'erreur sur le post ' + options.url + ' : '
      if (error) errorString += error.toString()
      else if (body.error) errorString += body.error
      else errorString += sjt.stringify(body)
      next(new Error(errorString))
    } else if (body.oid) {
      personne.oid = body.oid
      next(null, personne)
    } else {
      next(new Error('ni erreur ni oid en réponse à un post sur ' + options.url))
    }
  })
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @public
 * @param ressource
 * @param next
 */
function addRessource (ressource, next) {
  var idComb = common.getIdComb(ressource)
  idsToRec.inc(idComb)
  nbLaunched++
  var options = {
    url: urlBibli,
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    body: ressource
  }
  request.post(options, function (error, response, body) {
    nbLaunched--
    if (error || body.error || !body.oid) {
      // KO, le msg d'erreur
      var errorString = 'erreur sur le post ' + options.url + ' : '
      if (error) errorString += error.toString()
      else if (body.error) errorString += body.error
      else errorString += sjt.stringify(body)
      addError(idComb, errorString)
      if (opt.logApiCalls) log(idComb + ' KO : ' + errorString)
    } else {
      // OK
      idsToRec.dec(idComb)
      idsRec.inc(idComb)
      // on note la correspondance pour éviter de retourner le chercher juste pour ça
      oids[idComb] = body.oid
      if (opt.logApiCalls) log(idComb + ' ok')
    }
    next()
  })
}
common.addRessource = addRessource

/**
 * Ajoute une erreur pour cet id
 * @param id
 * @param {string} errorString
 */
function addError (id, errorString) {
  if (!_.isString(errorString)) errorString = errorString.toString()
  if (!errorString || errorString === 'undefined') errorString = (new Error("addError sans message d'erreur")).stack
  // on a un message non vide
  if (!id) {
    id = 'general'
    errorString += '\n' + (new Error('id undefined')).stack
  }
  if (errors[id]) errors[id] += '\n' + errorString
  else {
    errors[id] = errorString
    errors.length++
  }
}
common.addError = addError

/**
 * Note dans la var globale pendingRelations une relation à ajouter plus tard
 * @param idComb id combiné origine/idOrigine
 * @param relation [relationCode, idCombLié]
 */
common.addPendingRelation = function (idComb, relation) {
  if (pendingRelations[idComb]) pendingRelations[idComb].push(relation)
  else pendingRelations[idComb] = [relation]
}

/**
 * Lance l'étape suivante (précisée avec setAfterAllCb) si toutes les ressources ont été traitées
 * ou si on reste plus de timeout ms sans être rappelé
 */
common.checkEnd = function (cb) {
  var next = cb || afterAllCb
  function checkAndNext () {
    common.checkEnd(next)
  }

  // le timeout
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, ' + Math.floor(opt.timeout / 1000) +
              's sans rien depuis le dernier retour de bdd, il restait ' + nbLaunched + ' ressources en cours et ' +
              waitingRessource.length + ' en attente de traitement\n' +
              'enregistrées ' + idsRec.length + ', failed ' + errors.length
    addError('general', msg)
    log(msg)
    next()
  }, opt.timeout)

  // on regarde s'il en reste en attente et si c'est terminé
  if (waitingRessource.length) {
    while (nbLaunched < opt.maxLaunched && waitingRessource.length) {
      addRessource(waitingRessource.shift(), checkAndNext) // jshint ignore:line
    }
  } else if (nbLaunched === 0) {
    log('toutes les ressources de cette étape ont été traitées (on en est à ' + idsRec.length + '/' + idsToRec.length +
        ' et ' + waitingRessource.length + ' en attente)')
    clearTimeout(timerId)
    next()
  }
}

/**
 * Vérifie qu'une chaine est une liste d'entiers séparés par des virgules
 * @param {string} ids
 * @throws {Error} Si ce n'est pas le cas
 */
common.checkListOfInt = function (ids) {
  if (_.isString(ids)) {
    if (ids !== String(parseInt(ids, 10))) {
      var a = ids.split(',')
      a.forEach(function (elt) {
        if (elt !== String(parseInt(elt, 10))) throw new Error(`L’élément ${elt} n’est pas un entier`)
      })
    }
  } else {
    throw new Error("La liste d'ids n'est pas une chaine")
  }
}

/**
 * Ajoute une ressource à la file d'attente
 * @param ressource
 */
common.deferRessource = function (ressource) {
  waitingRessource.push(ressource)
}

/**
 * Affiche la compilation des résultats
 * @param next
 */
common.displayResult = function (next) {
  log(idsRec.length + ' ressources enregistrées en ' + idsRec.total() + ' appels')
  log('sur ' + idsToRec.length + ' à enregistrer (reste ' + idsToRec.total() + ' appels à faire)')
  if (errors.length) {
    var logfile = path.resolve(__dirname, '../../logs/import.error.log')
    var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})
    log('erreurs vers ' + logfile)
    log(errors.length + ' ressources avec erreurs :')
    writeStream.write("Erreurs d'importation de " + __filename + ' à ' + moment().format('YYYY-MM-DD HH:mm:ss')) // eslint-disable-line no-path-concat
    var id, msg
    for (id in errors) {
      if (errors.hasOwnProperty(id) && id !== 'length') {
        msg = id + ' : ' + errors[id]
        log(msg)
        writeStream.write(msg)
      }
    }
    writeStream.write("Fin des erreurs d'importation, " + moment().format('YYYY-MM-DD HH:mm:ss'))
  } else log('Aucune erreur rencontrée')
  log('Durée : ' + common.getElapsed(topDepart) / 1000 + 's')
  if (next) next()
  else process.exit()
}

/**
 * Rectifie l'origine labomepBIBS et retire l'offset d'idOrigine pour les ato, coll_doc et accomp
 * @param ressource
 */
common.fixLabomepBIBS = function (ressource) {
  if (ressource.origine === 'labomepBIBS' && ressource.idOrigine > 1000000) {
    if (ressource.idOrigine < 2000000) {
      ressource.origine = 'ato'
      ressource.idOrigine -= 1000000
    } else if (ressource.idOrigine < 3000000) {
      ressource.origine = 'coll_doc'
      ressource.idOrigine -= 2000000
    } else if (ressource.idOrigine < 4000000) {
      ressource.origine = 'accomp'
      ressource.idOrigine -= 3000000
    }
    // au delà de 4M c'est normalement que du j3p ajouté à la main par Alexis, on y touche pas
  }
}

/**
 * Passe en revue les relations qui n'auraient pas été affectées, mais une par une
 * (plusieurs relations peuvent affecter les même ressources, deux updates en // marchent pas)
 * @param next
 */
common.flushPendingRelations = function (next) {
  var pile = []

  if (_.isEmpty(pendingRelations)) {
    log('Rien à faire dans flushPendingRelations')
    next()
  } else {
    log('start flushPendingRelations')

    // on remplit la pile avec nos relations en attente
    _.each(pendingRelations, function (relations, idComb) {
      pile.push([idComb, relations])
    })

    // et on lance sa vidange (on peut tester cette fct avec em/3501 qui a deux relations)
    flow(pile).seqEach(function (task) {
      var thisFlow = this
      var idComb = task[0]
      var relations = task[1]
      // on récupère la ressource avec l'api (pour oid et relations éventuelles)
      if (opt.logRelations) log('on va chercher ' + idComb)
      common.getRessource(idComb, function (ressource) {
        // error loggée dans getRessource, on traite pas ici
        if (ressource) {
          if (opt.logRelations) log(idComb + ' est ' + ressource.oid + ' et va lui ajouter les relations ', relations)
          // accumulateur hors flow
          var newRelations = []
          // faut récupérer les oid de toutes ses relations (dont on a que les idComb dans relations)
          flow(relations).seqEach(function (relation) {
            var nextRelation = this
            if (opt.logRelations) log(idComb + ' et sa relation ' + relation[0] + ' => ' + relation[1])
            // le 1er param change pas, c'est la nature de la relation
            var newRel = relation.slice(0, 1)
            var idCombLie = relation[1]
            if (oids[idCombLie]) {
              newRel[1] = oids[idCombLie]
              if (opt.logRelations) log('on connaissait ' + idCombLie + ' qui est ' + newRel[1])
              newRelations.push(newRel)
              nextRelation()
            } else if (idCombLie) {
              // faut aller chercher l'oid de cette ressource liée
              common.getRessource(idCombLie, function (ressource) {
                if (ressource && ressource.oid) {
                  newRel[1] = ressource.oid
                  if (opt.logRelations) log(idCombLie + ' est ' + newRel[1])
                  newRelations.push(newRel)
                  nextRelation()
                } else {
                  addError(idComb, `une relation pointait vers ${idCombLie} qui n’existe pas`)
                  if (opt.logRelations) log(idComb, `une relation pointait vers ${idCombLie} qui n’existe pas`)
                  nextRelation()
                }
              })
            } else {
              addError(idComb, ' on avait une relation ' + newRel + ' vers rien')
            }
          }).seq(function () {
            if (opt.logRelations) log('on va merger dans ' + ressource.oid, newRelations)
            var mergedRelations = ressource.relations || []
            sjtObj.merge(mergedRelations, newRelations)
            common.mergeRessource({oid: ressource.oid, relations: mergedRelations}, this)
          }).seq(function () {
            // fin de subFlow
            if (opt.logRelations) log('fin relations de ' + idComb)
            thisFlow()
          }).catch(function (error) {
            log('erreur dans le traitement des relations de ' + idComb, error.stack || error)
            addError(idComb, 'erreur de relations : ' + error.toString())
            thisFlow()
          })
          // fin du subFlow
        } else {
          log('on a rien récupéré pour ' + idComb)
          thisFlow()
        }
      }) // getRessource
    }).seq(function () {
      log('fin du traitement des relations en attente')
      next()
    }).catch(function (error) {
      log('erreur dans le traitement de la pile de relations', error)
      next()
    })
    // fin du flow
  }
}

/**
 * Retourne la callback à rappeler quand la pile de ressource à envoyer à l'api sera vide
 */
common.getAfterAllCb = function () {
  return afterAllCb
}

/**
 * Retourne le nb de ms écoulées depuis start
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
common.getElapsed = function (start) {
  return (new Date()).getTime() - start
}

/**
 * Retourne l'id combiné origine/idOrigine
 * @param {Ressource} ressource
 * @returns {string}
 */
common.getIdComb = function (ressource) {
  return ressource.origine + '/' + ressource.idOrigine
}

/**
 * Récupère une liste via l'api
 * @param qsOptions Les paramètres à ajouter en queryString, cf GET /api/by pour le détail
 * @param next appelé avec (error, liste), liste étant un array de ressources
 */
common.getListe = function (qsOptions, next) {
  var options = {
    url: urlApi + '/by',
    qs: qsOptions,
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    content_type: 'charset=UTF-8'
  }
  // log('dans getRessource ' +idComb)
  request.get(options, function (error, response, result) {
    if (error) next(error)
    else if (result.error) next("Sur l'url " + options.url + " on a eu l'erreur " + result.error)
    else if (result.success) next(null, result.liste)
    else {
      log('Réponse inattendue : ', response)
      next(new Error("l'url " + options.url + " n'a pas répondu correctement"))
    }
  })
}

/**
 * Récupère une ref via l'api
 * @param origine
 * @param idOrigine
 * @param next appelé avec {ref, titre, type}
 */
common.getRef = function (origine, idOrigine, next) {
  var idComb = origine + '/' + idOrigine
  var options = {
    url: urlBibli + '/' + idComb + '?format=ref',
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    content_type: 'charset=UTF-8'
  }
  // log('dans getRessource ' +idComb)
  request.get(options, function (error, response, ref) {
    if (error) {
      addError(idComb, 'erreur sur le get ' + options.url + ' : ' + error.toString())
      next(null)
    } else if (ref.error) {
      addError(idComb, 'erreur renvoyé par get ' + options.url + ' : ' + ref.error)
      next(null)
    } else {
      next(ref)
    }
  })
}

/**
 * Récupère une ressource via l'api
 * @param {string|number} origine     L'origine ou un oid
 * @param {string}        [idOrigine] idOrigine ou rien (2 arguments dans ce cas) si on a passé un oid ou une ref en origine
 * @param next appelé avec la ressource (ou rien en cas de pb, que l'on log ici)
 */
common.getRessource = function (origine, idOrigine, next) {
  var idComb
  if (next) {
    idComb = origine + '/' + idOrigine
  } else {
    next = idOrigine
    idComb = origine
  }
  var options = {
    url: urlBibli + '/' + idComb,
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    content_type: 'charset=UTF-8'
  }
  // log('dans getRessource ' +idComb)
  request.get(options, function (error, response, ressource) {
    // log("on récupère l'erreur', error)
    // log('et la ressource", ressource)
    if (error) {
      addError(idComb, 'erreur sur le get ' + options.url + ' : ' + error.toString())
      next(null)
    } else if (ressource.error) {
      addError(idComb, 'erreur retournée par get ' + options.url + ' : ' + ressource.error)
      next(null)
    } else if (ressource.oid) {
      next(ressource)
    } else {
      next(new Error('La ressource récupérée avec ' + idComb + " n'a pas d'oid " + sjt.stringify(ressource)))
    }
  })
}

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 * @param objToDump
 */
function log (msg, objToDump) {
  var prefix = '[' + moment().format('HH:mm:ss.SSS') + '] '
  console.log(prefix + msg)
  if (objToDump) {
    if (objToDump.stack) console.error(objToDump.stack)
    else console.log(objToDump)
  }
}
common.log = log

/**
 * Ajoute des propriétés à une ressource de la bibli via l'api
 * @param ressourcePartielle
 * @param next
 */
common.mergeRessource = function (ressourcePartielle, next) {
  nbLaunched++
  var options = {
    url: urlBibli + '?merge=1',
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    body: ressourcePartielle
  }

  request.post(options, function (error, response, body) {
    nbLaunched--
    if (body && body.oid) {
      idsRec.inc(body.oid)
      if (opt.logApiCalls) log('màj ' + body.oid + ' ok')
    } else {
      var errStr = error ? error.toString() : (body.error ? body.error : 'Erreur inconnue')
      var idErr = ressourcePartielle.oid || 0
      addError(idErr, 'erreur sur le post ' + options.url + ' : ' + errStr)
      log('pb au retour du merge ' + errStr, ressourcePartielle)
    }
    next()
  })
}

/**
 * Lance l'ajout d'une ressource via l'api si on est pas au max et la met en attente sinon
 * @param ressource
 */
common.pushRessource = function (ressource) {
  var idComb = common.getIdComb(ressource)
  if (opt.logProcess) log('push ' + idComb)
  if (nbLaunched < opt.maxLaunched) addRessource(ressource, common.checkEnd)
  else waitingRessource.push(ressource)
}

/**
 * Fixe la callback à rappeler quand la pile de ressource à envoyer à l'api sera vide
 * @param cb
 */
common.setAfterAllCb = function (cb) {
  callbacks.push(afterAllCb)
  // log('on ajoute à la pile de cb', afterAllCb)
  afterAllCb = cb
}

/**
 * Remet la callback précédente
 */
common.setPreviousAfterAllCb = function () {
  if (callbacks.length) {
    afterAllCb = callbacks.pop()
    log('récupère de la pile de cb', afterAllCb)
  } else {
    throw new Error('Plus de callbacks dans la pile, il doit manquer un appel de setAfterAllCb')
  }
}

/**
 * Affecte les options (propriétés à choisir parmi timeout, maxLaunched, logApiCalls, log)
 * @param options
 */
common.setOptions = function (options) {
  sjtObj.update(opt, options)
}

// en cas d'interruption on veut le résultat quand même
process.on('SIGTERM', common.displayResult)
process.on('SIGINT', common.displayResult)

module.exports = common
