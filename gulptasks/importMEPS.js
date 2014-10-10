/**
 * Ce script passe en revue les tables MEPS et AIDES de mepcol et envoie tout ça à l'api (en http)
 *
 * Ça lui permettra d'être déplacé sur un autre serveur et de tourner de manière autonome
 * sans l'appli bibliothèque ni lassi
 */
'use strict';

/** le timestamp en ms du lancement de ce script */
var topDepart = (new Date()).getTime()
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
var serverConf = require('../_private/config');
var config = require('../construct/ressource/config.js');
var port = serverConf.server && serverConf.server.port || 3000;

// constantes
var tdCode = config.constantes.typeDocumentaires;
var tpCode = config.constantes.typePedagogiques;
var catCode = config.constantes.categories;
var relCode = config.constantes.relations;

// databases
var dbConfigMepCol = require(__dirname + '/../_private/config/mepcol.js');
// les connexions aux bases
var kmepcol = knex(dbConfigMepCol);

// les ids traités
var nbRessToParse = 0
var nbToRec = 0
var nbRec = 0
var idsParsed = [];
var idsOk = []
var idsFailed = [];
var errors = {}
var pendingRelations = {};
/** liste idComb:id */
var ids = {}

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
 * Renvoie le codeTechnique d'un resultSet Mep
 * @param mepRow
 * @returns {string}
 */
function getMepModele(mepRow) {
  if (mepRow.mep_modele === '1') {
    return 'mep1';
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'college') {
    return 'mep2col';
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'lycee') {
    return 'mep2lyc';
  } else {
    var msg = "mep_modele incohérent " + mepRow.mep_modele + ' ' + mepRow.mep_modele2
    if (!errors[mepRow.mep_id]) errors[mepRow.mep_id] = msg
    else errors[mepRow.mep_id] += msg
  }
}

/**
 * Renvoie le code langue à 3 char d'après le code à 2 char
 * @param mep_langue_id
 * @returns {*}
 */
function getLangue(mep_langue_id) {
  var corres = {
    'ar': 'ara',
    'br': 'bre',
    'ca': 'cat',
    'de': 'deu',
    'en': 'eng',
    'es': 'spa',
    'eu': 'eus',
    'fr': 'fra',
    'it': 'ita',
    'pt': 'por'
  };
  if (corres[mep_langue_id]) {
    return corres[mep_langue_id];
  } else {
    console.error(mep_langue_id + " n'est pas un code connu");
    return 'fra';
  }
}

/**
 * OBSOLETE
 * Récupère la date de création
 * @param row
 * @returns {Date}
 */
