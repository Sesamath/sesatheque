/**
 * Ce script passe en revue les ressources de Labomep,
 * soit la table PERSOS (origine = labomepPERSOS, avec --persos),
 * soit BIBS (origine = labomepBIBS, avec --bibs)
 * l'origine est donc commune à toutes les ressources traitées par le script
 */
'use strict';

/** le timestamp en ms du lancement de ce script */
var topDepart = (new Date()).getTime()
/** origine commune à toutes les ressources traitées ici, labomepPERSOS|labomepBIBS */
var origine
/** timeout en ms */
var timeout = 10000
/** Nb max de requetes http lancées vers l'api (qq get non pris en compte) */
var maxLaunched = 10

/** pour logguer les relations */
var logRelations = false
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = false
/** pour loguer les ressources dont le retour est ok */
var logOk = false

var knex = require('knex')
var _ = require('lodash')
var request = require('request')
var moment = require('moment')
var flow   = require('seq')
var xml2js = require('xml2js')

// conf de l'appli
var config = require('../construct/ressource/config.js');
// conf de l'appli
var serverConf = require('../_private/config')
var urlBibli = 'http://'
urlBibli += serverConf.$server && serverConf.$server.hostname || 'localhost'
urlBibli += ':'
urlBibli += serverConf.$server && serverConf.$server.port || '3000'
urlBibli += '/api/ressource'

// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;

// databases
var dbConfigLabomep = require(__dirname + '/../_private/config/labomep');
// les connexions aux bases
var klabomep = knex(dbConfigLabomep);

/**
 * On pourrait se contenter d'incrémeter des nombres, mais on enregistre les listes d'id
 * pour les avoir sous la static pour éventuel debug
 */
/** ids des ressources traitées ici */
var idsParsed = [];
/** ids des ressources sur la pile d'envoi */
var idsToSend = [];
/** ids des ressources envoyées */
var idsSent = [];
/** ids des ressources avec une réponse de l'api */
var idsResp = []
/** ids des ressources enregistrées par l'api */
var idsOk = []
/** ids des ressources dont l'enregistrement a planté */
var idsFailed = [];

/** la liste des erreurs rencontrées (la clé est l'id, 0 pour les erreurs générées ici hors ressource) */
var errors = {}
/** La liste des relations à ajouter ensuite */
var pendingRelations = {};

// Les variables globales de checkEnd, pour chaque étape (pour décider de passer à la suivante)
var nbLaunched = 0
var waitingRessource = []
var nextStep
var timerId

/**
 * Retourne le nb de ms écoulées depuis start
 * @param {number} start Passer le top de départ (ou 0 pour récupérer un top de départ)
 */
function getElapsed(start) {
  return (new Date()).getTime() -start
}

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 */
function log(msg, objToDump) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
  if (objToDump) console.log(objToDump)
}

/**
 * Ajoute une erreur à la liste qui sera affichée à la fin
 * (et affiche la stack en console si c'est une erreur de notre code)
 * @param id
 * @param error
 */
function addError(id, error) {
  if (error instanceof Error) {
    log(error.stack)
    error = error.toString()
  }
  if (errors[id]) errors[id] += '\n'
  else errors[id] = ''
  errors[id] += error
  if (id) idsFailed.push(id)
}

/**
 * Lance l'étape suivante si toutes les ressources ont été traitées ou si on reste plus de timeout ms sans être rappelé
 */
function checkEnd() {
  // le timeout
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, ' +Math.floor(timeout / 1000) +
        "s sans rien depuis le dernier retour de l'api, il restait " +nbLaunched +
        " ressources en attente de réponse de l'api et " +waitingRessource.length +" en attente d'envoi"
    addError(0, msg)
    log(msg)
    nextStep()
  }, timeout)

  // on regarde s'il en reste en attente et si c'est terminé
  if (waitingRessource.length) {
    while (nbLaunched < maxLaunched && waitingRessource.length) {
      addRessource(waitingRessource.shift(), checkEnd)
    }
  } else if (nbLaunched === 0) {
    log('toutes les ressources de cette étape ont été traitées')
    clearTimeout(timerId)
    nextStep()
  }
}

/**
 * Lance l'ajout d'une ressource via l'api si on est pas au max et la met en attente sinon
 * @param ressource
 */
