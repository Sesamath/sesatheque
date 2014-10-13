/**
 * @file Controleur de la route api/*
 * POST /api/ressource
 * GET  /api/ressource/:id Renvoie la ressource d'id :id
 * POST /api/ressourceMerge
 */
'use strict';

/**
 * Controleur de la route api/
 * @extends {lassi.Controller}
 */
var controller = lassi.Controller('api')

var _ = require('underscore')._
var flow = require('seq')
var converter = require('../converter')
var repository = require('../repository')

controller.respond('json');

/**
 * @callback api_ressource POST api/ressource
 */
controller
    .Action('ressource')
    .via('post')
    .do(postRessource, {timeout:10000})

/**
 * Create / update une ressource
 * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
 * @callback Callback~Task
 * @param ctx
 * @param next
 */
function postRessource(ctx, next) {
  var partial = !ctx.post.titre && !ctx.post.categories &&
      (ctx.post.id || (ctx.post.origine && ctx.post.idOrigine))
  var id = ctx.post.id || 0
  var ressource = converter.getRessourceFromPost(ctx.post, partial)

  function update(error, ressourceLoaded) {
    if (error) next(null, {error:error.toString()})
    else {
      ressourceLoaded.udate(ressource)
      write(ctx, ressourceLoaded, next)
    }
  }

  //log.dev("dans api write on récupère en post", ctx.post)
  try {
    var msg = id
    // init du chrono
    var start = log.getElapsed(0)
    /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
    if (!lassi.tmp) lassi.tmp = {}
    lassi.tmp[ctx.post.id] = {m:msg,s:start}
    lassi.tmp[ctx.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
    //log.dev("que l'on a transformé en", ressource)

    if (partial) {
      // faut la charger
      if (ressource.id) repository.load(ressource.id, update)
      else repository.loadByOrigin(ressource.origine, ressource.idOrigine, update)
    } else write(ctx, ressource, next)

  } catch (e) {
    log.error(e);
    next(null, {error: e.toString()})
  }
}

/**
 * Merge
 * Si le titre et la catégorie sont manquants on merge avec la ressource existante que l'on update, sinon on écrase
 */
controller
    .Action('ressourceMerge')
    .via('post')
    .do(function(ctx, next) {
      var part = converter.getRessourceFromPost(ctx.post, true)

      function merge(error, ressource) {
        if (error) next(null, {error:error.toString()})
        else {
          ressource.merge(part)
          write(ctx, ressource, next)
        }
      }

      if (part.id) repository.load(ctx.post.id, merge)
      else if (ctx.post.origine && ctx.post.idOrigine) repository.loadByOrigin(part.origine, part.idOrigine, merge)
      else next(null, {error:"Il faut fournir id ou origine+idOrigine"})
    })

/**
 * Read (get) & delete
 */
controller
    .Action('ressource/:id', 'api.read')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

      function del() {
        repository.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }

      if (ctx.method === 'get') {
        repository.load(id, function (error, ressource) {
          // log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource)
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
        })

      } else {
        if (lassi.personne.hasPermission('delete', ctx)) {
          del()
        } else {
          // faut charger la ressource pour le savoir
          repository.load(id, function (error, ressource) {
            if (error) next(error)
            else if (!ressource) next(new Error("la ressource d'identifiant " + id + " n'existe pas"))
            else if (lassi.personne.hasPermission('delete', ctx, ressource)) del() // next inclus
            else denied("Droits insuffisants pour supprimer la ressource d'identifiant " + id, ctx, next)
          })
        }
      }
    })

/**
 * Read (get) & delete byOrigine
 */
