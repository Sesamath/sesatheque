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
/* global log */
'use strict'

var _ = require('lodash')
var tools = require('../tools')
var sjt = require('sesajstools')
var sjtObj = require('sesajstools/utils/object')
var flow = require('an-flow')

/**
 * Controleur du chemin /groupe/ (pour voir/modifier les groupes d'auteurs)
 * @controller controllerGroupe
 */
module.exports = function (controller, EntityGroupe, $groupeRepository, $personneRepository, $accessControl, $page, $form, $flashMessages) {
  var h = require('./controllerGroupeHelper')($accessControl, $groupeRepository, $personneRepository)

  function addUrlDescribe (groupe) {
    if (groupe && groupe.nom) groupe.urlDescribe = '/groupe/voir/' + encodeURIComponent(groupe.nom)
  }

  function addUrlModif (groupe) {
    if (groupe && groupe.nom) {
      var suf = encodeURIComponent(groupe.nom)
      groupe.urlEdit = '/groupe/modifier/' + suf
      groupe.urlDelete = '/groupe/supprimer/' + suf
    }
  }

  function addUrlJoin (groupe) {
    if (groupe && groupe.nom) groupe.urlJoin = '/groupe/rejoindre/' + encodeURIComponent(groupe.nom)
  }

  function addUrlQuit (groupe) {
    if (groupe && groupe.nom) groupe.urlQuit = '/groupe/quitter/' + encodeURIComponent(groupe.nom)
  }

  function addUrlFollow (groupe) {
    if (groupe && groupe.nom) groupe.urlFollow = '/groupe/suivre/' + encodeURIComponent(groupe.nom)
  }

  function addUrlIgnore (groupe) {
    if (groupe && groupe.nom) groupe.urlIgnore = '/groupe/ignorer/' + encodeURIComponent(groupe.nom)
  }

  /**
   * Retourne le nom du groupe (helper des fcts qui prennent un argument groupe|groupeNom)
   * @private
   * @param {string|Groupe} groupe Le groupe ou son nom
   * @returns {string} undefined si groupe n'est ni une string ni un objet avec une propriété nom
   */
  function getNom (groupe) {
    var nom
    if (groupe) {
      if (groupe.nom) nom = groupe.nom
      else if (typeof groupe === 'string') nom = groupe
    }
    if (!nom) log.error('getNom appelé avec un paramètre incorrect', groupe)
    return nom
  }

  /**
   * Retourne true si on est dans ce groupe
   * @private
   * @param context
   * @param {string|Groupe} groupe Le groupe ou son nom
   * @returns {boolean}
   */
  function isMine (context, groupe) {
    var nom = getNom(groupe)
    return nom ? _.includes($accessControl.getCurrentUserGroupes(context), nom) : false
  }

  /**
   * Retourne une liste de gestionnaires
   * @private
   * @param {string|string[]} ids Liste d'id de personnes (array ou string avec séparateur qcq)
   * @param {boolean} [nameOnly=false] passer true pour récupérer un array de string 'prénom nom'
   * @param next callback appelée avec ({Error}, {Personne[]|string[]}, string[]), le dernier étant les ids en errur
   */
  function loadGestionnaires (ids, nameOnly, next) {
    ids = (typeof ids === 'string') ? tools.idListToArray(ids) : ids
    flow(ids).seqEach(function (id) {
      $personneRepository.load(id, this)
    }).seq(function (personnes) {
      var gests = []
      var ids404 = []
      // log.debug('loadGestionnaires transforme ' +ids.join(','), personnes, null, {max:19999})
      personnes.forEach(function (gest, i) {
        if (gest && gest.oid) { // si le load ne renvoie rien on récupère un tableau vide !
          if (nameOnly) gests.push(gest.prenom + ' ' + gest.nom)
          else gests.push(gest)
        } else {
          ids404.push(ids[ i ])
        }
      })
      next(null, gests, ids404)
    }).catch(function (error) {
      log.error(error)
      next(error)
    })
  }

  /**
   * Helper de POST /groupe/modifier/:nom dans le cas où il y a une confirmation à demander
   * @private
   * @param context
   * @param nom
   * @param gestionnairesNames
   */
  function modAskConfirm (context, nom, gestionnairesNames) {
    // on demande confirmation (en mettant en session tout le groupe modifié d'après la demande)
    var formPosted = context.post
    var pid = $accessControl.getCurrentUserPid(context)
    var fields = []
    var groupe
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      groupe = grp
      // on màj l'objet pour le mettre en session via le token et l'enregistrer après confirmation
      groupe.description = formPosted.description
      groupe.ouvert = (formPosted.ouvert === 'true')
      groupe.public = (formPosted.public === 'true')
      if (formPosted.newGestionnaires) loadGestionnaires(formPosted.newGestionnaires, false, this)
      else this()
    }).seq(function (newGestionnaires, ids404) {
      // nouveaux gestionnaires
      if (newGestionnaires && newGestionnaires.length) {
        var itemsNewG = []
        newGestionnaires.forEach(function (personne) {
          if (_.includes(groupe.gestionnaires, personne.oid)) {
            $flashMessages.add(context, personne.prenom + ' ' + personne.nom + " était déjà gestionnaire et n'a pas été ajouté")
          } else {
            groupe.gestionnaires.push(personne.oid)
            var ng = personne.prenom + ' ' + personne.nom
            gestionnairesNames.push(ng)
            itemsNewG.push(ng)
          }
        })
        // log.debug('new gest', itemsNewG)
        fields.push({
          widget: 'info',
          value: 'Gestionnaires à ajouter (qui deviendront non révocables après validation) : ' + itemsNewG.join(', ') // jshint:ignore line (espace insécable)
        })
      }
      if (ids404 && ids404.length) {
        var pl = ids404.length > 1 ? 's' : ''
        $flashMessages.add(context, 'Le' + pl + ' gestionnaire' + pl + " d'identifiant" + pl + ' ' + ids404.join(', ') + " n'existe" + (pl ? 'nt' : '') + ' pas')
      }

      // ne plus être gestionnaire
      if (formPosted.quit === 'true') {
        var i = groupe.gestionnaires.indexOf(pid)
        if (i > -1) {
          if (groupe.gestionnaires.length > 1) {
            groupe.gestionnaires.splice(i, 1)
            fields.push({
              widget: 'info',
              value: 'Vous ne serez plus gestionnaire de ce groupe'
            })
            var me = $accessControl.getCurrentUser(context)
            var myIndex = gestionnairesNames.indexOf(me.prenom + ' ' + me.nom)
            gestionnairesNames = gestionnairesNames.splice(myIndex, 1)
          } else {
            throw new Error('Vous êtes le seul gestionnaire de ce groupe et ne pouvez pas quitter cette fonction')
          }
        } else {
          throw new Error("Vous n'êtes pas gestionnaire de ce groupe")
        }
      }

      // on met ce groupe en session pour le sauvegarder la prochaine fois
      var token = $accessControl.addToken(context, null, groupe)
      fields.push({ name: 'token', value: token, widget: 'hidden' })
      // plutôt que des radios on donne des noms à 2 boutons submit
      // fields.push({name: 'confirm', value: [{label:'oui', value:'oui'}, {label:'non', value:'non'}], selectedValues:['non'], widget:'radios', label: 'Confirmer ces valeurs'}) // jshint:ignore line
      // id pour les css
      fields.push({ id: 'validModif', name: 'modOk', value: 'Valider', widget: 'submit' })
      fields.push({ id: 'cancelModif', name: 'modKo', value: 'Annuler', widget: 'submit' })
      // on passe l'affichage du groupe via blocsFirst
      var moreData = { blocsFirst: groupe }
      // log.debug('groupe à confirmer', groupe)
      moreData.blocsFirst.$view = 'displayGroupe'
      moreData.blocsFirst.gestionnairesNames = gestionnairesNames
      $form.print(context, null, null, fields, null, 'Valider les modifications du groupe', moreData)
    }).catch(function (error) {
      log.error(error)
      $page.printError(context, error)
    })
  } // modAskConfirm

  /**
   * Helper de POST /groupe/modifier/:nom dans le cas où on a confirmé
   * @private
   * @param context
   * @param nom
   */
  function modConfirmed (context, nom) {
    // Save du form confirmé, on vérifie et enregistre
    var formPosted = context.post
    var newGroupe = $accessControl.getTokenValue(context, formPosted.token)
    if (!newGroupe || newGroupe.nom !== nom) throw new Error('Données corrompues')
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (groupe) {
      sjtObj.updateIfExists(groupe, newGroupe)
      $groupeRepository.save(groupe, this)
    }).seq(function () {
      $flashMessages.add(context, 'groupe sauvegardé')
      context.redirect('/groupe/voir/' + encodeURIComponent(nom))
    }).catch(function (error) {
      $page.printError(context, error)
    })
  }

  /**
   * Helper de POST /groupe/modifier/:nom dans le cas où on
   * sauvegarde sans avoir de confirmation à demander
   * @private
   * @param context
   * @param nom
   */
  function modSave (context, nom) {
    var formPosted = context.post
    // pas besoin de confirmation
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (groupeBdd) {
      if (!groupeBdd || groupeBdd.nom !== nom) {
        this(new Error('Erreur interne, le nom du groupe récupéré en base de donnée ne correspond pas (' + nom + '≠' + groupeBdd.nom + ')'))
      } else {
        var isOuvert = (formPosted.ouvert === 'true')
        var isPublic = (formPosted.public === 'true')
        var saveNeeded = false
        if (groupeBdd.description !== formPosted.description) {
          groupeBdd.description = formPosted.description
          saveNeeded = true
        }
        if (groupeBdd.ouvert !== isOuvert) {
          groupeBdd.ouvert = isOuvert
          saveNeeded = true
        }
        if (groupeBdd.public !== isPublic) {
          groupeBdd.public = isPublic
          saveNeeded = true
        }
        if (saveNeeded) $groupeRepository.save(groupeBdd, this)
        else this()
      }
    }).seq(function (groupe) {
      if (groupe) {
        $flashMessages.add(context, 'groupe sauvegardé')
      } else {
        $flashMessages.add(context, 'Aucune modification à sauvegarder')
      }
      context.redirect('/groupe/voir/' + encodeURIComponent(nom))
    }).catch(function (error) {
      log.error(error)
      $page.printError(context, error)
    })
  }

  /**
   * Redirige vers la liste perso avec un message ou affiche une erreur (si on est pas authentifié)
   * @private
   * @param {Context} context
   * @param {string|Error} message
   * @param {boolean} isError Si c'est un message d'erreur à mettre en flashMessage
   */
  function goToPersoOrError (context, message, isError) {
    var level = isError ? 'error' : 'info'
    if ($accessControl.isAuthenticated(context)) {
      // on redirige vers perso avec le message ou l'erreur éventuelle
      if (typeof message === 'object') {
        if (message instanceof Error) {
          level = 'error'
          log.debug('error stack passé à goToPersoOrError', message.stack)
        } else {
          log.error(new Error("goToPersoOrError reçoit un objet qui n'est pas une erreur"), message)
        }
        message = message.toString()
      }
      $flashMessages.add(context, message, level)
      context.redirect('/groupe/perso')
    } else {
      // page d'erreur
      $page.printError(context, message)
    }
  }

  /**
   * Affiche le groupe
   * @private
   * @param context
   * @param groupe
   */
  function printGroupe (context, groupe) {
    loadGestionnaires(groupe.gestionnaires, true, function (error, gestionnairesNames) {
      if (error) {
        $page.printError(context, error)
      } else {
        var isManaged = h.isManaged(context, groupe)
        // les actions, modif
        if (isManaged) addUrlModif(groupe)
        // membre
        if (isMine(context, groupe)) addUrlQuit(groupe)
        else if (isManaged || groupe.ouvert) addUrlJoin(groupe)
        // follower
        if (h.isFollowed(context, groupe)) addUrlIgnore(groupe)
        else if (isManaged || groupe.public) addUrlFollow(groupe)
        var contentBloc = groupe
        contentBloc.$view = 'displayGroupe'
        contentBloc.gestionnairesNames = gestionnairesNames.join(', ')
        $page.print(context, 'Description du groupe', contentBloc)
      }
    })
  }

  /**
   * Affiche un groupe
   * @route GET /groupe/voir/:nom
   */
  controller.get('voir/:nom', function (context) {
    var nom = context.arguments.nom
    var groupe
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      groupe = grp
      var msg = 'Le groupe ' + nom + " n'existe pas ou n'est pas public"
      if (grp) {
        if (grp.public || isMine(context, nom)) this()
        else this(msg)
      } else {
        this(msg)
      }
    }).seq(function () {
      var $ressourceRepository = lassi.service('$ressourceRepository')
      $ressourceRepository.getListe('groupe/' + nom, {}, this)
    }).seq(function (ressources) {
      if (ressources && ressources.length) {
        var $ressourceConverter = lassi.service('$ressourceConverter')
        // faut passer addUrlsToList d'abord car il a besoin de la ressource complète
        // donc ensuite dans le map filtrer sur les propriétés url* (on sait pas à l'avance lesquelles)
        groupe.ressources = $ressourceConverter.addUrlsToList(groupe.ressources).map((ressource) => {
          // seulement ce qui intéresse la vue du groupe, mais est-ce bien une optimisation ?
          const ressData = {
            oid: ressource.oid,
            titre: ressource.titre
          }
          Object.keys(ressource).forEach(prop => {
            if (/^url/.test(prop)) ressData[prop] = prop
          })
          return ressData
        })
        // et on ajoute les liens
      }
      this()
    }).seq(function () {
      printGroupe(context, groupe)
    }).catch(function (error) {
      $page.printError(context, error.toString())
    })
  })

  /**
   * formulaire de création
   * @route GET /groupe/ajouter
   */
  controller.get('ajouter', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      if ($accessControl.hasGenericPermission('createGroupe', context)) {
        var fields = [
          { name: 'nom', label: 'Nom du groupe' },
          { name: 'description', label: 'Description', widget: 'textarea' },
          {
            name: 'ouvert',
            value: true,
            label: 'Ouvert à tous',
            labelInfo: 'Tout le monde pourra devenir membre du groupe'
          },
          {
            name: 'public',
            value: true,
            label: 'public',
            labelInfo: "Tout le monde pourra s'inscrire au suivi des publications du groupe"
          }
        ]
        $form.print(context, null, null, fields, 'Créer', 'Ajouter un groupe')
      } else {
        $page.denied(context, 'Droits insuffisants pour créer un groupe')
      }
    } else {
      $page.denied(context, 'Il faut être authentifié pour créer un groupe')
    }
  })

  /**
   * Traitement du formulaire d'ajout de ressource, réaffiche le form avec une erreur éventuelle ou
   * redirige vers le form d'édition (pour ajouter ce qui dépend du type choisi)
   * @route POST /groupe/ajouter
   */
  controller.post('ajouter', function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    try {
      // premiers contrôles qui renverront denied
      var pid = $accessControl.getCurrentUserPid(context)
      if (!pid) throw new Error('Il faut être authentifié pour créer un groupe')
      if (!$accessControl.hasGenericPermission('createGroupe', context)) throw new Error('Droits insuffisants pour créer un groupe')
      /**
       * @private
       * @type Groupe
       */
      var groupe = context.post
      if (!groupe.nom) throw new Error('Données invalides')
      var nom = groupe.nom
      var groupeBdd
      // on peut continuer, faut vérifier qu'il n'existe pas
      flow().seq(function () {
        $groupeRepository.load(nom, this)
      }).seq(function (groupeBdd) {
        if (groupeBdd) this('Le groupe « ' + nom + ' » existe déjà')
        else this()
      }).seq(function () {
        groupe.gestionnaires = [pid]
        $groupeRepository.save(groupe, this)
      }).seq(function (groupeSaved) {
        if (groupeSaved) {
          groupeBdd = groupeSaved
          h.joinGroup(context, nom, this)
        } else {
          this(new Error("Erreur à l'enregistrement du groupe " + nom))
        }
      }).seq(function () {
        if (context.get.closerId) {
          // on apelle le closer mis par sesatheque-client
          context.html({
            $metas: {
              title: 'Enregistrement réussi, fermeture automatique'
            },
            contentBloc: {
              $view: 'contents',
              contents: [ 'Groupe ' + nom + ' enregistré' ]
            },
            jsBloc: {
              $view: 'js',
              // action:"iframeCloser" est en dur dans sesatheque-client:addCloser
              jsCode: 'if (parent.postMessage) parent.postMessage({action:"iframeCloser", id:"' +
              context.get.closerId + '", groupe:' + sjt.stringify(groupeBdd) + '}, "*")'
            }
          })
        } else {
          // redirection normale
          $flashMessages.add(context, 'Le groupe « ' + nom + ' » a été créé')
          context.redirect('/groupe/voir/' + encodeURIComponent(nom))
        }
      }).catch(function (error) {
        if (error instanceof Error) log.error(error)
        if (context.get.closerId) {
          context.html({
            $metas: {
              title: 'Enregistrement échoué, fermeture automatique'
            },
            contentBloc: {
              $view: 'contents',
              contents: [ 'L’enregistrement du groupe ' + nom + ' a échoué : ' + error.toString() ]
            },
            jsBloc: {
              $view: 'js',
              // action:"iframeCloser" est en dur dans sesatheque-client:addCloser
              jsCode: 'if (parent.postMessage) parent.postMessage({action:"iframeCloser", id:"' +
              context.get.closerId + '", error:"' + error.toString().replace('"', '\\"') + '"}, "*")'
            }
          })
        } else {
          $page.printError(context, error)
        }
      })
    } catch (error) {
      $page.denied(context, error.toString())
    }
  })

  /**
   * formulaire d'édition
   * @route GET /groupe/modifier/:nom
   */
  controller.get('modifier/:nom', function (context) {
    var pid = $accessControl.getCurrentUserPid(context)
    if (pid) {
      var nom = context.arguments.nom
      var deniedMsg = 'Le groupe « ' + nom + " » n'existe pas ou vous n'en êtes pas gestionnaire"

      flow().seq(function () {
        $groupeRepository.load(nom, this)
      }).seq(function (groupeBdd) {
        // on regarde si on est gestionnaire
        if (groupeBdd) {
          if (groupeBdd.nom !== nom) this(new Error('Erreur interne, le nom du groupe récupéré en base de donnée ne correspond pas (' + nom + '≠' + groupeBdd.nom + ')')) // jshint:ignore line
          else if (_.includes(groupeBdd.gestionnaires, pid)) this(null, groupeBdd)
          else this(deniedMsg)
        } else {
          this(deniedMsg)
        }
      }).seq(function (groupeBdd) {
        var blocList = []
        var fields = [
          { name: 'ouvert', value: groupeBdd.ouvert, label: 'Ouvert à tous' },
          { name: 'public', value: groupeBdd.public, label: 'Visible de tous' },
          { name: 'description', label: 'Description', widget: 'textarea', value: groupeBdd.description },
          {
            name: 'newGestionnaires',
            label: 'Ajouter des gestionnaires',
            labelInfo: "L'ajout est irrévocable. Entrer un ou des identifiants séparés par des espaces, la confirmation sera demandée sur la page suivante avec les noms affichés"
          } // jshint:ignore line
        ]
        flow().seq(function () {
          if (groupeBdd.gestionnaires.length > 1) {
            fields.push({
              name: 'quit',
              value: false,
              label: 'Me retirer des gestionnaires de ce groupe'
            })
          }
          loadGestionnaires(groupeBdd.gestionnaires, true, this)
        }).seq(function (gestionnairesNames) {
          // on va stocker dans tokenValue {nom, gestionnairesNames} pour éviter de retourner chercher la liste
          var tokenValue = { nom: nom }
          // on l'ajoute au groupe mis en session
          tokenValue.gestionnairesNames = gestionnairesNames
          // et sur la page
          blocList.push({
            partialView: '../contents',
            liste: {
              titre: 'Gestionnaires de ce groupe',
              items: gestionnairesNames
            }
          })
          var token = $accessControl.addToken(context, null, tokenValue)
          fields.push({ name: 'token', value: token, widget: 'hidden' })
          var group = { label: 'Groupe : ' + nom }
          $form.print(context, null, group, fields, 'Modifier', 'Modifier un groupe', blocList)
        }).catch(function (error) {
          log.error(error)
          $page.printError(context, error)
        })
      }).catch(function (error) {
        if (error instanceof Error) log.error(error)
        $page.printError(context, error)
      })
    } else {
      $page.denied(context, 'Il faut être authentifié pour modifier un groupe')
    }
  })

  /**
   * Traitement du formulaire d'édition, réaffiche le formulaire si besoin de confirmation
   * @route POST /groupe/modifier/:nom
   */
  controller.post('modifier/:nom', function (context) {
    try {
      var pid = $accessControl.getCurrentUserPid(context)
      if (!pid) throw new Error('Il faut être authentifié pour modifier un groupe')
      var nom = context.arguments.nom
      var formPosted = context.post
      if (formPosted.modOk) {
        modConfirmed(context, nom)
      } else if (formPosted.modKo) {
        $flashMessages.add(context, 'modification du groupe annulée')
        context.redirect('/groupe/voir/' + encodeURIComponent(nom))
      } else {
        // on regarde le post pour savoir s'il faut une demande de confirmation
        var tokenValue = $accessControl.getTokenValue(context, formPosted.token)
        // log.debug('on récupère via le token', tokenValue)
        if (!tokenValue || tokenValue.nom !== nom) throw new Error('Données corrompues')
        if (formPosted.newGestionnaires || formPosted.quit) {
          modAskConfirm(context, nom, tokenValue.gestionnairesNames)
        } else {
          modSave(context, nom)
        }
      }
    } catch (error) {
      $page.denied(context, error.toString())
    }
  })

  /**
   * Affiche la liste de tous les groupes ouverts
   * @route GET /groupe/ouvert
   */
  controller.get('ouvert', function (context) {
    $groupeRepository.loadOuvert(function (error, groupes) {
      if (error) {
        $page.printError(context, error)
      } else {
        var contentBloc = {
          $view: 'groupes',
          groupes: []
        }
        if (groupes && groupes.length) {
          groupes.forEach(function (groupe) {
            var item = { nom: groupe.nom, description: groupe.description }
            if (h.isManaged(context, groupe)) addUrlModif(item)
            else if (isMine(context, groupe.nom)) addUrlQuit(item)
            else addUrlJoin(item)
            if (h.isFollowed(context, groupe.nom)) addUrlIgnore(item)
            else addUrlFollow(item)
            item.publicString = groupe.public ? 'public' : 'privé'
            contentBloc.groupes.push(item)
          })
        } else {
          contentBloc.defaultMessage = "Aucun groupe ouvert n'a été créé"
        }
        $page.print(context, 'Tous les groupes ouverts', contentBloc)
      }
    })
  })

  /**
   * Affiche la liste de tous les groupes publics
   * @route GET /groupe/public
   */
  controller.get('public', function (context) {
    $groupeRepository.loadPublic(function (error, groupes) {
      if (error) {
        $page.printError(context, error)
      } else {
        var contentBloc = {
          $view: 'groupes',
          groupes: []
        }
        if (groupes && groupes.length) {
          groupes.forEach(function (groupe) {
            var item = { nom: groupe.nom, description: groupe.description }
            if (h.isManaged(context, groupe)) addUrlModif(item)
            else if (isMine(context, groupe.nom)) addUrlQuit(item)
            else addUrlJoin(item)
            if (h.isFollowed(context, groupe.nom)) addUrlIgnore(item)
            else addUrlFollow(item)
            item.ouvertString = groupe.ouvert ? 'ouvert' : 'fermé'
            contentBloc.groupes.push(item)
          })
        } else {
          contentBloc.defaultMessage = "Aucun groupe public n'a été créé"
        }
        $page.print(context, 'Tous les groupes publics', contentBloc)
      }
    })
  })

  /**
   * Affiche la liste de mes groupes
   * @route GET /groupe/perso
   */
  controller.get('perso', function (context) {
    context.layout = (context.get.layout === 'iframe') ? 'iframe' : 'page'
    console.log('user en session', context.session.user.permissions)
    var blocList = []
    flow().seq(function () {
      if ($accessControl.isAuthenticated(context)) this()
      else this('Il faut être authentifié pour voir ses groupes')
    }).seq(function () {
      $accessControl.refreshCurrentUser(context, this)
    }).seq(function () {
      h.loadMyGroupesManaged(context, this)
    }).seq(function (groupesManaged) {
      // groupes dont on est gestionnaire
      groupesManaged.forEach(function (groupe) {
        addUrlModif(groupe)
        addUrlDescribe(groupe)
        groupe.ouvertString = groupe.ouvert ? 'ouvert' : 'fermé'
        groupe.publicString = groupe.public ? 'public' : 'privé'
      })
      // le lien pour ajouter un groupe
      blocList.push({
        partialView: '../groupes',
        titre: 'Groupes dont je suis gestionnaire',
        contents: $accessControl.hasGenericPermission('createGroupe', context) ? [ '<a href="/groupe/ajouter">Créer un groupe</a>' ] : '',
        groupes: groupesManaged,
        defaultMessage: 'aucun groupe'
      })
      // log.debug('groupes dont je suis gestionnaire', groupesManaged)

      // groupes dont on est membre
      var groupesMembre = $accessControl.getCurrentUserGroupes(context)
      var itemsMembre = []
      groupesMembre.forEach(function (nom) {
        var groupe = {
          nom: nom
        }
        addUrlDescribe(groupe)
        var isManaged = groupesManaged.some(function (groupeManaged) { return groupeManaged.nom === nom })
        if (isManaged) addUrlModif(groupe)
        else addUrlQuit(groupe)
        itemsMembre.push(groupe)
      })
      // log.debug('groupes membre', itemsMembre)
      blocList.push({
        partialView: '../groupes',
        titre: 'Groupes dont je suis membre',
        contents: [
          '<a href="/groupe/ouvert">Voir la liste des groupes ouverts</a>' +
          ' <span class="remarque">(pour éventuellement en devenir membre)</span>'
        ],
        groupes: itemsMembre,
        defaultMessage: 'aucun groupe'
      })

      // groupes que l'on suit
      var groupesSuivis = $accessControl.getCurrentUserGroupesSuivis(context)
      var itemsSuivis = []
      groupesSuivis.forEach(function (nom) {
        var groupe = { nom: nom }
        addUrlDescribe(groupe)
        var isManaged = groupesManaged.some(function (groupeManaged) { return groupeManaged.nom === nom })
        if (isManaged) addUrlModif(nom)
        else if (!isMine(context, nom)) addUrlIgnore(groupe)
        itemsSuivis.push(groupe)
      })
      // log.debug('groupes suivis', itemsSuivis)
      blocList.push({
        partialView: '../groupes',
        titre: 'Groupes suivis',
        contents: [
          '<a href="/groupe/public">Voir la liste des groupes publics</a>' +
          ' <span class="remarque">(pour éventuellement suivre leurs publications)</span>'
        ],
        groupes: itemsSuivis,
        defaultMessage: 'aucun groupe'
      })

      $page.print(context, 'Mes groupes', null, blocList)
    }).catch(function (error) {
      $page.printError(context, error)
    })
  })

  // Les actions depuis une liste pour modifier ses groupes (redirige sur perso)

  /**
   * Ajoute le groupe (membre) au user courant
   * @route GET /groupe/rejoindre/:nom
   */
  controller.get('rejoindre/:nom', function (context) {
    var nom = context.arguments.nom
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      var deniedMsg = 'Le groupe ' + nom + " n'existe pas ou n'est pas ouvert"
      if (grp) {
        if (isMine(context, nom)) this('Vous êtes déjà membre du groupe ' + nom)
        else if (grp.ouvert) this()
        else this(deniedMsg)
      } else {
        this(deniedMsg)
      }
    }).seq(function () {
      h.joinGroup(context, nom, this)
    }).seq(function () {
      goToPersoOrError(context, 'Vous êtes désormais membre du groupe ' + nom)
    }).catch(function (error) {
      goToPersoOrError(context, error, true)
    })
  })

  /**
   * Retire le groupe au user courant
   * @route GET /groupe/quitter/:nom
   */
  controller.get('quitter/:nom', function (context) {
    var nom = context.arguments.nom
    if (isMine(context, nom)) {
      h.quitGroup(context, nom, function (error) {
        if (error) goToPersoOrError(context, error, true)
        else goToPersoOrError(context, 'Vous avez quitté le groupe ' + nom)
      })
    } else {
      goToPersoOrError(context, 'Vous n’êtes pas membre du groupe ' + nom, true)
    }
  })

  /**
   * Suivre le groupe
   * @route GET /groupe/suivre/:nom
   */
  controller.get('suivre/:nom', function (context) {
    var nom = context.arguments.nom
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      var deniedMsg = 'Le groupe ' + nom + " n'existe pas ou n'est pas public"
      if (grp) {
        if (h.isFollowed(context, nom)) this('Vous suivez déjà les publications du groupe ' + nom)
        else if (grp.public) this()
        else this(deniedMsg)
      } else {
        this(deniedMsg)
      }
    }).seq(function () {
      h.followGroup(context, nom, this)
    }).seq(function () {
      goToPersoOrError(context, 'Vous suivez désormais les publications du groupe ' + nom)
    }).catch(function (error) {
      goToPersoOrError(context, error, true)
    })
  })

  /**
   * Ne plus suivre le groupe
   * @route GET /groupe/ignorer/:nom
   */
  controller.get('ignorer/:nom', function (context) {
    var nom = context.arguments.nom
    if (h.isFollowed(context, nom)) {
      h.ignoreGroup(context, nom, function (error) {
        if (error) goToPersoOrError(context, error, true)
        else goToPersoOrError(context, 'Vous avez cessé de suivre les publications du groupe ' + nom)
      })
    } else {
      goToPersoOrError(context, 'Vous ne suiviez pas les publications du groupe ' + nom, true)
    }
  })

  /**
   * Affiche la demande de confirmation pour effacement
   * (utilise la vue describe pour montrer le détail de ce que l'on va effacer)
   * @route GET /ressource/supprimer/:oid
   */
  controller.get('supprimer/:nom', function (context) {
    context.layout = 'page'
    var currentUser = $accessControl.getCurrentUser(context)
    if (currentUser) {
      var nom = context.arguments.nom
      var token = context.get.token
      if (token) {
        // on vérifie
        var verif = context.session.delGroup
        if (verif && verif.groupe && verif.groupe.nom === nom && verif.token === token) {
          // on le vire déjà pour le user courant
          $groupeRepository.delete(nom, function (error) {
            if (error) {
              goToPersoOrError(context, error)
            } else {
              // si on supprime ce groupe, on en est membre (sauf si on est admin), faut donc mettre la session à jour
              var index = currentUser.groupesMembre && currentUser.groupesMembre.indexOf(nom)
              if (index) currentUser.groupesSuivis = currentUser.groupesSuivis.filter(function (elt, i) { return index !== i })
              index = currentUser.groupesSuivis && currentUser.groupesSuivis.indexOf(nom)
              if (index) currentUser.groupesSuivis = currentUser.groupesSuivis.filter(function (elt, i) { return index !== i })
              // pas besoin de remettre en session, currentUser est une ref sur la session
              $accessControl.updateCurrentUser(context, currentUser)
              goToPersoOrError(context, 'Le groupe ' + nom + ' a été supprimé')
            }
          })
        }
      } else {
        // on demande confirmation
        flow().seq(function () {
          $groupeRepository.load(nom, this)
        }).seq(function (grp) {
          if (grp && h.isManaged(context, grp)) this(null, grp)
          else this('Le groupe ' + nom + " n'existe pas ou vous n'en êtes pas gestionnaire")
        }).seq(function (grp) {
          var token = sjt.getToken()
          context.session.delGroup = { groupe: grp, token: token }
          var link = '/groupe/supprimer/' + encodeURIComponent(nom) + '?token=' + token
          context.html({
            $metas: { title: 'Suppression du groupe ' + nom },
            contentBloc: {
              $view: 'contents',
              contents: [
                'Voulez-vous vraiment supprimer le groupe ' + nom + ' ?',
                'Les ressources publiées dans ce groupe ne seront plus accessible via ce partage.',
                '<a href="' + link + '"><button>Supprimer ' + nom + ' définitivement</button></a>'
              ]
            }
          })
        }).catch(function (error) {
          goToPersoOrError(context, error, true)
        })
      }
    } else {
      $page.denied(context)
    }
  })
}
