/**
 * Module avec les méthodes communes de nos différents scripts d'import
 */
'use strict';

var _ = require('lodash');
var request = require('request');
var moment = require('moment')
var flow = require('seq');

var tools = require('../../construct/tools')

// conf de l'appli
var confSesatheque = require('../../_private/config')
var urlBibli = 'http://'
urlBibli += confSesatheque.$server && confSesatheque.$server.hostname || 'localhost'
urlBibli += ':'
urlBibli += confSesatheque.$server && confSesatheque.$server.port || '3000'
urlBibli += '/api/ressource'
var apiToken = confSesatheque.apiTokens[0]

// conf des logs
var logOk = false

/** timeout en ms */
var timeout = 3000
/** Le nb max de requetes vers l'api en attente de réponse */
var maxLaunched = 5

// pour passer à l'étape suivante ou pas
var nbLaunched = 0
var waitingRessource = []
var timerId
var afterAllCb = function () {
  throw new Error("il fallait appeler setAfterAllCb avant de lancer des enregistrements")
}

// les ids traités
var nbRessToParse = 0
var nbToRec = 0
var nbRec = 0
var idsParsed = [];
var idsOk = []
var idsFailed = [];
var errors = {}
var pendingRelations = {};
/** liste idComb:oid */
var oids = {}

// notre module
var common = {}

/**
 * Les fonctions privées
 */

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next) {
  nbLaunched++
  var options = {
    url    : urlBibli,
    headers: {
      "X-ApiToken": apiToken
    },
    json   : true,
    body   : ressource
  }
  var idMix = ressource.origine + '/' + ressource.idOrigine
  request.post(options, function (error, response, body) {
    nbLaunched--
    if (error || body.error) {
      var errorString = error ? error.toString() : body.error
      idsFailed.push(idMix)
      errors[idMix] = errorString
      log('erreur api sur ' + idMix + ' : ' + errorString)
    } else if (body.oid) {
      // on note la correspondance pour éviter de retourner le chercher
      oids[idMix] = body.oid
      // et le fait que c'est bon
      idsOk.push(body.oid)
      nbRec++
      if (logOk) log(idMix + ' ok')
    } else {
      idsFailed.push(idMix)
      errors[idMix] = JSON.stringify(body)
      log('PB, ' + idMix + " renvoie à l'enregistrement " + JSON.stringify(body))
    }
    next()
  })
}

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
common.checkEnd = function () {
  // le timeout
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, ' + Math.floor(timeout / 1000) +
              's sans rien depuis le dernier retour de bdd, il restait ' + nbLaunched + ' ressources en cours et ' +
              waitingRessource.length + ' en attente de traitement\n' +
              'trouvées ' + nbRessToParse + ', parsed ' + idsParsed.length + ', failed ' + idsFailed.length
    errors['0'] += msg + '\n'
    log(msg)
    afterAllCb()
  }, timeout)

  // on regarde s'il en reste en attente et si c'est terminé
  if (waitingRessource.length) {
    while (nbLaunched < maxLaunched && waitingRessource.length) {
      addRessource(waitingRessource.shift(), common.checkEnd)
    }
  } else if (nbLaunched === 0) {
    log('toutes les ressources de cette étape ont été traitées (on en est à ' + nbRec + '/' + nbToRec + ')')
    clearTimeout(timerId)
    afterAllCb()
  }
}

/**
 * Vérifie qu'une chaine est une liste d'entiers séparés par des virgules
 * @param {string} ids
 * @throws {Error} Si ce n'est pas le cas
 */
