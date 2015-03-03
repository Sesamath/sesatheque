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

'use strict';
/**
 * Component de gestion des types de contenu "Ressource".
 * @extends {lassi.Component}
 */
var ressourceComponent = lassi.Component();

/** durée de cache par défaut (écrasé par la conf) */
ressourceComponent.cacheTTL = 3600

ressourceComponent.initialize = function(next) {
  // on ajoute à la conf de l'appli la conf ressource qui est dans notre dossier
  var config = require('./config.js')
  this.application.settings.ressource = config
  if (config.cacheTTL) ressourceComponent.cacheTTL = lassi.main.encadre(config.cacheTTL, 60, 12*3600,
      'ttl de cache par défaut pour les entities ressource')
  log('ttl du cache ressource fixé à ' +ressourceComponent.cacheTTL)
  next();
}

// et on l'exporte
module.exports = ressourceComponent;
