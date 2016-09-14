/**
 * Ce script passe en revue les ressources de Labomep,
 * soit la table PERSOS (origine = labomepPERSOS, avec --persos),
 * soit BIBS (origine = labomepBIBS, avec --bibs)
 * l'origine est donc commune à toutes les ressources traitées par le script
 */
'use strict'

// cf ex d'un auteur de retour du ssl dans le commit 0154483f007fe3fa397e2b1a0762b24e44c487db

var knex = require('knex')
var _ = require('lodash')
var request = require('request')
var flow = require('an-flow')
var xml2js = require('xml2js')
// pour ec2, fct piquée dans le repository
var elementtree = require('elementtree')
var tools = require('../app/tools')

// nos méthodes mutualisées
var common = require('./modules/common')
// raccourcis
var log = common.log // jshint ignore:line

/** origine commune à toutes les ressources traitées ici, labomepPERSOS|labomepBIBS */
var origine

/** pour logguer les relations */
var logRelations = false
/** pour loguer le processing */
var logProcess = true

// conf de l'appli
var config = require('../app/ressource/config.js')
// conf de l'appli
var serverConf = require('../_private/config')
var urlBibli = 'http://'
urlBibli += serverConf.$server && serverConf.$server.hostname || 'localhost'
urlBibli += ':'
urlBibli += serverConf.$server && serverConf.$server.port || '3000'
urlBibli += '/api/ressource'

// constantes
var tdCode = config.constantes.typeDocumentaires
var tpCode = config.constantes.typePedagogiques
var catCode = config.constantes.categories

// databases
var dbConfigLabomep = require('../_private/bddConfigs/labomep')
// les connexions aux bases, labomep
var klabomep = knex(dbConfigLabomep)
// et bibli, pour aller chercher les auteurs
var confKnex = {
  client: 'mysql',
  connection: serverConf.$entities.database
}
var kbibli = knex(confKnex)

// une liste id => oid des auteurs
var listeAuteurs = {}

var ressource2rec = []

/**
 * Ajoute à la ressource categories, typePedagogiques et typeDocumentaires pour un exo interactif
 * @param ressource
 */
function addCatExoInteractif (ressource) {
  ressource.categories = [catCode.exerciceInteractif]
  ressource.typePedagogiques = [tpCode.exercice, tpCode.autoEvaluation]
  ressource.typeDocumentaires = [tdCode.interactif]
}

/**
 * Ajoute à la ressource categorie, typePedagogiques et typeDocumentaires pour un contenu fixe
 * dont on sait pas si c'est un cours ou un exo (on met les 2)
 * @param ressource
 */
function addCoursExoFixe (ressource) {
  // ne sachant pas trop on met cours et exercice
  ressource.categories = [catCode.coursFixe, catCode.exerciceFixe]
  ressource.typeDocumentaires = [tdCode.imageFixe, tdCode.texte]
  ressource.typePedagogiques = [tpCode.cours, tpCode.exercice]
}

// noinspection FunctionWithMoreThanThreeNegationsJS,OverlyComplexFunctionJS,FunctionTooLongJS
/**
 * Convertit un recordset en objet Ressource et le pousse vers l'api
 * @param {Object} row
 */
