/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

var flow = require('an-flow')
const applog = require('an-log')(lassi.settings.application.name)
var request = require('request')
var stringify = require('sesajstools').stringify
var Ressource = require('../../constructors/Ressource')
var confRessource = require('../../ressource/config')

var name = 'transformation des pages externes vers voir_iep.php en ressources iep'
var description = ''

var limit = 50

var EntityRessource = lassi.service('EntityRessource')
var $ressourceRepository = lassi.service('$ressourceRepository')

function modifIep (ressource, next) {
  // crée une nouvelle ressource
  function saveNewAndNext (path) {
    // on aura des relations à ajouter
    if (!ressource.relations) ressource.relations = []
    flow().seq(function () {
      // on crée une nouvelle ressource à partir de l'ancienne
      var ressourceIep = new Ressource(ressource)
      ressourceIep.type = 'iep'
      ressourceIep.parametres = {
        url: base + path
      }
      ressourceIep.relations.push([confRessource.constantes.relations.remplace, ressource.oid])
      ressourceIep.version = 1
      // sinon on écrase la précédente !
      ressourceIep.oid = undefined
      // faut pas laisser origine & idOrigine existant sinon on écrase aussi
      if (ressourceIep.idOrigine) delete ressourceIep.idOrigine
      if (ressource.origine === 'coll_doc') {
        // on la laisse et on met la nouvelle en local
        ressourceIep.origine = 'local'
      } else {
        ressourceIep.origine = 'coll_doc'
        if (ressource.origine === 'labomepBIBS' && ressource.idOrigine > 200000 && ressource.idOrigine < 1000000) {
          ressourceIep.idOrigine = ressource.idOrigine - 200000
        } else if (ressource.origine === 'labomepBIBS' && ressource.idOrigine > 2000000 && ressource.idOrigine < 3000000) {
          // y'a bien deux décalages possibles, 200k ou 2M
          ressourceIep.idOrigine = ressource.idOrigine - 2000000
        } else {
          // on en sait rien, on met le xml en idOrigine et on le signale
          ressourceIep.idOrigine = path
          log.dataError('impossible de retrouver le coll_doc_id de', ressourceIep)
        }
      }
      // on la sauve
      $ressourceRepository.save(ressourceIep, this)
    }).seq(function (ressourceIep) {
      // on modifie la ressource originale, en virant d'abord un éventuel estRemplacePar précédent
      ressource.relations = ressource.relations.filter((relation) => relation[0] !== confRessource.constantes.relations.estRemplacePar)
      ressource.relations.push([confRessource.constantes.relations.estRemplacePar, ressourceIep.oid])
      // on laisse publié à true, car certains l'utilisent peut-être, mais on passe indexable à false
      // pour la sortir des résultats de recherche
      ressource.indexable = false
      $ressourceRepository.save(ressource, this)
    }).done(next)
  }
  function logAndNext (msg) {
    log.dataError(msg, ressource)
    next()
  }
  var base = 'https://ressources.sesamath.net'

  try {
    var url = ressource.parametres.adresse
    // on peut trouver du
    // http://ressources.sesamath.net/coll/lecteur/voir_iep.php?dossier=cah/valide&script=manuel_accomp_6N1s3_23_IePv2_b.xml
    // ou
    // voir_iep.php?typeres=bibiep&idres=211774
    var pos = url.indexOf('?') + 1
    var search = url.substr(pos)
    var params = {}
    search.split('&').forEach(function (chunk) {
      var args = chunk.split('=')
      params[args[0]] = args[1]
    })
    if (params.dossier && params.script) {
      // on a déjà tout pour le xml
      saveNewAndNext('/coll_docs/' + params.dossier + '/' + params.script)
    } else if (params.idres) {
      // on demande l'url du xml à voir_iep-javascript.php
      var options = {
        url: base + '/coll/lecteur/voir_iep-javascript.php?' + search + '&ws=getXmlPath',
        json: true
      }
      request.get(options, function (error, response, data) {
        if (error) {
          logAndNext('impossible de récupérer le xml de la figure iep : ' + error.toString())
        } else if (data) {
          if (data.xmlPath) {
            saveNewAndNext(data.xmlPath)
          } else if (data.error) {
            logAndNext('erreur sur la récupération du xml de la figure iep : ' + data.error)
          } else {
            logAndNext('impossible de récupérer le xml de la figure iep, ' + options.url + ' ne renvoie rien de compréhensible : ' + stringify(data))
          }
        } else {
          logAndNext('impossible de récupérer le xml de la figure iep, ' + options.url + ' ne renvoie rien')
        }
      })
    } else {
      logAndNext('page externe iep au format inconnu')
    }
  } catch (error) {
    logAndNext(error.toString())
  }
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      applog('update 5', 'traitement des pages externes de ' + offset + ' à ' + (offset + limit))
      EntityRessource.match('type').equals('url').sort('oid').grab(limit, offset, function (error, ressources) {
        if (error) return next(error)
        flow(ressources).seqEach(function (ressource) {
          var isIep = false
          var needResave = false
          try {
            // on a eu un bug d'import une fois qui donnait des objets avec une propriété 0
            // au lieu d'une string (pb php de cast d'un node simpleXml)
            if (ressource.parametres && typeof ressource.parametres.adresse !== 'string') {
              if (typeof ressource.parametres.adresse['0'] === 'string') {
                needResave = true
                for (var prop in ressource.parametres) {
                  if (typeof ressource.parametres[prop][0] === 'string') ressource.parametres[prop] = ressource.parametres[prop][0]
                }
              }
            }
            isIep = ressource.parametres.adresse.indexOf('voir_iep') !== -1
          } catch (error) {
            log.dataError('ressource url sans adresse', ressource)
            return this()
          }
          if (isIep) modifIep(ressource, this)
          else if (needResave) $ressourceRepository.save(ressource, this)
          else this()
        }).seq(function () {
          if (ressources.length === limit) {
            offset += limit
            grab()
          } else {
            this()
          }
        }).done(next)
      })
    }
    // init
    var offset = 0
    // go
    grab()
  } // run
}
