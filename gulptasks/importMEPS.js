/**
 * Ce script passe en revue les tables MEPS et AIDES de mepcol et envoie tout ça à l'api (en http)
 *
 * Ça lui permettra d'être déplacé sur un autre serveur et de tourner de manière autonome
 * sans l'appli bibliothèque ni lassi
 */
'use strict';

/** pour logguer les relations */
var logRelations = false
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = false

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
var dbConfigMepCol = require(__dirname + '/../_private/dbconfig/mepcol.js');
// les connexions aux bases
var kmepcol = knex(dbConfigMepCol);

// le décalage d'id pour les aides
var decalageAm = 6000;

// les ids traités
var nbRessToParse = 0
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
var nbWaiting = 0
var nextStep
var timerId

/**
 * Lance l'étape suivante si toutes les ressources ont été traitées ou si on reste plus d'1s sans être rappelé
 */
function checkEnd() {
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(function () {
    var msg = 'timeout, 1s sans rien depuis le dernier retour de bdd, il restait ' +nbWaiting +' ressources\n' +
        'trouvées ' +nbRessToParse +'parsed ' +idsParsed.length +', failed ' +idsFailed.length
    errors['0'] += msg +'\n'
    log(msg)
    nextStep()
  }, 1000)

  nbWaiting--
  if (nbWaiting === 0) {
    log('toutes les ressources de cette étape ont été traitées')
    clearTimeout(timerId)
    nextStep()
  }
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
 * @param id
 * @param relation [relationCode, idLié]
 */
function addPendingRelation(id, relation) {
  if (logRelations) log('on ajoute pour plus tard la relation ' +id +' >' +relation[0] +'> ' +relation[1])
  if (!pendingRelations[id]) pendingRelations[id] = [relation];
  else pendingRelations[id].push(relation);
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
  // aide
  if (row.mep_aide_id) {
    parametres.aide_id         = row.mep_aide_id;
    relations.push([relCode.requiert, row.mep_aide_id]);
    addPendingRelation(row.mep_aide_id + decalageAm, [relCode.estRequisPar, id]);
  }
  // traduction
  if (row.mep_id_fr !== id) {
    parametres.id_fr = row.mep_id_fr;
    relations.push([relCode.estTraductionDe, row.mep_id_fr]);
    addPendingRelation(row.mep_id_fr, [relCode.estTraduitAvec, id]);
  }

  // on regarde si on a des relations à ajouter
  if (pendingRelations[id]) {
    if (logRelations) log('pour ' +id +' on a trouvé les relations ', pendingRelations[id])
    relations = relations.concat(pendingRelations[id]);
    delete pendingRelations[id];
  }

  // @todo regarder mep_swf_utilisateur_id pour récupérer les auteurs
  // et ajouter les mep_txt_utilisateur_id dans les contributeurs

  return {
    id               : id,
    origine          : 'mep',
    idOrigine        : id,
    typeTechnique    : 'mep',
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
  var relations = [];
  var id = row.aide_id + decalageAm;
  // on regarde si on a des relations à ajouter
  if (pendingRelations[id]) {
    if (logRelations) log('pour ' +id +' on a trouvé les relations ', pendingRelations[id])
    relations = relations.concat(pendingRelations[id]);
    delete pendingRelations[id];
  }
  return {
    id              : id,
    origine          : 'am',
    idOrigine        : row.aide_id,
    typeTechnique    : 'am',
    titre            : row.aide_titre || 'aide mathenpoche',
    categories       : [7],
    typePedagogiques : [3],
    typeDocumentaires: [9],
    relations        : relations,
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
  nbWaiting = 1 // au cas où un timer tournerait toujours
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
          nbWaiting = ressources.length
          nbRessToParse += ressources.length
          ressources.forEach(function(row) {
            ressourceCourante = initRessourceMep(row);
            idsParsed.push(ressourceCourante.id);
            if (logProcess) log('processing mep ' + ressourceCourante.id)
            addRessource(ressourceCourante, checkEnd);
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
  nbWaiting = 1 // au cas où un timer tournerait toujours
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
        nbWaiting = rows[0].length
        nbRessToParse += rows[0].length
        rows[0].forEach(function(row) {
            ressourceCourante = initRessourceAm(row)
            idsParsed.push(ressourceCourante.id);
            log('processing aide ' + ressourceCourante.id)
            addRessource(ressourceCourante, checkEnd);
        })
      })
      .catch(function(e) {
        log(e.stack)
      })

  log('Select importAIDES lancé')
}

/**
 * Passe en revue les relations qui n'auraient pas été affectées
 * @param next
 */
function flushPendingRelations(next) {
  nbWaiting = 0
  nextStep = next

  if (_.isEmpty(pendingRelations)) {
    log('Rien à faire dans flushPendingRelations')
    next()
  } else {
    log('start flushPendingRelations', pendingRelations)
    _.each(pendingRelations, function (relations, id) {
      nbWaiting++
      // on récupère la ressource avec l'api
      var options = {
        url         : 'http://localhost:3000/api/ressource/' + id,
        json        : true,
        content_type: 'charset=UTF-8'
      }
      request.get(options, function (error, response, ressource) {
        if (ressource.error) {
          errors['0'] += "Erreur sur la récupération de " + id + ' : ' + ressource.error
          checkEnd()
        } else if (ressource.id != id) {
          errors['0'] += "Erreur sur la récupération de " + id + " (ressource incohérente)"
          checkEnd()
        } else {
          if (!_.isArray(ressource.relations) || _.isEmpty(ressource.relations)) ressource.relations = relations
          else ressource.relations = ressource.relations.concat(relations)
          addRessource(ressource, checkEnd)
        }
      })
    })
  }
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param ressource
 * @param next
 */
function addRessource(ressource, next) {
  var options = {
    url : 'http://localhost:3000/api/ressource',
    json: true,
    //body: JSON.stringify({ressource:ressource}),
    content_type: 'charset=UTF-8',
    form: ressource
  }
  request.post(options, function (error, response, body) {
    if (error) {
      idsFailed.push(ressource.id)
      errors[ressource.id] = error.toString()
      log(error)
    } else {
      if (body.error) {
        idsFailed.push(ressource.id)
        errors[ressource.id] = body.error
        log('erreur sur ' +ressource.id +' : ' +body.error)
      } else {
        if (body.id == ressource.id) {
          idsOk.push(ressource.id)
          log(ressource.id +' ok')
        } else {
          idsFailed.push(ressource.id)
          errors[ressource.id] = JSON.stringify(body)
          log('PB, ' +ressource.id +' renvoie ' +JSON.stringify(body))
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
  if (idsFailed.length) {
    var fs = require('fs')
    var logfile = __dirname + '/../logs/' +__filename +'.error.log'
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
  next()
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