common.checkListOfInt = function (ids) {
  if (_.isString(ids)) {
    if (ids != parseInt(ids, 10)) {
      var a = ids.split(',')
      a.forEach(function (elt) {
        if (elt != parseInt(elt, 10)) throw new Error("L'élément " + elt + " n'est pas un entier")
      })
    }
  } else {
    throw new Error("La liste d'ids n'est pas une chaine")
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
      nbToRec++
      pile.push([idComb, relations])
    })

    // et on lance sa vidange (on peut tester cette fct avec em/3501 qui a deux relations)
    flow(pile).seqEach(function (task) {
      var thisFlow = this
      var idComb = task[0]
      var relations = task[1]
      // on récupère la ressource avec l'api (pour oid et relations éventuelles)
      log('on va chercher ' + idComb)
      common.getRessource(idComb, function (ressource) {
        // error loggée dans getRessource, on traite pas ici
        var subFlow = require('seq')
        if (ressource) {
          // on gère notre accumulateur, car parMap ou seqMap ne passent pas l'ensemble des résultats au seq suivant
          // (qui doit lire this.stack pour tout récupérer), et ça rend l'ensemble plus lisible
          var newRelations = []
          log(idComb + ' est ' + ressource.oid + ' et va lui ajouter les relations ', relations)

          // faut récupérer les oid de toutes ses relations (dont on a que les idComb dans relations)
          subFlow(relations).seqMap(function (relation) {
            var thisSubFlow = this
            //log('dans subFlow on a le 1er elt de la pile', thisSubFlow.stack[0])
            //log('dans subFlow on a le 1er elt de la pile parente', thisFlow.stack[0])
            log(idComb + ' et sa relation ' + relation[0] + ' => ' + relation[1])
            // avec parMap la stack sera composée de tous les retours passé à this()
            // le 1er param change pas, c'est la nature de la relation
            var newRel = relation.slice(0, 1)
            var idCombLie = relation[1]
            if (oids[idCombLie]) {
              newRel[1] = oids[idCombLie]
              log('on connaissait ' + idCombLie + ' qui est ' + newRel[1])
              newRelations.push(newRel)
              thisSubFlow()
            } else if (idCombLie) {
              // faut aller chercher l'oid de cette ressource liée
              common.getRessource(idCombLie, function (ressource) {
                if (ressource && ressource.oid) {
                  newRel[1] = ressource.oid
                  log(idCombLie + ' est ' + newRel[1])
                  newRelations.push(newRel)
                  thisSubFlow()
                } else {
                  errors[idCombLie] = 'une relation pointait vers ' + idCombLie + " qui n'existe pas"
                  log('une relation pointait vers ' + idCombLie + " qui n'existe pas")
                  thisSubFlow()
                }
              })
            } else {
              errors[idComb] += (errors[idComb] ? '\n' : '') + " on avait une relation " + newRel + " vers rien"
            }
          }).seq(function () {
            log('on va merger dans ' + ressource.oid, newRelations)
            var mergedRelations = ressource.relations || []
            tools.merge(mergedRelations, newRelations)
            common.mergeRessource({oid: ressource.oid, relations: mergedRelations}, this)
          }).seq(function () {
            // fin de subFlow
            log('fin relations de ' + idComb)
            thisFlow()
          }).catch(function (error) {
            log('error dans le traitement des relations de ' + idComb, error.stack || error)
            errors[idComb] = error
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
 * Retourne le nb de ms écoulées depuis start
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
common.getElapsed = function (start) {
  return (new Date()).getTime() -start
}

/**
 * Récupère une ressource via l'api
 * @param origine
 * @param idOrigine
 * @param next appelé avec la ressource (ou rien en cas de pb, que l'on log ici)
 */
common.getRessource = function (origine, idOrigine, next) {
  var idComb
  if (next) {
    idComb = origine + '/' + idOrigine
  } else {
    next = idOrigine
    idComb = origine
    if (_.isString(idComb)) {
      var pos = idComb.indexOf('/')
      origine = idComb.substr(0, pos)
      idOrigine = idComb.substr(pos + 1)
    } else {
      // on nous passe un oid
      origine = null
      idOrigine = null
    }
  }
  var options = {
    url         : urlBibli + '/' + idComb,
    headers     : {
      "X-ApiToken": apiToken
    },
    json        : true,
    content_type: 'charset=UTF-8'
  }
  //log('dans getRessource ' +idComb)
  request.get(options, function (error, response, ressource) {
    //log("on récupère l'erreur", error)
    //log("et la ressource", ressource)
    if (error) {
      errors[idComb] = error.toString()
      next(null)
    } else if (ressource.error) {
      errors[idComb] = ressource.error
      next(null)
    } else if (ressource.origine !== origine || ressource.idOrigine !== idOrigine) {
      errors[idComb] = "ressource " + idComb + " incohérente : " +
                       JSON.stringify(origine) + '/' + JSON.stringify(idOrigine) +
                       '\n' + JSON.stringify(ressource)
      next(null)
    } else {
      next(ressource)
    }
  })
}


/**
 * Récupère une ref via l'api
 * @param origine
 * @param idOrigine
 * @param next appelé avec {ref, titre, typeTechnique}
 */
common.getRef = function (origine, idOrigine, next) {
  var options = {
    url         : urlBibli + '/getRef/' +origine +'/' +idOrigine,
    headers     : {
      "X-ApiToken": apiToken
    },
    json        : true,
    content_type: 'charset=UTF-8'
  }
  //log('dans getRessource ' +idComb)
  request.get(options, function (error, response, ressource) {
    //log("on récupère l'erreur", error)
    //log("et la ressource", ressource)
    if (error) {
      errors[idComb] = error.toString()
      next(null)
    } else if (ressource.error) {
      errors[idComb] = ressource.error
      next(null)
    } else if (ressource.origine !== origine || ressource.idOrigine !== idOrigine) {
      errors[idComb] = "ressource " + idComb + " incohérente : " +
                       JSON.stringify(origine) + '/' + JSON.stringify(idOrigine) +
                       '\n' + JSON.stringify(ressource)
      next(null)
    } else {
      next(ressource)
    }
  })
}

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 * @param objToDump
 */
function log(msg, objToDump) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
  if (objToDump) console.log(objToDump)
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
    url    : urlBibli + '?merge=1',
    headers: {
      "X-ApiToken": apiToken
    },
    json   : true,
    body   : ressourcePartielle
  }

  request.post(options, function (error, response, body) {
    nbLaunched--
    if (body && body.oid) {
      idsOk.push(body.oid)
      if (logOk) log('màj ' + body.oid + ' ok')
    } else {
      var errStr = error ? error.toString() : (body.error ? body.error : 'Erreur inconnue')
      var idErr = ressourcePartielle.oid || 0
      idsFailed.push(idErr)
      errors[idErr] = (errors[idErr] ? errors[idErr] + '\n' : '') + errStr
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
  if (nbLaunched < maxLaunched) addRessource(ressource, common.checkEnd)
  else waitingRessource.push(ressource)
}

/**
 * Fixe la callback à rappeler quand la pile de ressource à envoyer à l'api sera vide
 * @param cb
 */
common.setAfterAllCb = function (cb) {
  afterAllCb = cb
}

/**
 * Affecte les options (propriétés à choisir parmi timeout, maxLaunched, logOk)
 * @param options
 */
common.setOptions = function (options) {
  if (options.timeout) {
    if (options.timeout > 50 && timeout < 60000) timeout = options.timeout
    else log("Erreur : le timeout doit être donné en ms")
  }
  if (options.maxLaunched) maxLaunched = options.maxLaunched
  if (options.hasOwnProperty('logOk')) logOk = !!options.logOk
}

module.exports = common
