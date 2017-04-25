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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

var _ = require('lodash')
var request = require('request')
var flow = require('an-flow')
var sjt = require('sesajstools')
var sjtObj = require('sesajstools/utils/object')
var config = require('../config')
var myBaseId = config.application.baseId
var configRessource = require('./config')
var Ref = require('../constructors/Ref')

const {getBaseUrl, getRidComponents} = require('sesatheque-client/dist/sesatheques')

/**
 * Controleur de la route /api/ (qui répond en json) pour les ressources
 * Toutes les routes contenant /public/ ignorent la session (cookies viré par varnish,
 * cela permet de mettre le résultat en cache et devrait être privilégié pour les ressources publiques)
 * @Controller controllerApi
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $ressourceControl, $accessControl, $personneControl, $json, EntityRessource, $ressourceFetch) {
  /**
   * Efface une ressource d'après son id, appellera denied ou sendJson avec error ou deleted:id
   * @private
   * @param {Context} context
   * @param rid
   */
  function deleteAndSend (context, rid) {
    log.debug('dans cb api deleteRessource ' + rid)
    // de toute façon lassi demande de charger la ressource pour l'effacer, on le fait ici pour vérifier les droits
    $ressourceRepository.load(rid, function (error, ressource) {
      if (error) {
        $json.send(context, error)
      } else if (ressource) {
        $accessControl.checkPermission('delete', context, ressource, function (errorMessage) {
          if (errorMessage) {
            $json.denied(context, errorMessage)
          } else {
            $ressourceRepository.delete(ressource, function (error) {
              if (error) $json.send(context, error)
              // else $json.send(context, null, {error:"message d'erreur bidon"})
              else $json.sendOk(context, {deleted: rid})
            })
          }
        })
      } else {
        log.debug(`La ressource ${rid} n’existait pas, on a rien effacé`)
        // pas de ressource, on vérifie qu'il avait certains droits
        $json.send(context, new Error(`Aucune ressource d'identifiant ${rid}`))
      }
    })
  }

  /**
   * Renvoie l'id trouvé dans le post ou le get (en acceptant les propriétés id, oid ou origine&idOrigine, en GET ou POST)
   * @private
   * @param {Context} context
   * @returns {string} oid ou origine/idOrigine ou undefined
   */
  function extractId (context) {
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
  function getListeAll (context) {
    context.timeout = 3000
    // on vérifie les droits all avant de lancer la requete,
    // ce serait idiot de remonter des milliers de résultats tous privés
    // (et ça compliquerait bcp la pagination)
    if ($accessControl.hasAllRights(context)) grabListe(context, 'all')
    else $json.denied(context, "Vous n'avez pas de droits suffisants pour consulter toutes les ressources (privées comprises)")
  }

  /**
   * Traite GET|POST /api/liste/prof
   * @private
   * @param {Context} context
   */
  function getListeProf (context) {
    context.timeout = 3000
    if ($accessControl.hasGenericPermission('correction', context)) {
      grabListe(context, 'correction')
    } else if ($accessControl.isAuthenticated(context)) {
      $json.denied(context, "Vous n'avez pas les droits suffisants pour accéder aux corrigés")
    } else {
      $json.denied(context, 'Il faut être authentifié pour accéder aux corrigés')
    }
  }

  /**
   * Traite GET /api/liste/perso (appelé par sesatheque-client)
   * @private
   * @param {Context} context
   */
  function getListePerso (context) {
    /**
     * Ajoute des refs (en vérifiant qu'elles sont valides) à nos deux listes globales refs et sequenceModeles
     * @private
     * @param {Ressource[]} ressources La liste des ressources à ajouter après vérif de leur intégrité
     * @param {string}              droits     Les droits sur ces ressources (lettres WD pour Write & Delete)
     */
    function addRefs (ressources, droits) {
      ressources.forEach(function (ressource) {
        if (ressource.type === 'sequenceModele') {
          if (ressource.parametres) {
            const sequenceModele = ressource.parametres
            // on écrase ça qui a pu changer sur la ressource depuis l'enregistrement
            sequenceModele.public = !ressource.restriction
            sequenceModele.groupes = ressource.groupes || []
            sequenceModeles.push(sequenceModele)
          } else {
            log.dataError('sequenceModele sans parametres', ressource)
          }
        } else {
          const ref = new Ref(ressource)
          const isReadable = ref.public || ref.cle
          if (ref.aliasOf && ref.titre && ref.type && isReadable) {
            if (droits) ref.$droits = droits
            refs.push(ref)
          } else if (!isReadable) {
            log.dataError('ressource privée sans clé, pas utilisable pour sesalab', ressource)
          } else {
            log.dataError('ressource incomplète, pas utilisable pour sesalab', ressource)
          }
        }
      })
    }

    context.timeout = 3000
    const pid = $accessControl.getCurrentUserPid(context)
    /**
     * Liste des ressources perso
     * @type {Ref[]}
     */
    const refs = []
    /**
     * liste des sequenceModeles perso
     * @type {object[]} la liste des objets sequenceModele filés par sésalab (stockés ici dans les parametres de la ressource)
     */
    const sequenceModeles = []
    // on veut remonter le max autorisé par la conf…
    const nb = configRessource.limites.listeMax
    if (pid) {
      // la visibilité, c'est pour cet auteur,
      const visibility = 'auteur/' + pid
      flow().seq(function () {
        $ressourceRepository.getListe(visibility, {filters: [{index: 'auteurs', values: [pid]}], nb}, this)
      }).seq(function (ressources) {
        if (ressources.length) addRefs(ressources, 'WD')
        if (ressources.length === nb) {
          log.dataError(`Pour pid ${pid} on est arrivé au max du nb de ressources persos (${nb}, auteur)`)
          refs.push(new Ref({type: 'error', titre: `Maximum atteint pour le nb de ressources personnelles (${nb} ressources dont l’auteur est ${pid})`}))
        }
        $ressourceRepository.getListe(visibility, {filters: [{index: 'contributeurs', values: [pid], nb}]}, this)
      }).seq(function (ressources) {
        if (ressources.length) {
          addRefs(ressources, 'W')
          if (ressources.length === nb) {
            // @todo gérer un "ajouter nb ressources", ou un filtre…
            log.dataError(`Pour pid ${pid} on est arrivé au max du nb de ressources persos (${nb}, contributeur)`)
            refs.push(new Ref({type: 'error', titre: `Maximum atteint pour le nb de ressources personnelles (${nb} ressources avec ${pid} en contributeur)`}))
          }
        }
        $json.sendOk(context, {liste: refs, sequenceModeles: sequenceModeles})
      }).catch(function (error) {
        $json.sendError(context, error)
      })
    } else {
      $json.denied(context, 'Ressources personnelles inaccessibles (session expirée sur la Sésathèque), veuillez vous déconnecter et reconnecter')
    }
  }

  /**
   * Traite GET|POST /api/liste/public
   * @private
   * @param context
   */
  function getListePublic (context) {
    grabListe(context, 'public')
  }

  /**
   * Recupère une liste de ressource (d'après les argument get et post mergés) et l'envoie
   * @private
   * @param {Context} context
   * @param {string} visibility
   */
  function grabListe (context, visibility) {
    var args
    if (context.get.json) {
      args = sjt.parse(context.get.json)
    } else {
      args = context.get
      // en get on a des string, faut parser ce qui devrait être un objet
      if (args.filters) {
        args.filters = sjt.parse(args.filters)
      }
    }
    sjtObj.merge(args, context.post)
    log.debug('grabListe ' + visibility, args)
    $ressourceRepository.getListe(visibility, args, function (error, ressources) {
      sendListe(context, error, ressources)
    })
  }

  /**
   * Répond ok pour les options delete
   * @private
   * @param {Context} context
   */
  function optionsDeleteOk (context) {
    context.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
    // context.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept')
    // et on laisse le middleware CORS faire son boulot
    context.next(null, 'OK') // ne pas renvoyer de chaîne vide sinon 404
  }

  // noinspection FunctionWithMoreThanThreeNegationsJS
  /**
   * Traite la ressource de POST /api/ressource
   * @private
   * @param {Context} context
   */
  function postRessource (context) {
    context.timeout = 5000
    /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
     log.error(new Error('une trace pour ' +reqHttp)) */
    var ressourcePostee = context.post
    var pid = $accessControl.getCurrentUserPid(context)
    var groupesSup = ressourcePostee.hasOwnProperty('_groupesSup') ? ressourcePostee._groupesSup : ''
    var ressourceOriginale

    if (context.perf) {
      var msg = 'start-'
      if (ressourcePostee.origine && ressourcePostee.idOrigine) msg += ressourcePostee.origine + '/' + ressourcePostee.idOrigine
      else msg += ressourcePostee.oid
      log.perf(context.response, msg)
    }

    log.debug('post /api/ressource a reçu', ressourcePostee, 'api', {max: 10000})
    // faut au moins être authentifié
    if (!$accessControl.isAuthenticated(context) && !$accessControl.hasAllRights(context)) {
      return $json.denied(context, 'Vous devez être authentifié pour ajouter une ressource')
    }
    // si y'a pas qqchose pour identifier une ressource existante, faut avoir les droits de création

    flow().seq(function () {
      var next = this
      // si y'à un rid sans oid on traduit
      if (ressourcePostee.rid) {
        const [baseId, oid] = getRidComponents(ressourcePostee.rid)
        if (baseId !== myBaseId) return next(new Error(`Cette ressource doit être enregistrée sur ${baseId} et non ici`))
        if (ressourcePostee.oid && ressourcePostee.oid !== oid) return next(new Error(`oid ${ressourcePostee.oid} et rid ${ressourcePostee.rid} incohérents`))
        ressourcePostee.oid = oid
      }
      // faut la charger, ne serait-ce que pour savoir si elle existe
      if (ressourcePostee.oid) { // par oid
        $ressourceRepository.load(ressourcePostee.oid, next)
      } else if (ressourcePostee.origine && ressourcePostee.idOrigine) { // ou par origine/idOrigine
        $ressourceRepository.loadByOrigin(ressourcePostee.origine, ressourcePostee.idOrigine, next)
      } else {
        if (!ressourcePostee.origine) ressourcePostee.origine = myBaseId
        // l'idOrigine n'est pas obligatoire si c'est une création ici ($ressourceRepository.save créera une clé si besoin
        if (ressourcePostee.origine !== myBaseId && !ressourcePostee.idOrigine) {
          log.debug('ressource postée invalide', ressourcePostee)
          next(new Error('Il faut fournir oid ou au moins origine'))
        } else {
          next()
        }
      }
    }).seq(function (ressourceBdd) {
      if (log.perf) log.perf(context.response, 'loaded')
      const errMsg = ressourceBdd
        ? $accessControl.getDeniedMessage('update', context, ressourceBdd)
        : $accessControl.getDeniedMessage('create', context, ressourcePostee)
      if (errMsg) $json.denied(context, errMsg)
      else this(null, ressourceBdd)
    }).seq(function (ressourceBdd) {
      // on ajoute la catégorie si y'en a pas et qu'on peut la déduire
      var tt = ressourcePostee.type
      if (!ressourcePostee.categories && tt) ressourcePostee.categories = configRessource.categoriesToTypes[tt]
      // le contenu est partiel si on le réclame ou si on a oid (ou idOrigine) sans titre ni catégorie
      var partial = !!context.get.partial
      if (!partial && !ressourcePostee.titre && !ressourcePostee.categories) {
        partial = (ressourcePostee.oid > 0 || (ressourcePostee.origine && ressourcePostee.idOrigine))
      }
      if (partial) ressourcePostee = Object.assign({}, ressourceBdd, ressourcePostee)
      ressourceOriginale = ressourceBdd
      $ressourceControl.valideRessourceFromPost(ressourcePostee, this)
    }).seq(function (ressourceNew) {
      // la ressource est cohérente, ou avec errors/warnings et c'est writeAndOut qui gèrera
      $personneControl.checkGroupes(context, ressourceOriginale, ressourceNew, groupesSup, this)
    }).seq(function (ressourceNew) {
      // on ajoute le user courant pour serie et sequenceModele,
      // pas encore pour tout par crainte d'effets de bords…
      if (pid && ressourceNew.type === 'serie' || ressourceNew.type === 'sequenceModele') {
        ressourceNew.auteurs = [pid]
      }
      $personneControl.checkPersonnes(context, ressourceOriginale, ressourceNew, this)
    }).seq(function (ressourceNew) {
      if (ressourceOriginale) sjtObj.update(ressourceOriginale, ressourceNew)
      else ressourceOriginale = ressourceNew
      writeAndOut(context, ressourceOriginale)
    }).catch(function (error) {
      $json.send(context, error)
    })
  }

  /**
   * Ajoute des relations à une ressource
   * @private
   * @param {Context} context
   */
  function postRessourceAddRelations (context) {
    context.timeout = 5000
    if (context.perf) {
      var msg = 'start-'
      if (context.post.origine && context.post.idOrigine) msg += context.post.origine + '/' + context.post.idOrigine
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
            if ($accessControl.hasPermission('update', context, ressource)) {
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
            $json.notFound(context, 'La ressource ' + ref + " n'existe pas")
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
  function sendJsonJstreeArray (context, error, data) {
    var errorMsg
    if (error) {
      errorMsg = (typeof error === 'string') ? error : error.toString()
      $json.send(context, null, {arrayOnly: [{text: 'Erreur : ' + errorMsg}]})
    } else if (!Array.isArray(data)) {
      log.error(new Error("sendJsonJstreeArray appelé avec autre chose qu'un array"))
      $json.send(context, null, data)
    } else {
      log.debug('sendJson va renvoyer le tableau', data, 'api')
      $json.send(context, null, {arrayOnly: data})
    }
  }

  /**
   * Envoie une liste de ressources (en filtrant d'après les droits en lecture)
   * @private
   * @param {Context} context
   * @param error
   * @param ressources
   */
  function sendListe (context, error, ressources) {
    if (error) $json.send(context, error)
    else {
      var liste = []
      if (ressources && ressources.length) {
        // on regarde le format reçu en get ou post
        const format = context.post.format || context.get.format
        ressources.forEach(function (ressource) {
          if (!$accessControl.hasReadPermission(context, ressource)) return log.debug(`ressource ${ressource.oid} virée de la liste car pas de droit en lecture`)
          var item = (format === 'full') ? ressource : new Ref(ressource)
          item.droits = ''
          if ($accessControl.hasPermission('update', context, ressource)) item.$droits += 'W'
          if ($accessControl.hasPermission('delete', context, ressource)) item.$droits += 'D'
          liste.push(item)
        })
      }
      $json.sendOk(context, {liste: liste})
    }
  }

  /**
   * Renvoie la ressource (ou l'erreur) après avoir vérifié les droits, complète ou au format de context.get.format (avec ref ça ajoute les droits)
   * @private
   * @param {Context} context
   * @param error
   * @param ressource
   */
  function sendRessource (context, error, ressource) {
    log.debug('sendRessource api avec', ressource, 'avirer', {max: 5000})
    if (error) {
      $json.send(context, error)
    } else if (ressource) {
      if ($accessControl.hasReadPermission(context, ressource)) {
        var format = context.get.format
        if (format === 'ref') {
          const ref = new Ref(ressource)
          // avec ajout des droits
          ref.$droits = 'R'
          if ($accessControl.hasPermission('update', context, ressource)) ref.$droits += 'W'
          if ($accessControl.hasPermission('delete', context, ressource)) ref.$droits += 'D'
          $json.send(context, null, ref)
        } else {
          $json.send(context, null, ressource)
        }
      } else {
        $json.denied(context)
      }
    } else {
      $json.notFound(context, 'Cette ressource n’existe pas.')
    }
  }

  /**
   * Si la ressource contient des erreurs les renvoie, sinon l'enregistre et sort avec oid et warnings éventuels
   * ou le ?format= demandé (alias ou normalized, le reste donnant la ressource complète)
   * @private
   * @param {Context} context
   * @param ressource
   */
  function writeAndOut (context, ressource) {
    if (_.isEmpty(ressource.$errors)) {
      $ressourceRepository.save(ressource, function (error, ressource) {
        log.debug('dans cb api writeAndOut après $ressourceRepository.save', ressource, 'repository', {max: 500})
        if (error) {
          $json.send(context, error)
        } else {
          log.perf(context.response, 'written')
          if (context.get.format) {
            // on veut la ressource formatée, sendRessource le gère
            sendRessource(context, null, ressource)
          } else {
            // on ne renvoie que l'oid et des warnings éventuels
            var data = {oid: ressource.oid}
            if (!_.isEmpty(ressource.$warnings)) {
              data.warnings = ressource.$warnings
            }
            $json.send(context, null, data)
          }
        }
      })
    } else {
      $json.send(context, ressource.$errors)
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
              log.debug('titre de ' +ressource.oid +' changé : ' +ressource.titre +' => ' +newTitre)
              ressource.titre = newTitre
              $ressourceRepository.save(ressource) // pas de next, on laisse comme c'était si ça plante
          }
    }
  } /* */

  /**
   * Passe au suivant pour toutes les requetes OPTIONS (traitées par le middleware cors)
   * @route OPTIONS /api/*
   */
  controller.options('*', function (context) {
    log.debug('headers de la requete options', context.request.headers, 'xhr', {max: 5000, indent: 2})
    // on laisse le middleware CORS faire son boulot
    context.next() // ne pas renvoyer de chaîne vide sinon 404
  })

  /**
   * Retourne l'url d'une baseId
   * @route GET /api/baseId/:id
   */
  controller.get('baseId/:id', function (context) {
    const baseId = context.arguments.id
    const baseUrl = getBaseUrl(baseId, false)
    if (baseUrl) $json.sendOk(context, {baseUrl})
    else $json.sendError(context, `Sésathèque ${baseId} inconnue sur ${config.application.baseUrl}`)
  })

  /**
   * Clone une ressource de la bibli courante en mettant l'utilisateur courant contributeur, avec publié et privé
   * Retourne {@link reponseRessourceOid}
   * @route GET /api/clone/:oid
   */
  controller.get('clone/:oid', function (context) {
    var oid = context.arguments.oid
    var pid = $accessControl.getCurrentUserPid(context)
    if (pid) {
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return $json.send(context, error)
        if (ressource) {
          if ($accessControl.hasReadPermission(context, ressource)) {
            if (configRessource.editable[ressource.type]) {
              // editable on duplique
              delete ressource.oid
              delete ressource.idOrigine
              ressource.origine = config.application.baseId
              // faut mettre le user en auteur sinon il aura pas le droit de supprimer
              if (ressource.auteurs.indexOf(pid) < 0) ressource.auteurs.push(pid)
              ressource.publie = true
              ressource.restriction = configRessource.constantes.restriction.prive
              if (!ressource.relations) ressource.relations = []
              ressource.relations.push([configRessource.constantes.relations.estVersionDe, oid])
              $ressourceRepository.save(ressource, function (error, ressource) {
                if (error) $json.send(context, error)
                else if (ressource && ressource.oid) $json.sendOk(context, {oid: ressource.oid})
                else $json.send(context, new Error("L'enregistrement de la ressource a échoué"))
              })
            } else {
              // pas éditable, on crée un alias, mais on regarde si on en a pas déjà un pour cette ressource
              $ressourceRepository.loadByAlias(myBaseId + '/' + oid, function (error, alias) {
                if (error) return $json.sendError(context, error.toString())
                if (alias) return $json.sendOk(context, {oid: alias.oid})
                // faut le créer
                const data = {}
                ;['titre', 'type', 'categories', 'publie', 'restriction', 'cle'].forEach((p) => { data[p] = ressource[p] })
                data.aliasOf = myBaseId + '/' + ressource.oid
                data.auteursParents = ressource.auteurs
                data.auteurs = [pid]
                alias = EntityRessource.create(data)
                alias.store(function (error, ressAlias) {
                  if (error) return $json.sendError(context, error)
                  if (ressAlias) return $json.sendOk(context, {oid: ressAlias.oid})
                  $json.sendError(context, new Error('L’enregistrement de l’alias a échoué'))
                })
              })
            }
          } else {
            $json.denied(context, "Vous n'avez pas les droits suffisant pour lire la ressource " + oid)
          }
        } else {
          $json.notFound(context, 'La ressource ' + oid + " n'existe pas")
        }
      })
    } else {
      $json.denied(context, 'Vous devez être authentifié pour cloner une ressource')
    }
  })

  /**
   * Clone une ressource d'une autre sesatheque en mettant l'utilisateur courant en auteur
   * (sinon il pourra pas la supprimer), avec publié et privé
   * Retourne {@link Ref}
   * Utiliser la méthode sesatheque-client:cloneItem
   * @route GET /api/externalClone/:baseId/:oid
   */
  controller.get('externalClone/:baseId/:oid', function (context) {
    const oid = context.arguments.oid
    const baseIdOrigine = context.arguments.baseId
    const pid = $accessControl.getCurrentUserPid(context)
    flow().seq(function () {
      if (!pid) return this(new Error('Vous devez être authentifié pour créer une ressource'))
      const baseUrl = getBaseUrl(baseIdOrigine)
      // si on est là c'est une baseId connue de sesatheque-client,
      // mais ça suffit pas pour qu'on la référence
      if (!config.sesathequesById[baseIdOrigine]) return this(new Error(`Sésathèque ${baseIdOrigine} connue (${baseUrl}) mais pas déclarée comme source possible de cette sésathèque`))
      // on peut aller chercher la ressource
      $ressourceFetch.fetchOriginal(baseIdOrigine + '/' + oid, this)
    }).seq(function (ressource) {
      log.debug('externalClone a récupéré la ressource', ressource, 'clone', { max: 5000, indent: 2 })
      // on passe par Ref pour filtrer ce qu'on garde (pour un alias, seulement ce que ref utilise)
      const aliasData = new Ref(ressource)
      // on récupère les auteursParents d'origine que l'on cumule avec les auteurs de l'original
      aliasData.auteursParents = (ressource.auteursParents || []).concat(ressource.auteurs || [])
      aliasData.auteurs = [ pid ]
      aliasData.origine = config.application.baseId
      aliasData.dateCreation = new Date()
      aliasData.publie = true
      // si la ressource était publique on le laisse sur l'alias (pour la lecture),
      // pour l'écriture ça changera rien
      if (ressource.restriction === configRessource.constantes.restriction.aucune) aliasData.restriction = configRessource.constantes.restriction.aucune
      else aliasData.restriction = configRessource.constantes.restriction.prive
      // la relation ne sera ajoutée que lors de l'édition de cette ressource, inutile pour un alias
      // mais on conserve l'ancienne
      if (ressource.relations && ressource.relations.length) aliasData.relations = ressource.relations
      $ressourceRepository.save(aliasData, this)
    }).seq(function (ressAlias) {
      const refAlias = new Ref(ressAlias)
      // le user courant peut toujours effacer l'alias
      refAlias.$droits = 'D'
      // modif autorisée sur les ressources éditables seulement
      // (qui deviendront à l'édition des ressources dérivées et plus des alias)
      if (configRessource.editable[refAlias.type]) refAlias.$droits += 'W'
      $json.send(context, null, refAlias)
    }).catch(function (error) {
      $json.sendError(context, error.toString())
    })
  })

  /**
   * Loggue un user d'un sesalab localement, répond {success:true} ou {success:false, error:"message d'erreur"}
   * Dupliqué dans app/personne/controllerPersonne.js en html
   * @Route POST /api/connexion
   * @param {string} origine L'url de la racine du sesalab appelant (qui doit être déclaré dans le config de la sésathèque), avec préfixe http ou https
   * @param {string} token   Le token de sesalab qui servira à récupérer le user
   */
  controller.get('connexion', function (context) {
    var token = context.get.token
    var origine = context.get.origine
    var timeout = 5000
    if (token && origine) {
      if (origine.substr(-1) !== '/') origine += '/'
      if (config.sesalabsByOrigin[origine]) {
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
            $json.send(context, error)
          } else if (body.error) {
            $json.send(context, new Error(body.error))
          } else if (body.ok && body.utilisateur) {
            // on peut connecter
            $accessControl.loginFromSesalab(context, body.utilisateur, domaine, function (error) {
              log.debug('dans cb loginFromSesalab on a en session', context.session.user)
              if (error) $json.send(context, error)
              else $json.sendOk(context, {random: +new Date()})
            })
          } else {
            var msg = 'réponse du sso sesalab incohérente (ko sans erreur) sur ' + postOptions.url
            error = new Error(msg)
            log.error(error)
            log.debug(msg, body)
            $json.send(context, error)
          }
        })
      } else {
        $json.send(context, new Error('Origine ' + origine + 'non autorisée à se connecter ici'))
      }
    } else {
      $json.send(context, new Error('token ou origine manquant'))
    }
  })

  /**
   * Déconnecte l'utilisateur courant
   * @route GET /api/deconnexion
   */
  controller.get('deconnexion', function (context) {
    if ($accessControl.isAuthenticated(context)) {
      $accessControl.logout(context)
      $json.sendOk(context)
    } else {
      $json.sendOk(context, {warning: 'Utilisateur non connecté'})
    }
  })

  /**
   * Une route pour mathgraph qui répond en plain/text
   * @route POST /api/action/mathgraph/:token
   */
  controller.post('action/mathgraph/:token', function (context) {
    function sendError (error) {
      if (error.stack) log.error(error)
      context.status = 500
      context.plain('Erreur : ' + error.toString())
    }
    $ressourceRepository.getDeferred(context.arguments.token, function (error, data) {
      if (error) {
        sendError(error)
      } else if (data) {
        if (data.action === 'saveRessource' && data.oid) {
          $ressourceRepository.load(data.oid, function (error, ressource) {
            if (error) {
              sendError(error)
            } else if (ressource) {
              // on ne vérifie pas les droits, on l'a fait à la mise en cache, et ici on a probablement pas de session
              if (ressource.type === 'mathgraph') {
                if (context.post.base64) {
                  log.debug('la ressource ' + data.oid + ' avait la figure ' + ressource.parametres.figure + ' que l’on remplace par ' + context.post.base64)
                  ressource.parametres.figure = context.post.base64
                  $ressourceRepository.save(ressource, function (error, ressource) {
                    if (error) sendError(error)
                    else if (ressource) context.plain('La figure de la ressource ' + data.oid + ' a bien été mise à jour')
                    else sendError(new Error('Le save de la ressource ' + data.oid + ' ne remonte ni erreur ni ressource'))
                  })
                } else {
                  context.plain('Erreur : impossible de trouver une figure dans les données envoyées')
                }
              } else {
                sendError('Cette ressource n’est pas de type mathgraph (' + ressource.type + ')')
              }
            } else {
              context.status = 404
              context.plain('La ressource d’identifiant ' + data.oid + ' n’existe pas (ou plus)')
            }
          })
        } else {
          sendError(new Error('jeton valide mais données impossibles à traiter'))
        }
      } else {
        context.status = 404
        context.plain('jeton invalide ou périmé')
      }
    })
  })

  /**
   * Forward un post (au unload on ne peut pas poster en crossdomain, on le fait en synchrone ici qui fera suivre)
   * @Route POST /api/deferPost
   */
  controller.post('deferPost', function (context) {
    var resultat = context.post
    log.debug('deferPost appelé avec', resultat)
    if (typeof resultat.deferUrl === 'string') {
      var url = resultat.deferUrl
      delete resultat.deferUrl
      if (config.sesalabs.some((sesalab) => url.indexOf(sesalab.baseUrl) === 0)) {
        var postOptions = {
          url: url,
          json: true,
          content_type: 'charset=UTF-8',
          timeout: 3000,
          headers: {
            'Cookie': context.request.cookies
          },
          form: context.post
        }
        request.post(postOptions, function (error, response, body) {
          // pas la peine de répondre personne n'écoute
          log.debug('deferPost, après envoi vers ' + postOptions.url + ' de ', postOptions.form)
          log.debug("on récupère l'erreur", error)
          log.debug('on récupère la réponse', response)
          log.debug('on récupère et le body', body)
          // mais si on renvoie rien ça donne une erreur 500 en timeout, context.next() donne une 404 car pas de contenu
          $json.sendOk(context)
        })
      } else {
        $json.send(context, new Error('deferPost appelé pour faire suivre à ' + resultat.deferUrl + " qui n'est pas dans les sesalab autorisés"))
      }
    } else {
      $json.send(context, new Error('Il faut poster une url via deferUrl'))
    }
  })

  /**
   * Une url pour envoyer des notifications d'erreur, à priori par un client
   * qui trouve des incohérences dans ce qu'on lui a envoyé
   * @Route POST /api/notifyError
   */
  controller.post('notifyError', function (context) {
    if (context.post.rid) log.dataError('notifyError', context.post)
    else if (context.post.error) log.error('notifyError', context.post)
    else log.error('notifyError sans error avec la requête', context.request)
    $json.sendOk(context)
  })

  /**
   * Récupère un arbre au format jstree (cf le plugin arbre pour un exemple d'utilisation)
   * @route GET /api/jstree?ref=xx[&children=1]
   * @param {string} ref        Un oid ou origine/idOrigine
   * @param {string} [children] Passer 1 pour ne récupérer que les enfants
   */
  controller.get('jstree', function (context) {
    const {getJstreeChildren, toJstree} = require('sesatheque-client/dist/jstreeConvert')

    var id = context.get.rid || context.get.id || context.get.ref
    var onlyChildren = !!context.get.children
    if (id) {
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) {
          sendJsonJstreeArray(context, error)
        } else if (ressource && $accessControl.hasReadPermission(context, ressource)) {
          // on ajoute baseId s'il n'y est pas
          if (!ressource.baseId) ressource.baseId = config.application.baseId
          var jstData
          if (onlyChildren) {
            if (ressource.type === 'arbre') {
              jstData = getJstreeChildren(ressource)
              // log.debug('à partir de', ressource, 'avirer', {max: 5000, indent: 2})
              // log.debug('on récupère les enfants', jstData, 'avirer', {max: 5000, indent: 2})
              sendJsonJstreeArray(context, null, jstData)
            } else {
              sendJsonJstreeArray(context, "impossible de réclamer les enfants d'une ressource qui n'est pas un arbre")
            }
          } else {
            jstData = toJstree(ressource)
            sendJsonJstreeArray(context, null, [jstData]) // il veut toujours un Array (liste d'élément), ici le root
          }
        } else {
          sendJsonJstreeArray(context, 'la ressource ' + id + " n'existe pas ou vous n'avez pas suffisamment de droits pour y accéder")
        }
      })
    } else {
      sendJsonJstreeArray(context, 'il faut fournir un id de ressource')
    }
  })

  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin.
   * Retourne {@link reponseListe}
   * @route GET /api/liste/all
   * @param {requeteListe}
   */
  controller.get('liste/all', getListeAll)
  /**
   * Pour chercher parmi toutes les ressources (y compris privées et non publiées), il faut avoir les droits admin
   * Retourne {@link reponseListe}
   * @route POST /api/liste/all
   * @param {requeteListe}
   */
  controller.post('liste/all', getListeAll)
  /**
   * Ajoute aux headers cors habituels le header
   * Access-Control-Allow-Methods', 'POST, OPTIONS'
   * @route OPTIONS /api/liste/all
   */

  /**
   * Récupère la liste des ressources d'un groupe
   * Retourne {@link reponseListe}
   * @route GET /api/liste/groupe/:nom
   */
  controller.get('liste/groupe/:nom', function (context) {
    $ressourceRepository.getListe('groupe/' + context.arguments.nom, null, function (error, ressources) {
      sendListe(context, error, ressources)
    })
  })

  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant)
   * Retourne {@link reponseListe}
   * @route GET /api/liste/perso
   * @param {requeteListe}
   */
  controller.get('liste/perso', getListePerso)
  /**
   * Cherche parmi les ressources du user courant (qui doit être connecté avant), retourne {@link reponseListe}
   * @route POST /api/liste/perso
   * @param {requeteListe}
   */
  controller.post('liste/perso', getListePerso)
  /**
   * Pour le preflight, ajoute les headers allow… si autorisé
   * @route OPTIONS /api/liste/perso
   * @param {requeteListe}
   */

  /**
   * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
   * @route GET /api/liste/prof
   * @param {requeteListe}
   */
  controller.get('liste/prof', getListeProf)
  /**
   * Cherche parmi les ressources publiques ou les corrections, retourne {@link reponseListe}
   * @route POST /api/liste/prof
   * @param {requeteListe}
   */
  controller.post('liste/prof', getListeProf)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/liste/prof
   */

  /**
   * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
   * @route GET /api/liste/public
   * @param {requeteListe}
   */
  controller.get('liste/public', getListePublic)
  /**
   * Cherche parmi les ressources publiques publiées, retourne {@link reponseListe}
   * @route POST /api/liste/public
   * @param {requeteListe}
   */
  controller.post('liste/public', function (context) {
    grabListe(context, 'public')
  })
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods: POST OPTIONS
   * @route OPTIONS /api/liste/public
   */

  /**
   * Retourne la ressource publique et publiée (sinon 404) d'après son oid, accepte ?format=(alias|normalized)
   * Retourne {@link reponseListe}
   * @route GET /api/public/:oid
   * @param {Integer} :oid
   */
  controller.get('public/:oid', function (context) {
    var oid = context.arguments.oid
    if (oid === 'getRid') {
      // c'est pas pour nous
      context.next()
    } else {
      $ressourceRepository.loadPublic(oid, function (error, ressource) {
        if (error) $json.send(context, error)
        else if (ressource) sendRessource(context, null, ressource)
        else $json.notFound(context, 'La ressource ' + oid + " n'existe pas ou n'est pas publique")
      })
    }
  })

  /**
   * Retourne la ressource publique et publiée (sinon 404) d'après son id d'origine, accepte ?format=(alias|normalized)
   * Retourne {@link reponseRessource}
   * @route GET /api/public/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) $json.send(context, error)
      else if (ressource && ressource.restriction === 0) sendRessource(context, null, ressource)
      else $json.notFound(context, 'La ressource ' + origine + '/' + idOrigine + " n'existe pas ou n'est pas publique")
    })
  })

  /**
   * Retourne le rid d'une ressource (même privée, juste pour avoir la correspondance
   * origine/idOrigine => rid ou vérifier que l'id existe)
   * @route GET /api/public/getRid?id=xxx
   */
  controller.get('public/getRid', function (context) {
    let id = context.get.id
    if (id) {
      const slashPos = id.indexOf('/')
      const debut = id.substr(0, slashPos)
      if (debut === myBaseId) id = id.substr(slashPos + 1)
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) $json.sendError(context, error.toString())
        else if (ressource) $json.sendOk(context, {rid: ressource.rid})
        else $json.sendOk(context, {rid: null, error: 'pas de ressource ' + id})
      })
    } else {
      $json.sendError(context, 'id manquant')
    }
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:origine/:idOrigine
   */
  controller.delete('public/:origine/:idOrigine', function (context) {
    $json.denied(context, 'droits insuffisant pour effacer cette ressource')
  })

  /**
   * Denied (rerouting interne ressource => public si on a ni session ni token)
   * @internal
   * @route DEL /api/public/:oid
   */
  controller.delete('public/:oid', function (context) {
    $json.denied(context, 'droits insuffisant pour effacer cette ressource')
  })

  /**
   * Create / update une ressource
   * Prend un objet ressource, éventuellement incomplète mais oid ou origine/idOrigine sont obligatoires
   * Si le titre et la catégorie sont manquants, ou que l'on passe ?merge=1 à l'url, ça merge avec la ressource
   * existante que l'on update, sinon on écrase (ou on créé si elle n'existait pas)
   *
   * Retourne {@link reponseRessourceOid} ou {@link Ref} si on le réclame avec ?format=ref
   * @route POST /api/ressource
   * @param {object} Les propriétés de la ressource
   */
  controller.post('ressource', postRessource)
  /**
   * Pour le preflight, ajoute aux headers cors habituels le header
   *   Access-Control-Allow-Methods:POST OPTIONS
   * @route OPTIONS /api/ressource
   */

  /**
   * Retourne la ressource d'après son oid (si on a les droit de lecture dessus), accepte ?format=(alias|normalized)
   * Au format {@link reponseRessource} ou {@link Ref} si on le réclame avec ?format=ref
   * @Route GET /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.get('ressource/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Retourne la ressource d'après son id d'origine (si on a les droit de lecture dessus), accepte ?format=(alias|normalized)
   * Au format {@link reponseRessource} ou {@link Ref} si on le réclame avec ?format=ref
   * @route GET /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.get('ressource/:origine/:idOrigine', function (context) {
    var idOrigine = context.arguments.idOrigine
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      sendRessource(context, error, ressource)
    })
  })

  /**
   * Delete ressource par oid, retourne {@link reponseDeleted}
   * @route DEL /api/ressource/:oid
   * @param {Integer} oid
   */
  controller.delete('ressource/:oid', function (context) {
    deleteAndSend(context, context.arguments.oid)
  })
  controller.options('ressource/:oid', optionsDeleteOk)

  /**
   * Delete par id d'origine, retourne {@link reponseDeleted}
   * @route DEL /api/ressource/:origine/:idOrigine
   * @param {string} :origine
   * @param {string} :idOrigine
   */
  controller.delete('ressource/:origine/:idOrigine', function (context) {
    const rid = context.arguments.origine + '/' + context.arguments.idOrigine
    deleteAndSend(context, rid)
  })
  controller.options('ressource/:origine/:idOrigine', optionsDeleteOk)

  /**
   * Ajoute des relations à une ressource (pour identifier la ressource on accepte dans le post oid ou origine+idOrigine ou ref)
   * Retourne {@link reponseRessourceOid} ou {@link Ref} si on le réclame avec ?format=ref
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
}

/**
 * Format de la réponse à une demande de suppression
 * @typedef reponseDeleted
 * @type {Object}
 * @property {boolean} success
 * @property {string}  [error] Message d'erreur éventuel (si success vaut false)
 * @property {string}  deleted L'id passé en argument (DEPRECATED, pour compatibilité avec les versions anterieures)
 */

/**
 * Format de la réponse à une demande de liste
 * @typedef reponseListe
 * @type {Object}
 * @property {boolean}                     success
 * @property {string}                      [error] Message d'erreur éventuel
 * @property {Alias[]|Compact[]|Ressource[]} liste   Une liste d'Alias si aucun format n'a été précisé
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
 * @property {string}    type
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
 * @property {string}             [format]  alias|full par défaut on remonte les ressource au format {@link Alias}
 */

/**
 * Format d'un filtre à passer à une requete de demande de liste
 * @typedef requeteArgFilter
 * @type {Object}
 * @property {string} index  Le nom de l'index
 * @property {Array}  [values] Une liste de valeurs à chercher (avec des ou), remontera toutes les ressource ayant l'index si omis
 */
