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
var Memcached = require('memcached');
var mc = new Memcached('127.0.0.1:11211')

/**
 * Le controleur json du composant ressource (sur /api/)
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $accessControl, $ressourceControl, $cache, Ressource) {

  var _ = require('lodash')
  var flow = require('seq')

  var tools = require('../tools')

  /**
   * Équivalent de context.denied en json
   * @param msg
   * @param context
   */
  function denied(msg, context) {
    if (!msg) msg = "Accès refusé"
    context.status = 403;
    context.json({error: msg})
  }

  /**
   * Équivalent de context.notFound en json
   * @param msg
   * @param context
   */
  function notFound(msg, context) {
    if (!msg) msg = "Contenu inexistant"
    context.status = 404;
    context.json({error: msg})
  }

  /**
   * Callback générique de sortie
   * @param context
   * @param error
   * @param data
   */
  function sendJson(context, error, data) {
    if (error) {
      log.error(error);
      log.debug("sendJson va renvoyer l'erreur", error, 'api')
      context.json({error: error.toString()})
    } else {
      log.debug('sendJson va renvoyer', data, 'api')
      context.json(data)
    }
  }

  /**
   * Met éventuellement à jour un titre bateau si on en a un meilleur (asynchrone, lance la màj en bdd et rend la main)
   * @param ressource
   * @param newTitre
   */
  function updateTitre(ressource, newTitre) {
    // on regarde si l'arbre nous apporte un titre que l'on aurait pas
    if (newTitre) switch (ressource.titre) {
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
        ressource.store()
    }
  }

  /**
   * Met à jour une ressource issue de la bdd et appelle write pour l'enregistrer et sortir
   * ou sort avant avec une erreur
   * @param context
   * @param error
   * @param ressourceBdd
   * @param ressourceNew
   * @param {Function} [final=write] Une fct next (sinon ce sera write)
   */
  function updateAndOut(context, error, ressourceBdd, ressourceNew, final) {
    if (error) {
      sendJson(context, error)
    } else {
      // attention, le merge de lodash n'est pas récursif et n'écrase que les propriétés qui existent en destination
      _.merge(ressourceBdd, ressourceNew)
      if (final) final(context, ressourceBdd)
      else write(context, ressourceBdd)
    }
  }

  /**
   * Parse les enfants de l'arbre et remplace
   * @param context
   * @param ressource
   */
  function populateArbre(context, ressource) {

    /**
     * Enregistre la ressource avant de répondre ok ou error
     */
    function suite() {
      write(context, ressource)
    }

    /**
     * Parcours les enfants de parent pour les transformer et appeler nextStep
     * (sans argument, nextStep peut être le this de seq)
     * @param parent
     * @param nextStep
     */
    function populateEnfants(parent, nextStep) {
      if (parent.enfants && parent.enfants.length) {
        flow(parent.enfants)
          // seqEach passe au suivant de la boucle quand la cb appelle this
          // et au seq suivant quand la dernière cb appele this
          .seqEach(function (enfant, enfantIndex) {
            var finEach = this
            if (enfant.ref && enfant.refOrigine) {
              // on le cherche en db
              //var logSuffix = enfant.refOrigine + ' - ' + enfant.ref
              //log('load ' + logSuffix)
              $ressourceRepository.loadByOrigin(enfant.refOrigine, enfant.ref, function (error, ressource) {
                //log('load retour' +logSuffix)
                if (ressource) {
                  updateTitre(ressource, enfant.titre)
                  var newEnfant = {
                    oid          : ressource.oid,
                    titre        : ressource.titre,
                    typeTechnique: ressource.typeTechnique
                  }
                  if (enfant.contenu) newEnfant.contenu = enfant.contenu
                  if (enfant.enfants && enfant.enfants.length) newEnfant.enfants = enfant.enfants
                  // visiblement seq casse les références,
                  // on affecte directement à la variable parent restée hors du flux
                  parent.enfants[enfantIndex] = newEnfant
                } else {
                  // sinon on laisse en l'état mais on logue
                  log.errorData("On a pas trouvé la ressource " +enfant.refOrigine +' ' +enfant.ref)
                  parent.enfants[enfantIndex].titre += ' (non trouvé)'
                }
                populateEnfants(parent.enfants[enfantIndex], finEach)
              })
            } else {
              // pas de ref, on regarde quand même s'il y a des enfants éventuels
              populateEnfants(enfant, finEach)
            }
          }) // parEach
          .seq(function () {
            nextStep()
          })
          .catch(function() {
            log.error("L'analyse de l'arbre a planté", parent)
            nextStep()
          })
      } else {
        nextStep()
      }
    } // populateEnfants

    // debug
    if (ressource.idOrigine == "exercices_interactifs.part1") log.debug('populateArbre de', ressource)

    // checks
    if (ressource.typeTechnique !== 'arbre')
        sendJson(context, new Error("Impossible de peupler une ressource autre qu'un arbre"))
    else if (!ressource.enfants ||
        !ressource.enfants instanceof Array ||
        !ressource.enfants.length
    ) {
      log.debug('arbre vide', ressource)
      sendJson(context, new Error("Impossible de peupler un arbre vide"))
    } else {
      // go
      populateEnfants(ressource, suite)
    }
  }

  /**
   * Vérifie la validité de la ressource, les droits et enregistre la ressource
   * @param context
   * @param ressource
   */
  function write(context, ressource) {
    var permission = ressource.oid ? 'update' : 'create'
    $ressourceControl.valide(ressource, function (error, ressource) {
      if (error) sendJson(context, error)
      else if ($accessControl.hasPermission(permission, context, ressource)) {
        $ressourceRepository.write(ressource, function (error, ressource) {
          // oid - convertPost - valide+setVersion - store - store2 - fin
          //lassi.tmp[context.post.oid].m += '\tretSt ' +log.getElapsed(lassi.tmp[context.post.oid].s)
          //log.errorData(lassi.tmp[context.post.oid].m)
          log.debug("dans cb api write on récupère", ressource)
          if (error) sendJson(context, error)
          else {
            var data = {oid: ressource.oid}
            if (!_.isEmpty(ressource.warnings)) {
              data.warnings = ressource.warnings
            }
            sendJson(context, null, data)
          }
        })
      } else {
        var errorMsg = "Droits insuffisants"
        if (ressource.oid) errorMsg += " pour modifier la ressource " + ressource.oid
        else errorMsg += " pour ajouter une ressource"
        denied(errorMsg, context)
      }
    })
  }

  /**
   * Create / update une ressource
   * Si le titre et la catégorie sont manquants (mais avec oid) on merge avec la ressource existante que l'on update,
   * sinon on écrase ou on créé
   * @callback api_ressource POST api/ressource
   * @param context
   */
  controller.post('ressource', function (context) {
    // partiel si on a oid (ou idOrigine) sans titre ni catégorie
    var partial = !context.post.titre && !context.post.categories &&
        (context.post.oid || (context.post.origine && context.post.idOrigine))

    var ressource = $ressourceConverter.getRessourceFromPost(context.post, partial)

    try {
      /*
       var oid = context.post.oid || 0
       var msg = oid
       // init du chrono
       var start = log.getElapsed(0)
       /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs * /
       if (!lassi.tmp) lassi.tmp = {}
       lassi.tmp[context.post.oid] = {m:msg,s:start}
       lassi.tmp[context.post.oid].m += '\tcv ' +log.getElapsed(lassi.tmp[context.post.oid].s)
       //log.debug("que l'on a transformé en", ressource) /* */

      if (partial) {
        // faut la charger
        if (ressource.oid) {
          $ressourceRepository.load(ressource.oid, function (error, ressourceBdd) {
            updateAndOut(context, error, ressourceBdd, ressource)
          })
        } else {
          $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, function (error, ressourceBdd) {
            updateAndOut(context, error, ressourceBdd, ressource)
          })
        }
      } else write(context, ressource)

    } catch (error) {
      sendJson(context, error)
    }
  })
  
  /**
   * Merge de nouvelles valeurs avec une ressource existante (ou pas, et dans ce cas idem 'ressource')
   */
  controller.post('ressourceMerge', function (context) {
        var part = $ressourceConverter.getRessourceFromPost(context.post, true)

        function merge(error, ressource) {
          if (error) {
            sendJson(context, error)
          } else {
            ressource.merge(part)
            write(context, ressource)
          }
        }

        if (part.oid) $ressourceRepository.load(context.post.oid, merge)
        else if (context.post.origine && context.post.idOrigine)
            $ressourceRepository.loadByOrigin(part.origine, part.idOrigine, merge)
        else sendJson(context, new Error("Il faut fournir oid ou origine+idOrigine"))
      })

  // read
  controller.get('ressource/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      // log.debug("dans api get " +oid, ressource)
      if (error) sendJson(context, error)
      else if (ressource) {
        // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
        if ($accessControl.hasReadPermission(context, ressource)) sendJson(context, null, ressource)
        else denied("Droits insuffisants pour accéder à la ressource d'identifiant " + oid, context)
      } else notFound("La ressource d'identifiant " + oid + " n'existe pas", context)
    })
  })

  // delete
  controller.delete('ressource/:oid', function (context) {
    var oid = context.arguments.oid

    function del() {
      $ressourceRepository.del(oid, function (error, nbObjects, nbIndexes) {
        if (error) sendJson(context, error)
        else if (nbObjects > 0) sendJson(context, null, {deletedOid: oid, nbObjects: nbObjects, nbIndexes: nbIndexes})
        else sendJson(context, new Error("Aucune ressource d'identifiant " + oid))
      });
    }

    if ($accessControl.hasPermission('delete', context)) {
      del()
    } else {
      // faut charger la ressource pour le savoir
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) sendJson(context, error)
        else if (!ressource) notFound("la ressource d'identifiant " + oid + " n'existe pas", context)
        else if ($accessControl.hasPermission('delete', context, ressource)) del()
        else denied("Droits insuffisants pour supprimer la ressource d'identifiant " + oid, context)
      })
    }
  })

  // Read byOrigine
  controller.get('ressource/:origine/:oid', function (context) {
    var idOrigine = context.arguments.oid
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      // log('api.readByOrigine ' +origine +' ' +idOrigine +' récupère ', ressource)
      // log.debug("dans api get " +origine +'/' +idOrigine, ressource)
      if (error) sendJson(context, error)
      else if (ressource) {
        if ($accessControl.hasReadPermission(context, ressource)) sendJson(context, null, ressource)
        else  denied("Droits insuffisants pour accéder à la ressource d'origine " +
            origine + " et d'identifiant " + idOrigine, context)
      } else notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
          " n'existe pas", context)
    })
  })

  // delete by origine
  controller.delete('ressource/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine

    /**
     * Efface la ressource d'après les params origine & idOrigine de la requete
     */
    function delByOrigine() {
      $ressourceRepository.delByOrigine(origine, idOrigine, function (error, nbObjects, nbIndexes) {
        if (error) sendJson(context, error)
        else if (nbObjects > 0) sendJson(context, null, {nbObjects: nbObjects, nbIndexes: nbIndexes})
        else notFound("Aucune ressource d'origine " + origine + " et d'identifiant " + idOrigine, context)
      })
    }

    /**
     * Fct à privilégier car l'effacement du cache est nettement plus performant
     * @param oid
     */
    function del(oid) {
      $ressourceRepository.del(oid, function (error, nbObjects, nbIndexes) {
        if (error) sendJson(context, error)
        else if (nbObjects > 0) sendJson(context, null, {deletedOId: oid, nbObjects: nbObjects, nbIndexes: nbIndexes})
        else notFound("Aucune ressource d'identifiant " + oid, context)
      })
    }


    if ($accessControl.hasPermission('delete', context)) {
      delByOrigine()
    } else {
      // faut charger la ressource pour le savoir
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) sendJson(context, error)
        else if (!ressource) notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
            " n'existe pas", context)
        else if ($accessControl.hasPermission('delete', context, ressource)) del(ressource.oid)
        else denied("Droits insuffisants pour accéder à la ressource d'origine " +
            origine + " et d'identifiant " + idOrigine, context)
      })
    }
  })

  // Read public (sans session)
  controller.get('public/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.loadPublic(oid, function (error, ressource) {
      if (error) sendJson(context, error)
      else if (ressource) sendJson(context, null, ressource)
      else notFound("La ressource " + oid + " n'existe pas ou n'est pas publique", context)
    })
  })

  // Read public (sans session) par origine
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) sendJson(context, error)
      else if (ressource) {
        if (ressource.restriction === 0) sendJson(context, null, ressource)
        else  denied("Droits insuffisants pour accéder à la ressource " + origine + '/' + idOrigine, context)
      } else notFound("La ressource " + origine + '/' + idOrigine + " n'existe pas", context)
    })
  })

  /**
   * Liste d'après les filtres en json (qui peuvent être multiple)
   *
   * Le json doit contenir
   * - filters : array d'objets {index:nomIndex, values:tableauValeurs},
   *        tableauValeurs peut être undefined et ça remontera toutes les ressources ayant cet index
   * et peut contenir
   * - orderBy : un nom d'index
   * - order : 'desc' si on veut l'ordre descendant
   * - start : offset
   * - nb : nb de résultats voulus
   */
  controller.post('public/by', function (context) {
    log.debug('api.public.by reçoit', context.post)
    $ressourceRepository.getListe('public', context, context.post, function (error, ressources) {
      if (error) sendJson(context, error)
      else sendJson(context, null, ressources)
    })
  })

  controller.post('prof/by', function (context) {
    if (!$accessControl.isAuthenticated(context))
        denied("Il faut être authentifié pour accéder aux ressources prof", context)
    else $ressourceRepository.getListe('prof', context, context.post, function (error, ressources) {
      if (error) sendJson(context, error)
      else sendJson(context, null, ressources)
    })
  })

  controller.post('perso/by', function (context) {
    if (!$accessControl.isAuthenticated(context))
        denied("Il faut être authentifié pour accéder à ses ressources", context)
    else $ressourceRepository.getListe('perso', context, context.post, function (error, ressources) {
      if (error) sendJson(context, error)
      else sendJson(context, null, ressources)
    })
  })

  /**
   * Create / update une ressource à partir du post d'un arbre
   * Si l'arbre posté contient une ref mais pas d'enfant, on tentera de mettre à jour 
   * la racine de l'arbre en référence
   * Avec une ref et des enfants on écrase l'ancien s'il existait ou on signale l'erreur (ref incorrecte)
   */
  controller.post('arbre', function (context) {
    var partial = context.post.ref && !context.post.childrens
    var oid = parseInt(context.post.ref, 10) || 0
    // si on passe ?populate=1 dans l'url on parse les enfants pour récupérer titre et type
    // sinon on laisse en l'état
    log.debug('post avec populate ' + context.get.populate)
    var final = (context.get.populate) ? populateArbre : write
    var ressource = $ressourceConverter.getRessourceFromPostedArbre(context.post, partial)

    // log.debug("dans api arbre on récupère", ressource)
    try {
      /* debug, mesure de perfs, init du chrono */
      /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs * /
      var msg = oid
      var start = log.getElapsed(0)
      if (!lassi.tmp) lassi.tmp = {}
      lassi.tmp[context.post.ref] = {m: msg, s: start}
      lassi.tmp[context.post.ref].m += '\tcv ' + log.getElapsed(lassi.tmp[context.post.ref].s)
      /* fin mesures de perfs */

      if (partial) {
        $ressourceRepository.load(oid, function (error, ressourceBdd) {
          updateAndOut(context, error, ressourceBdd, ressource, final)
        })
      } else {
        final(context, ressource);
      }
    } catch (error) {
      sendJson(context, error)
    }
  })

  // Read arbre
  controller.get('arbre/:oid', function (context) {
    var oid = context.arguments.oid
    $ressourceRepository.load(oid, function (error, ressource) {
      // log.debug("dans api get " +oid, ressource)
      if (error) {
        sendJson(context, error)
      } else if (ressource) {
        if (ressource.typeTechnique === 'arbre') {
          if ($accessControl.hasReadPermission(context, ressource)) {
            sendJson(context, null, $ressourceConverter.toArbre(ressource))
          } else {
            denied("Droits insuffisants pour accéder à la ressource " + oid, context)
          }
        } else {
          notFound("La ressource d'identifiant " + oid + " n'est pas un arbre", context)
        }
      } else {
        notFound("La ressource d'identifiant " + oid + " n'existe pas", context)
      }
    })
  })

  var firstFreeId = 1
  $cache.set('cpt', firstFreeId, 3600, function(){})

  controller.get('cpt', function (context) {
    //mc.incr('cpt', )
    mc.incr('cpt', 1, function (err, val) {
      context.json({cpt:firstFreeId++, err:err, val:val})

    })
  })
}