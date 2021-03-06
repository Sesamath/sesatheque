/**
 * Ce script passe en revue les ressources j3p du xml issu de labomep (à copier dans
 * gulptasks/arbresXml/exercices_interactifs.xml) et regarde dans labomep.BIBS (cf _private/bddConfigs/labomep) les infos
 * si aussi dans oldbibli (_private/bddConfigs/oldbibli), on regarde les champs commentaires et description,
 *   si vide dans BIBS on prend sinon on ignore
 * (Alexis avait complété ces champs à la main dans l'ancienne bibli symfony)
 */
'use strict'

var knex = require('knex')
var fs = require('fs')
var path = require('path')
var flow = require('an-flow')
var elementtree = require('elementtree')
var request = require('request')

var common = require('./modules/common')
// raccourcis
var log = common.log // jshint ignore:line

// la moulinette d'Alexis
var graphe2Json = require('./modules/j3pGraphe2json')

// databases
var dbConfigOldBibli
var dbConfigLabomep = require('../_private/bddConfigs/labomep')
// les connexions aux bases
var kOldBibli
var kLabomep = knex(dbConfigLabomep)

var checkOldBibli = false
if (checkOldBibli) {
  dbConfigOldBibli = require('../_private/bddConfigs/oldbibli')
  kOldBibli = knex(dbConfigOldBibli)
}

/**
 * Passe en revue l'objet elementtree issu du xml pour en extraire les ids des tags j3p (récursif)
 * @param {elementtree} arbre
 * @returns {array} Les ids trouvés
 */
function getJ3pIds (arbre) {
  if (arbre.n) {
    log('parsing de la branche xml ' + arbre.n)
  }
  var j3pIds = []
  if (arbre._children) {
    arbre._children.forEach(function (child) {
      if (child.tag === 'j3p') {
        if (child.attrib.i) {
          j3pIds.push(child.attrib.i)
        } else {
          common.addError('élément ' + child.tag + " sans id , n° d'ordre " + child._id)
        }
      } else if (child.tag === 'd') {
        j3pIds = j3pIds.concat(getJ3pIds(child))
      }
    })
  }

  return j3pIds
}

/**
 * Récupère le xml en prod
 * @param next lui file la chaine récupérée ou une erreur
 */
function getOnlineXml (next) {
  var options = {
    url: 'http://www.labomep.net/config/xml/exercicesInteractifs/exercices_interactifs.xml',
    content_type: 'charset=UTF-8'
  }
  log('On va chercher ' + options.url)
  request.get(options, function (error, response) {
    if (error) next(error)
    else next(response.body)
  })
}

/**
 * Traite chacune des ids trouvées
 * @param {Array} idsFound
 */
function parseIds (idsFound) {
  if (idsFound && idsFound.length) {
    idsFound.forEach(function (id) {
      log('parsing ' + id)
      flow().seq(function () {
        var row
        var query = 'SELECT bib_id AS id, bib_titre AS titre, bib_descriptif AS descriptif,' +
                    ' bib_commentaire AS commentaire, bib_xml AS graphe FROM BIBS'
        common.setAfterAllCb(this)
        kLabomep.raw(query + ' WHERE bib_id = ' + id).exec(function (error, rows) {
          try {
            if (error) throw error
            if (rows[0] && rows[0][0]) {
              row = rows[0][0]
              // faut voir si on complète avec les infos de oldBibli
              if (checkOldBibli) {
                if (!row.bib_descriptif || !row.bib_commentaire) {
                  kOldBibli.raw('SELECT description, commentaires FROM Ressource WHERE id = ' + id).exec(function (error,
                    rows) {
                    var result
                    if (error) throw error
                    if (rows[0]) {
                      result = rows[0][0]
                      if (result && !row.descriptif && result.description) row.descriptif = result.description
                      if (result && !row.commentaire && result.commentaires) row.commentaire = result.commentaires
                    } else {
                      log('Pas de ressources avec ' + query)
                    }
                  })
                }
              }
              parseRessource(row)
            } else log("Pas de ressources dans BIBS d'id " + id)
          } catch (error) {
            log('erreur dans le select sur labomep')
            log(error)
          }
        })
      }).seq(function () {
        log('fin parsing')
        common.displayResult()
      }).catch(function (error) {
        log('Erreur dans le flow :', error)
      })
    })
  } else {
    log('Aucune ressource j3p trouvée dans le xml')
  }
}

