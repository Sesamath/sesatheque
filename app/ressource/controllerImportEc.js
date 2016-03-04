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

/**
 * Controleur /importEc/ pour importer les xml calculatice
 * @controller controllerImportEc
 * @requires $ressourceRepository {@link $ressourceRepository]
 * @requires $ressourceConverter
 * @requires $accessControl
 * @requires $personneControl
 * @requires $ressourcePage
 * @requires $routes
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $json, $personneControl, $ressourcePage, $routes) {
  var request = require('request')
  // var _ = require('lodash')
  var tools = require('../tools')
  var flow = require('an-flow')
  var elementtree = require('elementtree')
  var config = require('./config')
  var arbreCateg = config.constantes.categories.liste

  var xmls = ['cp', 'ce1', 'ce2', 'cm1', 'cm2', '6eme']
  var niveaux // affecté dans getArbreDefaultValues et utilisé au save

  /**
   * Met à jour un arbre calculatice
   * @route GET /importEc/:xml
   * @param {string} xmlSuffix Le suffixe du xml (cm2 pour ressources-cm2.xml)
   */
  function getAndParseXml (context, xmlSuffix, next) {
    var arbre = getArbreDefaultValues(xmlSuffix)

    flow().seq(function () {
      $accessControl.isSesamathClient(context, this)
    }).seq(function (isSesamathClient) {
      if (isSesamathClient) this()
      else $json.denied(context, "Vous n'avez pas les droits suffisant pour accéder à cette commande")
    }).seq(function () {
      // on peut importer
      var nextStep = this
      var url = config.imports.ecBase + '/xml/ressources-' + xmlSuffix + '.xml'
      request.get(url, function (error, response, body) {
        if (error) {
          log.error(error)
          nextStep(new Error('impossible de récupérer ' + url))
        } else if (body) {
          nextStep(null, body)
        } else {
          log.error("Sur l'url " + url + ' on récupère', response)
          nextStep(new Error(url + ' renvoie une réponse vide'))
        }
      })
    }).seq(function (xmlString) {
      // log.debug('analyse de', xmlString)
      var arbreXml = elementtree.parse(xmlString)
      if (!arbreXml._root) this(new Error('xml ' + xmlSuffix + ' sans racine'))
      else if (!arbreXml._root._children || !arbreXml._root._children.length) this(new Error('xml ' + xmlSuffix + ' vide'))
      else if (arbreXml._root.tag !== 'niveau') this(new Error('xml ' + xmlSuffix + ' ne contient pas de tag niveau à la racine'))
      else if (arbreXml._root.attrib.id !== xmlSuffix) this(new Error('xml ' + xmlSuffix + ' ne contient pas le bon niveau (trouvé ' + arbreXml._root.attrib.id + ')'))
      else this(null, arbreXml._root._children)
    }).seq(function (children) {
      // log.debug('obj xml', children, 'xml', {max:1000, indent:2})
      log.debug('parsing des enfants de ' + xmlSuffix)
      parseEnfants(children, this)
    }).seq(function (enfants) {
      arbre.enfants = enfants
      next(null, arbre)
    }).catch(function (error) {
      next(error)
    })
  } // getAndParseXml

  /**
   * Retourne les valeurs par défaut d'un arbre de ressources calculatice
   * @param xmlSuffix
   * @returns {object} {titre: string, type: string, origine: string, idOrigine: *, categories: *[], publie: boolean, restriction: number, enfants: Array}
   */
  function getArbreDefaultValues (xmlSuffix) {
    var classe = (xmlSuffix === '6eme') ? xmlSuffix : xmlSuffix.toUpperCase()
    var titre = 'Ressources Calcul@tice ' + classe
    if (xmlSuffix === 'all') {
      titre = 'Exercices de calcul mental Calcul@TICE'
      niveaux = [
        config.constantes.niveaux.cp,
        config.constantes.niveaux.ce1,
        config.constantes.niveaux.ce2,
        config.constantes.niveaux.cm1,
        config.constantes.niveaux.cm2,
        config.constantes.niveaux['6e']
      ]
    } else if (xmlSuffix === '6eme') {
      niveaux = [config.constantes.niveaux['6e']]
    } else {
      niveaux = [config.constantes.niveaux[xmlSuffix]]
    }
    return {
      titre: titre,
      type: 'arbre',
      origine: 'calculatice',
      idOrigine: xmlSuffix,
      categories: [arbreCateg],
      niveaux: niveaux,
      publie: true,
      restriction: 0,
      enfants: []
    }
  }

  /**
   * Retourne une ressource à partir d'un child exercice
   * @param child
   * @returns {Ressource}
   */
  function getEcRessource (child) {
    var ressource
    if (child.attrib.uid) {
      ressource = {
        titre: '???',
        origine: 'calculatice',
        idOrigine: child.attrib.uid,
        categories: [config.constantes.categories.exerciceInteractif],
        niveaux: niveaux,
        parametres: {}
      }
      var swf, js, options
      child._children.forEach(function (elt) {
        if (elt.tag === 'nom') ressource.titre = elt.text
        else if (elt.tag === 'fichier') swf = elt.text
        else if (elt.tag === 'fichierjs') js = elt.text
        else if (elt.tag === 'options') options = elt.text
        else log.debug("tag d'enfant d'exo ec inconnu", elt)
      })
      if (options && options !== 'default') {
        try {
          ressource.parametres.options = JSON.parse(options)
        } catch (error) {
          log.debug("parsing d'options HS", options)
          log.error(new Error("erreur sur le parsing des options de l'exercice calculatice " + ressource.idOrigine +
                  ' : ' + error.toString() + '\navec\n' + options))
        }
      } else if (!options) {
        log.error(new Error('exercice calculatice ' + ressource.idOrigine + ' sans options'))
      }
      if (js) {
        ressource.type = 'ecjs'
        ressource.parametres.fichierjs = js
      } else if (swf) {
        ressource.type = 'ec2'
        ressource.parametres.fichier = swf
      }
    }

    return ressource
  } // getEcRessource

  /**
   * Passe à next les enfants d'un élément du xml
   * @param children
   * @param next callback(error, enfants)
   */
  function parseEnfants (children, next) {
    var enfants = []

    flow(children).seqEach(function (child) {
      var nextChild = this
      if (child.tag === 'exercice') {
        save(getEcRessource(child), function (error, ressource) {
          if (error) log.error(error)
          else enfants.push($ressourceConverter.toRef(ressource))
          nextChild()
        })
      } else if (child._children.length) {
        var enfant = {}
        enfant.type = 'arbre'
        enfant.titre = getNom(child._children)
        parseEnfants(child._children, function (error, ptifils) {
          if (error) {
            nextChild(error)
          } else {
            enfant.enfants = ptifils
            enfants.push(enfant)
            nextChild()
          }
        })
      } else {
        if (child.tag !== 'nom') log.debug('child ignoré', child)
        nextChild()
      }
    }).seq(function () {
      next(null, enfants)
    }).catch(function (error) {
      log.error(error)
      next(error)
    })
  } // parseEnfants

  /**
   * Renvoie le text du premier tag nom trouvé dans les enfants passés en argument
   * @param {object[]} children
   */
  function getNom (children) {
    var i = 0
    var nom
    while (!nom && i < children.length) {
      if (children[i].tag === 'nom') {
        nom = children[i].text
      }
      i++
    }

    return nom || '???'
  }

  /**
   * Enregistre une ressource
   * @param {Ressource} ressource
   * @param next Appelé avec (error, entiteRessource)
   */
  function save (ressource, next) {
    if (ressource.idOrigine) {
      $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceLoaded) {
        if (error) {
          log.error('pb au chargement : ' + error.toString(), ressource)
          next(new Error('Impossible de sauvegarder la ressource récupérée (probablement mal interprétée)'))
        } else {
          var ressourceNew = tools.clone(ressourceLoaded) || {}
          tools.update(ressourceNew, ressource)
          if (ressource.idOrigine == 1) { // eslint-disable-line eqeqeq
            log.debug('ressource 1 en bdd', ressourceLoaded.parametres)
            log.debug('ressource 1 passée', ressourceNew.parametres)
          }
          if (tools.isEqual(ressourceLoaded, ressourceNew)) {
            next(null, ressourceNew)
          } else {
            log.debug('ressource calculatice/' + ressource.idOrigine + ' modifiée')
            $ressourceRepository.write(ressourceNew, next)
          }
        }
      })
    } else {
      log.debug('ressource incomplète', ressource)
      log.error(new Error('ressource sans idOrigine'))
      next(new Error('ressource incomplète'))
    }
  }

  /**
   * Enregistre la ressource et affiche la réponse
   * @param {Context}   context
   * @param {Ressource} ressource
   */
  function saveAndSendReponse (context, ressource) {
    save(ressource, function (error, ressource) {
      $json.send(context, error, $ressourceConverter.toRef(ressource))
    })
  }

  /**
   * Le controleur
   * @param context
   */
  function xmlController (context) {
    $accessControl.isSesamathClient(context, function (error, isSesamathClient) {
      if (error) {
        log.error(error)
        $json.denied(context, error.toString())
      } else if (isSesamathClient) {
        var xmlSuffix = context.arguments.xml
        if (!xmlSuffix) throw new Error('Il manque un argument') // devrait jamais arriver

        if (xmlSuffix === 'all') {
          var arbreAll = getArbreDefaultValues(xmlSuffix)

          flow(xmls).seqEach(function (suffix) {
            var nextXml = this
            log.debug('pour all on lance ' + suffix)
            getAndParseXml(context, suffix, function (error, arbre) {
              if (error) {
                nextXml(error)
              } else {
                save(arbre, function (error, arbre) {
                  if (error) {
                    nextXml(error)
                  } else {
                    arbreAll.enfants.push($ressourceConverter.toRef(arbre))
                    nextXml()
                  }
                })
              }
            })
          }).seq(function () {
            saveAndSendReponse(context, arbreAll)
          }).catch(function (error) {
            $json.send(context, error)
          })
        } else {
          getAndParseXml(context, xmlSuffix, function (error, arbre) {
            if (error) $json.send(context, error)
            else saveAndSendReponse(context, arbre)
          })
        }
      } else {
        $json.denied(context, "Vous n'avez pas les droits suffisant pour accéder à cette commande")
      }
    })
  }
  xmlController.timeout = 60000

  controller.get(':xml', xmlController)
}
