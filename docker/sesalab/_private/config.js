/**
 * This file is part of SesaXXX.
 *   Copyright 2014-2015, Association Sésamath
 *
 * SesaXXX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * SesaXXX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * SesaXXX est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * SesaXXX est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'

// inspiré du sesalab:_private.exemple/config.docker.minimal.js

module.exports = {
  application: {
    /* admin destinataire des notification d'anomalie de l'appli */
    mail: 'dockerSesalab@example.com',
    /* from de tous les mails envoyés */
    fromMail: 'dockerSesalab@example.com',
    /* destinataire des signalements utilisateur */
    contactMail: 'dockerSesalab@example.com',
    baseUrl: 'http://sesalab.local:3000/',
    sesatheques: [
      {baseId: 'biblilocal3001', baseUrl: 'http://bibliotheque.local:3001/'},
      {baseId: 'communlocal3002', baseUrl: 'http://commun.local:3002/'}
    ]
  },

  $cache: {
    redis: {
      host: 'redis',
      port: 6379,
      prefix: 'sesalab'
    }
  },

  $entities: {
    database: {
      host: 'mongo',
      port: 27017,
      name: 'sesalab'
    }
  },

  $crypto: {
    salt: '12s2#OXei8H34'
  },

  $rail: {
    cookie: {
      key: 'nbé32!ps2#OXei8Htd'
    },
    session: {
      secret: '2#OXei8Htdnbé32!p'
    }
  },

  $server: {
    host: 'sesalab.local',
    port: 3000
  },

  // le smtp docker
  smtp: {
    host: 'mailhog',
    port: 1025
  }
}
