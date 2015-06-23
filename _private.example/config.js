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
 * Nos paramètres locaux, dont connexion à la base de données, que l'on conserve hors git
 *
 * Dans un fichier js (et pas json) pour pouvoir mettre des commentaires
 */
module.exports = {
  application : {
    baseUrl : 'http://example.com:xxxx',
    mail : "user@example.com",
    staging: 'prod' // prod ou dev
  },
  $entities : {
    database: {
      host: "xxx",
      port: "3306",
      user: "xxx",
      password: "xxx",
      database: "xxx",
      // cf https://github.com/felixge/node-mysql/#pool-options
      connectTimeout : 1000,
      trace : true, // true par défaut, mettre false en prod ?
      connectionLimit : 50,
      waitForConnections : true, // avec true, si les 50 sont occupées on met en queue jusqu'à queueLimit
      acquireTimeout : 1000,
      queueLimit : 100,
      debug : true // mysql2 distingue pas
      // debug: ['ComQueryPacket', 'ErrorPacket'] // Cf node_modules/mysql/lib/protocol/packets/ pour la liste
    }
  },
  $server : {
    hostname : 'foo.bar', // utilisé par des tâches gulp en dev, mis à localhost si absent
    port:process.env.PORT || 3001
  },
  logs : {
    debugExclusions : ['cache'],
    perf : 'perf.log'
  }, /* */
  memcache : '127.0.0.1:11211',
  // des modules à précharger avant bootstrap
  extraModules : ['fooModule'],
  // des dépendances à ajouter au composant principal en premier
  extraDependenciesFirst : ['fooComposant'],
  // des dépendances à ajouter au composant principal en dernier
  extraDependenciesLast : ['barComposant'],
  /**
   * {strings[]} liste de token pour utiliser l'api depuis une ip locale (ou autorisée) avec tous les droits
   * À passer dans un header http X-ApiToken
   */
  apiToken : [],
  /** {string[]} surcharger ça en private pour autoriser des ip publiques à utiliser un token sur l'api */
  authIps : [],
  /**
   * Liste de pattern de domaine autorisés à utiliser un token sur l'api
   * par ex /^(.*\.)?(sesamath\.net|foo\.org)(:[0-9]+)?$/
   * {RegExp[]}
   */
  authDomainsRegexs : []
}

/**
 * Pour ajouter un composant à placer en dépendance globale (avant les dépendances du composant principal)
 *
 * Pas utilisable pour l'authentification si on a des dépendances à d'autres services de l'appli, dans ce
 * cas utiliser les propriétés extraModules, extraDependenciesFirst et extraDependenciesLast
 */
lassi.component('auth').config(function() {
  require('mon-module-auth')
})
