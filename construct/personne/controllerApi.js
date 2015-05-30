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

/**
 * Le controleur json du composant personne (sur /api/personne)
 * @param {Controller} controller
 * @param $personneRepository
 * @param $accessControl
 */
module.exports = function (controller, Personne, $personneRepository, $accessControl) {

  /**
   * Équivalent de context.denied en json
   * @param context
   * @param msg
   */
  function denied(context, msg) {
    if (!msg) msg = "Accès refusé"
    context.status = 403;
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
   * Create / update une personne
   * @param context
   */
  controller.post('add', function (context) {
    /* var reqHttp = context.request.method +' ' +context.request.parsedUrl.pathname +(context.request.parsedUrl.search||'')
     log.error(new Error('une trace pour ' +reqHttp)) */
    if (context.perf) {
      var msg = 'start-pers-' + context.post.id
      log.perf(context.response, msg)
    }
    //log.debug('post /api/personne a reçu', context.post, 'api', {max: 1000})
    log.debug('post /api/personne a reçu', context.post, 'api')
    if ($accessControl.hasAllRights(context)) {
      // l'appelant est censé être de confiance, on vérifie rien sinon passer par le constructeur
      // pour garantir l'intégrité des données
      var personne = Personne.create(context.post)
      if (personne.id) {
        personne.store(function (error, personneBdd) {
          if (error) sendJson(context, error)
          else if (personneBdd && personneBdd.oid) sendJson(context, null, {oid: personneBdd.oid})
          else sendJson(context, new Error("Erreur interne (personne.store ne renvoie pas d'objet avec oid)"))
        })
      } else {
        sendJson(context, new Error("id manquant"))
      }
    } else {
      denied(context)
    }
  })
}