function parseRessource (row) {
  var ressource = initRessourceGenerique(row)
  if (logProcess) log('parsing ' + ressource.idOrigine)
  var ajout = true

  // noinspection IfStatementWithTooManyBranchesJS
  if (row.type_id === 1) {
    ressource.type = 'qts'
    if (!ressource.titre) ressource.titre = 'Message ou question'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 2) {
    ressource.type = 'tep'
    if (!ressource.titre) ressource.titre = 'Figure TracenPoche'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 4) {
    ressource.type = 'testd'
    if (!ressource.titre) ressource.titre = 'Test diagnostique'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 6) {
    ressource.type = 'poseur'
    if (!ressource.titre) ressource.titre = 'Opération posée'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 7) {
    ressource.type = 'calkc'
    if (!ressource.titre) ressource.titre = 'Exercice avec la calculatrice cassée'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 9) {
    ressource.type = 'ggb'
    if (!ressource.titre) ressource.titre = 'Figure GeoGebra'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 10) {
    ressource.type = 'url'
    if (!ressource.titre) ressource.titre = 'Page externe'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 11) {
    ressource.type = 'mental'
    if (!ressource.titre) ressource.titre = 'Exercice de calcul mental'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 13) {
    ressource.type = 'ebeps'
    if (!ressource.titre) ressource.titre = 'Animation interactive'
    ressource.categories = catCode.activiteAnimee
    ressource.typePedagogiques = config.categoriesToTypes[catCode.activiteAnimee].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.activiteAnimee].typeDocumentaires
  } else if (row.type_id === 14) {
    ressource.type = 'msqcm'
    if (!ressource.titre) ressource.titre = 'QCM interactif'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 15) {
    ressource.type = 'msatdj'
    if (!ressource.titre) ressource.titre = 'Exercice corrigé'
    ressource.categories = catCode.exerciceInteractif
    ressource.typePedagogiques = config.categoriesToTypes[catCode.exerciceInteractif].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.exerciceInteractif].typeDocumentaires
  } else if (row.type_id === 16) {
    ressource.type = 'qcmlz'
    if (!ressource.titre) ressource.titre = 'QCM'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 17) {
    ressource.type = 'iep'
    if (!ressource.titre) ressource.titre = 'Animation instrumenpoche'
    ressource.categories = catCode.activiteAnimee
    ressource.typePedagogiques = config.categoriesToTypes[catCode.activiteAnimee].typePedagogiques
    ressource.typeDocumentaires = config.categoriesToTypes[catCode.activiteAnimee].typeDocumentaires
  } else if (row.type_id === 18) {
    ressource.type = 'gen'
    if (!ressource.titre) ressource.titre = 'Titre manquant'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 19) {
    ressource.type = 'j3p'
    if (!ressource.titre) ressource.titre = 'Titre manquant'
    addCatExoInteractif(ressource)
  } else if (row.type_id === 20) {
    ressource.type = 'lingotpd'
    if (!ressource.titre) ressource.titre = "Test diagnostique d'algèbre"
    addCatExoInteractif(ressource)
  } else if (row.type_id === 21) {
    ressource.type = 'ec2'
    if (!ressource.titre) ressource.titre = 'Exercice Calcul@TICE'
    addCatExoInteractif(ressource)
  } else {
    log('type ' + row.type_id + ' inconnu')
    ajout = false
  }

  if (ajout) ressource2rec.push(ressource)
}

function flushRessources (next) {
  if (ressource2rec.length) {
    // faut découper en tranches de 100 pour éviter RangeError: Maximum call stack size exceeded
    var paquet
    for (var i = 0; i < ressource2rec.length; i += 100) {
      paquet = ressource2rec.slice(i, i + 100)
      // on lance ça
      flow(paquet).seqEach(function (ressource) {
        var nextRess = this
        if (logProcess) log('processing ' + ressource.idOrigine)
        addAuteurs(ressource, function () {
          // on transforme le xml en objet js pour certains
          switch (ressource.type) {
            case 'url':
              modifyUrl(ressource, common.deferRessource)
              break
            case 'ec2':
              convertXmlEc2(ressource, common.deferRessource)
              break
            default :
              common.deferRessource(ressource)
          }
          nextRess()
        })
      }).seq(function () {
        log('flush envoyé')
        common.setAfterAllCb(this)
        common.checkEnd()
      }).seq(function () {
        log('flush terminé')
        next()
      }).catch(function (error) {
        log('erreur lors du flush', error)
      })
    }
  }
}

/**
 * Remplace les id auteurs par des oid et passe la ressource à next
 * @param ressource
 * @param next
 */