function deferAdd(ressource) {
  if (ressource && ressource.titre) {
    idsToSend.push(ressource.idOrigine);
    if (nbLaunched < maxLaunched) addRessource(ressource, checkEnd)
    else waitingRessource.push(ressource)
  } else {
    idsFailed.push(ressource.idOrigine)
    addError(ressource.idOrigine, "ressource sans titre ou invalide, non postée")
    log(ressource)
  }
}

/**
 * Convertie un timestamp (en s ou ms) en objet Date
 * Retourne null si le timestamp est dans le futur (+2h) ou avant le 01/01/2004
 * @param ts
 * @returns {Date}
 */
function getDate(ts) {
  if (logProcess) log('getDate avec ' +ts)
  if (ts > 10001001001001) ts = Math.round(ts / 1000) // c'était des ms, on passe en s
  // 7260 en cas de décalage horaire (fuseau mal réglé)
  if (ts > 1072911600 && ts < (new Date()).getTime() / 1000 + 7260) {
    return new Date(ts * 1000);
  } else {
    return null;
  }
}

/**
 * Converti un timestamp (ms ou s) en string (JJ/DD/YYYY, suivant la conf)
 * @param ts le timestamp
 * @returns {String}
 */
function getJour(ts) {
  // log('getJour avec ' +ts)
  // si c'est des s, on passe en ms
  // 11001001001 est arbitraire, correspond à 1970 en ms et 2318 en s)
  if (ts < 11001001001) ts = ts * 1000

  return ts ? moment.utc(new Date(ts)).format(config.formats.jour) : null
}

/**
 * Vérifie qu'une chaine est une liste d'entiers séparés par des virgules
 * @param {String} ids
 */
