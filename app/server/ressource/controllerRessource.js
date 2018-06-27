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
 *
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
const _ = require('lodash')
const {ensure, linkQs} = require('../tools')
const sjt = require('sesajstools')
// const sjtObj = require('sesajstools/utils/object')
const flow = require('an-flow')
const config = require('./config')
const appConfig = require('../config')
const myBaseId = appConfig.application.baseId
const request = require('request')

/**
 * Controleur /ressource/ pour les utilisateurs authentifiés.
 *
 * Toutes ses routes exposées ici seront traitées par le controleur {@link controllerPublic} si on est pas authentifié (via une redirection interne)
 *
 * @controller controllerRessource
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $ressourcePage, $routes, $ressourceFetch) {
  /**
   * Crée un formToken et l'ajoute à la ressource et en session
   * @private
   * @param {Context} context
   * @param ressource
   */
  function addToken (context, ressource) {
    var token = sjt.getToken()
    if (!context.session.tokens) context.session.tokens = {}
    log.debug('avant ajout du token on a en session', context.session.tokens)
    context.session.tokens[token] = ressource.oid || 0
    ressource.token = token
    log.debug('on a ajouté le token ' + token + " en session avec l'oid " + ressource.oid, context.session.tokens)
  }

  /**
   * Vérifie que le token du post correspond à un en session (et le vire)
   * On gère plusieurs token de formulaires pour autoriser l'ouverture de plusieurs forms
   * @private
   * @param {Context}        context
   * @param {string|Integer} oid
   * @param {errorCallback} next appelé sans argument si ok, sinon on affichera une erreur
   */
  function checkToken (context, oid, next) {
    var token = context.post.token
    var result = (token && context.session.tokens && context.session.tokens[token] == oid) // eslint-disable-line eqeqeq
    if (result) {
      delete context.session.tokens[token]
      next()
    } else {
      log.debug('checkToken KO, reçu ' + token + " pour l'oid " + oid + ' avec en session', context.session.tokens)
      next(new Error('Jeton invalide, demande probablement déjà soumise et en cours de traitement'))
    }
  }

  /**
   * Affiche une 401 avec Authentification requise en html
   * @private
   * @param {Context} context
   * @param {string} [message='Authentification requise']
   * @returns {boolean} true si authentifié
   */
  function denied (context, message) {
    if (!message) message = 'Authentification requise'
    $ressourcePage.printError(context, message, 401)
  }

  /**
   * Affiche le message existe pas ou droits insuffisant, avec un 404
   * @private
   * @param {Context} context
   * @param {string} [id=] Identifiant de la ressource (ou son titre), pour le mettre dans le message
   */
  function denied404 (context, id) {
    var message = `La ressource ${id} n’existe pas ou droits insuffisants`
    $ressourcePage.printError(context, message, 404)
  }

  /**
   * Affiche le message existe pas avec un 404
   * @private
   * @param {Context} context
   * @param {string} [id=] Identifiant de la ressource (ou son titre), pour le mettre dans le message
   */
  function print404 (context, id) {
    $ressourcePage.printError(context, `La ressource ${id} n’existe pas`, 404)
  }

  /**
   * Affiche un form en ajoutant un token à la ressource
   * @private
   * @param {Context}   context
   * @param {Error}     error
   * @param {Ressource} ressource
   * @param {string}    [titre] Le titre de la page
   */
  function printForm (context, error, ressource, titre) {
    if (error) log.error('une erreur au post update', error)
    if (ressource.$errors) log.debug('errors au post update', ressource.$errors)
    if (ressource.$warnings) log.debug('warnings au post update avec force=' + (context.post && context.post.force), ressource.$warnings)
    addToken(context, ressource)
    var options
    if (titre) options = {$metas: {title: 'Ajouter une ressource'}}
    $ressourcePage.printForm(context, error, ressource, options)
  }

  /**
   * Appelle next si on est authentifié ou redirige vers la même url en public
   * @private
   * @param {Context}  context Le contexte
   * @param {function} next    Sera appelée sans arguments si on est authentifié
   */
  function redirectPublicOrContinue (context, next) {
    if ($accessControl.isAuthenticated(context)) next()
    else context.redirect(context.request.originalUrl.replace('ressource/', 'public/'), 302)
  }

  /**
   * Vérifie les droits avant d'appeler $ressourcePage.prepareAndSend
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   * @param view
   * @param options
   */
  function send (context, error, ressource, view, options) {
    if (ressource && !$accessControl.hasReadPermission(context, ressource)) {
      ressource = null // prepare & send renverra son 404 habituel
    }
    $ressourcePage.prepareAndSend(context, error, ressource, view, options)
  }

  /**
   * Iframe de connexion pour loguer un user d'un sesalab localement, appelle sendMessage avec {action:'connexion',success:{boolean}[,error:msgErreur]}
   * Dupliqué dans app/connexion, qu'il remplace vu que pas mal de navigateurs déconnent pour affecter le cookie en xhr
   * @todo Remettre son usage en route via sesatheque-client:getPerso, qui pourrait proposer d'ouvrir un nouvel onglet pour reconnecter
   * @Route GET /ressource/connexion
   * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
   * @param {string} token   Le token de sesalab qui servira à récupérer le user
   */
  controller.get('connexion', function (context) {
    function end (error) {
      var retour = {
        action: 'connexion',
        success: !error
      }
      if (error) retour.error = error.toString()
      var data = {
        jsBloc: {
          $view: 'js',
          jsCode: 'if (parent.postMessage) parent.postMessage(' + sjt.stringify(retour) + ', "*")'
        }
      }
      context.html(data)
    }

    var token = context.get.token
    var origine = context.get.origine
    var timeout = 5000

    context.layout = 'iframe'
    context.status = 200 // sinon le listener va traduire l'absence de contenu par une 404

    if (token && origine) {
      if (origine.substr(-1) !== '/') origine += '/'
      if (appConfig.sesalabsByOrigin[origine]) {
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
        var domaine = /https?:\/\/([a-z.0-9]+(:[0-9]+)?)/.exec(origine)[1] // si ça plante fallait pas mettre n'importe quoi en config
        request.post(postOptions, function (error, response, body) {
          if (error) {
            end(error)
          } else if (body.error) {
            end(new Error(body.error))
          } else if (body.ok && body.utilisateur) {
            // on peut connecter
            $accessControl.loginFromSesalab(context, body.utilisateur, domaine, function (error) {
              log.debug('dans cb loginFromSesalab on a en session', context.session.user)
              if (error) end(error)
              else end()
            })
          } else {
            var msg = 'réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url
            error = new Error(msg)
            log.debug(msg, body)
            end(error)
          }
        })
      } else {
        end(new Error('Origine ' + origine + 'non autorisée à se connecter ici'))
      }
    } else {
      end(new Error('token ou origine manquant'))
    }
  })

  /**
   * Page describe
   * @route GET /ressource/decrire/:oid
   */
  controller.get($routes.get('describe', ':oid'), function (context) {
    context.layout = 'page'
    context.tab = 'describe'
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    redirectPublicOrContinue(context, function () {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (!error && ressource && ['iep', 'j3p', 'mathgraph', 'arbre'].includes(ressource.type)) {
          // version react
          let data = {
            contentBloc: {
              $view: 'ressource-editor',
              verbose: (appConfig.application.staging !== 'prod'),
              isDev: (appConfig.application.staging !== 'prod'),
              baseId: appConfig.application.baseId,
              sesatheques: appConfig.sesatheques,
              ressource: ressource ? sjt.stringify(ressource) : ''
            },
            jsBloc: {
              $view: 'js',
              jsFiles: ['/react.js']
            }
          }
          context.html(data)
        } else {
          send(context, error, ressource, 'describe')
        }
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
    redirectPublicOrContinue(context, function () {
      const origine = context.arguments.origine
      const idOrigine = context.arguments.idOrigine
      // ça gère le cas cle/xxx
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
    redirectPublicOrContinue(context, function () {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        send(context, error, ressource, 'display')
      })
    })
  })

  /**
   * Page display (voir en pleine page, à priori pour mettre en iframe)
   * @route GET /ressource/voir/:origine/:idOrigine
   */
  controller.get($routes.get('display', ':origine', ':idOrigine'), function (context) {
    context.layout = 'iframe'
    redirectPublicOrContinue(context, function () {
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
    redirectPublicOrContinue(context, function () {
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
    redirectPublicOrContinue(context, function () {
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
      var options = {$metas: {title: 'Ajouter une ressource'}}
      if (errorMsg) return denied(context, errorMsg)
      var clonedOid = context.get.clone
      if (clonedOid) {
        // cas particulier du clonage
        $ressourceRepository.load(clonedOid, function (error, ressource) {
          if (error) return $ressourcePage.printError(context, error)
          if (!ressource) return $ressourcePage.printError(context, 'Ressource à dupliquer inexistante ou droits insuffisants pour la lire', 404)
          $ressourceConverter.addRelations(ressource, [[config.constantes.relations.estVersionDe, ressource.rid]])
          ressource.titre += ' (copie)'
          delete ressource.oid
          delete ressource.rid
          delete ressource.idOrigine
          delete ressource.dateMiseAJour
          ressource.dateCreation = new Date()
          ressource.origine = myBaseId
          // on laisse les auteurs intacts et ajoute le user courant en contributeur,
          // sauf si on clone un alias, car dans ce cas il se retrouvera auteur de la ressource
          // issue de l'original lors de l'édition
          if (!ressource.aliasOf) {
            var pid = $accessControl.getCurrentUserPid(context)
            if (!ressource.contributeurs) ressource.contributeurs = []
            if (ressource.contributeurs.indexOf(pid) === -1) ressource.contributeurs.push(pid)
          }
          $ressourceRepository.save(ressource, function (error, ressource) {
            if (error) return $ressourcePage.printError(context, error)
            if (!ressource || !ressource.oid) return $ressourcePage.printError(context, new Error("L'enregistrement d'une copie de la ressource ' +clonedOid +' a échoué"))
            var url = $routes.getAbs('edit', ressource.oid, context)
            if (context.layout === 'iframe') url += '?layout=iframe'
            context.redirect(url)
          })
        })
      } else {
        // creation simple
        var fake = {new: true, publie: true}
        addToken(context, fake)
        $ressourcePage.printForm(context, null, fake, options)
      }
    })
  })

  /**
   * Traitement du formulaire d'ajout de ressource, réaffiche le form avec une erreur éventuelle ou
   * redirige vers le form d'édition (pour ajouter ce qui dépend du type choisi)
   * @route POST /ressource/ajouter
   */
  controller.post($routes.get('create'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'create'
    const ressourcePosted = context.post
    const titrePage = 'Ajouter une ressource'
    const pid = $accessControl.getCurrentUserPid(context)

    if (context.post.oid) return $ressourcePage.printError(context, "Impossible d'ajouter une ressource existante")
    if (!pid) return denied(context)

    // on peut y aller
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
      if (!ressourcePosted.dateMiseAJour) ressourcePosted.dateMiseAJour = new Date()
      // on met l'origine à la baseId locale si y'en a pas
      if (!ressourcePosted.origine) {
        ressourcePosted.origine = myBaseId
        ressourcePosted.idOrigine = undefined
      }
      $ressourceControl.valideRessourceFromPost(ressourcePosted, this)
    }).seq(function (ressource) {
      if (!_.isEmpty(ressource.$errors)) printForm(context, null, ressource, titrePage)
      else if (!_.isEmpty(ressource.$warnings) && !context.post.force) printForm(context, null, ressource, titrePage)
      else this(null, ressource)
    }).seq(function (ressource) {
      // on est sur l'ajout, pas encore de groupes ni d'auteurs ajoutés
      ressource.auteurs = [pid]
      // on veut gérér les erreurs ici, signe d'un bug dans notre code, donc pas d'appel au seq suivant
      $ressourceRepository.save(ressource, function (error, ressourceSaved) {
        if (error) {
          log.error(new Error('on a une erreur au save mais pas au valide précédent'))
          printForm(context, error, ressource, 'Ajouter une ressource')
        } else if (!_.isEmpty(ressourceSaved.$errors)) {
          printForm(context, error, ressourceSaved, 'Ajouter une ressource')
        } else {
          log.debug(`Après le save on récupère l’oid ${ressource.oid}, on lance le redirect`)
          var url = $routes.getAbs('edit', ressourceSaved.oid, context)
          if (context.layout === 'iframe') {
            url += '?layout=iframe'
            if (context.get.closerId) url += '&closerId=' + context.get.closerId
          }
          context.redirect(url)
        }
      }) // write
    }).catch(function (error) {
      printForm(context, error, ressourcePosted, titrePage)
    })
  })

  /**
   * Affichage du formulaire d'édition
   * @route GET /ressource/modifier/:oid
   */
  controller.get($routes.get('edit', ':oid'), function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'edit'
    const myPid = $accessControl.getCurrentUserPid(context)
    // pas la peine de la charger si on est pas authentifié
    if (!myPid) return denied(context)
    const oid = context.arguments.oid
    let ressource // la ressource qu'on va envoyer au form
    flow().seq(function () {
      $ressourceRepository.load(oid, this)
    }).seq(function (ressourceBdd) {
      if (!ressourceBdd) return print404(context, oid)
      ressource = ressourceBdd
      const deniedMsg = $accessControl.getDeniedMessage('update', context, ressource)
      // faut laisser passer ceux qui ont la permission index
      if (deniedMsg && !$accessControl.hasPermission('index', context, ressource)) return denied(context, deniedMsg)

      // sinon on peut afficher le form
      addToken(context, ressource)
      const data = {
        contentBloc: {
          $view: 'ressource-editor',
          verbose: (appConfig.application.staging !== 'prod'),
          isDev: (appConfig.application.staging !== 'prod'),
          baseId: appConfig.application.baseId,
          sesatheques: appConfig.sesatheques,
          ressource: ressource ? sjt.stringify(ressource) : ''
        },
        jsBloc: {
          $view: 'js',
          jsFiles: ['/react.js']
        }
      }
      context.html(data)
    }).catch(function (error) {
      log.error(error)
      $ressourcePage.printError(context, error)
    })
  })

  /**
   * Redirect vers le form d'édition par oid (pour jstree qui nous appelle ici si les enfants sont en origine/idOrigine)
   * @route GET /ressource/modifier/:origine/:idOrigine
   */
  controller.get($routes.get('edit', ':origine', ':idOrigine'), function (context) {
    $ressourceRepository.loadByOrigin(context.arguments.origine, context.arguments.idOrigine, function (error, ressource) {
      if (error) {
        log.error(error)
        $ressourcePage.printError(context, "Probleme d'accès à la base de données")
      } else if (ressource) {
        context.redirect($routes.getAbs('edit', ressource.oid))
      } else {
        denied404(context, context.arguments.origine + '/' + context.arguments.idOrigine)
      }
    })
  })

  /**
   * Traitement du formulaire d'édition, réaffiche le formulaire en cas d'erreur
   * ou sauvegarde et redirige vers la description
   * @route POST /ressource/modifier/:oid
   */
  controller.post($routes.get('edit', ':oid'), function (context) {
    context.timeout = 10000
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    context.tab = 'edit'
    var titrePage = 'Modifier une ressource'
    var oid = context.arguments.oid
    var ressourcePostee = context.post
    // les propriétés qui ne sont pas des champs de ressource
    var groupesSup = ressourcePostee.hasOwnProperty('_groupesSup') ? ressourcePostee._groupesSup : ''
    var ressourceNormee
    var ressourceOriginale

    if (!$accessControl.isAuthenticated(context)) return denied(context)
    flow().seq(function () {
      // vérifier le token, ça évite de vérifier de nouveau les droits
      checkToken(context, oid, this)
    }).seq(function () {
      $ressourceControl.valideRessourceFromPost(ressourcePostee, this)
    }).seq(function (ressource) {
      // faut la mémoriser pour comparer avec la bdd
      ressourceNormee = ressource
      if (_.isEmpty(ressource.$errors)) {
        if (!_.isEmpty(ressource.$warnings) && ressourcePostee.force !== 'forced') {
          printForm(context, null, ressource, titrePage)
        } else {
          // faut charger l'ancienne pour vérifier groupes et personnes
          $ressourceRepository.load(oid, this)
        }
      } else {
        printForm(context, null, ressource, titrePage)
      }
    }).seq(function (ressourceBdd) {
      // faut vérifier ici si on a les pleins droits sur la ressource ou seulement partiels
      const isOnlyIndex = $accessControl.hasPermission('index', context, ressourceBdd) && !$accessControl.hasPermission('update', context, ressourceBdd)
      if (!ressourceBdd) {
        return $ressourcePage.printError(context, new Error('La ressource n’existe pas (peut-être supprimée depuis)'))
      }
      ressourceOriginale = ressourceBdd
      // si on modifie un alias, ça fork automatiquement
      if (ressourceOriginale.aliasOf) {
        if (isOnlyIndex) return denied(context, 'Vous avez des droits d’indexation mais pas de modification')
        delete ressourceOriginale.aliasOf
      }
      // ici, on reset d'office tout ce qu'on ne peut pas modifier si on est juste indexateur
      if (isOnlyIndex) {
        // @todo finir ce bout de truc commencé ? config.indexFields
        // Object.keys(ressourceOriginale)
      }
      $personneControl.checkGroupes(context, ressourceOriginale, ressourceNormee, groupesSup, this)
    }).seq(function (ressource) {
      // on remet les relations, qui sont pas éditables
      ressource.relations = ressourceOriginale.relations
      // faut remettre _auteursAdd et _contributeursAdd virés à la validation (pas des champs de ressource)
      if (ressourcePostee._auteursAdd) ressource._auteursAdd = ressourcePostee._auteursAdd
      if (ressourcePostee._contributeursAdd) ressource._contributeursAdd = ressourcePostee._contributeursAdd
      $personneControl.checkPersonnes(context, ressourceOriginale, ressource, this)
    }).seq(function (ressource) {
      // faut pas de _.merge qui est récursif sur les propriétés de l'objet parametres (par ex)
      Object.assign(ressourceOriginale, ressource)
      log.debug('ressource avant enregistrement', ressourceOriginale, 'avirer', {max: 10000})
      $ressourceRepository.save(ressourceOriginale, this)
    }).seq(function (ressource) {
      log.debug('ressource enregistrée', ressource)
      // si on a du closerId=YYY dans l'url, on affiche une page qui envoie un message (Cf sesatheque-client.modifyItem)
      if (context.get.closerId) {
        // on apelle le closer mis par sesatheque-client, mais faut ajouter $droits à la ressource
        ressource.$droits = 'DWR'
        context.html({
          $metas: {
            title: 'Enregistrement réussi, fermeture automatique'
          },
          contentBloc: {
            $view: 'contents',
            contents: ['Ressource ' + ressource.oid + ' enregistrée']
          },
          jsBloc: {
            $view: 'js',
            // action:"iframeCloser" est en dur dans sesatheque-client:addCloser
            jsCode: 'if (parent.postMessage) parent.postMessage({action:"iframeCloser", id:"' +
              context.get.closerId + '", ressource:' + sjt.stringify(ressource) + '}, "*")'
          }
        })
      } else {
        // redirection normale
        var url = '/ressource/' + $routes.get('describe', ressource.oid) // pas getAbs pour ne pas aller vers /public/
        if (context.layout === 'iframe') url += '?layout=iframe'
        log.debug('update ' + ressource.oid + ' ok, on lance le redirect vers ' + url)
        context.redirect(url)
      }
    }).catch(function (error) {
      log.debug('erreur au post', error)
      log.debug('avec la ressource', ressourcePostee)
      printForm(context, error, ressourcePostee, titrePage)
    })
  })

  /**
   * Importe une ressource (via du js client qui appelera l'api
   * @route GET /ressource/import
   */
  controller.get('import', function (context) {
    context.layout = 'page'
    if ($accessControl.isAuthenticated(context)) {
      var data = {
        $metas: {
          title: 'Importer une ressource'
        },
        titre: 'Import d’une ressource',
        contentBloc: {
          $view: 'import'
        },
        jsBloc: {
          $view: 'js',
          jsFiles: ['/import.js'],
          jsCode: 'stimport()'
        }
      }
      context.html(data)
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
          $ressourcePage.printError(context, "Une erreur est survenue, impossible de vérifier l'existence de la ressource")
        } else if (ressource) {
          $accessControl.checkPermission('delete', context, ressource, function (errorMsg) {
            if (errorMsg) {
              denied(context, errorMsg)
            } else {
              addToken(context, ressource)
              // faut ajouter le token dans les options, car c'est un rendu describe que l'on appelle (pas de form)
              // le token, présent pour delete qui utilise aussi la vue describe
              var options = {
                $metas: {title: 'Supprimer la ressource : ' + ressource.titre},
                titre: ressource.titre,
                contentBloc: {
                  $view: 'delete',
                  token: {
                    value: ressource.token,
                    name: 'token',
                    hidden: true
                  }
                }
              }
              // la vue delete inclue la vue describe, faut les datas de describe
              send(context, error, ressource, 'describe', options)
            }
          })
        } else {
          $ressourcePage.printError(context, `La ressource ${oid} n’existe pas`)
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
        $metas: {title: 'Suppression de ressource'},
        contentBloc: {$view: 'delete'}
      }
      checkToken(context, oid, function () {
        // faut charger la ressource pour vérifier les droits, c'est pas cher on vient de la mettre en cache
        $ressourceRepository.load(oid, function (error, ressource) {
          if (error) {
            log.error(error)
            data.contentBloc.error = "Impossible d'accéder à la ressource " + ressource.titre + ' (' + oid + ')'
          } else if (ressource) {
            if ($accessControl.hasPermission('delete', context, ressource)) {
              $ressourceRepository.remove(ressource.oid, function (error) {
                if (error) {
                  log.error(error)
                  data.contentBloc.error = 'Erreur lors de la suppression de la ressource ' + ressource.titre + ' (' + oid + ')'
                } else {
                  data.contentBloc.deletedOid = oid
                  data.contentBloc.titre = ressource.titre
                }
                context.html(data)
              })
            } else {
              log.error(new Error('Token OK mais droits insuffisant pour effacer la ressource ' + oid))
              $ressourcePage.printError(context, 'Erreur interne dans la vérification des droits')
            }
          } else {
            log.error(new Error('Token OK mais la ressource ' + oid + ' n’existe pas ou plus !'))
            $ressourcePage.printError(context, 'Erreur interne, ressource introuvable, probablement déjà effacée')
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
  function search (context) {
    context.layout = 'page'
    const crit = context.get
    let nbTotal = 0
    let visibilite = 'public'
    const options = {}
    const data = $ressourcePage.getDefaultData('liste')

    flow().seq(function () {
      redirectPublicOrContinue(context, this)
    }).seq(function () {
      // form de recherche
      if (_.isEmpty(context.get) || context.get.modify) return $ressourcePage.printSearchForm(context)
      // résultats
      log.debug('search reçoit', context.get)
      // faut passer en revue les critères
      const filters = []
      let filter, prop
      // les filtres, parmi les propriétés défini en conf
      for (prop in crit) {
        if (crit.hasOwnProperty(prop) && config.labels.hasOwnProperty(prop) && crit[prop]) {
          filter = {
            index: prop,
            values: Array.isArray(crit[prop]) ? crit[prop] : [crit[prop]]
          }
          filters.push(filter)
        }
      }
      log.debug('traduits en filters', filters)
      // @todo ajouter des critères de tri
      if (!filters.length) return $ressourcePage.printSearchForm(context, ['il faut choisir au moins un critère'])
      options.filters = filters
      // getListe vérifiera que ces valeurs sont acceptables, mais on veut des entiers
      options.skip = ensure(crit.skip, 'integer', 0)
      options.limit = ensure(crit.limit, 'integer', 25)
      options.orderBy = crit.orderBy || 'dateCreation'

      // visibilite
      var pid = $accessControl.getCurrentUserPid(context)
      // avec une exception pour l'admin qui peut passer ?all=1
      if (context.get.all && $accessControl.hasAllRights(context)) visibilite = 'all'
      // qqun qui veut voir ses propres ressources
      else if (context.get.auteurs && context.get.auteurs === pid) visibilite = 'auteur/' + pid

      $ressourceRepository.getListeCount(visibilite, options, this)
    }).seq(function (nb) {
      nbTotal = nb
      $ressourceRepository.getListe(visibilite, options, this)
    }).seq(function (ressources) {
      data.$metas.title = 'Résultats de la recherche'
      var nbInit = ressources.length
      // on filtre d'après les droits en lecture (pas le boulot de getListe)
      ressources = ressources.filter(ressource => $accessControl.hasReadPermission(context, ressource))
      if (ressources.length < nbInit) {
        log.error((nbInit - ressources.length) + ' ressources de la liste ont été filtrées par les droits avec ' + context.request.originalUrl)
      }
      // les actions (en float right, dust sait pas boucler en partant de la fin, faudrait écrire un helper, on empile de droite à gauche)
      data.actions = {
        links: []
      }
      // lien suivant (si on est au max)
      if (ressources.length === options.limit) {
        crit.skip = options.skip + options.limit
        data.actions.links.push({html: linkQs($routes.get('search'), 'Résultats suivants', crit)})
      }
      // 'titre' avec le nb de ressources
      let html = nbTotal + ' ressource'
      if (ressources.length) {
        var last = Math.min(options.skip + options.limit, options.skip + ressources.length)
        html += 's (' + (options.skip + 1) + ' à ' + last + ')'
      }
      data.actions.links.push({html: html, selected: true})
      // liens précédents
      if (options.skip) {
        // on démarre pas à 0, donc y'a des précédents
        crit.skip = options.skip - options.limit
        if (crit.skip < 0) crit.skip = 0
        data.actions.links.push({html: linkQs($routes.get('search'), 'Résultats précédents', crit)})
      }
      // un spacer
      data.actions.links.push({spacer: true})
      // le lien pour modifier les critères
      data.actions.links.push({href: context.request.originalUrl + '&modify=1', value: 'Modifier cette recherche'})
      // et on ajoute des liens sur chaque ressource
      data.contentBloc.ressources = $ressourceConverter.addUrlsToList(ressources, context)
      log.debug('les datas search', data, null, {max: 20000})
      context.html(data)
    }).catch(function (error) {
      log.error(error)
      data.contentBloc.error = error.toString()
    })
  }
  // avec mysql ça peut être vraiment très lent… (3s pour le count et 3s pour remonter les data)
  search.timeout = 10000

  /**
   * Affiche le formulaire de recherche (s'il n'y a pas de critères) ou la liste de résultat
   * @route GET /ressource/recherche
   */
  controller.get($routes.get('search'), search)

  /**
   * Un proxy pour les pages externes en https
   * @route GET /ressource/urlProxy
   */
  controller.get('urlProxy/:url', function (context) {
    // decodeURIComponent est déjà passé sur les arguments
    const url = context.arguments.url
    return $ressourceFetch.fetchURL(url, `urlProxy${url}`, context)
  })

  /**
   * Récupère un jnlp pour lancer la version desktop de mathgraph sur cette ressource
   * et l'enregistrer plus tard (depuis mathgraph) par un post sur /api/deferredAction
   * @route GET /ressource/jnlp/mathgraph/:oid
   */
  controller.get('jnlp/mathgraph/:oid', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      var oid = context.arguments.oid
      $ressourceRepository.load(oid, function (error, ressource) {
        if (!error && ressource && ressource.type !== 'mathgraph') error = 'Cette url ne fonctionne qu’avec des ressources de type mathgraph'
        if (error) {
          send(context, error)
        } else if (ressource) {
          if ($accessControl.hasPermission('update', context, ressource)) {
            $ressourceRepository.saveDeferred(ressource.oid, function (error, token) {
              if (!error && !token) error = new Error('saveDeferred ne renvoie ni erreur ni token')
              if (error) $ressourcePage.printError(context, error)
              else {
                var url = appConfig.application.baseUrl + 'api/action/mathgraph/' + token
                var dateSuffix = Math.floor((new Date()).getTime() / 1000)
                var options = {attachment: 'figure_mathgraph_' + ressource.oid + '-' + dateSuffix + '.jnlp'}
                // const figureUnite = 'TWF0aEdyYXBoSmF2YTEuMAAAABA+TMzNAANmcmH###8BAP8BAAAAAAAAAAAHrwAABPUAAAAAAAAAAAAAAAEAAAAI#####wAAAAEACkNDYWxjQ29uc3QA#####wACcGkAFjMuMTQxNTkyNjUzNTg5NzkzMjM4NDb#####AAAAAQAKQ0NvbnN0YW50ZUAJIftURC0Y#####wAAAAEACkNQb2ludEJhc2UA#####wAAAAAAEwABVQDAMYAAAAAAAEAcAAAAAAAABQAAQEefPnz58+hAR58+fPnz6P####8AAAABABRDRHJvaXRlRGlyZWN0aW9uRml4ZQD#####AQAAAAAWAAABAAEAAAABAT#wAAAAAAAA#####wAAAAEAD0NQb2ludExpZURyb2l0ZQD#####AAAAAAATAAFWAEAVAAAAAAAAQBwAAAAAAAAFAAFAV58+fPnz6AAAAAL#####AAAAAQAIQ1NlZ21lbnQA#####wAAAAAAAAAAAQABAAAAAQAAAAP#####AAAAAQAHQ01pbGlldQD#####AQAAAAAWAAABBQAAAAABAAAAA#####8AAAACAAxDQ29tbWVudGFpcmUA#####wAAAAAAAAAAAAAAAABAGAAAAAAAAAAAAAUTAAAAAAABAAAAAAABMf####8AAAABAAlDTG9uZ3VldXIA#####wAAAAEAAAADAAAAB###########'
                const figureVide = 'TWF0aEdyYXBoSmF2YTEuMAAAABA+TMzNAANmcmH###8BAP8BAAAAAAAAAAAHrwAABPUAAAAAAAAAAAAAAAEAAAAB#####wAAAAEACkNDYWxjQ29uc3QA#####wACcGkAFjMuMTQxNTkyNjUzNTg5NzkzMjM4NDb#####AAAAAQAKQ0NvbnN0YW50ZUAJIftURC0Y################'
                const figure = (ressource.parametres && ressource.parametres.figure) || figureVide
                var content = `<?xml version="1.0" encoding="UTF-8"?>
<jnlp spec="1.0+" codebase="https://www.mathgraph32.org/jaws" >
  <information>
    <title>MathGraph32</title>
    <vendor>Association Sesamath</vendor>
    <homepage href="https://mathgraph32.org/"/>
    <icon href="logoMathGraph.png"/>
    <icon href="SplashScreen.png" kind="splash"/>
    <offline-allowed/>
  </information>
  <security>
    <all-permissions/>
  </security>
  <resources>
    <j2se version="1.7+"/>
    <jar href="MathGraph32.jar" main="true" version ="5.2.0"/>
    <property name="jnlp.versionEnabled" value="true"/>
  </resources>
  <application-desc name="MathGraph32" main-class="mathgraph32.Main" width="800" height="600">
    <argument>online</argument>
    <argument>${url}</argument>
    <argument>${figure}</argument>
  </application-desc>
  <update check="background"/>
</jnlp>`
                context.raw(content, options)
              }
            })
          } else {
            denied(context, 'Vous n’avez pas les droits suffisants pour modifier cette ressource')
          }
        } else {
          $ressourcePage.printError(context, 'La ressource d’identifiant ' + oid + ' n’existe pas', 404)
        }
      })
    } else {
      denied(context)
    }
  })
}
