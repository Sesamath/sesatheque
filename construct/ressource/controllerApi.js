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

  var tools = require('../tools')

  var testConnexionDelay = 10*60*1000 // 10 min en ms

  /**
   * Met à jour une ressource issue de la bdd et appelle checkWriteAndOut pour vérifier les droits, l'enregistrer et sortir
   * ou sort avant avec une erreur
   * @param context
   * @param error
   * @param ressourceBdd
   * @param ressourceNew
   */
  function checkUpdateAndOut(context, error, ressourceBdd, ressourceNew) {
    if (error) {
      sendJson(context, error)
    } else {
      log.perf(context.response, 'loaded')
      if (ressourceBdd) _.merge(ressourceBdd, ressourceNew)
      else ressourceBdd = ressourceNew
      checkWriteAndOut(context, ressourceBdd)
    }
  }

  /**
   * Vérifie la validité de la ressource, les droits et enregistre la ressource
   * @param context
   * @param ressource
   */
  function checkWriteAndOut(context, ressource) {
    log.debug("dans cb api checkWriteAndOut on récupère", ressource, 'api', {max:500})
    var permission = ressource.oid ? 'update' : 'create'
    // hasPermission et pas checkPermission pour être synchrone et gérer nos messages
    if ($accessControl.hasPermission(permission, context, ressource)) {
      // on ajoute celui qui poste comme auteur, sauf si c'est un admin
      if (!$accessControl.hasAllRights(context)) {
        var userOid = $accessControl.getCurrentUserOid(context)
        if (!ressource.auteurs) ressource.auteurs = [userOid]
        else if (ressource.auteurs.indexOf(userOid) === -1) ressource.auteurs.push(userOid)
      }
      $ressourceRepository.write(ressource, function (error, ressource) {
        log.debug("et après $ressourceRepository.write", ressource, 'repository', {max:500})
        if (error) log.debug("avec l'erreur", error, 'repository')
        // oid - convertPost - valide+setVersion - store - store2 - fin
        //lassi.tmp[context.post.oid].m += '\tretSt ' +log.getElapsed(lassi.tmp[context.post.oid].s)
        //log.errorData(lassi.tmp[context.post.oid].m)
        if (error) sendJson(context, error)
        else {
          log.perf(context.response, 'written')
          if (context.get.format) {
            // on veut une ref (ou un autre format) en réponse, sendRessource le gère
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
   * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine, en GET ou POST)
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
   * Recupère une liste de ressource (d'après les argument get et post mergés) et l'envoie
   * @param context
   * @param visibility
   */
  function grabListe(context, visibility) {
    log.debug("grabListe " +visibility)
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
    log.debug("grabListe " +visibility, args)
    $ressourceRepository.getListe(visibility, args, function (error, ressources) {
      sendListe(context, error, ressources)
    })
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

  function optionsOk(context) {
    context.setHeader('Access-Control-Allow-Methods', 'POST OPTIONS');
    // et on laisse le middleware CORS faire son boulot
    context.next(null, '');
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
    if (error) sendJson(context, error)
    else {
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
      else if (format === 'compact') sendJson(context, null, $ressourceConverter.toCompactFormat(ressource))
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
    if (oid !== 'by') {
      $ressourceRepository.loadPublic(oid, function (error, ressource) {
        if (error) sendJson(context, error)
        else if (ressource) sendJson(context, null, ressource)
        else notFound(context, "La ressource " + oid + " n'existe pas ou n'est pas publique")
      })
    }
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
        } else {
          // faut la charger, ne serait-ce que pour savoir si elle existe
          if (ressource.oid) { // par oid
            $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
              checkUpdateAndOut(context, error, ressourceBdd, ressource)
            })
          } else if (ressource.origine && ressource.idOrigine) { // ou par origine/idOrigine
            $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceBdd) {
              checkUpdateAndOut(context, error, ressourceBdd, ressource)
            })
          } else if (ressource.origine === "local") {
            // seul cas autorisé où l'idOrigine n'est pas obligatoire ($ressourceRepository.write le créera)
            checkWriteAndOut(context, ressource)
          } else {
            throw new Error("Il faut fournir oid ou origine/idOrigine")
          }
        }

      } catch (error) {
        sendJson(context, error)
      }
    })
  }
  postRessource.timeout = 5000
  controller.post('ressource', postRessource)
  controller.options('ressource', optionsOk)

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
            else checkWriteAndOut(context, ressource)
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
  controller.options('ressource/addRelations', optionsOk)

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
   * Liste de ressources publiques d'après les filtres demandés (Cf README pour les filtres possibles)
   * @callback GET /api/liste/public
   */
  controller.get('liste/public', function (context) {
    grabListe(context, 'public')
  })

  /**
   * Liste de ressources publiques d'après les filtres demandés
   * Cf GET /api/public pour le format de la demande
   * @callback POST /api/liste/public
   */
  controller.post('liste/public', function (context) {
    grabListe(context, 'public')
  })
  controller.options('liste/public', optionsOk)

  /**
   * Liste de ressources publique corrections incluses
   * @callback GET /api/liste/prof
   */
  controller.get('liste/prof', function (context) {
    if ($accessControl.hasGenericPermission('correction', context)) {
      grabListe(context, 'correction')
    } else if ($accessControl.isAuthenticated(context)) {
      denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
    } else {
      denied(context, "Il faut être authentifié pour accéder aux corrigés")
    }
  })

  /**
   * Liste de ressources publique corrections incluses
   * @callback POST /api/liste/prof
   */
  controller.post('liste/prof', function (context) {
    if ($accessControl.hasGenericPermission('correction', context)) {
      grabListe(context, 'correction')
    } else if ($accessControl.isAuthenticated(context)) {
      denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
    } else {
      denied(context, "Il faut être authentifié pour accéder aux corrigés")
    }
  })
  controller.options('liste/prof', optionsOk)

  /**
   * Idem pour les ressources du user courant, mais on va faire un test sur le serveur sso si on est pas authentifié
   * @callback GET /api/liste/perso
   */
  controller.get('liste/perso', function (context) {
    log.debug("controleur GET /api/liste/perso", context.session)
    // cette url est suceptible d'être appelée
    var oid = $accessControl.getCurrentUserOid(context)
    log.debug("oid : " +oid)
    if (oid) {
      grabListe(context, 'auteur/' +oid)
    } else if (context.session.user && context.session.lastCheck && context.session.lastCheck > ((new Date()).getTime() - testConnexionDelay)) {
      // on redirige vers l'authentification qui nous rappellera ensuite avec un ticket
      var urlConnexion = context.request.originalUrl
      urlConnexion += context.request.originalUrl.indexOf('?') > 0 ? '&' : '?'
      urlConnexion += 'testConnexion'
      log.debug("GET api/perso redirige vers " +urlConnexion)
      context.redirect(urlConnexion)
    }
  })

  /**
   * Idem pour les ressources du user courant
   * @callback POST /api/liste/perso
   */
  controller.post('liste/perso', function (context) {
    var oid = $accessControl.getCurrentUserOid(context)
    if (oid) {
      grabListe(context, 'auteur/' +oid)
    } else {
      // on redirige vers l'authentification qui nous rappellera ensuite, mais on est en post
      // donc faut reconstruire l'url en GET d'après cette demande en post
      var urlConnexion = context.request.originalUrl
      urlConnexion += context.request.originalUrl.indexOf('?') ? '&' : '?'
      var queryString = ''
      for (var prop in context.post) {
        if (context.post.hasOwnProperty(prop)) queryString += '&' +prop +'=' +encodeURIComponent(context.post[prop])
      }
      queryString += '&connexion'
      if (context.request.originalUrl.indexOf('?')) urlConnexion += queryString
      // faut virer notre premier & (on est sûr qu'il existe même si y'avait pas de post grace au &connexion)
      else urlConnexion += '?' +queryString.substr(1)
      context.redirect(urlConnexion)
    }
  })
  controller.options('liste/perso', optionsOk)

  /**
   * Pour récupérer aussi toutes les ressources privées, faut avoir tous les droits
   * @callback GET /api/liste/all
   */
  function getAllBy(context) {
    // si on lance la requete faut filtrer d'après les droits avec $accessControl.getListeLisible,
    // donc il récupèrera pas forcément nb résultats :-/
    // franchement pas terrible, donc on laisse tomber et on vérifie les droits all avant de lancer la requete
    if ($accessControl.hasAllRights(context)) grabListe(context, 'all')
    else denied("Vous n'avez pas de droits suffisants pour consulter toutes les ressources (privées comprises)")
  }
  getAllBy.timeout = 3000
  controller.get('liste/all', getAllBy)

  /**
   * Pour récupérer aussi toutes les ressources privées, faut avoir tous les droits
   * @callback POST /api/liste/all
   */
  function postAllBy(context) {
    if ($accessControl.hasAllRights(context)) grabListe(context, 'all')
    else denied("Vous n'avez pas de droits suffisants pour consulter toutes les ressources (privées comprises)")
  }
  postAllBy.timeout = 3000
  controller.post('liste/all', postAllBy)
  controller.options('liste/all', optionsOk)
}
