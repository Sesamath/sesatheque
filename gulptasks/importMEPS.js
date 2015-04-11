/**
 * Ce script passe en revue les tables MEPS et AIDES de mepcol et envoie tout ça à l'api (en http)
 *
 * Ça lui permettra d'être déplacé sur un autre serveur et de tourner de manière autonome
 * sans l'appli bibliothèque ni lassi
 */
'use strict'

/** pour logguer les relations (sera mis à true si on demande des ids particuliers) */
var logRelations = false
var logApiCalls = false

var knex = require('knex')
//var _ = require('lodash')
//var moment = require('moment')
var flow = require('seq')

var tools = require('../construct/tools')
var common = require('./modules/common')
var log = common.log // jshint ignore:line

// conf de l'appli
var confSesatheque = require('../_private/config')
var urlBibli = 'http://'
urlBibli += confSesatheque.$server && confSesatheque.$server.hostname || 'localhost'
urlBibli += ':'
urlBibli += confSesatheque.$server && confSesatheque.$server.port || '3000'
urlBibli += '/api/ressource'

// constantes
var confRessource = require('../construct/ressource/config')
var tdCode = confRessource.constantes.typeDocumentaires
var tpCode = confRessource.constantes.typePedagogiques
var catCode = confRessource.constantes.categories
var relCode = confRessource.constantes.relations

// databases
var confMeps = require('../_private/config/mepcol')
// les connexions aux bases
var kmepcol = knex(confMeps)

/**
 * Renvoie le codeTechnique d'un resultSet Mep
 * @param mepRow
 * @returns {string}
 */
function getMepModele(mepRow) {
  if (mepRow.mep_modele === '1') {
    return 'mep1'
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'college') {
    return 'mep2col'
  } else if (mepRow.mep_modele === '2' && mepRow.mep_modele2 === 'lycee') {
    return 'mep2lyc'
  } else {
    common.addError(mepRow.mep_id, "mep_modele incohérent " + mepRow.mep_modele + ' ' + mepRow.mep_modele2)
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
  }
  if (corres[mep_langue_id]) {
    return corres[mep_langue_id]
  } else {
    console.error(mep_langue_id + " n'est pas un code connu")
    return 'fra'
  }
}


/**
 * Convertit un recordset MEPS en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function initRessourceMep(row) {
  var relations = []
  var parametres = {}
  // raccourci
  var id = row.mep_id
  // parametres
  parametres.nbq_defaut    = row.mep_nbq_defaut // obligatoire
  parametres.mep_modele    = getMepModele(row)
  parametres.mep_langue_id = row.mep_langue_id || 'fr' // le swf veut le code langue à 2 lettres
  parametres.swf_id        = row.mep_swf_id
  if (row.mep_projet !== 'mep')         parametres.projet          = row.mep_projet
  if (row.mep_old)                      parametres.old             = row.mep_old
  if (row.mep_suite_formateur !== 'o')  parametres.suite_formateur = row.mep_suite_formateur
  if (row.mep_aide_formateur !== 'o')   parametres.aide_formateur  = row.mep_aide_formateur
  if (row.mep_nb_wnk)                   parametres.nb_wnk          = row.mep_nb_wnk

  // parametres + relations
  var idComb = 'em/' +id
  // aide
  if (row.mep_aide_id) {
    parametres.aide_id         = row.mep_aide_id
    common.addPendingRelation(idComb, [relCode.requiert, 'am/' +row.mep_aide_id])
    common.addPendingRelation('am/' +row.mep_aide_id, [relCode.estRequisPar, idComb])
  }
  // traduction
  if (row.mep_id_fr !== id) {
    parametres.id_fr = row.mep_id_fr
    common.addPendingRelation(idComb, [relCode.estTraductionDe, 'em/' +row.mep_id_fr])
    common.addPendingRelation('em/' +row.mep_id_fr, [relCode.estTraduitAvec, idComb])
  }

  // @todo regarder mep_swf_utilisateur_id pour récupérer les auteurs
  // et ajouter les mep_txt_utilisateur_id dans les contributeurs

  return {
    origine          : 'em',
    idOrigine        : id.toString(),
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
    publie           : (row.mep_statut_public === 'en_public'),
    restriction      : 0,
    dateCreation     : tools.toDate(row.dateCreation),
    dateMiseAJour    : tools.toDate(row.dateMiseAJour)
  }
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
    categories       : [catCode.activiteAnimee],
    typePedagogiques : confRessource.categoriesToTypes[catCode.activiteAnimee].typePedagogiques,
    typeDocumentaires: confRessource.categoriesToTypes[catCode.activiteAnimee].typeDocumentaires,
    relations        : [],
    parametres       : {},
    // auteurs
    // contributeurs
    langue           : 'fra',
    publie           : true,
    restriction      : 0,
    dateCreation     : tools.toDate(row.dateCreation),
    dateMiseAJour    : tools.toDate(row.dateMiseAJour)
  }
}

/**
 * Importe la table MEPS dans les ressource
 * @param {string}   ids  ids mep à traiter, séparés par des virgules sans espace (passer 'all' pour les faire tous)
 * @param {Function} next Callback à appeler quand toutes les ressources auront été envoyées à pushRessource
 */
