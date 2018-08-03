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

const flow = require('an-flow')

// Des retours d'erreur, pour tester la gestion d'erreur de nos clients
const errors = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  418: 'I’am a teapot',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
}

function controllerTestFactory (component) {
  // Les routes suivantes n'existent que pour les tests, cf index.js, pour répondre à des test client par mocha
  component.controller('test', function ($session, $json) {
    const controller = this
    let EntityPersonne
    /**
     * Connecte un utilisateur à son compte
     * ATTENTION : Cette route doit exister seulement pour les tests
     * @route POST /test/api/login
     */
    this.post('api/login', function (context) {
      if (!EntityPersonne) EntityPersonne = lassi.service('EntityPersonne')
      const {personne: {oid, pid}} = context.post
      flow().seq(function () {
        if (oid) EntityPersonne.match('oid').equals(oid).grabOne(this)
        else if (pid) EntityPersonne.match('pid').equals(pid).grabOne(this)
        else context.restKo('personne sans oid ni pid, login impossible')
      }).seq(function (personne) {
        if (!personne) return context.restKo(`La personne ${oid || pid} n’existe pas`)
        $session.login(context, personne)
        context.rest({message: 'Utilisateur login', personne})
      }).catch(function (error) {
        context.restKo(error)
      })
    })

    /**
     * Déconnecte un utilisateur
     * @route GET /test/api/logout
     */
    this.get('api/logout', function (context) {
      $session.logout(context)
      context.rest({message: 'Utilisateur logout'})
    })

    // les routes d'erreurs
    Object.entries(errors).forEach(([code, message]) => {
      controller.all(`text/${code}`, function (context) {
        context.status = Number(code)
        context.plain(message)
      })
      controller.all(`json/${code}`, function (context) {
        context.status = Number(code)
        context.json({message})
      })
    })

    // 2 routes ok
    controller.all(`text/200`, function (context) {
      context.status = 200
      context.plain('OK')
    })
    controller.all(`json/200`, function (context) {
      context.status = 200
      context.json({message: 'OK'})
    })

    // réponse ok avec {foo:bar} en réponse
    controller.all('api/foo/bar', function (context) {
      $json.sendOk(context, {foo: 'bar'})
    })

    // réponse ok avec retard
    controller.all(`api/delay/:sToWait`, function (context) {
      const respond = () => {
        $json.sendOk(context, context.post)
      }
      setTimeout(respond, context.arguments.sToWait * 1000)
    })

    // réponse KO avec le code et le message demandé
    controller.all('api/error/:status/:message', function (context) {
      const {status, message} = context.arguments
      context.status = status
      context.json({message})
    })

    // une route où on throw, pour vérifier que beforeTransport fait le taf
    controller.all('throw/:error', function (context) {
      throw Error(context.arguments.error)
    })
  })

  // faut aussi mettre des routes sur le préfixe /api si on veut tester des requêtes avec body
  // car le body-parser json n'agit que sur ces routes
  component.controller('api/test', function ($session, $json) {
    // réponse ok avec le contenu qu'on nous envoie
    this.all('echo', function (context) {
      const data = Object.keys(context.post).length ? context.post : undefined
      $json.sendOk(context, data)
    })
  })
}
// on ajoute ça pour les tests
controllerTestFactory.errors = errors
// et on exporte
module.exports = controllerTestFactory
