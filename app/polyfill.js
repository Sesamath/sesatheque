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
 * along with SesaReactComponent (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de SesaReactComponent, créée par l'association Sésamath.
 *
 * Sesatheque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sesatheque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que SesaQcm
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */
'use strict'
// On ajoutait les @babel/polyfill dans app/client-react/index.js et app/client/page/index.js
// et non directement dans les entries de webpack.
// C'était le seul moyen pour qu'il soit pris en compte par babel-env-preset 'useBuiltIns' option
// (qui sert à n'inclure que les polyfills nécessaires pour les browsers ciblés.)
// depuis babel 7.4, y'a plus de @babel/polyfill,
// on utilise directement core-js qui s'occupe d'ajouter les polyfill nécessaires,
// cf https://www.thebasement.be/updating-to-babel-7.4/
// https://babeljs.io/blog/2019/03/19/7.4.0

// plus besoin avec useBuiltIns usage
// import 'core-js'
// bug core-js qui ne l'inclus pas et ça fait planter IE11
import 'core-js/modules/es.array.iterator'
// core-js ne s'occupe pas des specs du dom, faut charger le polyfill fetch séparément
import 'whatwg-fetch'

// lui est nécessaire si on utilise des générateurs (pas le cas) ou async/await (y'en a dans le plugin url)
import 'regenerator-runtime/runtime'