function importMEPS(ids, next) {
  var ressourceCourante, where = ''
  log('Starting importMEPS')

  // la liste des ids à traiter
  if (common.checkListOfInt(ids)) where = ' WHERE mep_id IN (' + ids + ')'

  kmepcol
      .raw("SELECT *" +
        ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
            " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateCreation" +
        ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
          " WHERE dev_file_identifiant = m.mep_swf_id AND dev_file_type LIKE 'ex%') dateMiseAJour" +
        " FROM MEPS m" +where)
      .then(function (rows) {
          var ressources = rows[0]
          ressources.forEach(function(row) {
            ressourceCourante = initRessourceMep(row)
            common.pushRessource(ressourceCourante)
          })
          next()
      })
      .catch(function(e) {
        log(e.stack)
        next()
      })
  log('Select importMEPS lancé')
}

/**
 * Importe la table AIDES dans ressource
 * @param ids
 * @param next
 */
function importAIDES(ids, next) {
  var ressourceCourante,
      where = ''
  log('Starting importAIDES')

  // la liste des ids à traiter
  if (ids) {
    common.checkListOfInt(ids)
    where = ' WHERE aide_id IN (' + ids + ')'
  }
  var query = "SELECT *" +
              ", (SELECT MIN( dev_file_date ) FROM DEV_FILES" +
                " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') AS dateCreation" +
              ", (SELECT MAX( dev_file_date ) FROM DEV_FILES" +
              " WHERE dev_file_identifiant = a.aide_id AND dev_file_type LIKE 'aide%') AS dateMiseAJour" +
              " FROM AIDES a " +where

  kmepcol
      .raw(query)
      .then(function (rows) {
        var ressources = rows[0]
        log(query +"\nremonte " +ressources.length +' résultats')
        ressources.forEach(function(row) {
          ressourceCourante = initRessourceAm(row)
          common.pushRessource(ressourceCourante)
        })
        next()
      })
      .catch(function(e) {
        log(e.stack)
        next()
      })

  log('Select importAIDES lancé\n' +query)
}

/**
 * Passe en revue les relations qui n'auraient pas été affectées, mais une par une
 * (plusieurs relations peuvent affecter les même ressources, deux updates en // marchent pas)
 */


module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, importMEPS
  var argv = process.argv.slice(3)
  // tout par défaut
  var mepIds, aideIds, i

  log('task ' + __filename)

  // sauf si on précise l'un ou l'autre (on impose le log dans ce cas
  i = argv.indexOf('--mep')
  if (i > -1) {
    mepIds = argv[i + 1]
    aideIds = null
    log('On ne traitera que les id mep ' + mepIds)
    logRelations = true
    logApiCalls = true
  }

  i = argv.indexOf('--aide')
  if (i > -1) {
    aideIds = argv[i + 1]
    if (!mepIds) mepIds = null
    log('On ne traitera que les id aide ' +aideIds)
    logRelations = true
    logApiCalls = true
  }

  common.setOptions({
    logRelations : logRelations,
    logApiCalls : logApiCalls
  })

  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', common.displayResult)
  process.on('SIGINT', common.displayResult)

  flow().seq(function () {
    if (mepIds === null) this()
    else importMEPS(mepIds, this)

  }).seq(function () {
    if (aideIds === null) this()
    else importAIDES(aideIds, this)

  }).seq(function () {
    // knex.destroy() // impossible de fermer la connexion de ce #@§ knex
    common.flushPendingRelations(this)

  }).seq(function () {
    common.displayResult(this)

  }).seq(function () {
    log('END')
    process.exit() // gulp sort pas tout seul s'il reste qq callback dans le vent

  }).catch(function (error) {
    console.error('Erreur dans le flow : \n' + error.stack)
    common.displayResult()
  })
}