controller
    .Action('ressource/:origine/:id', 'api.readByOrigine')
    .via('get', 'delete')
    .do(function (ctx, next) {
      var idOrigine = ctx.arguments.id
      var origine = ctx.arguments.origine

      /**
       * Efface la ressource d'après les params origine & idOrigine de la requete
       */
      function delByOrigine() {
        repository.delByOrigine(origine, idOrigine, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'origine " +origine +" et d'identifiant " + idOrigine})
        });
      }

      /**
       * Fct à privilégier car l'effacement du cache est nettement plus performant
       * @param id
       */
      function del(id) {
        repository.del(id, function (error, nbObjects, nbIndexes) {
          if (error) next(null, {error: error.toString()})
          else if (nbObjects > 0) {
            next(null, {deletedId: id, nbObjects:nbObjects, nbIndexes:nbIndexes})
          } else next(null, {error: "Aucune ressource d'identifiant " + id})
        });
      }

      if (ctx.method === 'get') {
        // log('api.readByOrigine ' +origine +' ' +idOrigine)
        repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
          // log('api.readByOrigine ' +origine +' ' +idOrigine +' récupère ', ressource)
          // log.dev("dans api get " +id, ressource)
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify pour la sortie, à cause de la propriété _entity, d'où le toObject
            if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource)
            else  denied("Droits insuffisants pour accéder à la ressource d'origine " +
                origine +" et d'identifiant " + idOrigine, ctx, next)
          } else notFound("La ressource d'origine " +origine +" et d'identifiant " + idOrigine +
              " n'existe pas", ctx, next)
        })

      } else {
        if (lassi.personne.hasPermission('delete', ctx)) {
          delByOrigine()
        } else {
          // faut charger la ressource pour le savoir
          repository.loadByOrigin(origine, idOrigine, function (error, ressource) {
            if (error) next(error)
            else if (!ressource) notFound("La ressource d'origine " + origine + " et d'identifiant " + idOrigine +
                " n'existe pas", ctx, next)
            else if (lassi.personne.hasPermission('delete', ctx, ressource)) del(ressource.id) // next inclus
            else denied("Droits insuffisants pour accéder à la ressource d'origine " +
                  origine + " et d'identifiant " + idOrigine, ctx, next)
          })
        }
      }
    })

/**
 * Read public (sans session)
 */
