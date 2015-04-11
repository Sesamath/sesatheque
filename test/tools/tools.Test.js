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

'use strict'

/*global describe,it*/

var assert = require("assert")
var _ = require('lodash')
var tools = require('../../construct/tools')
var CounterMulti = require('../../construct/tools/CounterMulti')
//var flow = require('seq');
//var request = require('request')

describe('tools', function () {
  describe('clone', function () {
    it("retourne une copie de l'objet fourni (ou l'argument fourni si c'est pas un objet)", function () {
      [undefined, true, false, null, 0, 42, '', 'foo', 3.14].forEach(function (primitive) {
        assert.strictEqual(primitive, tools.clone(primitive))
      })
      var objects = []
      objects.push(['un', 2, 0])
      objects.push([])
      objects.push({})
      objects.push({foo:'bar',bar:null,baz:42,})
      objects.push(new Date())
      objects.push(/foo/)
      objects.forEach(function (data) {
        assert.ok(_.isEqual(data, tools.clone(data)))
      })
      // et avec un objet maison simple
      var cm = new CounterMulti()
      cm.inc('foo')
      assert.strictEqual(1, cm.foo)
      var cmCloned = tools.clone(cm)
      assert.ok(_.isEqual(cm, cmCloned))
      assert.strictEqual(1, cmCloned.foo)
      assert.ok(cmCloned.inc)
      assert.ok(typeof cmCloned.inc === 'function')
      cmCloned.inc('foo')
      assert.strictEqual(2, cmCloned.foo)
      assert.strictEqual(1, cmCloned.length)
    })
  })
})