function addAuteurs (ressource, next) {
  if (_.isEmpty(ressource.auteurs)) next(ressource)
  else {
    // on regarde si on le connait déjà
    var idComb = common.getIdComb(ressource)
    var auteurs = []
    flow(ressource.auteurs).seqEach(function (idSslSesa) {
      if (logProcess) log("on va chercher l'id auteur " + idSslSesa)
      var nextAuteur = this
      if (listeAuteurs[idSslSesa]) {
        // on l'a déjà croisé dans ce script
        log('auteur ' + idSslSesa + " déjà rencontré avec l'oid " + listeAuteurs[idSslSesa])
        auteurs.push(listeAuteurs[idSslSesa])
        nextAuteur()
      } else {
        // on regarde en bdd
        kbibli
            .raw("SELECT oid FROM personne_index WHERE name='id' AND _string='" + idSslSesa + "' LIMIT 1")
            .exec(function (error, rows) {
              if (error) {
                log('erreur sur la récup personne_index ' + idSslSesa)
                nextAuteur()
              } else if (rows[0] && rows[0][0] && rows[0][0].oid) {
                var oid = rows[0][0].oid
                log('auteur ' + idSslSesa + " trouvé en bdd avec l'oid " + oid)
                // on le connait, on remplace id par oid
                auteurs.push(oid)
                // on le note pour une prochaine fois
                listeAuteurs[idSslSesa] = oid
                nextAuteur()
              } else {
                log('auteur ' + idSslSesa + ' inconnu, on va le chercher sur ssl')
                // on le connait pas, faut aller le chercher en http
                /* */
                var options = {
                  url: 'https://ssl.sesamath.net/sesamath/requete_externe.php?fonction=getUserInfos&format=json&id=' + idSslSesa,
                  json: true
                }
                request.get(options, function (error, response, data) {
                  if (error || data.error || !data.id) {
                    // KO, le msg d'erreur
                    var errorString = 'erreur sur le get ' + options.url + ' : '
                    if (error) errorString += error.toString()
                    else if (data.error) errorString += data.error
                    else errorString += tools.stringify(data)
                    common.addError(idComb, errorString)
                    nextAuteur()
                  } else if (data.id && data.id == idSslSesa) { // eslint-disable-line eqeqeq
                    // OK, on l'enregistre ici * /
                    common.addPersonne(data, function (error, personne) {
                      // log('après addPersonne', personne)
                      if (error) {
                        log("erreur lors de la récup de l'auteur " + idSslSesa, error)
                        common.addError(idComb, error)
                      } else if (personne && personne.oid) {
                        log("on a récupéré sur ssl l'auteur " + idSslSesa + " enregistré localement sous l'oid " + personne.oid)
                        auteurs.push(personne.oid)
                        listeAuteurs[idSslSesa] = personne.oid
                      } else {
                        common.addError(idComb, 'erreur inconnue sur personne/add')
                      }
                      nextAuteur()
                    })
                  } else {
                    log("En cherchant l'id " + idSslSesa + " sur ssl on a récupéré l'id " + data.id)
                    nextAuteur()
                  }
                })
              }
            })
      }
    }).seq(function () {
      log('on a récupéré les oid des auteurs', auteurs)
      ressource.auteurs = auteurs
      next(null, ressource)
    }).catch(function (error) {
      log('erreur sur la récup des auteurs de ' + ressource.idOrigine + ' on va remplacer les id', ressource.auteurs)
      log('par les oid', auteurs)
      common.addError(idComb, error)
      ressource.auteurs = auteurs
      next(null, ressource)
    })
  }
}

/**
 * vire parametres.xml pour ne mettre que les params json
 * @param ressource
 * @param next
 */
function convertXmlEc2 (ressource, next) {
  if (ressource.parametres && ressource.parametres.xml) {
    var config = elementtree.parse(ressource.parametres.xml)
    var params = {}
    if (config._root && config._root.tag === 'config' && config._root._children) {
      config._root._children.forEach(function (child) {
        if (child.tag) {
          params[child.tag] = child.text
        }
      })
      ressource.parametres = params
    }
  }
  next(ressource)
}

/**
 * Initialise les propriété communes à toutes les ressources à partir du recordset, helper de parseRessource
 * @param {Object} row
 * @returns {Object}
 */
function initRessourceGenerique (row) {
  var ressource = {
    origine: origine,
    idOrigine: row.id,
    resume: row.descriptif || '',
    description: '',
    commentaires: row.commentaire || '',
    parametres: {xml: row.xml},
    langue: 'fra',
    publie: true,
    restriction: (origine === 'labomepBIBS') ? 0 : 3
  }
  if (row.titre) ressource.titre = row.titre
  if (row.sslsesa_user_id) ressource.auteurs = [row.sslsesa_user_id]
  // on rectifie origine et idOrigine pour les ressources qui viennent en fait d'ailleurs
  common.fixLabomepBIBS(ressource)

  return ressource
}

/**
 * Affine les ressources de type url
 * @param ressource
 * @param next
 */