controller
    .Action('public/:id', 'api.public')
    .do(function (ctx, next) {
      var id = ctx.arguments.id

        repository.load(id, function (error, ressource) {
          if (error) next(null, {error: error.toString()})
          else if (ressource) {
            // l'entité passe pas le JSON.stringify, à cause de la propriété _entity, d'où le toObject
            if (ressource.restriction === 0) next(null, ressource)
            else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
          } else notFound("La ressource d'identifiant " + id + " n'existe pas", ctx, next)
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
controller
    .Action('public/by', 'api.public.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      log.dev('api.public.by reçoit', ctx.post)
      repository.getListe('public', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('prof/by', 'api.prof.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated(ctx)) next(null, {error:"Il faut être authentifié pour accéder aux ressources prof"})
      else repository.getListe('prof', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

controller
    .Action('my/by', 'api.my.by')
    .via('post')
    .renderWith('liste')
    .do(function (ctx, next) {
      if (!lassi.personne.isAuthenticated(ctx)) next(null, {error:"Il faut être authentifié pour accéder à ses ressources"})
      else repository.getListe('moi', ctx, ctx.post, function(error, ressources) {
        if (error) next(null, {error:error.toString()})
        else next(null, addUrls(ctx, ressources))
      })
    })

/**
 * Create / update une ressource à partir du post d'un arbre
 * Si l'arbre posté contient un id mais pas d'enfant, on tentera de récupérer l'arbre et de mettre à jour sa racine,
 * sinon, avec un id on écrase l'ancien s'il existait ou on insère une nouvelle ressource
 */
controller
    .Action('arbre')
    .via('post')
    .do(function(ctx, next) {
      var partial = ctx.post.id && !ctx.post.childrens
      var id = ctx.post.id || 0
      // si on passe ?populate=1 dans l'url on parse les enfants pour récupérer titre et type
      // sinon on laisse en l'état
      log.dev('post avec populate ' +ctx.get.populate)
      var final = (ctx.get.populate) ? populateArbre : write
      var ressource = converter.getRessourceFromPostedArbre(ctx.post, partial)

      function update(error, ressourceLoaded) {
        if (error) next(null, {error:error.toString()})
        else {
          ressourceLoaded.udate(ressource)
          final(ctx, ressource, next)
        }
      }

      // log.dev("dans api arbre on récupère", ressource)
      try {

        /* debug, mesure de perfs, init du chrono */
        var msg = id
        var start = log.getElapsed(0)
        /** lassi.tmp sert à stocker des dates pour debug et mesures de perfs */
        if (!lassi.tmp) lassi.tmp = {}
        lassi.tmp[ctx.post.id] = {m:msg,s:start}
        lassi.tmp[ctx.post.id].m += '\tcv ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
        /* fin mesures de perfs */

        if (partial) repository.load(id, update)
        else final(ctx, ressource, next);
      } catch (e) {
        log.error(e);
        next(null, {error: e.toString()})
      }
    }, {timeout:20000})


/**
 * Read arbre
 */
controller
    .Action('arbre/:id', 'api.arbre.read')
    .via('get')
    .do(function (ctx, next) {
      var id = ctx.arguments.id
      repository.load(id, function (error, ressource) {
        // log.dev("dans api get " +id, ressource)
        if (error) next(null, {error: error.toString()})
        else if (ressource && ressource.typeTechnique === 'arbre') {
          if (lassi.personne.hasReadPermission(ctx, ressource)) next(null, ressource.toArbre())
          else  denied("Droits insuffisants pour accéder à la ressource d'identifiant " + id, ctx, next)
        } else notFound("La ressource d'identifiant " + id + " n'existe pas ou n'est pas un arbre", ctx, next)
      })
    })

module.exports = controller;

function denied(msg, ctx, next) {
  ctx.response.statusCode = 403;
  next(null, {error: msg})
}

function notFound(msg, ctx, next) {
  ctx.response.statusCode = 404;
  next(null, {error: msg})
}

/**
 * Ajoute les propriétés url à chaque elt du tableau de ressource
 * @param {Context} ctx
 * @param {Array} ressources
 * @returns {Array} Le nouveau tableau de ressources
 */
function addUrls(ctx, ressources) {
  return ressources.map(function (ressource) {
    if (ressource.restriction === 0) ressource.url = ctx.url(lassi.action.api.public.read, {id:ressource.id})
    else ressource.url = ctx.url(lassi.action.api.read, {id:ressource.id})
    return ressource
  })
}

/**
 * Vérifie les droits et enregistre la ressource
 * @param ctx
 * @param ressource
 * @param next
 */
function write(ctx, ressource, next) {
  var permission = (ressource.id || ressource.idOrigine) ? 'update' : 'create'
  if (lassi.personne.hasPermission(permission, ctx, ressource)) {
    repository.write(ressource, function (error, ressource) {
      // id - convertPost - valide+setVersion - store - store2 - fin
      lassi.tmp[ctx.post.id].m += '\tretSt ' +log.getElapsed(lassi.tmp[ctx.post.id].s)
      log.errorData(lassi.tmp[ctx.post.id].m)
      //log.dev("dans cb api write on récupère", ressource)
      if (error) next(null, {error: error.toString()})
      else if (!_.isEmpty(ressource.errors)) {
        next(null, {error: ressource.errors.join("\n")})
      } else {
        next(null, {id: ressource.id})
      }
    })
  } else {
    var errorMsg = "Droits insuffisants"
    if (ressource.id) errorMsg += " pour modifier la ressource d'identifiant " + id
    else errorMsg += " pour ajouter une ressource"
    denied(errorMsg, ctx, next)
  }
}

/**
 * Parse les enfants de l'arbre et remplace
 * @param ctx
 * @param ressource
 * @param {Callbacks~Done} next
 */
function populateArbre(ctx, ressource, next) {
  if (ressource.idOrigine == "exercices_interactifs.part1") log.dev('populateArbre de', ressource)
  // checks
  if (ressource.typeTechnique !== 'arbre')
    return next(null, {error:"Impossible de peupler une ressource autre qu'un arbre"})
  if (!ressource.enfants ||
      !ressource.enfants instanceof Array ||
      !ressource.enfants.length) {
    log('arbre vide', ressource)
    return next(null, {error:"Impossible de peupler un arbre vide"})
  }

  // go
  populateEnfants(ressource, suite)

  /**
   * Enregistre la ressource avant de passer à next
   */
  function suite() {
    write(ctx, ressource, next)
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
              repository.loadByOrigin(enfant.refOrigine, enfant.ref, function (error, ressource) {
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
}

/**
 * Met éventuellement à jour un titre bateau si on en a un meilleur
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
      log.dev("titre changé " +ressource.titre +' => ' +newTitre +' pour ' +ressource.id)
      ressource.titre = newTitre
      ressource.store()
  }
}