function checkListOfInt (ids) {
  if (_.isString(ids)) {
    if (ids == parseInt(ids, 10)) return
    else {
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
 * Note dans la var globale pendingRelations une relation à ajouter plus tard
 * Attention, les relations contiennent un id combiné,
 * il faudra récupérer l'id réel de la ressource au moment d'ajouter la relation
 * @param idOrigine
 * @param relation [relationCode, idComb]
 */
function addPendingRelation(idOrigine, relation) {
  if (logRelations) log('on ajoute pour plus tard la relation ' +idOrigine +' >' +relation[0] +'> ' +relation[1])
  if (!pendingRelations[idOrigine]) pendingRelations[idOrigine] = [relation];
  else pendingRelations[idOrigine].push(relation);
}

/**
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un exo interactif
 * @param ressource
 */
function addCatExoInteractif(ressource) {
    ressource.categories       = [catCode.exerciceInteractif]
    ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
    ressource.typeDocumentaires= [tdCode.interactif]
}

/**
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un contenu fixe
 * dont on sait pas si c'est un cours ou un exo (on met les 2)
 * @param ressource
 */
function addCoursExoFixe(ressource) {
  // ne sachant pas trop on met cours et exercice
  ressource.categories        = [catCode.coursFixe, catCode.exerciceFixe]
  ressource.typeDocumentaires = [tdCode.imageFixe, tdCode.texte]
  ressource.typePedagogiques  = [tpCode.cours, tpCode.exercice]
}

/**
 * Convertit un recordset en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function parseRessource(row) {
  var ressource = initRessourceGenerique(row)
  var ajout = true
  switch (row.type_id) {
    case 1: // Message ou question, qcm basique
      ressource.typeTechnique = 'qts'
      if (!ressource.titre) ressource.titre = "Message ou question"
      addCatExoInteractif(ressource)
      break
    case 2:
      ressource.typeTechnique = 'tep'
      if (!ressource.titre) ressource.titre = "Figure TracenPoche"
      addCatExoInteractif(ressource)
      break
    case 4: // Test diagnostique (IREM Nancy)
      ressource.typeTechnique = 'testd'
      if (!ressource.titre) ressource.titre = "Test diagnostique"
      addCatExoInteractif(ressource)
      break
    case 6:
      ressource.typeTechnique = 'poseur'
      if (!ressource.titre) ressource.titre = "Opération posée"
      addCatExoInteractif(ressource)
      break
    case 7:
      ressource.typeTechnique = 'calkc'
      if (!ressource.titre) ressource.titre = "Exercice avec la calculatrice cassée"
      addCatExoInteractif(ressource)
      break
    case 9: // exercice GeoGebra (java)
      ressource.typeTechnique = 'ggb'
      if (!ressource.titre) ressource.titre = "Figure GeoGebra"
      addCatExoInteractif(ressource)
      break
    case 10: // page externe (avec consigne ou pas)
      ressource.typeTechnique = 'url'
      // @todo affiner la catégorie suivant consigne et réponse ou pas
      if (!ressource.titre) ressource.titre = "Page externe"
      addCatExoInteractif(ressource)
      break
    case 11:
      ressource.typeTechnique = 'mental'
      if (!ressource.titre) ressource.titre = "Exercice de calcul mental"
      addCatExoInteractif(ressource)
      break
    case 13:
      ressource.typeTechnique = 'ebeps'
      if (!ressource.titre) ressource.titre = "Animation interactive"
      ressource.categories       = [catCode.activiteAnimee]
      ressource.typePedagogiques = [tpCode.exercice, tpCode.cours]
      ressource.typeDocumentaires= [tdCode.interactif]
      break
    case 14:
      ressource.typeTechnique = 'msqcm'
      if (!ressource.titre) ressource.titre = "QCM interactif"
      addCatExoInteractif(ressource)
      break
    case 15:
      ressource.typeTechnique = 'msatdj'
      if (!ressource.titre) ressource.titre = "Exercice corrigé"
      ressource.categories       = [catCode.exerciceInteractif]
      ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation, tpCode.corrigeExercice]
      ressource.typeDocumentaires= [tdCode.interactif]
      break
    case 16: // qcm en js
      ressource.typeTechnique = 'qcmlz'
      if (!ressource.titre) ressource.titre = "QCM"
      addCatExoInteractif(ressource)
      break
    case 17:
      ressource.typeTechnique = 'iep'
      if (!ressource.titre) ressource.titre = "Animation instrumenpoche"
      ressource.categories       = [catCode.activiteAnimee]
      ressource.typePedagogiques = [tpCode.exercice, tpCode.cours]
      ressource.typeDocumentaires= [tdCode.interactif]
      break
    case 18: // outil Labomep et ses composants
      ressource.typeTechnique = 'gen'
      if (!ressource.titre) ressource.titre = "Titre manquant"
      addCatExoInteractif(ressource)
      break
    case 19:
      log("Pas d'import j3p depuis labomep (ils sont dans oldbibli et ont leur procédure d'import")
      ajout = false
      break
    case 20: // test diagnostique Lingot
      ressource.typeTechnique = 'lingotpd'
      if (!ressource.titre) ressource.titre = "Test diagnostique d'algèbre"
      addCatExoInteractif(ressource)
      break
    case 21:
      ressource.typeTechnique = 'ec2'
      if (!ressource.titre) ressource.titre = "Exercice Calcul@TICE"
      addCatExoInteractif(ressource)
      break

    default :
      log("type " +row.type_id +" inconnu")
      ajout = false
  }
  if (ajout) {
    idsParsed.push(ressource.idOrigine);
    if (logProcess) log('processing ' + ressource.idOrigine)
    // on transforme le xml en objet js pour certains
    switch (ressource.typeTechnique) {
      case 'url':
          modifyUrl(ressource, deferAdd)
        break
      /* case '':
          xml2js.parseString(ressource.xml, function(error, result) {
            if (error) addError(ressource.idOrigine)
            else {
              ressource.parametres = result
              deferAdd(ressource)
            }
          })
        break */
      default : deferAdd(ressource)
    }

  }
}

/**
 * Initialise les propriété communes à toutes les ressources à partir du recordset, helper de parseRessource
 * @param {Object} row
 * @returns {Object}
 */
function initRessourceGenerique(row) {
  var ressource = {
    origine          : origine,
    idOrigine        : row.id,
    resume           : row.descriptif || '',
    description      : '',
    commentaires     : row.commentaire || '',
    parametres       : {xml:row.xml},
    langue           : 'fre',
    publie           : true,
    restriction      : (origine == 'labomepBIBS') ? 0 : 3
  }
  if (row.user_sslsesa_id) ressource.auteurs =  [row.user_sslsesa_id]

  return ressource
}

/**
 * Renvoie l'id combiné origine - idOrigine
 * @param ressource
 * @returns {string}
 */
function getIdComb(ressource) {
  return origine + '-' + ressource.idOrigine
}

/**
 * Affine les ressources de type url
 * @param ressource
 * @param next
 */
