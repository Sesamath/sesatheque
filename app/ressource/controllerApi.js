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

'use strict'

/**
 * Le controleur de la route /api/ (qui répond en json)
 * Toutes les routes contenant /public/ sont sans tenir compte de la session (cookies viré par varnish,
 * cela permet de mettre le résultat en cache et devrait être privilégié pour les ressources publiques)
 * @Controller controllerApi
 * @requires {@link $ressourceRepository}
 * @requires {@link $ressourceConverter}
 * @requires {@link $ressourceControl}
 * @requires {@link $accessControl}
 * @requires {@link $personneControl}
 */

module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $json) {
  var _ = require('lodash')
  var request = require('request')
  var flow = require('an-flow')
  var tools = require('../tools')
  var config = require("../config");
  var configRessource = require("./config");

  /**
   * Efface une ressource d'après son id, appellera denied ou sendJson avec error ou deleted:id
   * @private
   * @param {Context} context
   * @param id
   */
  function deleteAndSend(context, id) {
    log.debug("dans cb api deleteRessource " +id)
    if (!$accessControl.isAuthenticated(context)) {
      $json.denied(context, "Vous devez être authentifié pour effacer une ressource")
    } else {
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
                //else $json.send(context, null, {error:"message d'erreur bidon"})
                else $json.send(context, null, {deleted: id})
              })
            }
          })
        } else {
          log.debug("La ressource " + id + " n'existait pas, on a rien effacé")
          // pas de ressource, on vérifie qu'il avait certains droits
          $json.send(context, new Error("Aucune ressource d'identifiant " + id))
        }
      })
    }
  }

  /**
   * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine, en GET ou POST)
   * @private
   * @param {Context} context
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
   * Traite GET|POST /api/liste/all
   * @private
   * @param {Context} context
   */
  function getListeAll(context) {
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
  function getListeProf(context) {
    if ($accessControl.hasGenericPermission('correction', context)) {
      grabListe(context, 'correction')
    } else if ($accessControl.isAuthenticated(context)) {
      $json.denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
    } else {
      $json.denied(context, "Il faut être authentifié pour accéder aux corrigés")
    }
  }

  /**
   * Traite GET|POST /api/liste/perso
   * @private
   * @param {Context} context
   */
  function getListePerso(context) {
    var oid = $accessControl.getCurrentUserOid(context)
    if (oid) {
      grabListe(context, 'auteur/' +oid)
    } else {
      $json.denied(context, "Il faut s'authentifier avant pour récupérer ses ressources personnelles")
    }
  }

  /**
   * Traite GET|POST /api/liste/public
   * @private
   * @param context
   */
  function getListePublic(context) {
    grabListe(context, 'public')
  }

  /**
   * Recupère une liste de ressource (d'après les argument get et post mergés) et l'envoie
   * @private
   * @param {Context} context
   * @param visibility
   */
  function grabListe(context, visibility) {
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
   * Répond sur certaines requetes OPTIONS
   * @private
   * @param {Context} context
   */
  function optionsOk(context) {
    context.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept');
    // et on laisse le middleware CORS faire son boulot
    context.next(null, 'OK'); // ne pas renvoyer de chaîne vide sinon 404
  }

  /**
   * Répond ok pour les options delete
   */
  function optionsDeleteOk(context, method) {
    method = method || 'POST'
    context.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept');
    // et on laisse le middleware CORS faire son boulot
    context.next(null, 'OK'); // ne pas renvoyer de chaîne vide sinon 404
  }

  //noinspection FunctionWithMoreThanThreeNegationsJS
  /**
   * Traite la ressource de POST /api/ressource
   * @private
   * @param {Context} context
   */
  function postRessource(context) {
    /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
     log.error(new Error('une trace pour ' +reqHttp)) */
    var ressourcePostee = context.post
    var ressourceOriginale

    if (context.perf) {
      var msg = 'start-'
      if (ressourcePostee.origine && ressourcePostee.idOrigine) msg += ressourcePostee.origine +'/' +ressourcePostee.idOrigine
      else msg += ressourcePostee.oid
      log.perf(context.response, msg)
    }

    log.debug('post /api/ressource a reçu', ressourcePostee, 'api', {max:1000})

    if ($accessControl.isAuthenticated(context) || $accessControl.hasAllRights(context)) {
      flow().seq(function () {
        var next = this
        // faut la charger, ne serait-ce que pour savoir si elle existe
        if (ressourcePostee.oid) { // par oid
          $ressourceRepository.load(ressourcePostee.oid, next)
        } else if (ressourcePostee.origine && ressourcePostee.idOrigine) { // ou par origine/idOrigine
          $ressourceRepository.loadByOrigin(ressourcePostee.origine, ressourcePostee.idOrigine, next)
        } else if (ressourcePostee.origine === "local") {
          // seul cas autorisé où l'idOrigine n'est pas obligatoire ($ressourceRepository.write le créera)
          next(null, ressourcePostee)
        } else {
          next(new Error("Il faut fournir oid ou origine/idOrigine"))
        }

      }).seq(function (ressourceBdd) {
        if (log.perf) log.perf(context.response, 'loaded')
        if (ressourceBdd) {
          if ($accessControl.hasPermission("update", context, ressourceBdd)) this(null, ressourceBdd)
          else $json.denied(context, "Vous n'avez pas les droits suffisants pour modifier cette ressource")
        } else {
          if ($accessControl.hasPermission("create", context, ressourcePostee)) this(null, null)
          else $json.denied(context, "Vous n'avez pas les droits suffisants pour créer cette ressource")
        }

      }).seq(function (ressourceBdd) {
        // on ajoute la catégorie si y'en a pas et qu'on peut la déduire
        var tt = ressourcePostee.typeTechnique
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
        log.debug("fin checkGroupes & checkPersonnes")
        if (ressourceOriginale) tools.update(ressourceOriginale, ressourceNew)
        else ressourceOriginale = ressourceNew
        writeAndOut(context, ressourceOriginale)

      }).catch(function (error) {
        $json.send(context, error)
      })

    } else {
      $json.denied(context, "Vous devez être authentifié pour ajouter une ressource")
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
          if (error) $json.send(context, error)
          else if (ressource) {
            if ($accessControl.hasPermission("update", context, ressource)) {
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
            $json.notFound(context, "La ressource " + ref + " n'existe pas")
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
  function sendJsonJstreeArray(context, error, data) {
    var errorMsg
    if (error) {
      errorMsg = (typeof error === 'string') ? error : error.toString()
      $json.send(context, null, {arrayOnly:[{text:"Erreur : " +errorMsg}]})
    } else if (!data instanceof Array) {
      log.error(new Error("sendJsonJstreeArray appelé avec autre chose qu'un array"))
      $json.send(context, null, data)
    } else {
      log.debug('sendJson va renvoyer le tableau', data, 'api')
      $json.send(context, null, {arrayOnly:data})
    }
  }

  /**
   * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
   * @private
   * @param {Context} context
   * @param error
   * @param ressources
   */
  function sendListe(context, error, ressources) {
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
   * Renvoie la ressource (ou l'erreur) après avoir vérifié les droits, complète ou au format de context.get.format
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   */
  function sendRessource(context, error, ressource) {
    if (error) {
      $json.send(context, error)
    } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
      var format = context.get.format
      if (format === 'ref') $json.send(context, null, $ressourceConverter.toRef(ressource))
      else if (format === 'compact') $json.send(context, null, $ressourceConverter.toCompactFormat(ressource))
      else $json.send(context, null, ressource)
    } else {
      $json.notFound(context, 'Ressource inexistante ou droits insuffisants pour y accéder.')
    }
  }

  /**
   * Si la ressource contient des erreurs les renvoie, sinon l'enregistre et sort avec oid et warnings éventuels ou le format demandé
   * @private
   * @param {Context} context
   * @param ressource
   */
  function writeAndOut(context, ressource) {
    if (_.isEmpty(ressource.errors)) {
      $ressourceRepository.write(ressource, function (error, ressource) {
        log.debug("dans cb api writeAndOut après $ressourceRepository.write", ressource, 'repository', {max: 500})
        if (error) {
          $json.send(context, error)
        } else {
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
            $json.send(context, null, data)
          }
        }
      })
    } else {
      $json.send(context, ressource.errors)
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
              log.debug("titre de " +ressource.oid +" changé : " +ressource.titre +' => ' +newTitre)
              ressource.titre = newTitre
              $ressourceRepository.write(ressource) // pas de next, on laisse comme c'était si ça plante
          }
    }
  } /* */

  /**
   * Clone une ressource de la bibli courante en mettant l'utilisateur courant contributeur, avec publié et privé
   * @route GET /api/clone/:oid
   * @param {object} Les propriétés de la ressource
   * @returns {reponseRessourceOid}
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
            // on clone
            delete ressource.oid
            delete ressource.idOrigine
            ressource.origine = "local"
            if (ressource.contributeurs.indexOf(userOid) < 0) ressource.contributeurs.push(userOid)
            ressource.publie = true
            ressource.restriction = configRessource.constantes.restriction.prive
            if (!ressource.relations) ressource.relations = []
            ressource.relations.push([configRessource.constantes.relations.estVersionDe, oid])
            $ressourceRepository.write(ressource, function (error, ressource) {
              if (error) $json.send(context, error)
              else if (ressource && ressource.oid) $json.send(context, null, {success: true, oid: ressource.oid})
              else $json.send(context, new Error("L'enregistrement de la ressource a échoué"))
            })
          } else {
            $json.denied(context, "Vous n'avez pas les droits suffisant pour lire la ressource " + oid)
          }
        } else {
          $json.notFound(context, "La ressource " + oid + " n'existe pas")
        }
      })
    } else {
      $json.denied(context, "Vous devez être authentifié pour créer une ressource")
    }
  })

  /**
   * Clone une ressource d'une autre sesatheque en mettant l'utilisateur courant contributeur, avec publié et privé
   * @route GET /api/externalClone/:oid?sesathequeBase=url
   * @param {object} Les propriétés de la ressource
   * @returns {reponseRessourceOid}
   */
  controller.get('externalClone/:oid', function (context) {
    var oid = context.arguments.oid
    var sesathequeBase = context.get.sesathequeBase
    var userOid = $accessControl.getCurrentUserOid(context)
    if (userOid) {
      if (oid && sesathequeBase) {
        if (sesathequeBase.substr(-1) !== "/") sesathequeBase += "/"
        var options = {
          uri: sesathequeBase + "api/public/" + oid,
          gzip: true,
          json: true,
          timeout: 3000
        }
        request(options, function (error, response, ressource) {
          if (error) {
            $json.send(context, error)
          } else if (response.statusCode === 200 && ressource) {
            // on vire ce que l'on ne veut plus
            ["oid", "idOrigine", "version", "archiveOid", "displayUri", "describeUri", "dataUri"].forEach(function (prop) {
              if (ressource.hasOwnProperty(prop)) delete ressource[prop]
            })
            // on impose qq propriétés
            ressource.origine = "local"
            ressource.dateCreation = new Date()
            ressource.publie = true
            if (ressource.contributeurs.indexOf(userOid) < 0) ressource.contributeurs.push(userOid)
            ressource.restriction = configRessource.constantes.restriction.prive
            if (!ressource.relations) ressource.relations = []
            var originalUrl = sesathequeBase + "public/" + configRessource.constantes.routes.describe + "/" + oid
            ressource.relations.push([configRessource.constantes.relations.estVersionDe, originalUrl])
            $ressourceRepository.write(ressource, function (error, ressource) {
              if (error) $json.send(context, error)
              else if (ressource && ressource.oid) $json.send(context, null, {success: true, oid: ressource.oid})
              else $json.send(context, new Error("L'enregistrement de la ressource a échoué"))
            })
          } else {
            $json.notFound(context, "La ressource " + oid + " n'existe pas sur la sesatheque " + sesathequeBase)
          }
        })
      } else {
        $json.send(context, new Error("Paramètre manquant"))
      }
    } else {
      $json.denied(context, "Vous devez être authentifié pour créer une ressource")
    }
  })

  /**
   * Loggue un user d'un sesalab localement, répond {success:true} ou {success:false, error:"message d'erreur"}
   * @Route POST /api/connexion
   * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
   * @param {string} token   Le token de sesalab qui servira à récupérer le user
   */
  controller.get('connexion', function (context) {
    var token = context.get.token;
    var origine = context.get.origine;
    var timeout = 5000
    if (token && origine) {
      if (origine.substr(-1) !== "/") origine += "/"
      if (config.sesalabs.indexOf(origine) > -1) {
        var postOptions = {
          url: origine + "api/utilisateur/check-token",
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
              log.debug("dans cb loginFromSesalab on a en session", context.session.user)
              if (error) $json.send(context, error)
              else $json.sendOk(context)
            })
          } else {
            error = new Error('réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url)
            log.debug(error, body)
            $json.send(context, error)
          }
        })
      } else {
        $json.send(context, new Error("Origine " +origine +"non autorisée à se connecter ici"))
      }
    } else {
      $json.send(context, new Error("token ou origine manquant"))
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
      $json.send(context, "Utilisateur non connecté")
    }
  })

  /**
   * Forward un post (au unload on ne peut pas poster en crossdomain, on le fait en synchrone ici qui fera suivre)
   * @Route POST /api/deferPost
   */
  controller.post('deferPost', function (context) {
    var resultat = context.post
    log.debug("deferPost appelé avec", resultat)
    if (typeof resultat.deferUrl === "string") {
      var ok = false;
      var url = resultat.deferUrl;
      delete resultat.deferUrl;
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
            "Cookie": context.request.cookies
          },
          form: context.post
        }
        request.post(postOptions, function (error, response, body) {
          // pas la peine de répondre personne n'écoute
          log.debug("deferPost, après envoi vers " + postOptions.url + " de ", postOptions.form)
          log.debug("on récupère l'erreur", error)
          log.debug("on récupère la réponse", response)
          log.debug("on récupère et le body", body)
          // mais si on renvoie rien ça donne une erreur 500 en timeout, context.next() donne une 404 car pas de contenu
          $json.sendOk(context)
        })
      } else {
        $json.send(context, new Error("deferPost appelé pour faire suivre à " +resultat.defer +" qui n'est pas dans les sesalab autorisés"))
      }
    } else {
      $json.send(context, new Error("Il faut poster une url via deferUrl"))
    }
  })

  /**
   * Récupère un arbre au format jstree
   * @route GET /api/jstree?ref=xx[&children=1]
   * @param {string} ref        Un oid ou origine/idOrigine
   * @param {string} [children] Passer 1 pour ne récupérer que les enfants
   * @returns {Object} Un objet pour jstree (Cf le plugin arbre pour un exemple d'utilisation)
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


  getListeAll.timeout = 3000
  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
   * @route GET /api/liste/all
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.get('liste/all', getListeAll)
  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
   * @route POST /api/liste/all
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.post('liste/all', getListeAll)
  /**
   * Ajoute aux headers cors habituels le header
   * Access-Control-Allow-Methods', 'POST, OPTIONS'
   * @route OPTIONS /api/liste/all
   */
  controller.options('liste/all', optionsOk)


  getListePerso.timeout = 3000;
  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant)
   * @route GET /api/liste/perso
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.get('liste/perso', getListePerso)
  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant)
   * @route POST /api/liste/perso
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.post('liste/perso', getListePerso)
  /**
   * Pour le preflight
   * @route OPTIONS /api/liste/perso
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.options('liste/perso', optionsOk)


  getListeProf.timeout = 3000
  /**
   * Cherche parmi les ressources publiques ou les corrections
   * @route GET /api/liste/prof
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.get('liste/prof', getListeProf)
  /**
   * Cherche parmi les ressources publiques ou les corrections
   * @route POST /api/liste/prof
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.post('liste/prof', getListeProf)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/liste/prof
   */
  controller.options('liste/prof', optionsOk)


  /**
   * Cherche parmi les ressources publiques publiées
   * @route GET /api/liste/public
   * @param {requeteListe}
   * @returns {reponseListe}
   */
  controller.get('liste/public', getListePublic)
  /**
   * Cherche parmi les ressources publiques publiées
   * @route POST /api/liste/public
   * @param {requeteListe}
   * @returns {reponseListe}
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
   * Retourne la ressource publique et publiée (sinon 404) d'après son oid, accepte ?format=(ref|compact)
   * @route GET /api/public/:oid
   * @param {Integer} oid
   * @return {reponseRessource}
   */
  controller.get('public/:oid', function (context) {
    var oid = context.arguments.oid
    if (oid !== 'by') {
      $ressourceRepository.loadPublic(oid, function (error, ressource) {
        if (error) $json.send(context, error)
        else if (ressource) sendRessource(context, null, ressource)
        else $json.notFound(context, "La ressource " + oid + " n'existe pas ou n'est pas publique")
      })
    }
  })

  /**
   * Retourne la ressource publique et publiée (sinon 404) d'après son id d'origine, accepte ?format=(ref|compact)
   * @route GET /api/public/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   * @return {reponseRessource}
   */
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) $json.send(context, error)
      else if (ressource && ressource.restriction === 0) sendRessource(context, null, ressource)
      else $json.notFound(context, "La ressource " + origine + '/' + idOrigine + " n'existe pas ou n'est pas publique")
    })
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:origine/:idOrigine
   */
  controller.delete('public/:origine/:idOrigine', function (context) {
    $json.denied(context, "droits insuffisant pour effacer cette ressource")
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:oid
   */
  controller.delete('public/:oid', function (context) {
    $json.denied(context, "droits insuffisant pour effacer cette ressource")
  })

  postRessource.timeout = 5000
  /**
   * Create / update une ressource
   * Prend un objet ressource, éventuellement incomplète mais oid ou origine/idOrigine sont obligatoires
   * Si le titre et la catégorie sont manquants, ou que l'on passe ?merge=1 à l'url, ça merge avec la ressource
   * existante que l'on update, sinon on écrase (ou on créé si elle n'existait pas)
   *
   * Retourne d'autres propriétés de la ressource enregistrée si on le réclame avec ?format=(ref|compact)
   * @route POST /api/ressource
   * @param {object} Les propriétés de la ressource
   * @returns {reponseRessourceOid|reponseRessourceRef}
   */
  controller.post('ressource', postRessource)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/ressource
   */
  controller.options('ressource', optionsOk)

  /**
   * Retourne la ressource d'après son oid (si on a les droit de lecture dessus), accepte ?format=(ref|compact)
   * @Route GET /api/ressource/:oid
   * @param {Integer} oid
   * @return {reponseRessource}
   */
  controller.get('ressource/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Retourne la ressource d'après son id d'origine (si on a les droit de lecture dessus), accepte ?format=(ref|compact)
   * @route GET /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   * @return {reponseRessource}
   */
  controller.get('ressource/:origine/:idOrigine', function (context) {
    var idOrigine = context.arguments.idOrigine
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Delete par oid
   * @route DEL /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.delete('ressource/:oid', function (context) {
    deleteAndSend(context, context.arguments.oid)
  })
  controller.options('ressource/:oid', optionsDeleteOk)

  /**
   * Delete par id d'origine
   * @route DEL /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.delete('ressource/:origine/:idOrigine', function (context) {
    var ref = context.arguments.origine +'/' +context.arguments.idOrigine
    deleteAndSend(context, ref)
  })
  controller.options('ressource/:origine/:idOrigine', optionsDeleteOk)

  postRessourceAddRelations.timeout = 5000
  /**
   * Ajoute des relations à une ressource (pour identifier la ressource on accepte dans le post oid ou origine+idOrigine ou ref)
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
 * Format de la réponse à une demande de liste
 * @typedef reponseListe
 * @type {Object}
 * @property {boolean}                     success
 * @property {string}                      [error] Message d'erreur éventuel
 * @property {Ref[]|Compact[]|Ressource[]} liste   Une liste de Ref si aucun format n'a été précisé
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
 * @property {string}    typeTechnique
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
 * La réponse à une demande de ressource au format ref Cf {@link $ressourceConverter.toRef}
 * @typedef reponseRessourceRef
 * @type {Object}
 * @property {boolean}   success
 * @property {string}    [error]
 * @property {Integer}   ref
 * @property {string}    titre
 * @property {Integer[]} categories
 * @property {string}    typeTechnique
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
 * @property {string}             [format]  compact|full par défaut on remonte les ressource au format ref
 */

/**
 * Format d'un filtre à passer à une requete de demande de liste
 * @typedef requeteArgFilter
 * @type {Object}
 * @property {string} index  Le nom de l'index
 * @property {Array}  [values] Une liste de valeurs à chercher (avec des ou), remontera toutes les ressource ayant index si omis
 */
