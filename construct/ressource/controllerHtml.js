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

module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $views, $routes) {
/**
 * Le controleur html du composant ressource.
 *
 * Toutes ses routes exposées ici seront traitées par le controleur {@link /public/} si on est pas authentifié
 *
 * On ne fixe pas de layout dans les data renvoyées mais dans le contexte (page|iframe), le listener beforeTransport en déduira
 * ce qu'il doit ajouter dans data
 * @name controller
 * @Controller /ressource/
 * @requires $ressourceRepository
 * @requires $ressourceConverter
 * @requires $accessControl
 * @requires $views
 * @requires $routes
 */
  var _ = require('lodash')
  var tools = require('../tools')
  //var seq = require('an-flow')
  var config = require('./config')

  /**
   * Crée un formToken et l'ajoute à la ressource et en session
   * @private
   * @param context
   * @param ressource
   */
  function addToken(context, ressource) {
    var token = $ressourceControl.getToken()
    if (!context.session.formTokens) context.session.formTokens = []
    context.session.formTokens.push(token)
    ressource.token = token
  }

  /**
   * Vérifie que le token du post correspond à un en session (et le vire)
   * On gère plusieurs token de formulaires pour autoriser l'ouverture de plusieurs forms
   * @private
   * @param context
   * @param next appelé si ok, sinon on affichera une erreur
   */
  function checkToken(context, next) {
    var result = false
    if (context.post.token) {
      if (context.session.formTokens) {
        var i = context.session.formTokens.indexOf(context.post.token)
        if (i > -1) {
          context.session.formTokens.splice(i, 1)
          result = true
        }
      }
    }
    if (result) next()
    else $views.printError(context, "Jeton invalide, demande probablement déjà soumise et en cours de traitement")
  }

  /**
   * Affiche une 401 avec Authentification requise en html
   * @private
   * @param context
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
   * @param context
   * @param {string} [id=] Identifiant de la ressource (ou son titre), pour le mettre dans le message
   */
  function denied404(context, id) {
    var message = "La ressource " +id +" n'existe pas ou droits insuffisants"
    $views.printError(context, message, 404)
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
   * @param context
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
   * @route GET /ressource/apercu/:oid
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
   * @route GET /ressource/apercu/:origine/:idOrigine
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
  controller.get($routes.get('add'), function (context) {
    context.layout = 'page'
    context.tab = 'add'
    $accessControl.checkPermission('create', context, null, function (errorMsg) {
      // envoi des valeur au form
      function termine (ressource) {
        $views.printForm(context, null, ressource, options)
      }

      var options = {$metas: {title: 'Ajouter une ressource'}}
      if (errorMsg) denied(context, errorMsg)
      else {
        if (context.get.clone) {
          $ressourceRepository.load(context.get.clone, function (error, ressource) {
            if (error) {
              $views.printError(context, error)
            } else if (ressource) {
              delete ressource.oid
              delete ressource.idOrigine
              termine(ressource)
            } else {
              $views.printError(context, "Ressource à dupliquer inexistante ou droits insuffisants pour la lire", 404)
            }
          })
        } else {
          var fake = {new: true}
          addToken(context, fake)
          termine(fake)
        }
      }
    })
  })

  /**
   * Traitement du formulaire d'ajout de ressource, réaffiche le form avec une erreur éventuelle ou
   * redirige vers le form d'édition (pour ajouter ce qui dépend du typeTechnique choisi)
   * @route POST /ressource/ajouter
   */
  controller.post($routes.get('add'), function (context) {
    context.layout = 'page'
    context.tab = 'add'
    // réaffiche le form en cas d'erreur ou warnings
    function rePrintForm(error, ressource) {
      var options = {$metas: {title: 'Ajouter une ressource'}}
      addToken(context, ressource)
      $views.printForm(context, error, ressource, options)
    }

    if (context.post.oid) {
      $views.printError(context, "Impossible d'ajouter une ressource existante")
    } else {
      checkToken(context, function () {
        $accessControl.checkPermission('create', context, null, function (errorMsg) {
          if (errorMsg) {
            denied(context, errorMsg)
          } else {
            // on fixe la date de màj avant validation
            if (!context.post.dateMiseAJour) context.post.dateMiseAJour = new Date();
            $ressourceControl.valideRessourceFromPost(context.post, false, function (error, ressource) {
              // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
              // et rediriger vers le describe ou vers le form avec les erreurs
              if (error || !_.isEmpty(ressource.errors)) {
                rePrintForm(error, ressource)
              } else if (!_.isEmpty(ressource.warnings) && !ressource.force) {
                rePrintForm(error, ressource)
              } else {
                $ressourceRepository.write(ressource, function (error, ressource) {
                  if (error || !_.isEmpty(ressource.errors)) {
                    // là c'est un bug dans notre code
                    log.error(new Error("on a une erreur au write mais pas au valide précédent"))
                    rePrintForm(error, ressource)
                  } else {
                    log.debug("Après le save on récupère l'oid " + ressource.oid + ", on lance le redirect")
                    context.redirect($routes.getAbs('edit', ressource.oid))
                  }
                }) // write
              }
            }) // valideRessourceFromPost
          }
        }) // checkPermission
      }) // checkToken
    }
  })

  /**
   * Affichage du formulaire d'édition
   * @route GET /ressource/modifier
   */
  controller.get($routes.get('edit', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'edit'
    // pas la peine de la charger si on est pas authentifié
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          log.error(error)
          $views.printError(context, "Probleme d'accès à la base de données")
        } else if (ressource) {
          $accessControl.checkPermission('update', context, ressource, function (errorMsg) {
            if (errorMsg) {
              denied(context, errorMsg)
            } else {
              var options = {
                $metas: {title: 'Modifier la ressource : ' + ressource.titre}
              }
              options.titre = ressource.titre
              addToken(context, ressource)
              $views.printForm(context, error, ressource, options)
            }
          })
        } else {
          denied404(context, oid)
        }
      })
    } else {
      denied(context)
    }
  })

  /**
   * Traitement du formulaire d'édition, réaffiche le formulaire en cas d'erreur ou sauvegarde et redirige vers la description
   * @route GET /ressource/modifier
   */
  controller.post($routes.get('edit', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'edit'
    function rePrintForm(error, ressource) {
      if (error) log.error('une erreur au post update', error)
      if (ressource.errors) log.debug('errors au post update', ressource.errors)
      if (ressource.warnings) log.debug('warnings au post update avec force=' +context.post.force, ressource.warnings)
      addToken(context, ressource)
      $views.printForm(context, error, ressource)
    }

    if ($accessControl.isAuthenticated(context)) {
      checkToken(context, function () {
        // valider le contenu et l'enregistrer en DB (récupérer l'action add de l'api)
        // et rediriger vers le describe ou vers le form avec les erreurs
        $ressourceControl.valideRessourceFromPost(context.post, false, function (error, ressource) {
          if (error || (ressource.errors && ressource.errors.length) || (ressource.warnings && ressource.warnings.length && context.post.force !== "forced")) {
            rePrintForm(error, ressource)
          } else {
            $ressourceRepository.write(ressource, function (error, ressourceOk) {
              if (error) {
                rePrintForm(error, ressource)
              } else if (ressourceOk) {
                var url = $routes.getAbs('describe', ressourceOk)
                log.debug("update " + ressource.oid + " ok, on lance le redirect vers " + url)
                context.redirect(url)
              } else {
                rePrintForm(new Error("L'écriture en base de donnée n'a pas répondu correctement"), ressource)
              }
            })
          }
        })
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
      checkToken(context, function () {
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
              data.actions = {links:[]}
              // lien suivant (si on est au max)
              if (ressources.length == options.nb) {
                crit.start = options.start + options.nb
                data.actions.links.push({html :tools.linkQs($routes.get('search'), 'Résultats suivants', crit)})
              }
              // "titre" avec le nb de ressources
              var html = ressources.length +' ressource'
              if (ressources.length) {
                html += 's (' + (options.start + 1) + ' à ' + (options.start + 1 + options.nb) + ')'
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
          context.error = "il faut choisir au moins un critère"
          $views.printSearchForm(context)
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
