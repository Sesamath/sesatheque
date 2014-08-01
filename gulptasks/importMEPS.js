/**
 * Ce script passe en revue les tables MEPS et AIDES de mepcol et envoie tout ça à l'api (en http)
 *
 * Ça lui permettra d'être déplacé sur un autre serveur et de tourner de manière autonome
 * sans l'appli bibliothèque ni lassi
 */
'use strict';

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
function log(msg) {
  var prefix = '[' +moment().format('HH:mm:ss.SSS') +'] '
  console.log(prefix + msg)
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

// debug
var dumpLog = __dirname + '/../logs/'

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
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'college') {
    return 'mep2lyc';
  } else {
    throw new Error("mep_modele incohérent " + mepRow.mep_modele + ' ' + mepRow.mep_modele2);
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
          if (results[0] && results[0]['dev_file_date']) {
            ts = results[0]['dev_file_date'];
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
  log('getDate avec ' +ts)
  if (ts > 10001001001001) ts = Math.round(ts / 1000) // c'était des ms, on passe en s
  // 7260 en cas de décalage horaire (fuseau mal réglé)
  if (ts > 1072911600 && ts < (new Date()).getTime() / 1000 + 7260) {
    return new Date(ts * 1000);
  } else {
    return null;
  }
}

function getJour(ts) {
  // log('getJour avec ' +ts)
  // si c'est des s, on passe en ms
  // 11001001001 est arbitraire, correspond à 1970 en ms et 2318 en s)
  if (ts < 11001001001) ts = ts * 1000

  return ts ? moment.utc(new Date(ts)).format(config.formats.jour) : null
}

/**
 * Note dans la var globale pendingRelations une relation à ajouter plus tard
 * @param id
 * @param relation [relationCode, idLié]
 */
function addPendingRelation(id, relation) {
  log('on ajoute la relation ' +id +' >' +relation[0] +'> ' +relation[1])
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
    log('pour ' +id +' on a trouvé les relations ', pendingRelations[id])
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
    titre            : row.mep_titre,
    resume           : row.mep_descriptif,
    description      : '',
    commentaires     : row.mep_commentaire,
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
    log('pour ' +id +' on a trouvé les relations ', pendingRelations[id])
    relations = relations.concat(pendingRelations[id]);
    delete pendingRelations[id];
  }
  return {
    id              : id,
    origine          : 'am',
    idOrigine        : row.aide_id,
    typeTechnique    : 'am',
    titre            : row.aide_titre,
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
 * Importe la table MEPS dans ressource
 */
function importMEPS(next) {
  var ressourceCourante
  log('Starting importMEPS')
  nbWaiting = 1 // au cas où un timer tournerait toujours
  nextStep = next

  kmepcol
      .raw("SELECT *" +
        ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
            " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateCreation" +
        ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateMiseAJour" +
        " FROM MEPS m") //WHERE mep_id < 100
      .then(function (rows) {
          var ressources = rows[0]
          nbWaiting = ressources.length
          nbRessToParse += ressources.length
          ressources.forEach(function(row) {
            ressourceCourante = initRessourceMep(row);
            idsParsed.push(ressourceCourante.id);
            log('processing mep ' + ressourceCourante.id)
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
function importAIDES(next) {
  var ressourceCourante
  log('Starting importAIDES')
  nbWaiting = 1 // au cas où un timer tournerait toujours
  nextStep = next

  kmepcol
      .raw("SELECT *" +
          ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') dateCreation" +
          ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') dateMiseAJour" +
          " FROM AIDES a ") // WHERE aide_id < 100
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
  var nbRelations = pendingRelations.length

  function checkEnd() {
    nbRelations--
    if (nbRelations === 0) next()
  }

  if (!nbRelations) {
    log('rien à faire dans flushPendingRelations')
    next()
    return
  }

  log('start flushPendingRelations ' +nbRelations)

  _.each(pendingRelations, function(pendingRelations, id) {
    // on récupère la ressource avec l'api
    var options = {
      url : 'http://localhost:3000/api/ressource/' +id,
      json: true,
      content_type: 'charset=UTF-8',
    }
    request.get(options, function(error, response, ressource) {
        if (!_.isArray(ressource.relations) || _.isEmpty(ressource.relations)) ressource.relations = pendingRelations
        else ressource.relations = ressource.relations.concat(pendingRelations)
        addRessource(ressource, checkEnd)
    })
  })
}

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

function displayResult(next) {
  // attendues 4109 + 1613
  log(nbRessToParse +' ressources trouvées en bdd')
  log(idsParsed.length +' ressources traitées')
  log(idsOk.length +' ressources enregistrées')
  if (idsFailed.length) {
    log(idsFailed.length +' ressources avec erreurs :')
    idsFailed.forEach(function (id) {
      log(id +' : ' +errors[id])
    })
  } else log('Aucune erreur rencontrée')
  next()
}

module.exports = function () {
    log('task ' + __filename);
    flow()
        .seq(function () {
          importMEPS(this)
        })
        .seq(function () {
          importAIDES(this)
        })
        .seq(function () {
          flushPendingRelations(this)
        })
        .seq(function () {
          displayResult(this)
        })
        .seq(function (){
          log('END');
        })
        .catch(function (error) {
          console.error('Erreur dans le flow : \n' + error.stack);
        })
}