/**
 * Parse un xml (et appelle splitOrNotToSplit avec le résultat)
 */
function parseJ3pXml (xmlString, next) {
  var xmlName = 'exercices_interactifs' // sans l'extension
  try {
    if (xmlString) {
      log('processing xml récupéré online')
    } else {
      log('processing xml local ' + xmlName)
      xmlString = fs.readFileSync(path.join(__dirname, 'arbresXml', xmlName + '.xml')).toString()
    }
    var arbre = elementtree.parse(xmlString)
    if (!arbre._root) throw new Error('arbre sans racine')
    if (!arbre._root._children || !arbre._root._children.length) throw new Error('arbre vide')
    // si l'arbre n'a qu'un fils qui est un tag d avec enfants c'est lui qu'on prend comme racine
    if (arbre._root._children.length === 1 && arbre._root._children[0].tag === 'd') {
      if (arbre._root._children[0]._children.length) {
        arbre = arbre._root._children[0]
      } else throw new Error('arbre avec un seul dossier vide')
    } else {
      arbre = arbre._root
    }

    next(getJ3pIds(arbre))
  } catch (error) {
    common.addError(xmlName, 'le parsing du xml ' + xmlName + ' a planté : ' + error.toString())
    process.exit()
  }
}

/**
 * Convertit un recordset en objet Ressource que l'on pourra poster à l'api
 * @param row
 * @returns {Ressource}
 */
function parseRessource (row) {
  // if (idsParsed.length > 2) return
  var ressource = {
    titre: row.titre,
    origine: 'labomepBIBS',
    idOrigine: String(row.id),
    type: 'j3p',
    resume: row.resume || '',
    description: row.description || '',
    commentaires: row.commentaire || '',
    parametres: { },
    langue: 'fra',
    publie: true,
    restriction: 0
  }
  // on ajoute le graphe qu'il faut transformer
  try {
    var json = graphe2Json(row.graphe)
    ressource.parametres.g = JSON.parse(json)
  } catch (error) {
    common.addError(common.getIdComb(ressource), 'graphe invalide : ' + error)
    return
  }
  common.fixLabomepBIBS(ressource)
  common.addCatExoInteractif(ressource)
  common.pushRessource(ressource)
}

/**
 * Efface toutes les ressources j3p
 */
function purgeJ3pAndExit () {
  log('On vire toutes les ressources j3p existantes')

  var query = 'DELETE ressource, ri2 FROM ressource_index ri INNER JOIN ressource USING(oid)' +
      ' INNER JOIN ressource_index ri2 USING(oid)' +
      " WHERE ri.name = 'type' AND ri._string = 'j3p'"
  var dbConfigBibli = require('../_private/config')
  var confKnex = {
    client: 'mysql',
    connection: dbConfigBibli.entities.database
  }
  var kBibli = knex(confKnex)
  flow()
    .seq(function () {
      log('on va lancer la requete de purge')
      var next = this
      kBibli
        .raw(query)
        .exec(function (error, rows) {
          if (error) throw error
          // la suite est jamais affichée :-/
          else {
            log('retour', rows)
            next()
          }
        })
    })
    .seq(function () {
      log('Ressources j3p purgées')
      process.exit(0)
    })
    .catch(function (error) {
      log('Erreur dans la purge j3p :', error)
    })
}

// les 3 premiers args sont node, nomDeLaTache
var argv = process.argv.slice(2)
if (argv[0] === '--purge') {
  purgeJ3pAndExit()
} else {
  // en cas d'interruption on veut le résultat quand même
  process.on('SIGTERM', function () {
    common.displayResult()
  })
  process.on('SIGINT', function () {
    common.displayResult()
  })

  if (argv[0] === '--id') {
    parseIds(argv[1].split(','))
  } else if (argv[0] === '--prod') {
    // on va chercher le xml online
    getOnlineXml(function (xml) {
      if (xml && !xml.stack) parseJ3pXml(xml, parseIds)
      else log(xml)
    })
  } else {
    // on parse le xml local
    parseJ3pXml(null, parseIds)
  }
}
