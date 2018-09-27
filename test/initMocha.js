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
/* eslint-env mocha */

// on peut mettre dans mocha.opts un
// --require babel-core/register
// mais il faut lui passer des options, on le fait ici et remplace la ligne précédente par
// --require ./test/initMocha

// on veut exclure les node_modules sauf sesatheque-client/src
// faut retourner true pour que babel ignore le fichier
const babelIgnoreFilter = (file) => {
  if (/\/node_modules\//.test(file)) {
    return !/\/sesatheque-client\/src\//.test(file)
  }
  return false
}

require('ignore-styles')
require('@babel/register')({
  // faut pas qu'il lise les preset du package.json, sinon ça donne du
  // Error: Options {"loose":true} passed to  /home/sesamath/projets/git/sesatheque/node_modules/babel-preset-env/lib/index.js which does not accept options. (While processing preset: …
  babelrc: false,
  // notre filtre sur les fichiers à traiter
  ignore: [babelIgnoreFilter],
  presets: [
    ['@babel/preset-env', {'targets': 'node 10'}],
    ['@babel/preset-react']
  ],
  plugins: [
    ['module-resolver', {
      root: ['./app']
    }]
  ]
})
