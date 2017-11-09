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

const flow = require('an-flow')
const request = require('request')
const {getAllParams, getParam} = require('../../tools/url')
const {refreshArbres} = require('../../cli/refreshArbres')

const name = 'Essaie de remplacer les pages externes vers une visionneuse par la ressource quand elle existe (puis màj arbres)'
const description = ''

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const config = require('../../config')
const updateLog = require('an-log')(`${config.application.name} update${updateNum}`)

const myBaseId = config.application.baseId
const configRessource = require('../../ressource/config')
const {estRemplacePar, remplace} = configRessource.constantes.relations

function getReplace (ressource) {
  if (ressource.relations && ressource.relations.length) {
    const relation = ressource.relations.find(([typeRelation]) => typeRelation === remplace)
    if (relation) return relation[1]
  }
}
function getReplacedBy (ressource) {
  if (ressource.relations && ressource.relations.length) {
    const relation = ressource.relations.find(([typeRelation]) => typeRelation === estRemplacePar)
    if (relation) return relation[1]
  }
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function findIep (url, next) {
      const oid = iepByUrl.get(url)
      if (oid) EntityRessource.Match('oid').equals(oid).grabOne(next)
      else next()
    }

    function grabCollDocs (next) {
      flow().seq(function () {
        EntityRessource.match('type').equals('coll_doc').grab({limit, skip}, this)
      }).seqEach(function (ressource) {
        nb++
        // on passe ceux déjà marqués obsolètes
        if (getReplacedBy(ressource)) return this()
        // on essaie d'en trouver qu'on pourrait remplacer
        if (ressource.parametres && /^https:\/\/ressources.sesamath.net\/coll\/lecteur\/voir_iep.php\?/.test(ressource.parametres.url)) {
          replaceByIep(ressource, this)
        } else {
          if (/lecteur\/voir/.test(ressource.parametres.url)) updateLog.info(`trouvé ${ressource.parametres.url} pour ${ressource.oid}`)
          this()
        }
      }).seq(function () {
        if (nb === skip + limit) {
          skip += limit
          grabUrls(next)
        } else {
          next()
        }
      }).catch(next)
    }

    function grabIep (next) {
      flow().seq(function () {
        EntityRessource.match('type').equals('iep').grab({limit, skip}, this)
      }).seqEach(function (ressource) {
        nb++
        if (ressource.parametres.url) iepByUrl[ressource.parametres.url] = ressource.oid
        else log.dataError(`Ressource iep sans url ${ressource.oid}`)
        this()
      }).seq(function () {
        if (nb < skip + limit) return next()
        skip += limit
        process.nextTick(grabIep, next)
      }).catch(next)
    }

    function grabUrls (next) {
      flow().seq(function () {
        EntityRessource.match('type').equals('url').grab({limit, skip}, this)
      }).seqEach(function (ressource) {
        nb++
        // si y'a déjà un remplaçant on passe
        if (getReplacedBy(ressource)) return this()
        let url = ressource.parametres && (ressource.parametres.url || ressource.parametres.adresse)
        if (!url) {
          updateLog.error(`Pas d’url pour ${ressource.oid}`, ressource.parametres)
          return this()
        }
        // si c'est pour nous on garde pour traitement au seq suivant
        if (/^https:\/\/(ressources|mep-outils|j3p)\.(dev)?sesamath.net/.test(url)) {
          // c'est chez nous
          if (/^https:\/\/ressources.sesamath.net\/coll\/lecteur\/voir_iep\.php\?/.test(url)) {
            return replaceByIep(ressource, this)
          } else if (/^https:\/\/ressources.sesamath.net\/coll_docs\/[^/]+\/[^/]+\/voir_iepv2\.php\?/.test(url)) {
            return replaceByIep(ressource, this)
          } else if (/^https:\/\/mep-outils.sesamath.net\/manuel_numerique\/diapo\.php\?/.test(url)) {
            return replaceByAto(ressource, this)
          } else if (/^https:\/\/mep-outils.sesamath.net\/animations3D/.test(url)) {
            animations3D++
          } else if (/^https:\/\/ressources.sesamath.net\/.+\/voir_tep\.php\?/.test(url)) {
            voirTep++
          } else if (/^https:\/\/ressources.sesamath.net\/.+\/voir_(flash|swf)\.php\?/.test(url)) {
            voirFlash++
          } else if (/^https:\/\/ressources.sesamath.net\/matoumatheux\/www\//.test(url)) {
            matoumatheux++
          } else {
            updateLog(`trouvé ${url} sur ${ressource.oid}`)
          }
        }
        this()
      }).seq(function () {
        if (nb === skip + limit) {
          skip += limit
          grabUrls(next)
        } else {
          next()
        }
      }).catch(next)
    }

    function replaceBy (old, dst, next) {
      // si c'est déjà fait on passe
      if (getReplacedBy(old) === dst.rid && getReplace(dst) === old.rid) return next()

      flow().seq(function () {
        if (!dst.relations) dst.relations = []
        if (getReplace(dst) === old.rid) {
          updateLog.warn(`${dst.rid} était déjà marqué remplaçant ${old.rid} mais l'info n'était pas dans ${old.rid}`)
        } else {
          dst.relations.push([remplace, old.rid])
        }
        $ressourceRepository.save(dst, this)
      }).seq(function (_dst) {
        dst = _dst
        if (!old.relations) old.relations = []
        if (getReplacedBy(old) === dst.rid) {
          updateLog.warn(`${old.rid} était déjà marqué comme étant remplacé par ${dst.rid} mais l’info n’était pas dans ${dst.rid}`)
        } else {
          old.relations.push([estRemplacePar, dst.rid])
        }
        $ressourceRepository.save(old, this)
      }).seq(function () {
        updateLog(`${old.rid} remplacé par ${dst.rid}`)
        next()
      }).catch(next)
    }

    function replaceByAto (ressource, next) {
      // on ne reçoit que du type url
      const url = ressource.parametres && ressource.parametres.adresse
      const atomeId = getParam(url, 'atome')
      if (!atomeId) {
        updateLog.error(`url ${ressource.oid} type diapo sans atome ${url}`)
        return next()
      }
      flow().seq(function () {
        EntityRessource.match('origine').equals('ato').match('idOrigine').equals(atomeId).grabOne(this)
      }).seq(function (atome) {
        if (!atome) {
          atome = EntityRessource.create({
            type: 'ato',
            origine: 'ato',
            idOrigine: atomeId // string car vient de l'url
          })
        }
        process.nextTick(replaceBy, ressource, atome, next)
      }).done(next)
    }

    function replaceByIep (ressource, next) {
      // updateLog(`replaceByIep ${ressource.oid}`)
      let xmlUrl
      flow().seq(function () {
        const nextStep = this
        // ressource est de type coll_doc ou url

        // coll_doc avec files
        if (ressource.parametres.files) {
          let xmlFile = ressource.parametres.files.find(file => file.format === 'xml' && file.uri && (file.statut === 'o' || !ressource.publie))
          if (xmlFile && xmlFile.uri) {
            // faut chercher s'il existe déjà…
            return nextStep(null, `https://ressources.sesamath.net${xmlFile.uri}`)
          } else {
            updateLog.error(`pas trouvé l’url du xml dans files pour ${ressource.oid}`, ressource.parametres)
          }

        // url ou adresse
        } else if (ressource.parametres.url || ressource.parametres.adresse) {
          const url = ressource.parametres.url || ressource.parametres.adresse

          // pour ces url faut demander à l'interface coll l'url du xml qu'on ne peut pas deviner
          if (/voir_iep.php\?typeres=bibiep&idres=[0-9]+$/.test(url)) {
            var options = {
              uri: ressource.parametres.adresse + '&ws=getXmlPath',
              json: true,
              timeout: 3000
            }
            request(options, function (error, response, data) {
              if (error) {
                updateLog.error(`pb sur ${options.uri}`, error)
              } else if (response.statusCode === 200 && data && data.xmlPath) {
                return nextStep(null, `https://ressources.sesamath.net${data.xmlPath}`)
              } else if (data.error) {
                updateLog.error(`${options.uri} retourne ${data.error} pour ${ressource.oid}`)
              }
              nextStep()
            })
            return

          // ancien lecteur iepv2
          } else if (/coll_docs\/[^/]+\/[^/]+\/voir_iepv2.php/.test(url)) {
            const dossier = url.replace(/https:\/\/ressources.sesamath.net\/coll_docs\/([^/]+)\/([^/]+)\/voir_iepv2.php.*/, '$1/$2')
            const script = getParam(url, 'script')
            if (/^https/.test(dossier)) updateLog.error(`url inattendue ${url} pour ${ressource.oid}`)
            else return nextStep(null, `https://ressources.sesamath.net/coll_docs/${dossier}/${script}`)

          // xml directement dans url
          } else if (url.substr(-4) === '.xml') {
            const {dossier, script} = getAllParams(url)
            if (dossier && script) return nextStep(null, `https://ressources.sesamath.net/coll_docs/${dossier}/${script}`)
            updateLog.error(`pas trouvé l’url du xml pour ${ressource.oid}`, ressource.parametres)

          // pas trouvé
          } else {
            updateLog.error(`url iep sans xml : ${url}`)
          }
        }
        nextStep()
      }).seq(function (xmlUrl) {
        if (!xmlUrl) return next()
        findIep(xmlUrl, this)
      }).seq(function (iep) {
        if (!iep) {
          // faut le créer (relations seront ajoutées par replaceBy)
          const data = {
            type: 'iep',
            origine: myBaseId,
            parametres: {
              url: xmlUrl
            }
          }
          ;['titre', 'resume', 'description', 'commentaires'].forEach(p => { data[p] = ressource[p] })
          iep = EntityRessource.create(data)
        }
        process.nextTick(replaceBy, ressource, iep, next)
      }).catch(next)
    }

    const EntityRessource = lassi.service('EntityRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    let skip = 0
    let nb = 0
    let iepByUrl = new Map()
    let animations3D = 0
    let matoumatheux = 0
    let voirFlash = 0
    let voirTep = 0
    const limit = 100

    flow().seq(function () {
      // on commence par récupérer toutes les url des iep connus
      grabIep(this)
    }).seq(function () {
      updateLog(`Recensé ${nb} ressources iep, traitement des coll_doc`)
      nb = 0
      skip = 0
      grabCollDocs(this)
    }).seq(function () {
      updateLog(`Traité ${nb} ressources coll_doc, traitement des url`)
      // on cherche les urls
      skip = 0
      nb = 0
      grabUrls(this)
    }).seq(function () {
      updateLog(`Traité ${nb} ressources url, (trouvé ${voirFlash} voir_flash, ${animations3D} animations3D, ${voirTep} voir_tep et ${matoumatheux} matoumatheux), rafraichissement des arbres`)
      refreshArbres(this)
    }).done(next)
  } // run
}