function getDateCreation(row) {
  // 1072911600 => 2004-01-01
  if (row.mep_swf_date > 1072911600 && row.mep_swf_date < (new Date()).getTime() / 1000) {
    return new Date(row.mep_swf_date * 1000);
  } else {
    // faut aller chercher ça dans DEV_FILES
    kmepcol()
        .select('dev_file_date')
        .from('DEV_FILES')
        .where({dev_file_id: row.mep_swf_id, dev_file_type: 'exswf'})
        .limit(1)
        .orderBy('dev_file_date', 'desc')
        .then(function (results) {
          var ts;
          if (results[0] && results[0].dev_file_date) {
            ts = results[0].dev_file_date
            if (ts > 1072911600 && ts < (new Date()).getTime() / 1000) {
              return new Date(ts * 1000);
            } else {
              console.error("On a trouvé " + ts + " dans DEV_FILES.dev_file_date pour swf_id " + row.mep_swf_id);
              return null;
            }
          } else {
            console.error("La requete " + this.toSQL() + " a échouée");
            return null;
          }
        });
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
 * @param idComb id combiné origine-idOrigine
 * @param relation [relationCode, idCombLié]
 */
function addPendingRelation(idComb, relation) {
  if (logRelations) log('on ajoute pour plus tard la relation ' +idComb +' >' +relation[0] +'> ' +relation[1])
  if (!pendingRelations[idComb]) pendingRelations[idComb] = [relation];
  else pendingRelations[idComb].push(relation);
}

/**
 * Convertit un recordset MEPS en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function initRessourceMep(row) {
  var relations = [];
  var parametres = {};
  // raccourci
  var id = row.mep_id;
  // parametres
  parametres.nbq_defaut = row.mep_nbq_defaut; // obligatoire
  parametres.mep_modele = getMepModele(row)
  parametres.mep_langue_id = row.mep_langue_id || 'fr' // le swf veut le code langue à 2 lettres
  if (row.mep_swf_id !== id)            parametres.swf_id          = row.mep_swf_id;
  if (row.mep_projet !== 'mep')         parametres.projet          = row.mep_projet;
  if (row.mep_old)                      parametres.old             = row.mep_old;
  if (row.mep_suite_formateur !== 'o')  parametres.suite_formateur = row.mep_suite_formateur;
  if (row.mep_aide_formateur !== 'o')   parametres.aide_formateur  = row.mep_aide_formateur;
  if (row.mep_nb_wnk)                   parametres.nb_wnk          = row.mep_nb_wnk;

  // parametres + relations
  var idComb = 'em-' +id
  // aide
  if (row.mep_aide_id) {
    parametres.aide_id         = row.mep_aide_id;
    addPendingRelation(idComb, [relCode.requiert, 'am-' +row.mep_aide_id]);
    addPendingRelation('am-' +row.mep_aide_id, [relCode.estRequisPar, idComb]);
  }
  // traduction
  if (row.mep_id_fr !== id) {
    parametres.id_fr = row.mep_id_fr;
    addPendingRelation(idComb, [relCode.estTraductionDe, 'em-' +row.mep_id_fr]);
    addPendingRelation('em-' +row.mep_id_fr, [relCode.estTraduitAvec, idComb]);
  }

  // @todo regarder mep_swf_utilisateur_id pour récupérer les auteurs
  // et ajouter les mep_txt_utilisateur_id dans les contributeurs

  return {
    origine          : 'em',
    idOrigine        : id,
    typeTechnique    : 'em',
    titre            : row.mep_titre || 'Exercice mathenpoche',
    resume           : row.mep_descriptif || '',
    description      : '',
    commentaires     : row.mep_commentaire || '',
    niveaux          : [],
    categories       : [catCode.exerciceInteractif],
    typePedagogiques : [tpCode.exercice, tpCode.autoEvaluation],
    typeDocumentaires: [tdCode.interactif],
    relations        : relations,
    parametres       : parametres,
    // auteurs
    // contributeurs
    langue           : getLangue(row.mep_langue_id),
    publie           : (row.mep_statut_public === 'en_public' ? true : false),
    restriction      : 0,
    dateCreation     : getJour(row.dateCreation),
    dateMiseAJour    : getJour(row.dateMiseAJour)
  };
}

/**
 * Convertit un recordset AIDES en objet Ressource
 * @param row
 * @returns {Ressource}
 */
function initRessourceAm(row) {
  return {
    origine          : 'am',
    idOrigine        : row.aide_id,
    typeTechnique    : 'am',
    titre            : row.aide_titre || 'Aide mathenpoche',
    categories       : [7],
    typePedagogiques : [3],
    typeDocumentaires: [9],
    relations        : [],
    parametres       : {},
    // auteurs
    // contributeurs
    langue           : 'fra',
    publie           : true,
    restriction      : 0,
    dateCreation     : getJour(row.dateCreation),
    dateMiseAJour    : getJour(row.dateMiseAJour)
  };
}

/**
 * Importe la table MEPS dans les ressource
 *
 * @param {Function} next fct à appeler quand tous les mep auront été importés
 * @param {String}   ids  ids mep à traiter, séparés par des virgules sans espace (passer 'all' pour les faire tous)
 */
function importMEPS(next, ids) {
  var ressourceCourante, where
  log('Starting importMEPS')
  nbLaunched = 0
  nextStep = next

  // la liste des ids à traiter
  if (ids === 'all') where = ''
  else if (ids) where = ' WHERE mep_id IN (' + ids + ')'
  else {
    log("Pas d'import mep à faire")
    next()
    return
  }

  kmepcol
      .raw("SELECT *" +
        ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
            " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateCreation" +
        ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateMiseAJour" +
        " FROM MEPS m" +where)
      .then(function (rows) {
        /*
        var fs = require('fs'), tmpFile, writeStream
        for (var i = 0; i < rows.length; i++) {
          tmpFile = __dirname + '/../logs/tmp' +i +'.dump';
          writeStream = fs.createWriteStream(tmpFile);
          writeStream.write(JSON.stringify(rows[i]))
          writeStream.end();
        } /* */

          var ressources = rows[0]
          nbRessToParse += ressources.length
          nbToRec += ressources.length
          ressources.forEach(function(row) {
            ressourceCourante = initRessourceMep(row);
            idsParsed.push(ressourceCourante.id);
            if (logProcess) log('processing mep ' + ressourceCourante.id)
            defer(ressourceCourante)
          })
      })
      .catch(function(e) {
        log(e.stack)
      })
  log('Select importMEPS lancé')
}

/**
 * Importe la table AIDES dans ressource
 */
function importAIDES(next, ids) {
  var ressourceCourante,
      where = ''
  log('Starting importAIDES')
  nbLaunched = 0
  nextStep = next

  // la liste des ids à traiter
  if (ids === 'all') where = ''
  else if (ids) where = ' WHERE aide_id IN (' +ids +')'
  else {
    log("Pas d'import aide à faire")
    next()
    return
  }

  kmepcol
      .raw("SELECT *" +
          ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') dateCreation" +
          ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') dateMiseAJour" +
          " FROM AIDES a " +where)
      .then(function (rows) {
        nbToRec += rows[0].length
        nbRessToParse += rows[0].length
        rows[0].forEach(function(row) {
            ressourceCourante = initRessourceAm(row)
            idsParsed.push(ressourceCourante.id);
            if (logProcess) log('processing aide ' + ressourceCourante.id)
            addRessource(ressourceCourante, checkEnd);
        })
      })
      .catch(function(e) {
        log(e.stack)
      })

  log('Select importAIDES lancé')
}

/**
 * Passe en revue les relations qui n'auraient pas été affectées, mais une par une
 * (plusieurs relations peuvent affecter les même ressources, deux updates en // marchent pas)
 * @param next
 */
function flushPendingRelations(next) {
  var pile = []

  function depile() {
    if (pile.length) {
      var task = pile.shift()
      var idComb = task[0]
      var relations = task[1]
      var pos =  idComb.indexOf('-')
      var origine = idComb.substr(0, pos)
      var idOrigine = parseInt(idComb.substr(pos+1), 10)
      // on récupère la ressource avec l'api
      getRessource(origine, idOrigine, function (ressource) {
        // error loggée dans get, on traite pas ici
        if (ressource) {
          // faut récupérer les id de toutes ses relations (dont on a que les idComb dans relations)
          flow(relations)
            .parMap(function(relation) {
              // avec parMap la stack sera composée de tous les retours passé à this()
              var newRel = [relation[0]] // le 1er param change pas, c'est la nature de la relation
              var idComb = relation[1]
              var nextSeq = this
              if (ids[idComb]) {
                newRel[1] = ids[idComb]
                nextSeq(newRel)
              } else {
                // faut aller chercher l'id de cette ressource liée
                pos =  idComb.indexOf('-')
                origine = idComb.substr(0, pos)
                idOrigine = parseInt(idComb.substr(pos+1), 10)
                getRessource(origine, idOrigine, function (ressource) {
                  if (ressource && ressource.id) {
                    newRel[1] = ressource.id
                    nextSeq(newRel)
                  } else {
                    errors[idComb] = 'une relation pointait vers ' +origine +'-' +idOrigine +" qui n'existe pas"
                    nextSeq()
                  }
                })
              }
            })
            .seq(function(newRelations) {
                mergeRessource({id:ressource.id, relations:newRelations}, this)
            })
            .seq(depile)
            .catch(depile)
        } else {
          // pb mais on continue
          depile()
        }
      })

    } else {
      // la pile est vide, on peut passer à l'étape suivante
      next()
    }
  } // depile

  if (_.isEmpty(pendingRelations)) {
    log('Rien à faire dans flushPendingRelations')
    next()
  } else {
    log('start flushPendingRelations')

    // on remplit la pile avec nos relations en attente
    _.each(pendingRelations, function (relations, id) {
      nbToRec++
      pile.push([id, relations])
    })

    // et on lance sa vidange
    depile()
  }
}

/**
 * Récupère une ressource via l'api
 * @param origine
 * @param idOrigine
 * @param next appelé avec la ressource (ou rien en cas de pb, que l'on log ici)
 */
function getRessource(origine, idOrigine, next) {
  var idComb = origine +'-' +idOrigine
  var options = {
    url         : 'http://localhost:' +port +'/api/ressource/' + origine +'/' +idOrigine,
    json        : true,
    content_type: 'charset=UTF-8'
  }
  request.get(options, function (error, response, ressource) {
    if (error) {
      errors[idComb] = error.toString()
      next(null)
    } else if (ressource.error) {
      errors[idComb] = ressource.error
      next(null)
    } else if (ressource.origine !== origine || ressource.idOrigine !== idOrigine) {
      errors[idComb] = "ressource " +idComb +" incohérente : " +JSON.stringify(ressource)
      next(null)
    } else next(null, ressource)
  })
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next) {
  nbLaunched++
  var options = {
    url : 'http://localhost:' +port +'/api/ressource',
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: ressource
  }
  var idMix = ressource.id ? ressource.id : ressource.origine +'-' +ressource.idOrigine
  request.post(options, function (error, response, body) {
    nbLaunched--
    if (error || body.error) {
      var errorString = error ? error.toString() : body.error
      idsFailed.push(idMix)
      errors[idMix] = errorString
      log('erreur api sur ' +idMix +' : ' +errorString, options)
    } else if (body.id) {
      idsOk.push(body.id)
      // on note la correspondance pour éviter de retourner le chercher
      if (!ressource.id) ids[idMix] = body.id
      nbRec++
      if (logOk) log(idMix +' ok')
    } else {
      idsFailed.push(idMix)
      errors[idMix] = JSON.stringify(body)
      log('PB, ' +idMix +" renvoie à l'enregistrement " +JSON.stringify(body))
    }
    next()
  })
}

/**
 * Ajoute des propriétés à une ressource de la bibli via l'api
 * @param ressourcePartielle
 * @param next
 */
function mergeRessource(ressourcePartielle, next) {
  nbLaunched++
  var options = {
    url : 'http://localhost:' +port +'/api/ressource/merge',
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: ressourcePartielle
  }
  request.post(options, function (error, response, body) {
    nbLaunched--
    if (body && body.id) {
      idsOk.push(body.id)
      if (logOk) log('màj ' +body.id +' ok')
    } else {
      var errStr = error ? error.toString() : (body.error ? body.error : 'Erreur inconnue')
      var idErr = ressourcePartielle.id || ressourcePartielle.origine +'-' +ressourcePartielle.idOrigine || 0
      idsFailed.push(idErr)
      errors[idErr] = (errors[idErr] ? errors[idErr] +'\n' : '') +errStr
      log(errStr)
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
    var logfile = __dirname + '/../logs/import.error.log'
    var writeStream = fs.createWriteStream(logfile, {'flags': 'a'})
    log('erreurs vers '+logfile)
    log(idsFailed.length +' ressources avec erreurs :')
    writeStream.write("Erreurs d'importation de " +moment().format('YYYY-MM-DD HH:mm:ss'))
    idsFailed.forEach(function (id) {
      log(id +' : ' +errors[id])
      writeStream.write(id +' : ' +errors[id])
    })
    writeStream.write("Fin des erreurs d'importation, " +moment().format('YYYY-MM-DD HH:mm:ss'))
    writeStream.end();
  } else log('Aucune erreur rencontrée')
  log('Durée : ' +getElapsed(topDepart)/1000 +'s')
  if (next) next()
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, importMEPS
  var argv = process.argv.slice(3)
  // tout par défaut
  var mepIds = 'all',
      aideIds = 'all'

  log('task ' + __filename);

  // sauf si on précise l'un ou l'autre (on impose le log dans ce cas
  if (argv[0] === '--mep') {
    mepIds = argv.slice(1)[0]
    checkListOfInt(mepIds)
    aideIds = undefined
    log('On ne traitera que les id mep ' +mepIds)
    logProcess = true
    logRelations = true
  } else if (argv[0] === '--aide') {
    aideIds = argv.slice(1)[0]
    checkListOfInt(aideIds)
    mepIds = undefined
    log('On ne traitera que les id aide ' +aideIds)
    logProcess = true
    logRelations = true
  }

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', displayResult);
  process.on('SIGINT', displayResult);

  flow()
      .seq(function () {
        importMEPS(this, mepIds)
      })
      .seq(function () {
        importAIDES(this, aideIds)
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
