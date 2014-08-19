/**
 * Ce script passe en revue les ressources persos de type calculatrice cassée
 * (calkc, type 7 de la table PERSOS, rien dans BIBS)
 * On peut aussi les repérer avec le <cassees> que contient le xml de conf
 */
'use strict';

var origine // sera labomepPersos ou labomepBibs suivant le cas
/** timeout en ms */
var timeout = 3000
var maxLaunched = 100

/** pour logguer les relations */
var logRelations = false
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = false
/** pour loguer les ressources dont le retour est ok */
var logOk = false

var knex = require('knex');
var _ = require('underscore')._;
var request = require('request');
var moment = require('moment')
var flow          = require('seq');

// conf de l'appli
var config = require('../construct/ressource/config.js');

// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;
var relCode = config.constantes.relations;

// databases
var dbConfigLabomep = require(__dirname + '/../_private/dbconfig/labomep');
// les connexions aux bases
var klabomep = knex(dbConfigLabomep);

// les ids traités
var nbRessToParse = 0
var nbToRec = 0
var nbRec = 0
var idsParsed = [];
var idsOk = []
var idsFailed = [];
var errors = {}
var pendingRelations = {};

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 */
function log(msg, objToDump) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
  if (objToDump) console.log(objToDump)
}

// pour passer à l'étape suivante
var nbLaunched = 0
var waitingRessource = []
var nextStep
var timerId

/**
 * Lance l'étape suivante si toutes les ressources ont été traitées ou si on reste plus de timeout ms sans être rappelé
 */
function checkEnd() {
  // le timeout
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, ' +Math.floor(timeout / 1000) +
        's sans rien depuis le dernier retour de bdd, il restait ' +nbLaunched +' ressources en cours et ' +
        waitingRessource.length+' en attente de traitement\n' +
        'trouvées ' +nbRessToParse +', parsed ' +idsParsed.length +', failed ' +idsFailed.length
    errors['0'] += msg +'\n'
    log(msg)
    nextStep()
  }, timeout)

  // on regarde s'il en reste en attente et si c'est terminé
  if (waitingRessource.length) {
    while (nbLaunched < maxLaunched && waitingRessource.length) {
      addRessource(waitingRessource.shift(), checkEnd)
    }
  } else if (nbLaunched === 0) {
    log('toutes les ressources de cette étape ont été traitées (on en est à ' +nbRec +'/' +nbToRec)
    clearTimeout(timerId)
    nextStep()
  }
}

/**
 * Lance l'ajout d'une ressource via l'api si on est pas au max et la met en attente sinon
 * @param ressource
 */
function defer(ressource) {
  if (nbLaunched < maxLaunched) addRessource(ressource, checkEnd)
  else waitingRessource.push(ressource)
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
 * @param idOrigine
 * @param relation [relationCode, idLié]
 */
function addPendingRelation(idOrigine, relation) {
  if (logRelations) log('on ajoute pour plus tard la relation ' +idOrigine +' >' +relation[0] +'> ' +relation[1])
  if (!pendingRelations[idOrigine]) pendingRelations[idOrigine] = [relation];
  else pendingRelations[idOrigine].push(relation);
}

/**
 * Convertit un recordset en objet Ressource que l'on pourra poster à l'api après enrichissement suivant les cas
 * @param row
 * @returns {Ressource}
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
    restriction      : 2
  }
  if (row.user_sslsesa_id) ressource.auteurs =  [row.user_sslsesa_id]

  return ressource
}

function addCatExoInteractif(ressource) {
    ressource.categories       = [catCode.exerciceInteractif]
    ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
    ressource.typeDocumentaires= [tdCode.interactif]
}

/**
 * Convertit un recordset Perso en objet Ressource que l'on pourra poster à l'api
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
      if (!ressource.titre) ressource.titre = "figure TracenPoche"
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
      if (!ressource.titre) ressource.titre = "exercice avec la calculatrice cassée"
      addCatExoInteractif(ressource)
      break
    case 9: // exercice GeoGebra (java)
      ressource.typeTechnique = 'ggb'
      if (!ressource.titre) ressource.titre = "figure GeoGebra"
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
      if (!ressource.titre) ressource.titre = "animation instrumenpoche"
      ressource.categories       = [catCode.activiteAnimee]
      ressource.typePedagogiques = [tpCode.exercice, tpCode.cours]
      ressource.typeDocumentaires= [tdCode.interactif]
      break
    case 18: // outil Labomep et ses composants
      ressource.typeTechnique = 'gen'
      if (!ressource.titre) ressource.titre = "titre manquant"
      addCatExoInteractif(ressource)
      break
    case 19:
      ressource.typeTechnique = 'j3p'
      if (!ressource.titre) ressource.titre = "Parcours interactif"
      addCatExoInteractif(ressource)
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
    var idComb = origine + '-' + ressource.idOrigine
    idsParsed.push(idComb);
    if (logProcess) log('processing ' + idComb)
    defer(ressource);
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
        url         : 'http://localhost:3000/api/ressource/' +origine +'/' + idOrigine,
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
      nbToRec++
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
  var options = {
    url : 'http://localhost:3000/api/ressource',
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: ressource
  }
  request.post(options, function (error, response, body) {
    nbLaunched--
    if (error) {
      idsFailed.push(ressource.idOrigine)
      errors[ressource.idOrigine] = error.toString()
      log(error)
    } else {
      if (body.error) {
        idsFailed.push(ressource.idOrigine)
        errors[ressource.idOrigine] = body.error
        log('erreur sur ' +ressource.idOrigine +' : ' +body.error)
      } else {
        if (body.id) { // on ne récupère que ça
          idsOk.push(ressource.idOrigine)
          nbRec++
          if (logOk) log(ressource.idOrigine +' ok avec ' +ressource.idOrigine)
        } else {
          idsFailed.push(ressource.idOrigine)
          errors[ressource.idOrigine] = JSON.stringify(body)
          log('PB, ' +ressource.idOrigine +' renvoie ' +JSON.stringify(body))
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
  log(nbRessToParse +' ressources trouvées en bdd')
  log(idsParsed.length +' ressources traitées')
  log(idsOk.length +' ressources enregistrées')
  log('à enregistrer : ' +nbToRec)
  log('enregistrées : ' +nbRec)
  if (idsFailed.length) {
    var fs = require('fs')
    var logfile = __dirname + '/../logs/' +__filename +'.error.log'
    var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})
    log('erreurs vers '+logfile)
    log(idsFailed.length +' ressources avec erreurs :')
    writeStream.write("Erreurs d'importation de " +moment().format('YYYY-MM-DD HH:mm:ss'))
    idsFailed.forEach(function (idOrigine) {
      log(idOrigine +' : ' +errors[idOrigine])
      writeStream.write(idOrigine +' : ' +errors[idOrigine])
    })
    writeStream.write("Fin des erreurs d'importation, " +moment().format('YYYY-MM-DD HH:mm:ss'))
    writeStream.end();
  } else log('Aucune erreur rencontrée')
  next()
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, importMEPS
  var argv = process.argv.slice(3)
  var ids
  var query

  log('task ' + __filename);

  // sauf si on précise l'un ou l'autre (on impose le log dans ce cas
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
  ids = argv.slice(1)[0]
  if (ids) {
    checkListOfInt(ids)
    logProcess = true
    logRelations = true
    log('On ne traitera que les id ' + ids)
    if (origine === 'labomepPERSOS') query += " WHERE perso_id IN(" +ids +")"
    else query += " WHERE bib_id IN(" +ids +")"
  }

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
        console.error('Erreur dans le flow : \n' + error.stack);
      })
}
