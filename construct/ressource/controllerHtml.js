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
 * Le controleur html du composant ressource
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 * @param $views
 * @param $routes
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $views, $routes) {
  var _ = require('lodash')
  //var tools = require('../tools')
  //var seq = require('seq')

  /**
   * Crée un formToken et l'ajoute à la ressource et en session
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
   * @param context
   * @param {string} [id=] Identifiant de la ressource (ou son titre), pour le mettre dans le message
   */
  function denied404(context, id) {
    var message = "La ressource " +id +" n'existe pas ou droits insuffisants"
    $views.printError(context, message, 404)
  }

  // describe
  controller.get($routes.get('describe', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'describe')
    })
  })

// describeByOrigin
  controller.get($routes.get('describe', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'describe')
    })
  })

// display : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// displayByOrigin : Voir la ressource pleine page (pour iframe)
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'display', {$layout: '../../static/views/layout-iframe'})
    })
  })

// preview : Voir la ressource dans le site
  controller.get($routes.get('preview', ':oid'), function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'display')
    })
  })

  // previewByOrigin
  controller.get($routes.get('preview', ':origine', ':idOrigine'), function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      $views.prepareAndSend(context, error, ressource, 'display')
    })
  })

  // Ajouter, affichage du form de saisie
  controller.get($routes.get('add'), function (context) {
    if ($accessControl.isAuthenticated(context)) {
      $accessControl.checkPermission('create', context, null, function (errorMsg) {
        var options = {$metas: {title: 'Ajouter une ressource'}}
        if (errorMsg) denied(context, errorMsg)
        else {
          var fake = {new:true}
          addToken(context, fake)
          $views.printForm(context, null, fake, options)
        }
      })
    } else {
      denied(context)
    }
  })

  // Ajouter, traitement du post
  controller.post($routes.get('add'), function (context) {
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
                    context.redirect($routes.getAbs('describe', ressource.oid))
                  }
                }) // write
              }
            }) // valideRessourceFromPost
          }
        }) // checkPermission
      }) // checkToken
    }
  })

  // Modifier, affichage du form
  controller.get($routes.get('edit', ':oid'), function (context) {
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
              var options = {$metas: {title: 'Modifier la ressource : ' + ressource.titre}}
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

  // Modifier, traitement du form
  controller.post($routes.get('edit', ':oid'), function (context) {
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

  // Delete, affichage d'une demande de confirmation
  controller.get($routes.get('delete', ':oid'), function (context) {
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
                contentBloc: {
                  $view: 'delete',
                  token : {
                    value:ressource.token,
                    name:'token',
                    hidden:true
                  }
                }
              }
              // la vue delete inclue la vue describe, faut les datas de describe
              $views.prepareAndSend(context, error, ressource, 'describe', options)
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

  // Delete, traitement du post
  controller.post($routes.get('delete', ':oid'), function (context) {
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      var data = {
        $views     : __dirname + '/views',
        $metas     : {title: 'Suppression de ressource'},
        $layout    : '../../static/views/layout-page',
        contentBloc: {$view: 'delete'}
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

  // form de recherche
  controller.get($routes.get('search'), function (context) {
    $views.printSearchForm(context)
  })

  // résultats
  controller.post($routes.get('search'), function (context) {
    $views.printSearchForm(context)
  })

  /**
   * Liste d'après le critère passé en 1er param (puis valeur, offset & nb)
   * Ne remonte que les ressources publiques
   * SELECT _string, COUNT(*) AS nb  FROM ressource_index WHERE name = 'typeTechnique' GROUP BY _string
   */
  controller.get('by/:index/:value/:start/:nb', function (context) {
    log.debug('liste avec les args', context.arguments)
    var index = context.arguments.index
    var value = context.arguments.value
    var options = {
      filters: [{index: index, values: [value]}],
      orderBy: 'oid',
      start  : parseInt(context.arguments.start),
      nb     : parseInt(context.arguments.nb)
    }
    var visibilite = 'public'
    // avec une exception pour l'admin qui peut passer ?all=1
    if (context.get.all && context.session.user && context.session.user.roles && context.session.user.roles.admin)
      visibilite = "tout"
    $ressourceRepository.getListe(visibilite, context, options, function (error, ressources) {
      var data = $views.getDefaultData('liste')
      data.$metas.title = 'Résultats de la recherche'
      log.debug('liste avec les options', options)
      log.debug('qui remonte', ressources)
      if (error) data.contentBloc.error = error.toString()
      else data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources)
      context.html(data)
    })
  })
}
