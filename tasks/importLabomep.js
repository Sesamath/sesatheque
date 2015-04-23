/**
 * Ce script passe en revue les ressources de Labomep,
 * soit la table PERSOS (origine = labomepPERSOS, avec --persos),
 * soit BIBS (origine = labomepBIBS, avec --bibs)
 * l'origine est donc commune à toutes les ressources traitées par le script
 */
'use strict'


var knex = require('knex')
//var _ = require('lodash')
//var request = require('request')
//var moment = require('moment')
var flow   = require('seq')
var xml2js = require('xml2js')

// nos méthodes mutualisées
var common = require('./modules/common')
// raccourcis
var log = common.log // jshint ignore:line

/** origine commune à toutes les ressources traitées ici, labomepPERSOS|labomepBIBS */
var origine

/** pour logguer les relations */
var logRelations = false
/** pour loguer le processing (un point par ressource sinon) */
var logProcess = false

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
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un exo interactif
 * @param ressource
 */
function addCatExoInteractif(ressource) {
    ressource.categories       = [catCode.exerciceInteractif]
    ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
    ressource.typeDocumentaires= [tdCode.interactif]
}

/**
 * Ajoute à la ressource categorie, typePedagogiques et typeDocumentaires pour un contenu fixe
 * dont on sait pas si c'est un cours ou un exo (on met les 2)
 * @param ressource
 */
function addCoursExoFixe(ressource) {
  // ne sachant pas trop on met cours et exercice
  ressource.categories        = [catCode.coursFixe, catCode.exerciceFixe]
  ressource.typeDocumentaires = [tdCode.imageFixe, tdCode.texte]
  ressource.typePedagogiques  = [tpCode.cours, tpCode.exercice]
}

//noinspection FunctionWithMoreThanThreeNegationsJS,OverlyComplexFunctionJS,FunctionTooLongJS
/**
 * Convertit un recordset en objet Ressource et le pousse vers l'api
 * @param {Object} row
 */