function modifyUrl(ressource, next) {
  var idComb = ressource.origine +'/' +ressource.idOrigine
  try {
    // il faut échapper d'éventuels & qui ne sont pas sous la forme &amp;
    // on pourrait passer l'option strict:false mais on préfère planter en cas de xml bancal
    var xmlSrc = ressource.parametres.xml.replace(/&/g, '&amp;').replace(/&amp;amp;/g, '&amp;')
    // cf https://github.com/Leonidas-from-XIV/node-xml2js
    var options = {
      explicitArray :false,
      explicitRoot  :false,
      trim          :true,
      ignoreAttrs   :true
    }
    xml2js.parseString(xmlSrc, options, function (error, result) {
      if (error) {
        log(error.stack)
        log("le parsing du xml a planté " +xmlSrc)
        addError(ressource.idOrigine, "le parsing du xml a planté " +ressource.parametres.xml)
      } else {
        // log('le xml', xmlSrc)
        // log('donne', result)
        ressource.parametres = result
        // un raccourci
        var p = ressource.parametres
        if (p.adresse) {
          // on simplifie les ressources sans consigne ni question
          if (!p.consigne &&
             (!p.question_option || p.question_option === 'off') &&
             (!p.answer_option   || p.answer_option   === 'off')) {
            // url toute simple, on nettoie un peu
            ressource.parametres = {adresse: p.adresse}
            // ne sachant pas trop on met rien...
            // (0 pour que l'api accepte l'import, il faudra compléter à la prochaine édition)
            ressource.categories = [0]
            // un cas particulier sur toutes ces diapos qui devraient exister par ailleurs
            if (p.adresse.indexOf("http://mep-outils.sesamath.net/manuel_numerique/diapo.php?atome=") === 0) {
              var test = /diapo.php\?atome=([0-9]+)/.exec(result.adresse)
              // c'est en fait un atome, on le garde comme ressource url originaire de labomep,
              // mais on ajoute les refs à l'atome, ça servira probablement
              ressource.parametres.cloneDe = {
                origine      : 'zoneur',
                idOrigine    : test[1],
                typeTechnique: 'ato'
              }
              // ne sachant pas trop on met cours et exercice
              addCoursExoFixe(ressource)
            }
          } else if (p.consigne) {
            // faut remettre le html
            p.consigne = p.consigne
                .replace(/\&amp;/g, '&')
                .replace(/\&lt;/g, '<')
                .replace(/\&gt;/g, '>')
            console.log(p.consigne)
          }
        } else {
          return addError(ressource.idOrigine, "Url sans adresse")
        }
        next(ressource)
      }
    })
  } catch (error) {
    addError(idComb, "le parsing du xml a planté " +xmlSrc)
  }
}

/**
 * Passe en revue les relations qui n'auraient pas été affectées, mais une par une
 * (plusieurs relations peuvent affecter les même ressources, deux updates en // marchent pas)
 * @param next
 */
function flushPendingRelations(next) {
  var pile = []

  function depile() {
    var task, options, idOrigine, relations
    if (pile.length) {
      task = pile.shift()
      idOrigine = task[0]
      relations = task[1]
      // on récupère la ressource avec l'api
      options = {
        url         : urlBibli +origine +'/' + idOrigine,
        json        : true,
        content_type: 'charset=UTF-8'
      }
      log('relations de '+idOrigine +' ' +JSON.stringify(relations))
      request.get(options, function (error, response, ressource) {
        if (ressource.error) {
          errors['0'] += "Erreur sur la récupération de " + idOrigine + ' : ' + ressource.error
          log('erreur ' +ressource.error)
          depile()
        } else if (ressource.origine != origine || ressource.idOrigine != idOrigine) {
          errors['0'] += "Erreur sur la récupération de " + idOrigine + " (ressource incohérente)"
          log('erreur cohérence')
          depile()
        } else {
          log(idOrigine +' récupérée')
          if (!_.isArray(ressource.relations) || _.isEmpty(ressource.relations)) ressource.relations = relations
          else ressource.relations = ressource.relations.concat(relations)
          addRessource(ressource, depile)
        }
      })

    } else {
      next()
    }
  } // depile

  if (_.isEmpty(pendingRelations)) {
    log('Rien à faire dans flushPendingRelations')
    next()
  } else {
    log('start flushPendingRelations')

    // on remplit la pile
    _.each(pendingRelations, function (relations, idOrigine) {
      pile.push([idOrigine, relations])
    })

    // et on lance sa vidange
    depile()
  }
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next) {
  nbLaunched++
  idsSent.push(ressource.idOrigine)
  var options = {
    url : urlBibli,
    json: true,
    body: ressource
  }
  request.post(options, function (error, response, body) {
    nbLaunched--
    idsResp.push(ressource.idOrigine)
    if (error) addError(ressource.idOrigine, error.toString())
    else {
      if (body.error) {
        addError(ressource.idOrigine, body.error)
      } else {
        if (body.oid) { // on ne récupère que ça, c'est pas le idOrigine posté
          idsOk.push(ressource.idOrigine)
          if (logOk) log(ressource.idOrigine +' ok avec ' +ressource.idOrigine)
        } else {
          addError(ressource.idOrigine, "L'api renvoie " +JSON.stringify(body))
        }
      }
    }
    next()
  })
}

