/**
 * controller file is part of Sesatheque.
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
 * Controleur /ressource/ pour les utilisateurs authentifiés.
 *
 * Toutes ses routes exposées ici seront traitées par le controleur {@link controllerPublic} si on est pas authentifié (via une redirection interne)
 *
 * @controller controllerRessource
 * @requires $ressourceRepository {@link $ressourceRepository]
 * @requires $ressourceConverter
 * @requires $accessControl
 * @requires $personneControl
 * @requires $views
 * @requires $routes
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $views, $routes) {
  var _ = require('lodash')
  var tools = require('../tools')
  var flow = require('an-flow')
  var config = require('./config')

  /**
   * Crée un formToken et l'ajoute à la ressource et en session
   * @private
   * @param {Context} context
   * @param ressource
   */
  function addToken(context, ressource) {
    var token = $ressourceControl.getToken()
    if (!context.session.tokens) context.session.tokens = {}
    context.session.tokens[token] = ressource.oid
    ressource.token = token
  }

  /**
   * Vérifie que le token du post correspond à un en session (et le vire)
   * On gère plusieurs token de formulaires pour autoriser l'ouverture de plusieurs forms
   * @private
   * @param {Context}        context
   * @param {string|Integer} oid
   * @param {errorCallback} next appelé sans argument si ok, sinon on affichera une erreur
   */
  function checkToken(context, oid, next) {
    var token = context.post.token
    var result = (token && context.session.tokens && context.session.tokens[token] == oid)
    if (result) {
      delete context.session.tokens[token]
      next()
    } else {
      log.debug("checkToken KO, reçu " +token +" pour l'oid " +oid +" avec en session", context.session.tokens)
      next(new  Error("Jeton invalide, demande probablement déjà soumise et en cours de traitement"))
    }
  }

  /**
   * Affiche une 401 avec Authentification requise en html
   * @private
   * @param {Context} context
   * @param {string} [message="Authentification requise"]
   * @returns {boolean} true si authentifié
   */
  function denied(context, message) {
    if (!message) message = "Authentification requise"
    $views.printError(context, message, 401)
  }

  /**
   * Affiche le message existe pas ou droits insuffisant, avec un 404
   * @private
   * @param {Context} context
   * @param {string} [id=] Identifiant de la ressource (ou son titre), pour le mettre dans le message
   */
  function denied404(context, id) {
    var message = "La ressource " +id +" n'existe pas ou droits insuffisants"
    $views.printError(context, message, 404)
  }

  /**
   * Affiche un form en ajoutant un token à la ressource
   * @private
   * @param {Context}   context
   * @param {Error}     error
   * @param {Ressource} ressource
   * @param {string}    [titre] Le titre de la page
   */
  function printForm(context, error, ressource, titre) {
    if (error) log.error('une erreur au post update', error)
    if (ressource.errors) log.debug('errors au post update', ressource.errors)
    if (ressource.warnings) log.debug('warnings au post update avec force=' +context.post.force, ressource.warnings)
    addToken(context, ressource)
    var options
    if (titre) options = {$metas : {title: 'Ajouter une ressource'}}
    $views.printForm(context, error, ressource, options)
  }

  /**
   * Appelle next si on est authentifié ou redirige vers la même url en public
   * @private
   * @param {Context}  context Le contexte
   * @param {function} next    Sera appelée sans arguments si on est authentifié
   */
  function redirectOrContinue(context, next) {
    if ($accessControl.isAuthenticated(context)) next()
    else context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
  }

  /**
   * Vérifie les droits avant d'appeler $views.prepareAndSend
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   * @param view
   * @param options
   */
  function send(context, error, ressource, view, options) {
    if (ressource && !$accessControl.hasReadPermission(context, ressource)) {
      ressource = null // prepare & send renverra son 404 habituel
    }
    $views.prepareAndSend(context, error, ressource, view, options)
  }

  /**
   * Page describe
   * @route GET /ressource/decrire/:oid
   */
  controller.get($routes.get('describe', ':oid'), function (context) {
    context.layout = 'page'
    redirectOrContinue(context, function () {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        send(context, error, ressource, 'describe')
      })
    })
  })

  /**
   * Page describe par id d'origine
   * @route GET /ressource/decrire/:origine/:idOrigine
   */
  controller.get($routes.get('describe', ':origine', ':idOrigine'), function (context) {
    context.layout = 'page'
    context.tab = 'describe'
    redirectOrContinue(context, function () {
      var origine = context.arguments.origine
      var idOrigine = context.arguments.idOrigine
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        send(context, error, ressource, 'describe')
      })
    })
  })

  /**
   * Page display (voir en pleine page, à priori pour mettre en iframe)
   * @route GET /ressource/voir/:oid
   */
  controller.get($routes.get('display', ':oid'), function (context) {
    context.layout = 'iframe'
    redirectOrContinue(context, function () {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        send(context, error, ressource, 'display', {$layout: '../../static/views/layout-iframe'})
      })
    })
  })

  /**
   * Page display (voir en pleine page, à priori pour mettre en iframe)
   * @route GET /ressource/voir/:origine/:idOrigine
   */
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    context.layout = 'iframe'
    redirectOrContinue(context, function () {
      var origine = context.arguments.origine
      var idOrigine = context.arguments.idOrigine
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        send(context, error, ressource, 'display')
      })
    })
  })

  /**
   * Page preview
   * @route GET /ressource/apercevoir/:oid
   */
  controller.get($routes.get('preview', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'preview'
    redirectOrContinue(context, function () {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        send(context, error, ressource, 'display')
      })
    })
  })

  /**
   * Page preview
   * @route GET /ressource/apercevoir/:origine/:idOrigine
   */
  controller.get($routes.get('preview', ':origine', ':idOrigine'), function (context) {
    context.layout = 'page'
    context.tab = 'preview'
    redirectOrContinue(context, function () {
      var origine = context.arguments.origine
      var idOrigine = context.arguments.idOrigine
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        send(context, error, ressource, 'display')
      })
    })
  })

  /**
   * Page ajout de ressource (le formulaire de création)
   * @route GET /ressource/ajouter
   */
  controller.get($routes.get('create'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'create'
    $accessControl.checkPermission('create', context, null, function (errorMsg) {
      // envoi des valeur au form
      function termine (ressource) {
        addToken(context, ressource)
        if (context.get.layout === 'iframe') ressource.layout = "iframe"
        $views.printForm(context, null, ressource, options)
      }

      var options = {$metas: {title: 'Ajouter une ressource'}}
      if (errorMsg) {
        denied(context, errorMsg)
      } else {
        if (context.get.clone) {
          $ressourceRepository.load(context.get.clone, function (error, ressource) {
            if (error) {
              $views.printError(context, error)
            } else if (ressource) {
              $ressourceConverter.addRelations(ressource, [config.constantes.relations.estVersionDe, ressource.oid])
              delete ressource.oid
              delete ressource.idOrigine
              ressource.origine = "local"
              termine(ressource)
            } else {
              $views.printError(context, "Ressource à dupliquer inexistante ou droits insuffisants pour la lire", 404)
            }
          })
        } else {
          termine({new:true, oid:0})
        }
      }
    })
  })

  /**
   * Traitement du formulaire d'ajout de ressource, réaffiche le form avec une erreur éventuelle ou
   * redirige vers le form d'édition (pour ajouter ce qui dépend du typeTechnique choisi)
   * @route POST /ressource/ajouter
   */
  controller.post($routes.get('create'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'create'
    var ressourcePosted = context.post
    var titrePage = 'Ajouter une ressource'

    if (context.post.oid) {
      $views.printError(context, "Impossible d'ajouter une ressource existante")
    } else {
      flow().seq(function () {
        checkToken(context, 0, this)

      }).seq(function () {
        var next = this
        $accessControl.checkPermission('create', context, ressourcePosted, function (errorMsg) {
          if (errorMsg) denied(context, errorMsg)
          else next()
        })

      }).seq(function () {
        // on fixe la date de màj avant validation
        if (!ressourcePosted.dateMiseAJour) ressourcePosted.dateMiseAJour = new Date();
        $ressourceControl.valideRessourceFromPost(context.post, false, this)

      }).seq(function (ressource) {
        ressourcePosted = ressource
        if (!_.isEmpty(ressource.errors)) printForm(context, null, ressource, titrePage)
        else if (!_.isEmpty(ressource.warnings) && !ressource.force) printForm(context, null, ressource, titrePage)
        else this(null, ressource)

      }).seq(function (ressource) {
        $personneControl.checkGroupes(context, null, ressource, this)

      }).seq(function (ressource) {
        $personneControl.checkPersonnes(context, null, ressource, this)

      }).seq(function (ressource) {
        $ressourceRepository.write(ressource, function (error, ressource) {
          // on veut gérér les erreurs ici car y'a un bug dans notre code
          if (error || !_.isEmpty(ressource.errors)) {
            log.error(new Error("on a une erreur au write mais pas au valide précédent"))
            printForm(context, error, ressource, 'Ajouter une ressource')
          } else {
            log.debug("Après le save on récupère l'oid " + ressource.oid + ", on lance le redirect")
            var url = $routes.getAbs('edit', ressource.oid)
            if (context.layout === "iframe") url += "?layout=iframe"
            context.redirect(url)
          }
        }) // write

      }).catch(function (error) {
        printForm(context, error, ressourcePosted, titrePage)
      })

    }
  })

  /**
   * Affichage du formulaire d'édition
   * @route GET /ressource/modifier/:oid
   */
  controller.get($routes.get('edit', ':oid'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'edit'
    // pas la peine de la charger si on est pas authentifié
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          log.error(error)
          $views.printError(context, "Probleme d'accès à la base de données")
        } else if (ressource) {
          if ($accessControl.hasPermission('update', context, ressource)) {
            var options = {
              $metas: {title: 'Modifier la ressource : ' + ressource.titre}
            }
            options.titre = ressource.titre
            addToken(context, ressource)
            $views.printForm(context, error, ressource, options)
          } else {
            // la ressource existe mais on donne pas l'info
            denied404(context, oid)
          }
        } else {
          // la ressource n'existe pas mais on donne pas l'info
          denied404(context, oid)
        }
      })
    } else {
      denied(context)
    }
  })

  /**
   * Traitement du formulaire d'édition, réaffiche le formulaire en cas d'erreur ou sauvegarde et redirige vers la description
   * @route POST /ressource/modifier/:oid
   */
  controller.post($routes.get('edit', ':oid'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'edit'
    var titrePage = "Modifier une ressource"
    var ressourceNew = context.post
    var ressourceOriginale

    if ($accessControl.isAuthenticated(context)) {
      flow().seq(function () {
        checkToken(context, ressourceNew.oid, this)

      }).seq(function () {
        $ressourceControl.valideRessourceFromPost(ressourceNew, false, this)

      }).seq(function (ressourceNormee) {
        if (!_.isEmpty(ressourceNew.errors)) {
          printForm(context, null, ressourceNew, titrePage)
        } else if (!_.isEmpty(ressourceNew.warnings) && ressourceNew.force !== "forced") {
          printForm(context, null, ressourceNew, titrePage)
        } else {
          ressourceNew = ressourceNormee
          // faut charger pour vérifier groupes et personnes
          $ressourceRepository.load(ressourceNew.oid, this)
        }

      }).seq(function (ressourceBdd) {
        if (!ressourceBdd) {
          var error = new Error("La ressource " +ressourceNew.oid +" n'existe plus")
          log.error(error)
          this(error)
        } else {
          ressourceOriginale = ressourceBdd
          $personneControl.checkGroupes(context, ressourceOriginale, ressourceNew, this)
        }

      }).seq(function (ressource) {
        ressourceNew = ressource
        $personneControl.checkPersonnes(context, ressourceOriginale, ressourceNew, this)

      }).seq(function (ressource) {
        ressourceNew = ressource
        _.merge(ressourceOriginale, ressource)
        $ressourceRepository.write(ressourceOriginale, this)

      }).seq(function (ressource) {
        var url = "/ressource/" + $routes.get('describe', ressource.oid) // pas getAbs pour ne pas aller vers /public/
        log.debug("update " + ressource.oid + " ok, on lance le redirect vers " + url)
        context.redirect(url)

      }).catch(function (error) {
        printForm(context, error, ressourceNew, titrePage)
      })
    } else {
      denied(context)
    }
  })

  /**
   * Affiche la demande de confirmation pour effacement
   * (utilise la vue describe pour montrer le détail de ce que l'on va effacer)
   * @route GET /ressource/supprimer/:oid
   */
  controller.get($routes.get('delete', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'delete'
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          log.error(error)
          $views.printError(context, "Une erreur est survenue, impossible de vérifier l'existence de la ressource")
        } else if (ressource) {
          $accessControl.checkPermission('delete', context, ressource, function (errorMsg) {
            if (errorMsg) {
              denied(context, errorMsg)
            } else {
              addToken(context, ressource)
              // faut ajouter le token dans les options, car c'est un rendu describe que l'on appelle (pas de form)
              // le token, présent pour delete qui utilise aussi la vue describe
              var options = {
                $metas     : {title: 'Supprimer la ressource : ' + ressource.titre},
                titre : ressource.titre,
                contentBloc: {
                  $view: __dirname +'/views/delete',
                  token : {
                    value:ressource.token,
                    name:'token',
                    hidden:true
                  }
                }
              }
              // la vue delete inclue la vue describe, faut les datas de describe
              send(context, error, ressource, 'describe', options)
            }
          })
        } else {
          $views.printError(context, "La ressource " +oid +" n'existe pas ou vous n'avez pas les droits suffisants pour la supprimer")
        }
      })
    } else {
      denied(context)
    }
  })

  /**
   * Traite la demande d'effacement et affiche le résultat
   * @route POST /ressource/supprimer
   */
  controller.post($routes.get('delete', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'delete'
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      var data = {
        $views     : __dirname + '/views',
        $metas     : {title: 'Suppression de ressource'},
        contentBloc: {$view: __dirname +'/views/delete'}
      }
      checkToken(context, oid, function () {
        // lassi demande de charger la ressource pour l'effacer, mais on vient de la mettre en cache
        $ressourceRepository.load(oid, function (error, ressource) {
          if (error) {
            log.error(error)
            data.contentBloc.error = "Impossible d'accéder à la ressource " + ressource.titre + ' (' + oid + ")"
          } else if (ressource) {
            if ($accessControl.hasPermission('delete', context, ressource)) {
              $ressourceRepository.delete(ressource, function (error) {
                if (error) {
                  log.error(error)
                  data.contentBloc.error = "Erreur lors de la suppression de la ressource " + ressource.titre + ' (' + oid + ')'
                } else {
                  data.contentBloc.deletedOid = oid
                  data.contentBloc.titre = ressource.titre
                }
                context.html(data)
              })
            } else {
              log.error(new Error("Token OK mais droits insuffisant pour effacer la ressource " + oid))
              $views.printError(context, "Erreur interne dans la vérification des droits")
            }
          } else {
            log.error(new Error("Token OK mais la ressource " + oid +" n'existe pas ou plus !"))
            $views.printError(context, "Erreur interne, ressource introuvable, probablement déjà effacée")
          }
        })
      })
    } else {
      denied(context)
    }
  })

  /**
   * Affiche ou traite le form de recherche (donc affiche les résultats)
   * @private
   * @param {Context} context
   */
  function search(context) {
    context.layout = 'page'
    redirectOrContinue(context, function () {
      if (_.isEmpty(context.get) || context.get.modify) {
        // form de recherche
        $views.printSearchForm(context)
      } else {
        // résultats
        log.debug('search reçoit', context.get)
        // faut passer en revue les critères
        var filters = []
        var crit = context.get
        var filter

        // les filtres, parmi les propriétés défini en conf
        for (var prop in crit) {
          if (crit.hasOwnProperty(prop) && config.labels.hasOwnProperty(prop) && crit[prop]) {
            filter = {
              index : prop,
              values: _.isArray(crit[prop]) ? crit[prop] : [crit[prop]]
            }
            filters.push(filter)
          }
        }
        log.debug("traduits en filters", filters)
        // @todo ajouter des critères de tri
        if (filters.length) {
          var options = {
            filters: filters
          }
          // getListe vérifiera que ces valeurs sont acceptables, mais on veut des entiers
          options.start = parseInt(crit.start, 10) || 0
          options.nb = parseInt(crit.nb, 10) || 25
          options.orderBy = crit.orderBy || 'oid'
          var visibilite = 'public'
          // avec une exception pour l'admin qui peut passer ?all=1
          if (context.get.all && $accessControl.hasAllRights(context)) visibilite = "all"
          $ressourceRepository.getListe(visibilite, options, function (error, ressources) {
            var data = $views.getDefaultData('liste')
            data.$metas.title = 'Résultats de la recherche'
            log.debug('liste avec les options', options)
            log.debug('qui remonte', ressources)
            if (error) data.contentBloc.error = error.toString()
            else {
              var nbInit = ressources.length
              // on filtre d'après les droits en lecture
              // @todo ajouter le filtrage dans la requete de recherche...
              ressources = $accessControl.getListeLisible(context, ressources)
              if (ressources.length < nbInit) {
                log.error((nbInit - ressources.length) +" ressources de la liste ont été filtrées par les droits avec " +context.request.originalUrl)
              }
              // les actions (en float right, dust sait pas boucler en partant de la fin, faudrait écrire un helper, on empile de droite à gauche)
              data.actions = {
                $view : __dirname +"/views/actions",
                links:[]
              }
              // lien suivant (si on est au max)
              if (ressources.length == options.nb) {
                crit.start = options.start + options.nb
                data.actions.links.push({html :tools.linkQs($routes.get('search'), 'Résultats suivants', crit)})
              }
              // "titre" avec le nb de ressources
              var html = ressources.length +' ressource'
              if (ressources.length) {
                html += 's (' + (options.start + 1) + ' à ' + (options.start + options.nb) + ')'
              }
              data.actions.links.push({html :html, selected:true})
              // liens précédents
              if (options.start) {
                // on démarre pas à 0, donc y'a des précédents
                crit.start = options.start - options.nb
                if (crit.start < 0) crit.start = 0
                data.actions.links.push({html : tools.linkQs($routes.get('search'), 'Résultats précédents', crit)})
              }
              // un spacer
              data.actions.links.push({spacer:true})
              // le lien pour modifier les critères
              data.actions.links.push({href: context.request.originalUrl +'&modify=1', value:"Modifier cette recherche"})
              // et on ajoute des liens sur chaque ressource
              data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
            }
            context.html(data)
          })
        } else {
          $views.printSearchForm(context, ["il faut choisir au moins un critère"])
        }
      }
    })
  }
  search.timeout = 3000
  /**
   * Affiche le formulaire de recherche (s'il n'y a pas de critères) ou la liste de résultat
   * @route GET /ressource/
   */
  controller.get($routes.get('search'), search)
}
