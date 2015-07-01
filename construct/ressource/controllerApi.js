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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

/**
 * @file Controleur de la route api/*
 * POST /api/ressource
 * GET  /api/ressource/:oid Renvoie la ressource d'oid :oid
 * POST /api/ressourceMerge
 */
'use strict'

/**
 * Le controleur json du composant ressource (sur /api/)
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $ressourceControl
 * @param $accessControl
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl) {

  var _ = require('lodash')
  //var flow = require('an-flow')

  //var tools = require('../tools')

  /**
   * Efface une ressource d'après son id, appellera denied ou sendJson avec error ou deleted:id
   * @param context
   * @param id
   */
  function deleteAndSend(context, id) {
    log.debug("dans cb api deleteRessource " +id)
    // on donne pas d'info sur l'existence de la ressource
    var deniedMsg = "droits insuffisant pour effacer cette ressource"
    // avant d'aller plus loin on vérifie qu'on a une chance d'avoir les droits
    if (!$accessControl.isAuthenticated(context) && !$accessControl.hasAllRights(context)) {
      denied(context, deniedMsg)
    } else {
      // de toute façon lassi demande de charger la ressource pour l'effacer, on le fait ici pour vérifier les droits
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) {
          sendJson(context, error)
        } else if (ressource) {
          if ($accessControl.hasPermission('delete', context, ressource)) {
            $ressourceRepository.delete(ressource, function (error) {
              if (error) sendJson(context, error)
              else sendJson(context, null, {deleted: id})
            })
          } else {
            log.debug(deniedMsg + ' (' + id + ')')
            denied(context, deniedMsg)
          }
        } else {
          log.debug("La ressource " + id + " n'existait pas, on a rien effacé")
          // pas de ressource, on vérifie qu'il avait certains droits
          sendJson(context, new Error("Aucune ressource d'identifiant " + id))
        }
      })
    }
  }

  /**
   * Équivalent de context.denied en json
   * @param context
   * @param msg
   */
  function denied(context, msg) {
    if (!msg) msg = "Accès refusé"
    context.status = 403;
    context.json({error: msg})
  }

  /**
   * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine)
   * @param context
   * @returns {string} oid ou origine/idOrigine ou undefined
   */
  function extractId(context) {
    var id
    if (context.post.origine && context.post.idOrigine) id = context.post.origine + '/' + context.post.idOrigine
    else if (context.get.origine && context.get.idOrigine) id = context.get.origine + '/' + context.get.idOrigine
    else id = context.post.oid || context.post.id || context.get.oid || context.get.id

    return id
  }

  /**
   * Équivalent de context.notFound en json
   * @param {Context} context
   * @param {string}  msg
   */
  function notFound(context, msg) {
    if (!msg) msg = "Contenu inexistant"
    context.status = 404;
    context.json({error: msg})
  }

  /**
   * Callback générique de sortie
   * @param context
   * @param {string|Error} error
   * @param data
   */
  function sendJson(context, error, data) {
    if (error) {
      log.debug("sendJson va renvoyer l'erreur", error, 'api')
      // on logge l'erreur si s'en est vraiment une (pas les strings simples)
      if (error.stack) {
        log.error(error)
        error = error.toString()
      }
      context.json({error: error})
    } else {
      log.debug('sendJson va renvoyer', data, 'api')
      // pas la peine de faire le stringify pour rien, on teste avant
      // if (log.perf.out) log.perf(context.response, 'jsonSentLength ' +tools.stringify(data).length, true)
      // commenté car Content-Length dispo dans le onFinish, sauf 204 et 304 (logique)
      context.json(data)
    }
  }

  /**
   * Retourne un array pour jstree
   * @param context
   * @param error
   * @param data
   */
  function sendJsonJstreeArray(context, error, data) {
    var errorMsg
    if (error) {
      errorMsg = (typeof error === 'string') ? error : error.toString()
      sendJson(context, null, {arrayOnly:[{text:"Erreur : " +errorMsg}]})
    } else if (!data instanceof Array) {
      log.error(new Error("sendJsonJstreeArray appelé avec autre chose qu'un array"))
      sendJson(context, error, data)
    } else {
      log.debug('sendJson va renvoyer le tableau', data, 'api')
      sendJson(context, error, {arrayOnly:data})
    }
  }

  /**
   * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
   * @param context
   * @param error
   * @param ressources
   */
  function sendListe(context, error, ressources) {
    if (error) {
      sendJson(context, error)
    } else {
      var liste = []
      ressources = $accessControl.getListeLisible(context, ressources)
      if (ressources && ressources.length) {
        // on regarde le format reçu en get ou post
        var format = context.post.format || context.get.format
        ressources.forEach(function (ressource) {
          if (format === 'compact') liste.push($ressourceConverter.toCompactFormat(ressource))
          else if (format === 'ref') liste.push($ressourceConverter.toRef(ressource))
          else liste.push(ressource)
        })
      }
      sendJson(context, null, {success: true, liste: liste})
    }
  }

  /**
   * Renvoie la ressource (ou l'erreur) après avoir vérifié les droits, au format de context.get.format
   * @param context
   * @param error
   * @param ressource
   */
  function sendRessource(context, error, ressource) {
    if (error) {
      sendJson(context, error)
    } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
      var format = context.get.format
      if (format === 'ref') sendJson(context, null, $ressourceConverter.toRef(ressource))
      if (format === 'compact') sendJson(context, null, $ressourceConverter.toCompactFormat(ressource))
      else sendJson(context, null, ressource)
    } else {
      notFound(context, 'Ressource inexistante ou droits insuffisants pour y accéder.')
    }
  }

  /**
   * Met éventuellement à jour un titre bateau si on en a un meilleur (asynchrone, lance la màj en bdd et rend la main)
   * @param ressource
   * @param newTitre
   * /
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
              log.debug("titre de " +ressource.oid +" changé : " +ressource.titre +' => ' +newTitre)
              ressource.titre = newTitre
              $ressourceRepository.write(ressource) // pas de next, on laisse comme c'était si ça plante
          }
    }
  } /* */

  /**
   * Met à jour une ressource issue de la bdd et appelle write pour l'enregistrer et sortir
   * ou sort avant avec une erreur
   * @param context
   * @param error
   * @param ressourceBdd
   * @param ressourceNew
   * @param {Function} [final=write] Une fct next (sinon ce sera write)
   */
  function updateAndOut(context, error, ressourceBdd, ressourceNew, final) {
    if (error) {
      sendJson(context, error)
    } else {
      log.perf(context.response, 'loaded')
      // attention, le merge de lodash n'est pas récursif et n'écrase que les propriétés qui existent en destination
      _.merge(ressourceBdd, ressourceNew)
      if (final) final(context, ressourceBdd)
      else write(context, ressourceBdd)
    }
  }

  /**
   * Vérifie la validité de la ressource, les droits et enregistre la ressource
   * @param context
   * @param ressource
   */
  function write(context, ressource) {
    log.debug("dans cb api write on récupère", ressource, 'api', {max:500})
    var permission = ressource.oid ? 'update' : 'create'
    if ($accessControl.hasPermission(permission, context, ressource)) {
      $ressourceRepository.write(ressource, function (error, ressource) {
        log.debug("et après $ressourceRepository.write", ressource, 'repository', {max:500})
        if (error) log.debug("avec l'erreur", error, 'repository')
        // oid - convertPost - valide+setVersion - store - store2 - fin
        //lassi.tmp[context.post.oid].m += '\tretSt ' +log.getElapsed(lassi.tmp[context.post.oid].s)
        //log.errorData(lassi.tmp[context.post.oid].m)
        if (error) sendJson(context, error)
        else {
          log.perf(context.response, 'written')
          if (context.get.format === 'ref') {
            // on veut une ref en réponse, sendRessource gère le format
            sendRessource(context, null, ressource)
          } else {
            // on ne renvoie que l'oid et des warnings éventuels
            var data = {oid: ressource.oid}
            if (!_.isEmpty(ressource.warnings)) {
              data.warnings = ressource.warnings
            }
            sendJson(context, null, data)
          }
        }
      })
    } else {
      // denied
      var errorMsg = "Droits insuffisants"
      if (ressource.oid) errorMsg += " pour modifier la ressource " + ressource.oid
      else errorMsg += " pour ajouter une ressource"
      denied(context, errorMsg)
    }
  }


  /**
   * Read (accepte ?format=ref|compact)
   * @callback GET /api/ressource/:oid
   */
  controller.get('ressource/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })
  /**
   * Read byOrigine (accepte ?format=ref|compact)
   * @callback GET /api/ressource/:origine/:idOrigine
   */
  controller.get('ressource/:origine/:idOrigine', function (context) {
    var idOrigine = context.arguments.idOrigine
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })
  /**
   * Read public (sans session, accepte ?format=ref|compact)
   * @callback GET /api/public/:oid
   */
  controller.get('public/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.loadPublic(oid, function (error, ressource) {
      if (error) sendJson(context, error)
      else if (ressource) sendJson(context, null, ressource)
      else notFound(context, "La ressource " + oid + " n'existe pas ou n'est pas publique")
    })
  })
  /**
   * Read public byOrigine (sans session)
   * @callback GET /api/public/:origine/:idOrigine
   */
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) sendJson(context, error)
      else if (ressource && ressource.restriction === 0) sendJson(context, null, ressource)
      else notFound(context, "La ressource " + origine + '/' + idOrigine + " n'existe pas ou n'est pas publique")
    })
  })

  /**
   * Read au format jstree (accepte children=1 pour récupérer les enfants seulement)
   * @callback GET /api/jstree?ref=xx[&children=1]
   */
  controller.get('jstree', function (context) {
    var ref = context.get.ref || context.get.id
    var onlyChildren = !!context.get.children
    if (!ref) sendJsonJstreeArray(context, "il faut fournir une ref de ressource")
    $ressourceRepository.load(ref, function (error, ressource) {
      if (error) {
        sendJsonJstreeArray(context, error)
      } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
        var jstData
        if (onlyChildren) {
          if (ressource.typeTechnique === 'arbre') {
            jstData = $ressourceConverter.getJstreeChildren(ressource)
            sendJsonJstreeArray(context, null, jstData)
          } else {
            sendJsonJstreeArray(context, "impossible de réclamer les enfants d'une ressource qui n'est pas un arbre")
          }
        } else {
          jstData = $ressourceConverter.toJstree(ressource)
          sendJsonJstreeArray(context, null, [jstData]) // il veut toujours un Array (liste d'élément), ici le root
        }
      } else {
        sendJsonJstreeArray(context, "la ressource " +ref +" n'existe pas ou vous n'avez pas suffisamment de droits pour y accéder")
      }
    })
  })

  //noinspection FunctionWithMoreThanThreeNegationsJS
  /**
   * Create / update une ressource
   * Si le titre et la catégorie sont manquants (mais avec oid), ou que l'on passe merge=1 en paramètre,
   * on merge avec la ressource existante que l'on update,sinon on écrase ou on créé
   * Attention, c'est un merge au sens lodash du terme (chaque propriété présente écrase la précédente)
   * @callback POST /api/ressource
   * @param context
   */
  function postRessource(context) {
    /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
    log.error(new Error('une trace pour ' +reqHttp)) */
    if (context.perf) {
      var msg = 'start-'
      if (context.post.origine && context.post.idOrigine) msg += context.post.origine +'/' +context.post.idOrigine
      else msg += context.post.oid
      log.perf(context.response, msg)
    }
    // 1s ne suffit pas toujours en local, à cause d'insert mysql très lents, on met 2s dans le listener

    // partiel si on le réclame ou si on a oid (ou idOrigine) sans titre ni catégorie
    var partial = !!context.get.partial
    if (!partial && !context.post.titre && !context.post.categories) {
      partial = (context.post.oid > 0 || (context.post.origine && context.post.idOrigine))
    }

    log.debug('post /api/ressource a reçu', context.post, 'api', {max:1000})

    $ressourceControl.valideRessourceFromPost(context.post, partial, function (error, ressource) {
      try {
        if (error) {
          sendJson(context, error)
        } else if (partial) {
          // faut la charger
          if (ressource.oid) { // par oid
            $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
              updateAndOut(context, error, ressourceBdd, ressource)
            })
          } else { // ou par origine/idOrigine
            $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceBdd) {
              updateAndOut(context, error, ressourceBdd, ressource)
            })
          }
        } else write(context, ressource)

      } catch (error) {
        sendJson(context, error)
      }
    })
  }
  postRessource.timeout = 5000
  controller.post('ressource', postRessource)

  /**
   * Ajoute des relations à une ressource (pour identifier la ressource on accepte dans le post oid ou origine+idOrigine ou ref)
   * @param context
   * @callback POST /api/ressource/addRelations
   */
  function postRessourceAddRelations (context) {
    if (context.perf) {
      var msg = 'start-'
      if (context.post.origine && context.post.idOrigine) msg += context.post.origine +'/' +context.post.idOrigine
      else msg += context.post.oid
      log.perf(context.response, msg)
    }
    log.debug('post /api/ressource/addRelation a reçu', context.post, 'api')
    var relations = context.post.relations
    if (relations && relations.length) {
      var ref = extractId(context)

      if (ref) {
        $ressourceRepository.load(ref, function (error, ressource) {
          if (error) sendJson(context, error)
          else if (ressource) {
            var errors = $ressourceConverter.addRelations(ressource, relations)
            // rien changé
            if (errors === false) sendJson(context, null, {success: true, oid:ressource.oid})
            // y'a eu des erreurs
            else if (errors.length) sendJson(context, errors)
            // ni l'un ni l'autre, faut sauvegarder
            else {
              $ressourceRepository.write(ressource, function (error, ressource) {
                if (error) sendJson(context, error)
                else sendJson(context, null, {success: true, oid:ressource.oid})
              })
            }
          } else {
            notFound(context, "La ressource " + ref + " n'existe pas")
          }
        })
      } else {
        sendJson(context, "pas d'identifiant de ressource")
      }
    } else {
      sendJson(context, 'relations manquantes')
    }
  }
  postRessourceAddRelations.timeout = 5000
  controller.post('ressource/addRelations', postRessourceAddRelations)

  /**
   * Delete
   * @callback DEL /api/ressource/:oid
   */
  controller.delete('ressource/:oid', function (context) {
    deleteAndSend(context, context.arguments.oid)
  })
  /**
   * Delete par origine
   * @callback DEL /api/ressource/:origine/:idOrigine
   */
  controller.delete('ressource/:origine/:idOrigine', function (context) {
    var ref = context.arguments.origine +'/' +context.arguments.idOrigine
    deleteAndSend(context, ref)
  })
  /**
   * Delete denied sur api/public (rerouting from ressource si on a ni session ni token)
   * @callback DEL /api/public/:origine/:idOrigine
   */
  controller.delete('public/:origine/:idOrigine', function (context) {
    denied(context, "droits insuffisant pour effacer cette ressource")
  })
  /**
   * Delete denied sur api/public (rerouting from ressource si on a ni session ni token)
   * @callback DEL /api/public/:oid
   */
  controller.delete('public/:oid', function (context) {
    denied(context, "droits insuffisant pour effacer cette ressource")
  })

  /**
   * Liste d'après les filtres en json (qui peuvent être multiple)
   *
   * Le json doit contenir
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   * @callback POST /api/public/by
   */
  controller.post('public/by', function (context) {
    log.debug('api.public.by reçoit', context.post)
    $ressourceRepository.getListe('public', context.post, function (error, ressources) {
      sendListe(context, error, ressources)
    })
  })
  /**
   * Idem en incluant les corrections
   * @callback POST /api/prof/by
   */
  controller.post('prof/by', function (context) {
    if ($accessControl.hasGenericPermission('correction', context)) {
      $ressourceRepository.getListe('correction', context.post, function (error, ressources) {
        sendListe(context, error, ressources)
      })
    }
    else denied(context, "Il faut être authentifié pour accéder aux ressources prof")
  })
  /**
   * Idem pour les ressources du user courant
   * @callback POST /api/perso/by
   */
  controller.post('perso/by', function (context) {
    var oid = $accessControl.currentUserOid
    if (oid) {
      $ressourceRepository.getListe('auteur/' +oid, context.post, function (error, ressources) {
        if (error) sendJson(context, error)
        else sendJson(context, null, ressources)
      })
    } else {
      // on redirige vers l'authentification qui nous rappellera ensuite
      // @todo le module d'authentification devrait fournir une méthode pour ça
      var urlConnexion = context.request.originalUrl
      urlConnexion += context.request.originalUrl.indexOf('?') ? '&' : '?'
      urlConnexion += 'connexion'
      context.redirect(urlConnexion)
    }
  })

  /**
   * Liste d'après les filtres postés en json (qui peuvent être multiple)
   * Le json doit contenir
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   * - format : compact|ref pour n'avoir que des refs ou le format compact (Cf $ressourceConverter.toCompactFormat)
   * @callback POST /api/all/by
   */
  function postBy(context) {
    $ressourceRepository.getListe('all', context.post, function (error, ressources) {
      sendListe(context, error, ressources)
    })
  }
  postBy.timeout = 3000
  controller.post('by', postBy)

  /**
   * Liste d'après les filtres en json (qui peuvent être multiple), que l'on rend aussi dispo aussi en get
   * Les arguments peuvent être
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   * - format : compact|ref pour n'avoir que des refs ou le format compact (Cf $ressourceConverter.toCompactFormat)
   * et peuvent éventuellement être regroupés dans un seul argument json=
   * @callback GET /api/by
   */
  function getBy(context) {
    var options, errorMsg
    if (context.get.json) {
      try {
        options = JSON.parse(context.get.json)
        // faut l'ajouter ici pour que sendListe l'utilise
        if (options.format && !context.get.format) context.get.format = options.format
      } catch (error) {
        errorMsg = 'json invalide : ' +context.arguments.json
      }
    } else {
        options = context.get
    }
    if (_.isEmpty(options)) {
      errorMsg = "Il faut passer des critères de recherche"
    }
    if (errorMsg) {
      sendJson(context, null, {error:errorMsg})
    } else {
      $ressourceRepository.getListe('public', options, function (error, ressources) {
        sendListe(context, error, ressources)
      })
    }
  }
  getBy.timeout = 3000
  controller.get('by', getBy)
}