/**
 * Affiche la compilation des résultats
 * @param next
 */
function displayResult(next) {
  // attendues 4109 + 1613
  log(idsParsed.length +' ressources traitées')
  log(idsToSend.length +' ressources à poster')
  log(idsResp.length +" réponses de l'api")
  log(idsOk.length +' ressources enregistrées')
  if (idsFailed.length) {
    var fs = require('fs')
    var logfile = __dirname + '/../logs/importLabomep.error.log'
    var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})
    log('erreurs vers '+logfile)
    log(idsFailed.length +' ressources avec erreurs :' +idsFailed.join(','))
    writeStream.write("Erreurs d'importation de " +moment().format('YYYY-MM-DD HH:mm:ss'))
    idsFailed.forEach(function (idOrigine) {
      log(idOrigine +' : ' +errors[idOrigine])
      writeStream.write(idOrigine +' : ' +errors[idOrigine])
    })
    writeStream.write("Fin des erreurs d'importation, " +moment().format('YYYY-MM-DD HH:mm:ss'))
    writeStream.end();
  } else log('Aucune erreur rencontrée')
  log('Durée : ' +getElapsed(topDepart)/1000 +'s')
  if (next) next()
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, nomDeLaTache
  var argv = process.argv.slice(3)
  var ids
  var query

  log('task ' + __filename);

  // on doit préciser persos ou bibs
  if (argv[0] === '--persos') {
    query = "SELECT perso_id AS id, perso_type_id AS type_id, perso_titre AS titre, perso_descriptif AS descriptif," +
        " perso_commentaire AS commentaire, perso_xml AS xml, su.user_id AS sslsesa_user_id FROM PERSOS" +
        " INNER JOIN sslsesa_user su ON perso_util_id = user_labomep_id"
    origine = 'labomepPERSOS'
  } else if (argv[0] === '--bibs') {
    query = "SELECT bib_id AS id, bib_type_id AS type_id, bib_titre AS titre, bib_descriptif AS descriptif," +
        " bib_commentaire AS commentaire, bib_xml AS xml FROM BIBS"
    origine = 'labomepBIBS'
  } else {
    throw new Error("il faut ajouter l'argument --persos ou --bibs " +
        "(suivi éventuellement d'une liste d'ids séparés par des virgules)")
  }

  // on regarde s'il faut se limiter à certains ids
  ids = argv.slice(1)[0]
  if (ids) {
    checkListOfInt(ids)
    logProcess = true
    logRelations = true
    log('On ne traitera que les id ' + ids)
    if (origine === 'labomepPERSOS') query += " WHERE perso_id IN(" +ids +")"
    else query += " WHERE bib_id IN(" +ids +")"
  }

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', displayResult);
  process.on('SIGINT', displayResult);

  // yapluka
  flow()
      .seq(function () {
        nextStep = this
        klabomep
            .raw(query)
            .exec(function(error, rows) {
              if (error) throw error
              if (rows[0]) rows[0].forEach(parseRessource)
              else log("Pas de ressources avec " +query)
            })
      })
      .seq(function () {
        flushPendingRelations(this)
      })
      .seq(function () {
        displayResult(this)
      })
      .seq(function () {
        log('END')
        process.exit() // gulp sort pas tout seul s'il reste qq callback dans le vent
      })
      .catch(function (error) {
        log('Erreur dans le flow :', error);
      })
}
