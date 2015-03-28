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
 * GET  /api/ressource/:id Renvoie la ressource d'id :id
 * POST /api/ressourceMerge
 */
'use strict'

/**
 * Le controleur json du composant ressource (sur /api/)
 * @param {Controller} controller
 * @param $ressourceRepository
 * @param $ressourceConverter
 * @param $accessControl
 */
module.exports = function (controller, $ressourceRepository, $ressourceConverter, $accessControl) {

  var _ = require('lodash')
  var flow = require('seq')

  /**
   * Équivalent de context.denied en json
   * @param msg
   * @param context
   */
  function denied(msg, context) {
    context.status = 403;
    context.json({error: msg})
  }

  /**
   * Équivalent de context.notFound en json
   * @param msg
   * @param context
   */
  function notFound(msg, context) {
    context.status = 404;
    context.json({error: msg})
  }

  /**
   * Ajoute la propriété url à chaque elt du tableau de ressource
   * @param {Array} ressources
   * @returns {Array} Le nouveau tableau de ressources
   */
  function addUrls(ressources) {
    ressources.forEach(function (ressource) {
      if (ressource.restriction === 0) ressource.url = '/api/public/' +ressource.id
      else ressource.url = '/api/' +ressource.id
    })
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
        log.dev("titre de " +ressource.id +" changé : " +ressource.titre +' => ' +newTitre)
        ressource.titre = newTitre
        ressource.store()
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
          // seqEach passe au suivant de la boucle quand la cb appelle this et au seq suivant à la fin
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
                      id           : ressource.id,
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
              log.error("L'analyse de l'arbre a planté")
              try {log.error(lassi.tools.stringify(parent))} catch(e) { }
              nextStep()
            })
      } else {
        nextStep()
      }
    } // populateEnfants

    if (ressource.idOrigine == "exercices_interactifs.part1") log.dev('populateArbre de', ressource)
    // checks
    if (ressource.typeTechnique !== 'arbre')
      return context.json({error:"Impossible de peupler une ressource autre qu'un arbre"})
    if (!ressource.enfants ||
        !ressource.enfants instanceof Array ||
        !ressource.enfants.length
    ) {
      log('arbre vide', ressource)
      return context.json({error:"Impossible de peupler un arbre vide"})
    }

    // go
    populateEnfants(ressource, suite)
  }

  /**
   * Vérifie les droits et enregistre la ressource
   * @param context
   * @param ressource
   */
  function write(context, ressource) {
    var permission = (ressource.id || ressource.idOrigine) ? 'update' : 'create'
    if ($accessControl.hasPermission(permission, context, ressource)) {
      $ressourceRepository.write(ressource, function (error, ressource) {
        // id - convertPost - valide+setVersion - store - store2 - fin
        //lassi.tmp[context.post.id].m += '\tretSt ' +log.getElapsed(lassi.tmp[context.post.id].s)
        //log.errorData(lassi.tmp[context.post.id].m)
        //log.dev("dans cb api write on récupère", ressource)
        if (error) context.json({error: error.toString()})
        else if (!_.isEmpty(ressource.errors)) {
          context.json({error: ressource.errors.join("\n")})
        } else {
          context.json({id: ressource.id})
        }
      })
    } else {
      var errorMsg = "Droits insuffisants"
      if (ressource.id) errorMsg += " pour modifier la ressource d'identifiant " + ressource.id
      else errorMsg += " pour ajouter une ressource"
      denied(errorMsg, context)
    }
  }

  /**
   * Create / update une ressource
   * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
   * @callback api_ressource POST api/ressource
   * @param context
   */
  controller.post('ressource', function (context) {
    // partiel si on a id (ou idOrigine) sans titre ni catégorie
    var partial = !context.post.titre && !context.post.categories &&
        (context.post.id || (context.post.origine && context.post.idOrigine))
    var ressource = $ressourceConverter.getRessourceFromPost(context.post, partial)

    function update(error, ressourceLoaded) {
      if (error) context.json({error:error.toString()})
      else {
        ressourceLoaded.udate(ressource)
        write(context, ressourceLoaded)
      }
    }

    //log.dev("dans api write on récupère en post", context.post)
    try {
      /*
       var id = context.post.id || 0
       var msg = id
       // init du chrono
       var start = log.getElapsed(0)
       /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs * /
       if (!lassi.tmp) lassi.tmp = {}
       lassi.tmp[context.post.id] = {m:msg,s:start}
       lassi.tmp[context.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[context.post.id].s)
       //log.dev("que l'on a transformé en", ressource) /* */

      if (partial) {
        // faut la charger
        if (ressource.id) $ressourceRepository.load(ressource.id, update)
        else $ressourceRepository.loadByOrigin(ressource.origine, ressource.idOrigine, update)
      } else write(context, ressource)

    } catch (e) {
      log.error(e);
      context.json({error: e.toString()})
    }
  })
  
  /**
   * Merge de nouvelles valeurs avec une ressource existante (ou pas, et dans ce cas idem 'ressource')
   * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
   */
  controller.post('ressourceMerge', function (context) {
        var part = $ressourceConverter.getRessourceFromPost(context.post, true)

        function merge(error, ressource) {
          if (error) context.json({error: error.toString()})
          else {
            ressource.merge(part)
            write(context, ressource)
          }
        }

        if (part.id) $ressourceRepository.load(context.post.id, merge)
        else if (context.post.origine && context.post.idOrigine) $ressourceRepository.loadByOrigin(part.origine, part.idOrigine, merge)
        else context.json({error: "Il faut fournir id ou origine+idOrigine"})
      })

  // read
  controller.get('ressource/:id', function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      // log.dev("dans api get " +id, ressource)
      if (error) context.json({error: error.toString()})
      else if (ressource) {
        // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
        if ($accessControl.hasReadPermission(context, ressource)) context.json(ressource)
        else denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, context)
      } else notFound("La ressource d'identifiant " + id + " n'existe pas", context)
    })
  })

  // delete
  controller.delete('ressource/:id', function (context) {
    var id = context.arguments.id

    function del() {
      $ressourceRepository.del(id, function (error, nbObjects, nbIndexes) {
        if (error) context.json({error: error.toString()})
        else if (nbObjects > 0) context.json({deletedId: id, nbObjects: nbObjects, nbIndexes: nbIndexes})
        else context.json({error: "Aucune ressource d'identifiant " + id})
      });
    }

    if (lassi.personne.hasPermission('delete', context)) {
      del()
    } else {
      // faut charger la ressource pour le savoir
      $ressourceRepository.load(id, function (error, ressource) {
        if (error) context.json({error: error.toString()})
        else if (!ressource) context.json({error: "la ressource d'identifiant " + id + " n'existe pas"})
        else if ($accessControl.hasPermission('delete', context, ressource)) del()
        else denied("Droits insuffisants pour supprimer la ressource d'identifiant " + id, context)
      })
    }
  })

  // Read byOrigine
  controller.get('ressource/:origine/:id', function (context) {
    var idOrigine = context.arguments.id
    var origine = context.arguments.origine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      // log('api.readByOrigine ' +origine +' ' +idOrigine +' récupère ', ressource)
      // log.dev("dans api get " +origine +'/' +idOrigine, ressource)
      if (error) context.json({error: error.toString()})
      else if (ressource) {
        if ($accessControl.hasReadPermission(context, ressource)) context.json(ressource)
        else  denied("Droits insuffisants pour accéder à la ressource d'origine " +
            origine + " et d'identifiant " + idOrigine, context)
      } else notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
          " n'existe pas", context)
    })
  })

  // delete by origine
  controller.delete('ressource/:origine/:id', function (context) {
    var idOrigine = context.arguments.id
    var origine = context.arguments.origine

    /**
     * Efface la ressource d'après les params origine & idOrigine de la requete
     */
    function delByOrigine() {
      $ressourceRepository.delByOrigine(origine, idOrigine, function (error, nbObjects, nbIndexes) {
        if (error) context.json({error: error.toString()})
        else if (nbObjects > 0) context.json({nbObjects: nbObjects, nbIndexes: nbIndexes})
        else context.json({error: "Aucune ressource d'origine " + origine + " et d'identifiant " + idOrigine})
      })
    }

    /**
     * Fct à privilégier car l'effacement du cache est nettement plus performant
     * @param id
     */
    function del(id) {
      $ressourceRepository.del(id, function (error, nbObjects, nbIndexes) {
        if (error) context.json({error: error.toString()})
        else if (nbObjects > 0) context.json({deletedId: id, nbObjects: nbObjects, nbIndexes: nbIndexes})
        else context.json({error: "Aucune ressource d'identifiant " + id})
      })
    }


    if (lassi.personne.hasPermission('delete', context)) {
      delByOrigine()
    } else {
      // faut charger la ressource pour le savoir
      $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
        if (error) context.json({error: error.toString()})
        else if (!ressource) notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
            " n'existe pas", context)
        else if ($accessControl.hasPermission('delete', context, ressource)) del(ressource.id)
        else denied("Droits insuffisants pour accéder à la ressource d'origine " +
            origine + " et d'identifiant " + idOrigine, context)
      })
    }
  })

  // Read public (sans session)
  controller.get('public/:id', function (context) {
    var id = context.arguments.id
    $ressourceRepository.loadPublic(id, function (error, ressource) {
      if (error) context.json({error: error.toString()})
      else if (ressource) context.json(ressource)
      else notFound("La ressource d'identifiant " + id + " n'existe pas ou n'est pas publique", context)
    })
  })

  // Read public (sans session) par origine
  controller.get('public/:origine/:idOrigine', function (context) {
    var origine = context.arguments.origine
    var idOrigine = context.arguments.idOrigine
    $ressourceRepository.loadByOrigin(origine, idOrigine, function (error, ressource) {
      if (error) context.json({error: error.toString()})
      else if (ressource) {
        if (ressource.restriction === 0) context.json(ressource)
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
    log.dev('api.public.by reçoit', context.post)
    $ressourceRepository.getListe('public', context, context.post, function (error, ressources) {
      if (error) context.json({error: error.toString()})
      else context.json(ressources)
    })
  })

  controller.post('prof/by', function (context) {
    if (!$accessControl.isAuthenticated(context))
        context.json({error: "Il faut être authentifié pour accéder aux ressources prof"})
    else $ressourceRepository.getListe('prof', context, context.post, function (error, ressources) {
      if (error) context.json({error: error.toString()})
      else context.json(ressources)
    })
  })

  controller.post('perso/by', function (context) {
    if (!$accessControl.isAuthenticated(context))
        context.json({error: "Il faut être authentifié pour accéder à ses ressources"})
    else $ressourceRepository.getListe('perso', context, context.post, function (error, ressources) {
      if (error) context.json({error: error.toString()})
      else context.json(ressources)
    })
  })

  /**
   * Create / update une ressource à partir du post d'un arbre
   * Si l'arbre posté contient un id mais pas d'enfant, on tentera de récupérer l'arbre et de mettre à jour sa racine,
   * sinon, avec un id on écrase l'ancien s'il existait ou on insère une nouvelle ressource
   */
  controller.post('arbre', function (context) {
    var partial = context.post.id && !context.post.childrens
    var id = context.post.id || 0
    // si on passe ?populate=1 dans l'url on parse les enfants pour récupérer titre et type
    // sinon on laisse en l'état
    log.dev('post avec populate ' + context.get.populate)
    var final = (context.get.populate) ? populateArbre : write
    var ressource = $ressourceConverter.getRessourceFromPostedArbre(context.post, partial)

    function update(error, ressourceLoaded) {
      if (error) context.json({error: error.toString()})
      else {
        ressourceLoaded.udate(ressource)
        final(context, ressource)
      }
    }

    // log.dev("dans api arbre on récupère", ressource)
    try {

      /* debug, mesure de perfs, init du chrono */
      var msg = id
      var start = log.getElapsed(0)
      /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
      if (!lassi.tmp) lassi.tmp = {}
      lassi.tmp[context.post.id] = {m: msg, s: start}
      lassi.tmp[context.post.id].m += '\tcv ' + log.getElapsed(lassi.tmp[context.post.id].s)
      /* fin mesures de perfs */

      if (partial) $ressourceRepository.load(id, update)
      else final(context, ressource);
    } catch (e) {
      log.error(e);
      context.json({error: e.toString()})
    }
  })

  // Read arbre
  controller.get('arbre/:id', function (context) {
    var id = context.arguments.id
    $ressourceRepository.load(id, function (error, ressource) {
      // log.dev("dans api get " +id, ressource)
      if (error) context.json({error: error.toString()})
      else if (ressource && ressource.typeTechnique === 'arbre') {
        if (lassi.personne.hasReadPermission(context, ressource)) context.json(ressource.toArbre())
        else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, context)
      } else notFound("La ressource d'identifiant " + id + " n'existe pas ou n'est pas un arbre", context)
    })
  })
}