function parseRessource(row) {
  var ressource = initRessourceGenerique(row)
  var ajout = true

  //noinspection IfStatementWithTooManyBranchesJS
  if (row.type_id === 1) {
    ressource.typeTechnique = 'qts'
    if (!ressource.titre) ressource.titre = "Message ou question"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 2) {
    ressource.typeTechnique = 'tep'
    if (!ressource.titre) ressource.titre = "Figure TracenPoche"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 4) {
    ressource.typeTechnique = 'testd'
    if (!ressource.titre) ressource.titre = "Test diagnostique"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 6) {
    ressource.typeTechnique = 'poseur'
    if (!ressource.titre) ressource.titre = "Opération posée"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 7) {
    ressource.typeTechnique = 'calkc'
    if (!ressource.titre) ressource.titre = "Exercice avec la calculatrice cassée"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 9) {
    ressource.typeTechnique = 'ggb'
    if (!ressource.titre) ressource.titre = "Figure GeoGebra"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 10) {
    ressource.typeTechnique = 'url'
    if (!ressource.titre) ressource.titre = "Page externe"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 11) {
    ressource.typeTechnique = 'mental'
    if (!ressource.titre) ressource.titre = "Exercice de calcul mental"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 13) {
    ressource.typeTechnique = 'ebeps'
    if (!ressource.titre) ressource.titre = "Animation interactive"
    ressource.categories  = catCode.activiteAnimee
    ressource.typePedagogiques = config.categoriesToTypes[catCode.activiteAnimee].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.activiteAnimee].typeDocumentaires
  } else if (row.type_id === 14) {
    ressource.typeTechnique = 'msqcm'
    if (!ressource.titre) ressource.titre = "QCM interactif"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 15) {
    ressource.typeTechnique = 'msatdj'
    if (!ressource.titre) ressource.titre = "Exercice corrigé"
    ressource.categories = catCode.exerciceInteractif
    ressource.typePedagogiques = config.categoriesToTypes[catCode.exerciceInteractif].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.exerciceInteractif].typeDocumentaires
  } else if (row.type_id === 16) {
    ressource.typeTechnique = 'qcmlz'
    if (!ressource.titre) ressource.titre = "QCM"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 17) {
    ressource.typeTechnique = 'iep'
    if (!ressource.titre) ressource.titre = "Animation instrumenpoche"
    ressource.categories = catCode.activiteAnimee
    ressource.typePedagogiques = config.categoriesToTypes[catCode.activiteAnimee].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.activiteAnimee].typeDocumentaires
  } else if (row.type_id === 18) {
    ressource.typeTechnique = 'gen'
    if (!ressource.titre) ressource.titre = "Titre manquant"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 19) {ajout = false} else if (row.type_id === 20) {
    ressource.typeTechnique = 'lingotpd'
    if (!ressource.titre) ressource.titre = "Test diagnostique d'algèbre"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 21) {
    ressource.typeTechnique = 'ec2'
    if (!ressource.titre) ressource.titre = "Exercice Calcul@TICE"
    addCatExoInteractif(ressource)
  } else {
    log("type " + row.type_id + " inconnu")
    ajout = false
  }

  if (ajout) {
    if (logProcess) log('processing ' + ressource.idOrigine)
    // on transforme le xml en objet js pour certains
    switch (ressource.typeTechnique) {
      case 'url':
          modifyUrl(ressource, common.pushRessource)
        break
      /* case '':
          xml2js.parseString(ressource.xml, function(error, result) {
            if (error) addError(ressource.idOrigine)
            else {
              ressource.parametres = result
              common.pushRessource(ressource)
            }
          })
        break */
      default : common.pushRessource(ressource)
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
        log("le parsing du xml a planté " +xmlSrc)
        log(error.stack)
        common.addError(ressource.idOrigine, "le parsing du xml a planté " +ressource.parametres.xml)
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
            ressource.categorie = 0
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
            // log('la consigne : ' +p.consigne)
          }
        } else {
          return common.addError(ressource.idOrigine, "Url sans adresse")
        }
        next(ressource)
      }
    })
  } catch (error) {
    common.addError(idComb, "le parsing du xml a planté " +xmlSrc)
  }
}

// on vire node et ce fichier passé en 1er arg
var argv = process.argv.slice(2)
var ids
var query

log('task ' + __filename);

// on doit préciser persos ou bibs
if (argv[0] === '--persos') {
  query = "SELECT perso_id AS id, perso_type_id AS type_id, perso_titre AS titre, perso_descriptif AS descriptif," +
      " perso_commentaire AS commentaire, perso_xml AS xml, su.user_id AS sslsesa_user_id FROM PERSOS" +
      " INNER JOIN sslsesa_user su ON perso_util_id = user_labomep_id LIMIT 1000"
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
  common.checkListOfInt(ids)
  logProcess = true
  logRelations = true
  log('On ne traitera que les id ' + ids)
  if (origine === 'labomepPERSOS') query += " WHERE perso_id IN(" +ids +")"
  else query += " WHERE bib_id IN(" +ids +")"
}

// en cas d'interruption on veut le résultat quand même
process.on('SIGTERM', common.displayResult);
process.on('SIGINT', common.displayResult);

// yapluka
flow().seq(function () {
  // la cb quand toutes les ressources seront enregistrées
  common.setAfterAllCb(this)
  klabomep
      .raw(query)
      .exec(function (error, rows) {
              if (error) throw error
              if (rows[0]) rows[0].forEach(parseRessource)
              else log("Pas de ressources avec " + query)
            })
}).seq(function () {
  common.flushPendingRelations(this)
}).seq(function () {
  common.displayResult(this)
}).seq(function () {
  log('END')
  process.exit()
}).catch(function (error) {
  log('Erreur dans le flow :', error)
  common.displayResult()
})
