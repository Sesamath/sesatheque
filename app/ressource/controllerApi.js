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
 * Controleur de la route /api/ (qui répond en json) pour les ressources
 * Toutes les routes contenant /public/ ignorent la session (cookies viré par varnish,
 * cela permet de mettre le résultat en cache et devrait être privilégié pour les ressources publiques)
 * @Controller controllerApi
 */
module.exports = function (controller, EntityAlias, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $json) {
  var _ = require('lodash')
  var request = require('request')
  var flow = require('an-flow')
  var tools = require('../tools')
  var config = require('../config')
  var configRessource = require('./config')
  var Alias = require('../constructors/Alias')

  /**
   * Efface une ressource d'après son id, appellera denied ou sendJson avec error ou deleted:id
   * @private
   * @param {Context} context
   * @param id
   */
  function deleteAndSend (context, id) {
    log.debug('dans cb api deleteRessource ' + id)
    // de toute façon lassi demande de charger la ressource pour l'effacer, on le fait ici pour vérifier les droits
    $ressourceRepository.load(id, function (error, ressource) {
      if (error) {
        $json.send(context, error)
      } else if (ressource) {
        $accessControl.checkPermission('delete', context, ressource, function (errorMessage) {
          if (errorMessage) {
            $json.denied(context, errorMessage)
          } else {
            $ressourceRepository.delete(ressource, function (error) {
              if (error) $json.send(context, error)
              // else $json.send(context, null, {error:"message d'erreur bidon"})
              else $json.sendOk(context, {deleted: id})
            })
          }
        })
      } else {
        log.debug('La ressource ' + id + " n'existait pas, on a rien effacé")
        // pas de ressource, on vérifie qu'il avait certains droits
        $json.send(context, new Error("Aucune ressource d'identifiant " + id))
      }
    })
  }

  /**
   * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine, en GET ou POST)
   * @private
   * @param {Context} context
   * @returns {string} oid ou origine/idOrigine ou undefined
   */
  function extractId (context) {
    var id
    if (context.post.origine && context.post.idOrigine) id = context.post.origine + '/' + context.post.idOrigine
    else if (context.get.origine && context.get.idOrigine) id = context.get.origine + '/' + context.get.idOrigine
    else id = context.post.oid || context.post.id || context.get.oid || context.get.id

    return id
  }

  /**
   * Traite GET|POST /api/liste/all
   * @private
   * @param {Context} context
   */
  function getListeAll (context) {
    // si on lance la requete faut filtrer d'après les droits avec $accessControl.getListeLisible,
    // donc il récupèrera pas forcément nb résultats :-/
    // franchement pas terrible, donc on laisse tomber et on vérifie les droits all avant de lancer la requete
    if ($accessControl.hasAllRights(context)) grabListe(context, 'all')
    else $json.denied(context, "Vous n'avez pas de droits suffisants pour consulter toutes les ressources (privées comprises)")
  }

  /**
   * Traite GET|POST /api/liste/prof
   * @private
   * @param {Context} context
   */
  function getListeProf (context) {
    if ($accessControl.hasGenericPermission('correction', context)) {
      grabListe(context, 'correction')
    } else if ($accessControl.isAuthenticated(context)) {
      $json.denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
    } else {
      $json.denied(context, 'Il faut être authentifié pour accéder aux corrigés')
    }
  }

  /**
   * Traite GET /api/liste/perso (appelé par sesatheque-client)
   * @private
   * @param {Context} context
   */
  function getListePerso (context) {
    /**
     * Ajoute des refs (en vérifiant qu'elles sont valides) à nos deux listes globales refs et sequenceModeles
     * @private
     * @param {Ressource[]|Alias[]} ressources La liste des ressources|aliases à ajouter après vérif de leur intégrité
     * @param {string}              droits     Les droits sur ces ressources (lettres WD pour Write & Delete)
     */
    function addRefs (ressources, droits) {
      ressources.forEach(function (ressource) {
        if (ressource.type === 'sequenceModele') {
          if (ressource.parametres) sequenceModeles.push(ressource.parametres)
          else log.errorData('sequenceModele sans parametres', ressource)
        } else {
          var alias = new Alias(ressource)
          if (alias.ref && alias.titre && alias.type && (alias.public || alias.cle)) {
            if (droits) alias.$droits = droits
            refs.push(alias)
          } else {
            log.errorData('ressource pas utilisable pour sesalab', ressource)
          }
        }
      })
    }
    var oid = $accessControl.getCurrentUserOid(context)
    // liste des ressources perso
    var refs = []
    // liste des sequenceModeles perso
    var sequenceModeles = []
    if (oid) {
      flow().seq(function () {
        $ressourceRepository.getListe('all', {filters: [{index: 'auteurs', values: [oid]}]}, this)
      }).seq(function (ressources) {
        if (ressources.length) addRefs(ressources, 'WD')
        $ressourceRepository.getListe('all', {filters: [{index: 'contributeurs', values: [oid]}]}, this)
      }).seq(function (ressources) {
        if (ressources.length) addRefs(ressources, 'W')
        EntityAlias.match('userOid').equals(oid).grab(this)
      }).seq(function (aliases) {
        if (aliases.length) addRefs(aliases, 'D')
        $json.sendOk(context, {liste: refs, sequenceModeles: sequenceModeles})
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    } else {
      $json.denied(context, "Il faut s'authentifier avant pour récupérer ses ressources personnelles")
    }
  }

  /**
   * Traite GET|POST /api/liste/public
   * @private
   * @param context
   */
  function getListePublic (context) {
    grabListe(context, 'public')
  }

  /**
   * Recupère une liste de ressource (d'après les argument get et post mergés) et l'envoie
   * @private
   * @param {Context} context
   * @param {string} visibility
   */
  function grabListe (context, visibility) {
    var args
    if (context.get.json) {
      args = tools.parse(context.get.json)
    } else {
      args = context.get
      // en get on a des string, faut parser ce qui devrait être un objet
      if (args.filters) {
        args.filters = tools.parse(args.filters)
      }
    }
    tools.merge(args, context.post)
    log.debug('grabListe ' + visibility, args)
    $ressourceRepository.getListe(visibility, args, function (error, ressources) {
      sendListe(context, error, ressources)
    })
  }

  /**
   * Répond sur certaines requetes OPTIONS
   * @private
   * @param {Context} context
   */
  function optionsOk (context) {
    log.debug('headers de la requete options', context.request.headers, 'xhr', {max: 5000, indent: 2})
    // on laisse le middleware CORS faire son boulot
    context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
  }

  /**
   * Répond ok pour les options delete
   * @private
   * @param {Context} context
   */
  function optionsDeleteOk (context) {
    context.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
    // context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept')
    // et on laisse le middleware CORS faire son boulot
    context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
  }

  // noinspection FunctionWithMoreThanThreeNegationsJS
  /**
   * Traite la ressource de POST /api/ressource
   * @private
   * @param {Context} context
   */
  function postRessource (context) {
    /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
     log.error(new Error('une trace pour ' +reqHttp)) */
    var ressourcePostee = context.post
    var ressourceOriginale

    if (context.perf) {
      var msg = 'start-'
      if (ressourcePostee.origine && ressourcePostee.idOrigine) msg += ressourcePostee.origine + '/' + ressourcePostee.idOrigine
      else msg += ressourcePostee.oid
      log.perf(context.response, msg)
    }

    log.debug('post /api/ressource a reçu', ressourcePostee, 'api', {max: 10000})

    if ($accessControl.isAuthenticated(context) || $accessControl.hasAllRights(context)) {
      flow().seq(function () {
        var next = this
        // faut la charger, ne serait-ce que pour savoir si elle existe
        if (ressourcePostee.oid) { // par oid
          $ressourceRepository.load(ressourcePostee.oid, next)
        } else if (ressourcePostee.origine && ressourcePostee.idOrigine) { // ou par origine/idOrigine
          $ressourceRepository.loadByOrigin(ressourcePostee.origine, ressourcePostee.idOrigine, next)
        } else if (ressourcePostee.origine) {
          // l'idOrigine n'est pas obligatoire ($ressourceRepository.write créera une clé si besoin
          next(null, ressourcePostee)
        } else {
          next(new Error('Il faut fournir oid ou au moins origine'))
        }
      }).seq(function (ressourceBdd) {
        if (log.perf) log.perf(context.response, 'loaded')
        if (ressourceBdd && ressourceBdd.oid) {
          if ($accessControl.hasPermission('update', context, ressourceBdd)) this(null, ressourceBdd)
          else $json.denied(context, "Vous n'avez pas les droits suffisants pour modifier cette ressource")
        } else {
          if ($accessControl.hasPermission('create', context, ressourcePostee)) this(null, null)
          else $json.denied(context, "Vous n'avez pas les droits suffisants pour créer cette ressource")
        }
      }).seq(function (ressourceBdd) {
        // on ajoute la catégorie si y'en a pas et qu'on peut la déduire
        var tt = ressourcePostee.type
        if (!ressourcePostee.categories && tt) ressourcePostee.categories = configRessource.categoriesToTypes[tt]
        // on valide le contenu
        // partiel si on le réclame ou si on a oid (ou idOrigine) sans titre ni catégorie
        var partial = !!context.get.partial
        if (!partial && !ressourcePostee.titre && !ressourcePostee.categories) {
          partial = (ressourcePostee.oid > 0 || (ressourcePostee.origine && ressourcePostee.idOrigine))
        }
        ressourceOriginale = ressourceBdd
        $ressourceControl.valideRessourceFromPost(ressourcePostee, partial, this)
      }).seq(function (ressourceNew) {
        // la ressource est cohérente, ou avec errors/warnings et c'est writeAndOut qui gèrera
        $personneControl.checkGroupes(context, ressourceOriginale, ressourceNew, this)
      }).seq(function (ressourceNew) {
        $personneControl.checkPersonnes(context, ressourceOriginale, ressourceNew, this)
      }).seq(function (ressourceNew) {
        if (ressourceOriginale) tools.update(ressourceOriginale, ressourceNew)
        else ressourceOriginale = ressourceNew
        writeAndOut(context, ressourceOriginale)
      }).catch(function (error) {
        $json.send(context, error)
      })
    } else {
      $json.denied(context, 'Vous devez être authentifié pour ajouter une ressource')
    }
  }

  /**
   * Ajoute des relations à une ressource
   * @private
   * @param {Context} context
   */
  function postRessourceAddRelations (context) {
    if (context.perf) {
      var msg = 'start-'
      if (context.post.origine && context.post.idOrigine) msg += context.post.origine + '/' + context.post.idOrigine
      else msg += context.post.oid
      log.perf(context.response, msg)
    }
    log.debug('post /api/ressource/addRelation a reçu', context.post, 'api')
    var relations = context.post.relations
    if (relations && relations.length) {
      var ref = extractId(context)

      if (ref) {
        $ressourceRepository.load(ref, function (error, ressource) {
          if (error) $json.send(context, error)
          else if (ressource) {
            if ($accessControl.hasPermission('update', context, ressource)) {
              var errors = $ressourceConverter.addRelations(ressource, relations)
              // rien changé
              if (errors === false) $json.sendOk(context, {oid: ressource.oid})
              // y'a eu des erreurs lors de l'ajout
              else if (errors.length) $json.send(context, errors)
              // ni l'un ni l'autre, faut sauvegarder
              else writeAndOut(context, ressource)
            } else {
              $json.denied(context, "Vous n'avez pas les droits suffisants pour modifier cette ressource")
            }
          } else {
            $json.notFound(context, 'La ressource ' + ref + " n'existe pas")
          }
        })
      } else {
        $json.send(context, new Error("pas d'identifiant de ressource"))
      }
    } else {
      $json.send(context, new Error('relations manquantes'))
    }
  }

  /**
   * Retourne un array pour jstree
   * @private
   * @param {Context} context
   * @param error
   * @param data
   */
  function sendJsonJstreeArray (context, error, data) {
    var errorMsg
    if (error) {
      errorMsg = (typeof error === 'string') ? error : error.toString()
      $json.send(context, null, {arrayOnly: [{text: 'Erreur : ' + errorMsg}]})
    } else if (!(data instanceof Array)) {
      log.error(new Error("sendJsonJstreeArray appelé avec autre chose qu'un array"))
      $json.send(context, null, data)
    } else {
      log.debug('sendJson va renvoyer le tableau', data, 'api')
      $json.send(context, null, {arrayOnly: data})
    }
  }

  /**
   * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
   * @private
   * @param {Context} context
   * @param error
   * @param ressources
   */
  function sendListe (context, error, ressources) {
    if (error) $json.send(context, error)
    else {
      var liste = []
      ressources = $accessControl.getListeLisible(context, ressources)
      if (ressources && ressources.length) {
        // on regarde le format reçu en get ou post
        var format = context.post.format || context.get.format
        ressources.forEach(function (ressource) {
          if (format === 'compact') liste.push($ressourceConverter.toCompactFormat(ressource))
          else if (format === 'full') liste.push(ressource)
          else liste.push($ressourceConverter.toRef(ressource))
        })
      }
      $json.sendOk(context, {liste: liste})
    }
  }

  /**
   * Renvoie la ressource (ou l'erreur) après avoir vérifié les droits, complète ou au format de context.get.format (alias ou compact ou normalized)
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   */
  function sendRessource (context, error, ressource) {
    log.debug('sendRessource api avec', ressource, 'avirer', {max: 5000})
    if (error) {
      $json.send(context, error)
    } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
      var format = context.get.format
      if (format === 'alias' || format === 'ref') {
        ressource = $ressourceConverter.toRef(ressource)
        // au format ref on ajoute les droits
        ressource.$droits = 'R'
        if ($accessControl.hasPermission('update', context, ressource)) ressource.$droits += 'W'
        if ($accessControl.hasPermission('delete', context, ressource)) ressource.$droits += 'D'
      } else if (format === 'compact') {
        ressource = $ressourceConverter.toCompactFormat(ressource)
      } else {
        // full, on ajoute la base
        if (!ressource.base) ressource.base = config.application.baseUrl
      }
      $json.send(context, null, ressource)
    } else {
      log.debug('lecture ko', ressource, 'avirer', {max: 5000})
      $json.notFound(context, 'Ressource inexistante ou droits insuffisants pour y accéder.')
    }
  }

  /**
   * Si la ressource contient des erreurs les renvoie, sinon l'enregistre et sort avec oid et warnings éventuels
   * ou le ?format= demandé (alias ou compact ou normalized, le reste donnant la ressource complète)
   * @private
   * @param {Context} context
   * @param ressource
   */
  function writeAndOut (context, ressource) {
    if (_.isEmpty(ressource._errors)) {
      $ressourceRepository.write(ressource, function (error, ressource) {
        log.debug('dans cb api writeAndOut après $ressourceRepository.write', ressource, 'repository', {max: 500})
        if (error) {
          $json.send(context, error)
        } else {
          log.perf(context.response, 'written')
          if (context.get.format) {
            // on veut la ressource formatée, sendRessource le gère
            sendRessource(context, null, ressource)
          } else {
            // on ne renvoie que l'oid et des warnings éventuels
            var data = {oid: ressource.oid}
            if (!_.isEmpty(ressource._warnings)) {
              data.warnings = ressource._warnings
            }
            $json.send(context, null, data)
          }
        }
      })
    } else {
      $json.send(context, ressource._errors)
    }
  }

  /**
   * Met éventuellement à jour un titre bateau si on en a un meilleur (asynchrone, lance la màj en bdd et rend la main)
   * @param ressource
   * @param newTitre
   */ /*
  function updateTitre(ressource, newTitre) {
    // on regarde si l'arbre nous apporte un titre que l'on aurait pas
    if (newTitre) {
      //noinspection SwitchStatementWithNoDefaultBranchJS
      switch (ressource.titre) {
            // titres par défaut mis par importMEPS
            case 'Exercice mathenpoche':
            case 'Aide mathenpoche':
            // titres par défaut mis par importLabomep
            case 'Message ou question':
            case 'Figure TracenPoche':
            case 'Test diagnostique':
            case 'Opération posée':
            case 'Exercice avec la calculatrice cassée':
            case 'Figure GeoGebra':
            case 'Page externe':
            case 'Exercice de calcul mental':
            case 'Animation interactive':
            case 'QCM interactif':
            case 'Exercice corrigé':
            case 'QCM':
            case 'Animation instrumenpoche':
            case 'Titre manquant':
            case 'Parcours interactif':
            case "Test diagnostique d'algèbre":
            case 'Exercice Calcul@TICE':
              // on sauvegarde le nouveau titre
              log.debug('titre de ' +ressource.oid +' changé : ' +ressource.titre +' => ' +newTitre)
              ressource.titre = newTitre
              $ressourceRepository.write(ressource) // pas de next, on laisse comme c'était si ça plante
          }
    }
  } /* */

  /**
   * Clone une ressource de la bibli courante en mettant l'utilisateur courant contributeur, avec publié et privé
   * Retourne {@link reponseRessourceOid}
   * @route GET /api/clone/:oid
   */
  controller.get('clone/:oid', function (context) {
    var oid = context.arguments.oid
    var userOid = $accessControl.getCurrentUserOid(context)
    if (userOid) {
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          $json.send(context, error)
        } else if (ressource) {
          if ($accessControl.hasReadPermission(context, ressource)) {
            if (configRessource.editable[ressource.type]) {
              // on clone
              delete ressource.oid
              delete ressource.idOrigine
              ressource.origine = 'local'
              // faut mettre le user en auteur sinon il aura pas le droit de supprimer
              if (ressource.auteurs.indexOf(userOid) < 0) ressource.auteurs.push(userOid)
              ressource.publie = true
              ressource.restriction = configRessource.constantes.restriction.prive
              if (!ressource.relations) ressource.relations = []
              ressource.relations.push([configRessource.constantes.relations.estVersionDe, oid])
              $ressourceRepository.write(ressource, function (error, ressource) {
                if (error) $json.send(context, error)
                else if (ressource && ressource.oid) $json.sendOk(context, {oid: ressource.oid})
                else $json.send(context, new Error("L'enregistrement de la ressource a échoué"))
              })
            } else {
              // on crée un alias, mais on regarde si on en a pas déjà un pour cette ressource
              EntityAlias.match('alias').equals(ressource.oid).match('base').equals(config.application.baseUrl).grabOne(function (error, alias) {
                if (error) {
                  $json.sendError(context, error.toString())
                } else if (alias) {
                  $json.sendOk(context, {oid: alias.oid})
                } else {
                  alias = EntityAlias.create(new Alias(ressource))
                  alias.userOid = userOid
                  alias.store(function (error, alias) {
                    if (error) $json.sendError(context, error)
                    else $json.sendOk(context, {oid: alias.oid})
                  })
                }
              })
            }
          } else {
            $json.denied(context, "Vous n'avez pas les droits suffisant pour lire la ressource " + oid)
          }
        } else {
          $json.notFound(context, 'La ressource ' + oid + " n'existe pas")
        }
      })
    } else {
      $json.denied(context, 'Vous devez être authentifié pour cloner une ressource')
    }
  })

  /**
   * Clone une ressource d'une autre sesatheque en mettant l'utilisateur courant en auteur
   * (sinon il pourra pas la supprimer), avec publié et privé
   * Retourne {@link reponseRessourceOid}
   * @route GET /api/externalClone/:oid?base=url
   */
  controller.get('externalClone/:oid', function (context) {
    /**
     * Ajoute $droits et envoie
     * @private
     * @param item
     */
    function sendItem (item) {
      item.$droits = 'WD'
      $json.send(context, null, item)
    }

    var oid = context.arguments.oid
    var base = context.get.base
    try {
      if (!base) throw new Error('Il faut préciser une base pour la ressource à cloner')
      if (!oid) throw new Error('Paramètre manquant')
      // on normalise avec slash de fin
      if (base.substr(-1) !== '/') base += '/'
      if (base === config.application.baseUrl) throw new Error('La source est déjà sur cette sésathèque, clonage externe inutile')
      var userOid = $accessControl.getCurrentUserOid(context)
      if (!userOid) throw new Error('Vous devez être authentifié pour créer une ressource')
      // on peut aller chercher la ressource
      var url = base + 'api/ressource/' + oid
      var options = {
        uri: url,
        gzip: true,
        json: true,
        timeout: 3000
      }
      request(options, function (error, response, ressource) {
        if (error) {
          $json.send(context, error)
        } else if (response.statusCode === 200 && ressource) {
          log.debug('externalClone a récupéré la ressource', ressource, 'clone', {max: 5000, indent: 2})
          if (configRessource.editable[ressource.type]) {
            // on vire ce que l'on ne veut plus
            ['oid', 'idOrigine', 'version', 'archiveOid', 'displayUri', 'describeUri', 'dataUri'].forEach(function (prop) {
              if (ressource.hasOwnProperty(prop)) delete ressource[prop]
            })
            // on impose qq propriétés
            ressource.origine = 'local'
            ressource.dateCreation = new Date()
            ressource.publie = true
            if (ressource.auteurs && ressource.auteurs.length) {
              if (!ressource.auteursParents) ressource.auteursParents = []
              ressource.auteurs.forEach(function (auteur) {
                ressource.auteursParents.push(base + 'auteur/' + auteur)
              })
            }
            ressource.auteurs = [userOid]
            ressource.restriction = configRessource.constantes.restriction.prive
            if (!ressource.relations) ressource.relations = []
            var originalUrl = base + 'ressource/' + configRessource.constantes.routes.describe + '/' + oid
            ressource.relations.push([configRessource.constantes.relations.estVersionDe, originalUrl])
            $ressourceRepository.write(ressource, function (error, ressource) {
              if (error) $json.send(context, error)
              else if (ressource && ressource.oid) sendItem(new Alias(ressource))
              else $json.sendError(context, new Error("L'enregistrement de la ressource a échoué"))
            })
          } else {
            // pas éditable, on en fait un alias, on regarde si on l'avait pas déjà
            EntityAlias.match('ref').equals(ressource.oid).match('base').equals(base).grabOne(function (error, alias) {
              if (error) {
                $json.send(context, error)
              } else if (alias) {
                sendItem(alias)
              } else {
                // faut le créer
                alias = EntityAlias.create(ressource)
                alias.userOid = userOid
                alias.base = base
                alias.store(function (error, alias) {
                  if (error) $json.sendError(context, error)
                  else sendItem(alias)
                })
              }
            })
          }
        } else {
          $json.notFound(context, 'La ressource ' + oid + " n'existe pas sur la sesatheque " + base)
        }
      })
    } catch (error) {
      $json.sendError(context, error.toString())
    }
  })

  /**
   * Loggue un user d'un sesalab localement, répond {success:true} ou {success:false, error:"message d'erreur"}
   * Dupliqué dans app/personne/controllerPersonne.js en html
   * @Route POST /api/connexion
   * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
   * @param {string} token   Le token de sesalab qui servira à récupérer le user
   */
  controller.get('connexion', function (context) {
    var token = context.get.token
    var origine = context.get.origine
    var timeout = 5000
    if (token && origine) {
      if (origine.substr(-1) !== '/') origine += '/'
      if (config.sesalabs.indexOf(origine) > -1) {
        var postOptions = {
          url: origine + 'api/utilisateur/check-token',
          json: true,
          content_type: 'charset=UTF-8',
          timeout: timeout,
          form: {
            token: token
          }
        }
        // on ne garde que le nom de domaine en origine
        var domaine = /https?:\/\/([a-z\.0-9]+(:[0-9]+)?)/.exec(origine)[1] // si ça plante fallait pas mettre n'importe quoi en config
        request.post(postOptions, function (error, response, body) {
          if (error) {
            $json.send(context, error)
          } else if (body.error) {
            $json.send(context, new Error(body.error))
          } else if (body.ok && body.utilisateur) {
            // on peut connecter
            $accessControl.loginFromSesalab(context, body.utilisateur, domaine, function (error) {
              log.debug('dans cb loginFromSesalab on a en session', context.session.user)
              if (error) $json.send(context, error)
              else $json.sendOk(context, {random: +new Date()})
            })
          } else {
            error = new Error('réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url)
            log.debug(error, body)
            $json.send(context, error)
          }
        })
      } else {
        $json.send(context, new Error('Origine ' + origine + 'non autorisée à se connecter ici'))
      }
    } else {
      $json.send(context, new Error('token ou origine manquant'))
    }
  })

  /**
   * Déconnecte l'utilisateur courant
   */
  controller.get('deconnexion', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      $accessControl.logout(context)
      $json.sendOk(context)
    } else {
      $json.sendOk(context, {warning: 'Utilisateur non connecté'})
    }
  })

  controller.get('deferAction/saveRessource/:id', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      var id = context.arguments.id
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) {
          $json.sendError(context, error)
        } else if (ressource) {
          if ($accessControl.hasPermission('update', context, ressource)) {
            $ressourceRepository.saveDeferred(context, ressource, function (error, token) {
              if (!error && !token) error = new Error('saveDeferred ne renvoie ni erreur ni token')
              if (error) $json.sendError(context, error)
              else $json.sendOk(context, {url: config.application.baseUrl + 'api/deferAction/' + token})
            })
          } else {
            $json.denied(context, 'Vous n’avez pas les droits suffisants pour modifier cette ressource')
          }
        } else {
          $json.notFound(context, 'La ressource d’identifiant ' + id + ' n’existe pas')
        }
      })
    } else {
      $json.denied(context)
    }
  })

  /**
   * Forward un post (au unload on ne peut pas poster en crossdomain, on le fait en synchrone ici qui fera suivre)
   * @Route POST /api/deferPost
   */
  controller.post('deferPost', function (context) {
    var resultat = context.post
    log.debug('deferPost appelé avec', resultat)
    if (typeof resultat.deferUrl === 'string') {
      var ok = false
      var url = resultat.deferUrl
      delete resultat.deferUrl
      config.sesalabs.forEach(function (sesalab) {
        if (url.indexOf(sesalab) === 0) ok = true
      })
      if (ok) {
        var postOptions = {
          url: url,
          json: true,
          content_type: 'charset=UTF-8',
          timeout: 3000,
          headers: {
            'Cookie': context.request.cookies
          },
          form: context.post
        }
        request.post(postOptions, function (error, response, body) {
          // pas la peine de répondre personne n'écoute
          log.debug('deferPost, après envoi vers ' + postOptions.url + ' de ', postOptions.form)
          log.debug("on récupère l'erreur", error)
          log.debug('on récupère la réponse', response)
          log.debug('on récupère et le body', body)
          // mais si on renvoie rien ça donne une erreur 500 en timeout, context.next() donne une 404 car pas de contenu
          $json.sendOk(context)
        })
      } else {
        $json.send(context, new Error('deferPost appelé pour faire suivre à ' + resultat.defer + " qui n'est pas dans les sesalab autorisés"))
      }
    } else {
      $json.send(context, new Error('Il faut poster une url via deferUrl'))
    }
  })

  /**
   * Une url pour envoyer des notifications d'erreur, à priori par un client qui trouve des incohérences dans ce qu'on lui a envoyé
   * @Route POST /api/notifyError
   */
  controller.post('notifyError', function (context) {
    log('notifyError', context.post)
    if (context.post.ref) log.errorData('notifyError', context.post)
    else log.error('notifyError', context.post)
    $json.sendOk(context)
  })
  controller.options('notifyError', optionsOk)

  /**
   * Récupère un arbre au format jstree (cf le plugin arbre pour un exemple d'utilisation)
   * @route GET /api/jstree?ref=xx[&children=1]
   * @param {string} ref        Un oid ou origine/idOrigine
   * @param {string} [children] Passer 1 pour ne récupérer que les enfants
   */
  controller.get('jstree', function (context) {
    var ref = context.get.ref || context.get.id
    var onlyChildren = !!context.get.children
    if (ref) {
      $ressourceRepository.load(ref, function (error, ressource) {
        if (error) {
          sendJsonJstreeArray(context, error)
        } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
          var jstData
          if (onlyChildren) {
            if (ressource.type === 'arbre') {
              jstData = $ressourceConverter.getJstreeChildren(ressource)
              log.debug('à partir de', ressource, 'avirer', {max: 5000, indent: 2})
              log.debug('on récupère les enfants', jstData, 'avirer', {max: 5000, indent: 2})
              sendJsonJstreeArray(context, null, jstData)
            } else {
              sendJsonJstreeArray(context, "impossible de réclamer les enfants d'une ressource qui n'est pas un arbre")
            }
          } else {
            jstData = $ressourceConverter.toJstree(ressource)
            sendJsonJstreeArray(context, null, [jstData]) // il veut toujours un Array (liste d'élément), ici le root
          }
        } else {
          sendJsonJstreeArray(context, 'la ressource ' + ref + " n'existe pas ou vous n'avez pas suffisamment de droits pour y accéder")
        }
      })
    } else {
      sendJsonJstreeArray(context, 'il faut fournir un id de ressource')
    }
  })

  getListeAll.timeout = 3000
  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin.
   * Retourne {@link reponseListe}
   * @route GET /api/liste/all
   * @param {requeteListe}
   */
  controller.get('liste/all', getListeAll)
  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
   * Retourne {@link reponseListe}
   * @route POST /api/liste/all
   * @param {requeteListe}
   */
  controller.post('liste/all', getListeAll)
  /**
   * Ajoute aux headers cors habituels le header
   * Access-Control-Allow-Methods', 'POST, OPTIONS'
   * @route OPTIONS /api/liste/all
   */
  controller.options('liste/all', optionsOk)

  /**
   * Récupère la liste des ressources d'un groupe
   * Retourne {@link reponseListe}
   * @route GET /api/liste/groupe/:nom
   */
  controller.get('liste/groupe/:nom', function (context) {
    var nom = context.arguments.nom
    grabListe(context, 'groupe/' + nom)
  })
  controller.options('liste/groupe/:nom', optionsOk)

  getListePerso.timeout = 3000
  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant)
   * Retourne {@link reponseListe}
   * @route GET /api/liste/perso
   * @param {requeteListe}
   */
  controller.get('liste/perso', getListePerso)
  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant), retourne {@link reponseListe}
   * @route POST /api/liste/perso
   * @param {requeteListe}
   */
  controller.post('liste/perso', getListePerso)
  /**
   * Pour le preflight, ajoute les headers allow… si autorisé
   * @route OPTIONS /api/liste/perso
   * @param {requeteListe}
   */
  controller.options('liste/perso', optionsOk)

  getListeProf.timeout = 3000
  /**
   * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
   * @route GET /api/liste/prof
   * @param {requeteListe}
   */
  controller.get('liste/prof', getListeProf)
  /**
   * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
   * @route POST /api/liste/prof
   * @param {requeteListe}
   */
  controller.post('liste/prof', getListeProf)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/liste/prof
   */
  controller.options('liste/prof', optionsOk)

  /**
   * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
   * @route GET /api/liste/public
   * @param {requeteListe}
   */
  controller.get('liste/public', getListePublic)
  /**
   * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
   * @route POST /api/liste/public
   * @param {requeteListe}
   */
  controller.post('liste/public', function (context) {
    grabListe(context, 'public')
  })
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods: POST OPTIONS
   * @route OPTIONS /api/liste/public
   */
  controller.options('liste/public', optionsOk)

  /**
   * Retourne la ressource publique et publiée (sinon 404) d'après son oid, accepte ?format=(alias|compact|normalized)
   * Retourne {@link reponseListe}
   * @route GET /api/public/:oid
   * @param {Integer} :oid
   */
  controller.get('public/:oid', function (context) {
    var oid = context.arguments.oid
    if (oid !== 'by') {
      $ressourceRepository.loadPublic(oid, function (error, ressource) {
        if (error) $json.send(context, error)
        else if (ressource) sendRessource(context, null, ressource)
        else $json.notFound(context, 'La ressource ' + oid + " n'existe pas ou n'est pas publique")
      })
    }
  })

  /**
   * Retourne la ressource publique et publiée (sinon 404) d'après son id d'origine, accepte ?format=(alias|compact|normalized)
   * Retourne {@link reponseRessource}
   * @route GET /api/public/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) $json.send(context, error)
      else if (ressource && ressource.restriction === 0) sendRessource(context, null, ressource)
      else $json.notFound(context, 'La ressource ' + origine + '/' + idOrigine + " n'existe pas ou n'est pas publique")
    })
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:origine/:idOrigine
   */
  controller.delete('public/:origine/:idOrigine', function (context) {
    $json.denied(context, 'droits insuffisant pour effacer cette ressource')
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:oid
   */
  controller.delete('public/:oid', function (context) {
    $json.denied(context, 'droits insuffisant pour effacer cette ressource')
  })

  postRessource.timeout = 5000
  /**
   * Create / update une ressource
   * Prend un objet ressource, éventuellement incomplète mais oid ou origine/idOrigine sont obligatoires
   * Si le titre et la catégorie sont manquants, ou que l'on passe ?merge=1 à l'url, ça merge avec la ressource
   * existante que l'on update, sinon on écrase (ou on créé si elle n'existait pas)
   *
   * Retourne {@link reponseRessourceOid} ou {@link reponseRessourceAlias} si on le réclame avec ?format=alias
   * @route POST /api/ressource
   * @param {object} Les propriétés de la ressource
   */
  controller.post('ressource', postRessource)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/ressource
   */
  controller.options('ressource', optionsOk)

  /**
   * Retourne la ressource d'après son oid (si on a les droit de lecture dessus), accepte ?format=(alias|compact|normalized)
   * Au format {@link reponseRessource} ou {@link reponseRessourceAlias} si on le réclame avec ?format=alias
   * @Route GET /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.get('ressource/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Retourne la ressource d'après son id d'origine (si on a les droit de lecture dessus), accepte ?format=(alias|compact|normalized)
   * Au format {@link reponseRessource} ou {@link reponseRessourceAlias} si on le réclame avec ?format=alias
   * @route GET /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.get('ressource/:origine/:idOrigine', function (context) {
    var idOrigine = context.arguments.idOrigine
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Delete ressource par oid, retourne {@link reponseDeleted}
   * @route DEL /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.delete('ressource/:oid', function (context) {
    deleteAndSend(context, context.arguments.oid)
  })
  controller.options('ressource/:oid', optionsDeleteOk)

  /**
   * Delete alias par oid, retourne {@link reponseDeleted}
   * @route DEL /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.delete('alias/:oid', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      EntityAlias.match('oid').equals(context.arguments.oid).grabOne(function (error, alias) {
        if (error) {
          $json.sendError(context, error)
        } else if (alias) {
          if (alias.userOid && alias.userOid === $accessControl.getCurrentUserOid(context)) {
            alias.delete(function (error) {
              if (error) $json.sendError(context, error)
              else $json.sendOk(context)
            })
          } else {
            $json.sendError(context, "Vous n'êtes pas propriétaire de cet alias, impossible de le supprimer")
          }
        } else {
          $json.sendError(context, "Cet alias n'existe pas ici")
        }
      })
    } else {
      $json.denied(context, 'droits insuffisant pour effacer cette ressource')
    }
  })
  controller.options('alias/:oid', optionsDeleteOk)

  /**
   * Delete par id d'origine, retourne {@link reponseDeleted}
   * @route DEL /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.delete('ressource/:origine/:idOrigine', function (context) {
    var ref = context.arguments.origine + '/' + context.arguments.idOrigine
    deleteAndSend(context, ref)
  })
  controller.options('ressource/:origine/:idOrigine', optionsDeleteOk)

  postRessourceAddRelations.timeout = 5000
  /**
   * Ajoute des relations à une ressource (pour identifier la ressource on accepte dans le post oid ou origine+idOrigine ou ref)
   * Retourne {@link reponseRessourceOid} ou {@link reponseRessourceAlias} si on le réclame avec ?format=alias
   * @param {Integer} [oid]
   * @param {string} [origine]
   * @param {string} [idOrigine]
   * @param {string} [ref]
   * @param {Array} relations
   * @route POST /api/ressource/addRelations
   */
  controller.post('ressource/addRelations', postRessourceAddRelations)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/ressource/addRelations
   */
  controller.options('ressource/addRelations', optionsOk)
}

/**
 * Format de la réponse à une demande de suppression
 * @typedef reponseDeleted
 * @type {Object}
 * @property {boolean} success
 * @property {string}  [error] Message d'erreur éventuel (si success vaut false)
 * @property {string}  deleted L'id passé en argument (DEPRECATED, pour compatibilité avec les versions anterieures)
 */

/**
 * Format de la réponse à une demande de liste
 * @typedef reponseListe
 * @type {Object}
 * @property {boolean}                     success
 * @property {string}                      [error] Message d'erreur éventuel
 * @property {Alias[]|Compact[]|Ressource[]} liste   Une liste d'Alias si aucun format n'a été précisé
 */

/**
 * La réponse à une demande de ressource
 * @typedef reponseRessource
 * @type {Object}
 * @property {boolean}   success
 * @property {string}    [error]        Message d'erreur éventuel
 * @property {string[]}  [warnings]     Avertissements éventuels sur la ressource (incohérences ne justifiant pas une erreur et le rejet de l'enregistrement)
 * @property {Integer}   oid
 * @property {string}    titre
 * @property {Integer[]} categories
 * @property {string}    type
 * @property … Autre propriétés d'une ressource
 */

/**
 * La réponse à un post pour enregistrer une ressource (ou une modif)
 * @typedef reponseRessourceOid
 * @type {Object}
 * @property {boolean}  success
 * @property {string}   [error]    Message d'erreur éventuel
 * @property {string[]} [warnings] Avertissements éventuels sur la ressource (incohérences ne justifiant pas une erreur et le rejet de l'enregistrement)
 * @property {Integer}  oid
 */
/**
 * La réponse à une demande de ressource au format alias Cf {@link $ressourceConverter.toRef}
 * @typedef reponseRessourceAlias
 * @type {Object}
 * @property {boolean}   success
 * @property {string}    [error]
 * @property {Integer}   ref
 * @property {string}    titre
 * @property {Integer[]} categories
 * @property {string}    type
 * @property {boolean}   public
 * @property {string}    base
 */

/**
 * Arguments à donner à une requête qui renvoie une liste de ressources
 * @typedef requeteListe
 * @type {Object}
 * @property {string}             [json]    Tous les paramètres qui suivent dans une chaîne json (GET seulement, ignoré en POST)
 * @property {requeteArgFilter[]} [filters] Les filtres à appliquer
 * @property {string}             [orderBy] Un nom d'index
 * @property {string}             [order]   Préciser 'desc' si on veut l'ordre descendant
 * @property {Integer}            [start]   offset
 * @property {Integer}            [nb]      Nombre de résultats voulus (Cf settings.ressource.limites.listeNbDefault, à priori 25),
 *                                          sera ramené à settings.ressource.limites.maxSql si supérieur (à priori 500)
 * @property {string}             [format]  compact|full par défaut on remonte les ressource au format {@link Alias}
 */

/**
 * Format d'un filtre à passer à une requete de demande de liste
 * @typedef requeteArgFilter
 * @type {Object}
 * @property {string} index  Le nom de l'index
 * @property {Array}  [values] Une liste de valeurs à chercher (avec des ou), remontera toutes les ressource ayant l'index si omis
 */
