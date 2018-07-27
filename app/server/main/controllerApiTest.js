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

module.exports = function controllersApiTestFactory (component) {
  // Les routes suivantes n'existent que pour les tests, cf index.js
  component.controller('api/test', function controllersApiTest ($session) {
    let EntityPersonne
    /**
     * Connecte un utilisateur à son compte
     * ATTENTION : Cette route doit exister seulement pour les tests
     * @route POST /api/test/login
     */
    this.post('login', function (context) {
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
     * @route GET /api/test/logout
     */
    this.get('logout', function (context) {
      $session.logout(context)
      context.rest({message: 'Utilisateur logout'})
    })
  })
}
