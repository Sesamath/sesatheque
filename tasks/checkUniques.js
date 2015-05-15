/**
 * Ce script passe en revue les ressources (dans la base) pour vérifier que les id sont uniques
 */
'use strict';

/** La limite max du nb de dump en console */
var maxDumps = 50

var knex = require('knex')
var moment = require('moment')
var flow          = require('seq')

var dbConfig = require(__dirname + '/../_private/config')
var confKnex = {
  client: "mysql",
  connection: dbConfig.$entities.database
}
var kdb = knex(confKnex)

/** La liste d'ids passés en argument avec --dump (séparateur virgule sans espaces) */
var idsAsked = ''
/** {boolean} Il faudra afficher les dump */
var dumpAsked = false
/** Liste d'id en doublon trouvé (pour récap en END ou dump) */
var duplicates = []

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
 * Récupère toutes les ressources ayant plus d'un id (et rempli la var globale duplicates avec)
 *
 * @param {Function} next fct à appeler quand tous les mep auront été importés
 */
function checkId(next) {
  var query = "SELECT _string AS id, count( * ) AS nb FROM ressource_index ri" +
              " INNER JOIN  ressource_index ri2 USING(oid) " +
              " WHERE ri2.name = 'origine' AND ri2._string = 'em'" +
              " AND ri.name = 'idOrigine' "
  if (idsAsked) query += "AND ri._string IN (" +idsAsked +')'
  query += " GROUP BY _string HAVING nb > 1 ORDER BY _string DESC"
  kdb.raw(query).exec(function (error, rows) {
    if (error) next(error)
    else {
      var results = rows[0]
      if (results.length) {
        log("Il y a des doublons !")
        results.forEach(function (row) {
          duplicates.push(row.id)
          log('ID ' + row.id + " existe en " +row.nb +' exemplaires')
        })
      }
      next()
    }
  })
}

/**
 * Passe en revue les ressources avec id en doublons et les dump (jusqu'au max autorisé)
 * @param next
 */
function dumpDup(next) {
  if (!dumpAsked) next()
  else {
    if (duplicates.length) {
      var query = "SELECT i._integer AS id, d.oid AS oid, d.data AS data FROM ressource d" +
          " INNER JOIN ressource_index i ON d.oid = i.oid" +
          " WHERE i.name = 'id' AND i._integer IN (" +duplicates.join(',') +")" +
          " ORDER BY id DESC" +
          " LIMIT " +maxDumps
      var id = 0
      kdb.raw(query).exec(function (error, rows) {
        var results = rows[0]
        if (results.length == maxDumps) log("Les résultats ont été limités à " +maxDumps)
        results.forEach(function (row) {
          if (row.id != id) {
            console.log('\n')
            log("Pour l'id " + row.id + " on a les ressources suivantes")
            id = row.id
          }
          console.log("oid " + row.oid + "\n" + row.data +'\n')
        })
        next()
      })
    } else log("Aucune ressource en doublon à afficher")
  }
}

module.exports = function () {
  // les 3 premiers args sont node, /path/2/gulp, importMEPS
  var argv = process.argv.slice(3)
  log('task ' + __filename);

  // sauf si on précise l'un ou l'autre (on impose le log dans ce cas
  if (argv[0] === '--dump') {
    dumpAsked = true
    idsAsked = argv.slice(1)[0]
    if (idsAsked) log('On ne traitera que les id ' +idsAsked)
  }

  flow()
      .seq(function () {
        checkId(this)
      })
      .seq(function () {
        dumpDup(this)
      })
      .seq(function () {
        if (!dumpAsked && duplicates.length) {
          // on suggère de le réclamer
          log("Pour voir le détail des doublons trouvés, vous pouvez relancer la commande en ajoutant en option")
          console.log("--dump " +duplicates.join(','))
        }
        log('END')
        process.exit() // gulp sort pas tout seul s'il reste qq callback dans le vent
      })
      .catch(function (error) {
        console.error('Erreur dans le flow : \n' + error.stack);
      })
}
