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

//var _ = require('lodash')
var tools = require('../tools')
var flow = require('an-flow')

/**
 * Controleur du chemin /groupe/ (pour voir/modifier les groupes d'auteurs)
 *
 * @controller controllerGroupe
 * @requires $ressourceRepository {@link $ressourceRepository]
 * @requires EntityGroupe {@link EntityGroupe}
 * @requires $groupeRepository {@link $groupeRepository}
 * @requires $personneRepository {@link $personneRepository}
 * @requires $accessControl {@link $accessControl}
 * @requires $page {@link $page}
 * @requires $form {@link $form}
 */
module.exports = function (controller, EntityGroupe, $groupeRepository, $personneRepository, $accessControl, $page, $form, $flashMessages) {

  /**
   * Retourne la liste des gestionnaires
   * @private
   * @param {string|string[]} ids
   * @param next callback appelée avec ({Error}, {EntityPersonne[]})
   */
  function getGestionnairesNames(ids, next) {
    ids = (typeof ids === 'string') ? tools.idListToArray(ids) : ids
    var gests = []
    flow(ids).seqEach(function (id) {
      log.error("avant load")
      $personneRepository.load(id, this)
    }).seq(function (personnes) {
      personnes.forEach(function (gest) {
        gests.push(gest.prenom + ' ' + gest.nom)
      })
      next(null, gests)
    }).catch(function (error) {
      log.error(error)
      next(error)
    })
  }

  /**
   * Retourne la liste des groupes du user courant (liste vide si pas authentifié)
   * @private
   * @param {Context} context
   * @returns {Array}
   */
  function getMyGroupes(context) {
    var me = $accessControl.getCurrentUser(context)
    return me && me.groupes || []
  }

  /**
   * Récupère la liste des groupes dont je suis proprio
   * @private
   * @param {Context} context
   * @param {groupeListCallback} next
   */
  function getMyGroupesManaged(context, next) {
    var myId = $accessControl.getCurrentUserOid(context)
    if (myId) {
      $groupeRepository.getListManagedBy(myId, next)
    }
  }

  /**
   * Ajoute un groupe à l'utilisateur courant
   * @private
   * @param context
   * @param nom
   * @param next
   */
  function joinGroup(context, nom, next) {
    var me = $accessControl.getCurrentUser(context)
    if (me) {
      if (!me.groupes) me.groupes = []
      me.groupes.push(nom)
      $personneRepository.save(me, next)
      // et faut pas oublier de mettre à jour la session
      $accessControl.updateCurrentUser(context, me)
    } else {
      next(new Error("Il faut être authentifié pour rejoindre un groupe"))
    }
  }

  /**
   * Helper de POST /groupe/modifier/:nom dans le cas où il y a une confirmation à demander
   * @private
   * @param context
   * @param nom
   * @param gestionnairesNames
   */
  function modAskConfirm(context, nom, gestionnairesNames ) {
    // on demande confirmation (en mettant en session tout le groupe modifié d'après la demande)
    var formPosted = context.post
    var uid = $accessControl.getCurrentUserOid(context)
    var fields = [
      {name: "confirm", value: true, label: 'Confirmer ces valeurs'}
    ]
    var blocs = {
      infoGest: {
        $view: 'contents',
        liste: {
          titre: 'Gestionnaires existants (non modifiable)',
          items: gestionnairesNames
        }
      }
    }
    var groupe
    var newOids = []
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (groupeBdd) {
      groupe = groupeBdd
      if (formPosted.newGestionnaires) getGestionnairesNames(formPosted.newGestionnaires, this)
      else this()
    }).seq(function (personnes) {

      // nouveaux gestionnaires
      if (personnes && personnes.length) {
        blocs.newGests = {
          $view: 'contents',
          liste: {
            titre: 'Gestionnaires à ajouter (non révocables)',
            items: []
          }
        }
        personnes.forEach(function (personne) {
          if (groupe.gestionnaires.indexOf(personne.oid) === -1) {
            newOids.push(personne.oid)
            groupe.gestionnaires.push(personne.oid)
            blocs.newGests.liste.items.push(personne.prenom + ' ' + personne.nom)
          } else {
            $flashMessages.add(context, personne.prenom + ' ' + personne.nom + " était déjà gestionnaire et n'a pas été ajouté")
          }
        })
      }

      // ne plus être gestionnaire
      if (formPosted.quit === 'true') {
        var i = groupe.gestionnaires.indexOf(uid)
        if (i > -1) {
          if (groupe.gestionnaires.length > 1) groupe.gestionnaires.splice(i, 1)
          else throw new Error("Vous êtes le seul gestionnaire de ce groupe et ne pouvez pas quitter cette fonction")
        } else {
          throw new Error("Vous n'êtes pas gestionnaire de ce groupe")
        }
      }

      // on met ce groupe en session pour le sauvegarder la prochaine fois
      var token = $accessControl.addToken(context, groupe)
      fields.push({name: 'token', value: token, widget: 'hidden'})
      $form.print(context, 'Valider les modifications du groupe', blocs)

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
  function modConfirmed(context, nom) {
    // Save du form confirmé, on vérifie et enregistre
    var formPosted = context.post
    var formConfirmed = $accessControl.getTokenValue(context, formPosted.token)
    if (!formConfirmed || formConfirmed.nom !== nom) throw new Error("Données corrompues")
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (groupe) {
      tools.updateIfExists(groupe, formConfirmed)
      $groupeRepository.save(groupe, this)
    }).seq(function () {
      $page.print(context, 'Groupe modifié')
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
  function modSave(context, nom) {
    var formPosted = context.post
    // pas besoin de confirmation
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (groupeBdd) {
      if (!groupeBdd || groupeBdd.nom !== nom) {
        this(new Error("Erreur interne, le nom du groupe récupéré en base de donnée ne correspond pas (" + nom + "≠" + groupeBdd.nom + ")"))
      } else {
        var isOuvert = (formPosted.ouvert === 'true')
        if (groupeBdd.ouvert !== isOuvert) {
          groupeBdd.ouvert = isOuvert
          $groupeRepository.save(groupeBdd, this)
        } else {
          this()
        }
      }
    }).seq(function (groupe) {
      if (groupe) {
        $flashMessages.add(context, "groupe sauvegardé")
      } else {
        $flashMessages.add(context, "Aucune modification à sauvegarder")
      }
      context.redirect('/groupe/voir/' + encodeURIComponent(nom))
    }).catch(function (error) {
      log.error(error)
      $page.printError(context, error)
    })
  }

  /**
   * Affiche le groupe
   * @private
   * @param context
   * @param groupe
   */
  function printGroupe(context, groupe) {
    getGestionnairesNames(groupe.gestionnaires, function(error, gestionnaires) {
      if (error) {
        $page.printError(context, error)
      } else {
        var contentBloc = {
          $view: 'displayGroupe',
          nom: groupe.nom,
          ouvert: groupe.ouvert,
          gestionnaires: gestionnaires.join(', ')
        }
        $page.print(context, 'Groupe ' + groupe.nom, contentBloc)
      }
    })
  }

  /**
   * Affiche la liste de tous les groupes ouverts
   * @route GET /groupe/tous
   */
  controller.get('tous', function (context) {
    var uid = $accessControl.getCurrentUserOid(context)
    var myGroupes = getMyGroupes(context)
    $groupeRepository.loadOpen(function (error, groupes) {
      if (error) {
        $page.printError(context, error)
      } else {
        var contentBloc = {
          $view: 'groupes',
          groupes: []
        }
        if (groupes && groupes.length) {
          groupes.forEach(function (groupe) {
            var item = {nom: groupe.nom}
            var nomUrl = encodeURIComponent(groupe.nom)
            if (myGroupes.indexOf(groupe.nom) === -1) item.urlJoin = '/groupe/rejoindre/' + nomUrl
            else item.urlQuit = '/groupe/quitter/' + nomUrl
            if (groupe.gestionnaires.indexOf(uid) !== -1) item.urlEdit = '/group/modifier/' + nomUrl
            contentBloc.groupes.push(item)
          })
        } else {
          contentBloc.defaultMessage = "Aucun groupe public n'a été créé"
        }
        $page.print(context, 'Tous les groupes', contentBloc)
      }
    })
  })

  /**
   * Affiche la liste de mes groupes
   * @route GET /groupe/perso
   */
  controller.get('perso', function (context) {
    var blocList = []
    log('get perso')
    flow().seq(function () {
      if (!$accessControl.isAuthenticated(context)) this("Il faut être authentifié pour voir ses groupes")
      else getMyGroupesManaged(context, this)
    }).seq(function (groupes) {
      blocList.push({
        partialView: '../groupes',
        titre : "Groupes dont je suis gestionnaire",
        groupes: groupes,
        defaultMessage : "Inscrit dans aucun groupe"
      })
      blocList.push({
        partialView: '../groupes',
        titre : "Groupes auxquels j'appartiens",
        groupes: getMyGroupes(context),
        defaultMessage : "Inscrit dans aucun groupe"
      })
      $page.print(context, 'Mes groupes', null, {blocs:{blocList:blocList}})
    }).catch(function (error) {
      $page.printError(context, error)
    })
  })

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
      var msg = 'Le groupe ' +nom +" n'existe pas ou n'est pas ouvert"
      if (!grp) this(msg)
      else if (grp && (grp.ouvert || getMyGroupes(context).indexOf(nom) !== -1)) this()
      else this(msg)
    }).seq(function () {
      printGroupe(context, groupe)
    }).catch(function (error) {
      $page.printError(context, error.toString())
    })
  })

  /**
   * Ajoute le groupe au user courant
   * @route GET /groupe/rejoindre/:nom
   */
  controller.get('rejoindre/:nom', function (context) {
    var nom = context.arguments.nom
    var groupe
    flow().seq(function () {
      $groupeRepository.load(nom, this)
    }).seq(function (grp) {
      groupe = grp
      if (grp && grp.ouvert) {
        if (getMyGroupes(context).indexOf(nom) !== -1) this("Vous êtes déjà dans le groupe " +nom)
        else this()
      } else {
        this('Le groupe ' +nom +" n'existe pas ou n'est pas ouvert")
      }
    }).seq(function () {
      joinGroup(context, nom, this)
    }).seq(function () {
      $flashMessages.add(context, "Vous faites désormais partie de ce groupe")
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
          {name: "nom", label:'Nom du groupe'},
          {name: "ouvert", value: true, label:'Ouvert à tous'}
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
    try {
      // premiers contrôles qui renverront denied
      var uid = $accessControl.getCurrentUserOid(context)
      if (!uid) throw new Error("Il faut être authentifié pour créer un groupe")
      if (!$accessControl.hasGenericPermission('createGroupe', context)) throw new Error("Droits insuffisants pour créer un groupe")
      /**
       * @private
       * @type Groupe
       */
      var groupe = context.post
      if (!groupe.nom) throw new Error("Données invalides")
      var nom = groupe.nom
      // on peut continuer, faut vérifier qu'il n'existe pas
      flow().seq(function () {
        $groupeRepository.load(nom, this)
      }).seq(function (groupeBdd) {
        if (groupeBdd) this("Le groupe « " + nom + " » existe déjà")
        else this()
      }).seq(function () {
        groupe.gestionnaires = [uid]
        $groupeRepository.save(groupe, this)
      }).seq(function (groupeSaved) {
        if (groupeSaved) {
          joinGroup(context, nom, this)
        } else {
          var error = new Error("Erreur à l'enregistrement du groupe " +tools.stringify(groupe))
          log.error(error)
          this(error)
        }
      }).seq(function () {
        $page.printMessage(context, "Le groupe « " + nom + " » a été créé", 'Groupe ajouté')
      }).catch(function (error) {
        if (error instanceof Error) log.error(error)
        $page.printError(context, error)
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
    try {
      var uid = $accessControl.getCurrentUserOid(context)
      if (!uid) throw new Error("Il faut être authentifié pour modifier un groupe")
      // on regarde s'il est gestionnaire
      var nom = context.arguments.nom
      var myGroupes = getMyGroupes(context)
      if (myGroupes.indexOf(nom) === -1 || $accessControl.hasGenericPermission('createGroupe', context)) throw new Error("Droits insuffisants")
      flow().seq(function () {
        $groupeRepository.load(nom, this)
      }).seq(function (groupeBdd) {
        if (!groupeBdd) this("Le groupe « " + nom + " » n'existe pas")
        if (groupeBdd.nom !== nom)
          this(new Error("Erreur interne, le nom du groupe récupéré en base de donnée ne correspond pas (" +nom+"≠"+groupeBdd.nom+")"))
        else if (groupeBdd.gestionnaires.indexOf(uid) === -1) this("Droits insuffisants pour modifier ce groupe (vous n'êtes pas gestionnaire)")
        else this(null, groupeBdd)
      }).seq(function (groupeBdd) {
        var fields = [
          {name: "ouvert", value: true, label:'Ouvert à tous'},
          {name: "newGestionnaires", label:'Ajouter des gestionnaires',
            labelInfo:"L'ajout est irrévocable. Entrer un ou des identifiants séparés par des espaces (confirmation demandée sur la page suivante)"}
        ]
        var blocs
        var gestionnairesNames = []
        flow().seq(function () {
          var next = this
          if (groupeBdd.gestionnaires.length > 1) {
            fields.push({name: "quit", value: true, label: 'Me retirer des gestionnaires de ce groupe'})
            blocList.push({
              partialView: '../contents',
              liste: {
                titre: 'Autres gestionnaires de ce groupe',
                items: []
              }
            })
            getGestionnairesNames(groupeBdd.gestionnaires, this)
          } else {
            next()
          }
        }).seq(function (gests) {
          var tokenValue = {nom:nom}
          if (gests && gests.length) {
            // on va stocker dans tokenValue la liste des gestionnaires pour éviter de retourner la chercher
            fields.push()
            gests.forEach(function (gest) {
              gestionnairesNames.push(gest.prenom + ' ' + gest.nom)
            })
            // on l'ajoute au groupe mis en session
            tokenValue.gestionnairesNames = gestionnairesNames
            // et sur la page
            blocs = {
              blocList : [{
                partialView: '../contents',
                liste: {
                  titre: 'Autres gestionnaires de ce groupe',
                  items: gestionnairesNames
                }
              }]
            }
          }
          var token = $accessControl.addToken(context, null, tokenValue)
          fields.push({name:'token', value:token, widget:'hidden'})
          var group = {label:"Groupe : " + nom}
          $form.print(context, null, group, fields, 'Modifier', 'Modifier un groupe', blocs)
        }).catch(function (error) {
          log.error(error)
          $page.printError(context, error)
        })
      }).catch(function (error) {
        if (error instanceof Error) log.error(error)
        $page.printError(context, error)
      })
    } catch (error) {
      $page.denied(context, error.toString())
    }
  })

  /**
   * Traitement du formulaire d'édition, réaffiche le formulaire si besoin de confirmation
   * @route POST /groupe/modifier/:nom
   */
  controller.post('modifier/:nom', function (context) {
    try {
      var uid = $accessControl.getCurrentUserOid(context)
      if (!uid) throw new Error("Il faut être authentifié pour modifier un groupe")
      var nom = context.arguments.nom
      var formPosted = context.post
      if (formPosted.confirm === 'true') {
        modConfirmed(context)
      } else {
        // on regarde le post pour savoir s'il faut une demande de confirmation
        var tokenValue = $accessControl.getToken(context, formPosted.token)
        if (!tokenValue || tokenValue.nom !== nom) throw new Error("Données corrompues")
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

}
