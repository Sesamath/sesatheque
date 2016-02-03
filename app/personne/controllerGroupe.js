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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

/**
 * Controleur du chemin /groupe/ (pour voir/modifier les groupes d'auteurs)
 *
 * @controller controllerGroupe
 * @requires $ressourceRepository {@link $ressourceRepository]
 * @requires EntityGroupe {@link EntityGroupe}
 * @requires $groupeRepository {@link $groupeRepository}
 * @requires $accessControl {@link $accessControl}
 * @requires $page {@link $page}
 * @requires $form {@link $form}
 */
module.exports = function (controller, EntityGroupe, $groupeRepository, $accessControl, $page, $form) {
  var _ = require('lodash')
  var tools = require('../tools')
  var flow = require('an-flow')
  var appConfig = require('../config')

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
    $page.printForm(context, error, ressource, options)
  }

  /**
   * Affiche la liste de tous les groupes ouverts
   * @route GET /groupe/tous
   */
  controller.get('tous', function (context) {
    $groupeRepository.loadOpen(function (error, groupes) {
      var data = $page.getDefaultData(context)
      data.contentBloc = {
        $view : 'groupes',
        groupes : groupes
      }
      context.html(data)
    })
  })

  /**
   * Affiche la liste de mes groupes
   * @route GET /groupe/perso
   */
  controller.get('perso', function (context) {
    var me = $accessControl.getCurrentUser(context)
    var data = $page.getDefaultData(context)
    var groupes = []
    if (me && me.groupes) {
      groupes = tools.truePropertiesList(me.groupes)
    }
    data.contentBloc = {
      $view : 'mesGroupes',
      groupes : groupes
    }
    context.html(data)
  })

  /**
   * formulaire de création
   * @route GET /groupe/ajouter
   */
  controller.get('ajouter', function (context) {
    var data = $page.getDefaultData(context)
    if ($accessControl.hasGenericPermission('createGroupe', context)) {
      data.$metas.title = 'Ajouter un groupe'
      data.contentBloc = $form.get()
      data.contentBloc.$view = 'form';
    log('data', data)
      context.html(data)
    } else {
      $page.denied(context, 'Droits insuffisants pour créer un groupe')
    }
  })

  /**
   * Traitement du formulaire d'ajout de ressource, réaffiche le form avec une erreur éventuelle ou
   * redirige vers le form d'édition (pour ajouter ce qui dépend du type choisi)
   * @route POST /groupe/ajouter
   */
  controller.post('ajouter', function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'create'
    var ressourcePosted = context.post
    var titrePage = 'Ajouter une ressource'

    if (context.post.oid) {
      $page.printError(context, "Impossible d'ajouter une ressource existante")
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
        log.debug("auteurs après checkPersonnes", ressource.auteurs)
        $ressourceRepository.write(ressource, function (error, ressource) {
          // on veut gérér les erreurs ici car y'a un bug dans notre code
          if (error || !_.isEmpty(ressource.errors)) {
            log.error(new Error("on a une erreur au write mais pas au valide précédent"))
            printForm(context, error, ressource, 'Ajouter une ressource')
          } else {
            log.debug("Après le save on récupère l'oid " + ressource.oid + ", on lance le redirect")
            var url = $routes.getAbs('edit', ressource.oid, context)
            if (context.layout === "iframe") {
              url += "?layout=iframe"
              if (context.get.closerId) url += "&closerId=" +context.get.closerId
            }
            context.redirect(url)
          }
        }) // write

      }).catch(function (error) {
        printForm(context, error, ressourcePosted, titrePage)
      })

    }
  })

  /**
   * formulaire d'édition
   * @route GET /groupe/modifier/:oid
   */
  controller.get('/modifier/:oid', function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'edit'
    // pas la peine de la charger si on est pas authentifié
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          log.error(error)
          $page.printError(context, "Probleme d'accès à la base de données")
        } else if (ressource) {
          if ($accessControl.hasPermission('update', context, ressource)) {
            var options = {
              $metas: {title: 'Modifier la ressource : ' + ressource.titre}
            }
            options.titre = ressource.titre
            addToken(context, ressource)
            $page.printForm(context, error, ressource, options)
          } else {
            // la ressource existe mais on donne pas l'info si on a pas les droits
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
   * @route POST /groupe/modifier/:oid
   */
  controller.post('/modifier/:oid', function (context) {
    context.timeout = 10000
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
        log.debug("auteurs après checkPersonnes", ressource.auteurs)
        ressourceNew = ressource
        // faut pas de _.merge qui est récursif sur les propriétés de l'objet parametres (par ex)
        tools.update(ressourceOriginale, ressource)
        $ressourceRepository.write(ressourceOriginale, this)

      }).seq(function (ressource) {
        // si on a du closerId=YYY dans l'url, on affiche une page qui envoie un message (Cf sesatheque-client.modifyItem)
        if (context.get.closerId) {
          context.html({
            $metas : {
              title: "Enregistrement réussi, fermeture automatique"
            },
            $views : __dirname +"/../views",
            contentBloc : {
              $view : "home",
              content : "Ressource " +ressource.oid +" enregistrée"
            },
            jsBloc : {
              $view : "js",
              jsCode : 'if (parent.postMessage) parent.postMessage({action:"iframeCloser", id:"' +
                context.get.closerId +'", ressource:' +JSON.stringify($ressourceConverter.toRef(ressource)) +'}, "*")'
            }
          })
        } else {
          // redirection normale
          var url = "/ressource/" + $routes.get('describe', ressource.oid) // pas getAbs pour ne pas aller vers /public/
          if (context.layout === "iframe") url += "?layout=iframe"
          log.debug("update " + ressource.oid + " ok, on lance le redirect vers " + url)
          context.redirect(url)
        }

      }).catch(function (error) {
        log.debug("erreur au post", error)
        log.debug("avec la ressource", ressourceNew)
        printForm(context, error, ressourceNew, titrePage)
      })
    } else {
      denied(context)
    }
  })

  /**
   * Affiche la demande de confirmation pour effacement
   * (utilise la vue describe pour montrer le détail de ce que l'on va effacer)
   * @route GET /groupe/supprimer/:oid
   */
  controller.get('/supprimer/:oid', function (context) {
    context.layout = 'page'
    context.tab = 'delete'
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) {
          log.error(error)
          $page.printError(context, "Une erreur est survenue, impossible de vérifier l'existence de la ressource")
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
                  $view: 'delete',
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
          $page.printError(context, "La ressource " +oid +" n'existe pas ou vous n'avez pas les droits suffisants pour la supprimer")
        }
      })
    } else {
      denied(context)
    }
  })

  /**
   * Traite la demande d'effacement et affiche le résultat
   * @route POST /groupe/supprimer
   */
  controller.post('/supprimer/:oid', function (context) {
    context.layout = 'page'
    context.tab = 'delete'
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      var data = {
        $views     : __dirname + '/../views',
        $metas     : {title: 'Suppression de ressource'},
        contentBloc: {$view: 'delete'}
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
              $page.printError(context, "Erreur interne dans la vérification des droits")
            }
          } else {
            log.error(new Error("Token OK mais la ressource " + oid +" n'existe pas ou plus !"))
            $page.printError(context, "Erreur interne, ressource introuvable, probablement déjà effacée")
          }
        })
      })
    } else {
      denied(context)
    }
  })

}