function modifyUrl (ressource, next) {
  var idComb = ressource.origine + '/' + ressource.idOrigine
  // il faut échapper d'éventuels & qui ne sont pas sous la forme &amp;
  // on pourrait passer l'option strict:false mais on préfère planter en cas de xml bancal
  var xmlSrc = ressource.parametres.xml.replace(/&/g, '&amp;').replace(/&amp;amp;/g, '&amp;')
  // cf https://github.com/Leonidas-from-XIV/node-xml2js
  var options = {
    explicitArray: false,
    explicitRoot: false,
    trim: true,
    ignoreAttrs: true
  }
  xml2js.parseString(xmlSrc, options, function (error, result) {
    try {
      if (error) {
        log('le parsing du xml a planté ' + xmlSrc)
        log(error.stack)
        common.addError(ressource.idOrigine, 'le parsing du xml a planté ' + ressource.parametres.xml)
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
             (!p.answer_option || p.answer_option === 'off')) {
            // url toute simple, on nettoie un peu
            ressource.parametres = {adresse: p.adresse}
            // ne sachant pas trop on met rien...
            // (0 pour que l'api accepte l'import, il faudra compléter à la prochaine édition)
            ressource.categorie = 0
            // un cas particulier sur toutes ces diapos qui devraient exister par ailleurs
            if (p.adresse.indexOf('http://mep-outils.sesamath.net/manuel_numerique/diapo.php?atome=') === 0) {
              var test = /diapo.php\?atome=([0-9]+)/.exec(result.adresse)
              // c'est en fait un atome, on le garde comme ressource url originaire de labomep,
              // mais on ajoute les refs à l'atome, ça servira probablement
              ressource.parametres.cloneDe = {
                origine: 'zoneur',
                idOrigine: test[1],
                type: 'ato'
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
          return common.addError(ressource.idOrigine, 'Url sans adresse')
        }
        next(ressource)
      }
    } catch (error) {
      common.addError(idComb, 'le parsing du xml a planté ' + xmlSrc)
    }
  })
}

// on vire node et ce fichier passé en 1er arg
var argv = process.argv.slice(2)
var ids
var query

// on doit préciser persos ou bibs
if (argv[0] === '--persos') {
  query = 'SELECT perso_id AS id, perso_type_id AS type_id, perso_titre AS titre, perso_descriptif AS descriptif,' +
      ' perso_commentaire AS commentaire, perso_xml AS xml, su.user_id AS sslsesa_user_id FROM PERSOS' +
      ' INNER JOIN sslsesa_user su ON perso_util_id = user_labomep_id'
  origine = 'labomepPERSOS'
} else if (argv[0] === '--bibs') {
  query = 'SELECT bib_id AS id, bib_type_id AS type_id, bib_titre AS titre, bib_descriptif AS descriptif,' +
          ' bib_commentaire AS commentaire, bib_xml AS xml FROM BIBS'
  origine = 'labomepBIBS'
/* } else if (argv[0] === '--bibs2menus') {
  query = 'SELECT bib_id AS id, bib_type_id AS type_id, bib_titre AS titre, bib_descriptif AS descriptif,' +
          ' bib_commentaire AS commentaire, bib_xml AS xml FROM BIBS WHERE '
  origine = 'labomepBIBS'
} else if (argv[0] === '--menus') {
  query = 'SELECT bib_id AS id, bib_type_id AS type_id, bib_titre AS titre, bib_descriptif AS descriptif,' +
          ' bib_commentaire AS commentaire, bib_xml AS xml FROM MENUS'
  origine = 'labomepMENUS' /* */
} else {
  throw new Error("il faut ajouter l'argument --persos ou --bibs ou --menus (suivi éventuellement d'une liste d'ids séparés par des virgules)")
}

// on regarde s'il faut se limiter à certains ids
ids = argv.slice(1)[0]
if (ids) {
  common.checkListOfInt(ids)
  logProcess = true
  logRelations = true
  log('On ne traitera que les id ' + ids)
  if (origine === 'labomepPERSOS') query += ' WHERE perso_id IN(' + ids + ')'
  else query += ' WHERE bib_id IN(' + ids + ')'
} // else query += ' LIMIT 1000'

common.setOptions({
  timeout: 2000,
  maxLaunched: 1,
  logApiCalls: logProcess,
  logProcess: logProcess,
  logRelations: logRelations
})

// yapluka
flow().seq(function () {
  log('lancement de la requete \n' + query)
  // la cb quand toutes les ressources seront enregistrées
  var nextStep = this
  klabomep
      .raw(query)
      .exec(function (error, rows) {
        if (error) throw error
        if (rows[0]) rows[0].forEach(parseRessource)
        else log('Pas de ressources avec ' + query)
        nextStep()
      })
}).seq(function () {
  flushRessources(this)
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
