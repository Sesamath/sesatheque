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
var filters = require('../../construct/ressource/public/vendors/sesamath/tools/filters')
//var flow = require('seq');
//var request = require('request')

describe('filters', function () {
  describe('array', function () {
    it('retourne le même tableau ou un tableau vide', function () {
      var data
      data = [1, 2, 3]
      assert.ok(_.isEqual(data, filters.array(data)))
      data = ['un']
      assert.ok(_.isEqual(data, filters.array(data)))
      data = []
      assert.ok(_.isEqual(data, filters.array(data)))
      assert.ok(_.isEqual([], filters.array({})))
      assert.ok(_.isEqual([], filters.array('foo')))
      assert.ok(_.isEqual([], filters.array(undefined)))
    })

  })

  describe('arrayInt', function () {
    it('retourne le tableau purgé de ses valeurs qui ne sont pas des entiers positifs', function () {
      var data
      data = [1, 0, 2, 3]
      assert.ok(_.isEqual(data, filters.arrayInt(data)))
      assert.ok(_.isEqual([0,1], filters.arrayInt(['un', 0, 'deux', 1])))
      assert.ok(_.isEqual([0,1], filters.arrayInt([0, -2, 1])))
      assert.ok(_.isEqual([], filters.arrayInt([-3])))
      assert.ok(_.isEqual([], filters.arrayInt({})))
      assert.ok(_.isEqual([], filters.arrayInt('foo')))
      assert.ok(_.isEqual([], filters.arrayInt(undefined)))
    })
  })

  describe('arrayString', function () {
    it('retourne le tableau purgé de ses valeurs non string', function () {
      assert.ok(_.isEqual(['un', 'deux'], filters.arrayString(['un', 'deux'])))
      assert.ok(_.isEqual(['un', 'deux', 'trois'], filters.arrayString(['un', -1, 'deux', 42, 'trois'])))
      assert.ok(_.isEqual([], filters.arrayString([0, -2, 1])))
      assert.ok(_.isEqual([], filters.arrayString({})))
      assert.ok(_.isEqual([], filters.arrayString('foo')))
      assert.ok(_.isEqual([], filters.arrayString(undefined)))
    })
  })

  describe('int', function () {
    it("retourne l'entier entré ou 0", function () {
      assert.strictEqual(2, filters.int(2))
      assert.strictEqual(42, filters.int('42'))
      assert.strictEqual(0, filters.int(new Date()))
      assert.strictEqual(0, filters.int(true))
      assert.strictEqual(0, filters.int(undefined))
      assert.strictEqual(0, filters.int([42]))
      assert.strictEqual(0, filters.int({foo:42}))
    })
  })

  describe('date', function () {
    it("retourne la date entrée ou undefined", function () {
      var date = new Date()
      assert.strictEqual(date, filters.date(date))
      var dateString = '2015-04-10T23:40:19.962Z'
      date = new Date(dateString)
      assert.strictEqual(date, filters.date(date))
      // le == retourne false sur deux instance différentes de Date
      assert.ok(_.isEqual(date, filters.date(dateString)))
      var timestamp = 1428709219
      date = new Date(timestamp)
      assert.ok(_.isEqual(date, filters.date(timestamp)))
      assert.strictEqual(timestamp, filters.date(date).getTime())
    })
  })


  describe('string', function () {
    it('retourne la string entrée ou une string vide', function () {
      assert.strictEqual('foo', filters.string('foo'))
      assert.strictEqual('3', filters.string(3))
      var date = new Date()
      assert.strictEqual(date.toString(), filters.string(date))
      assert.strictEqual('true', filters.string(true))
      assert.strictEqual('', filters.string(undefined))
      assert.strictEqual('', filters.string([]))
      assert.strictEqual('', filters.string({}))
    })
  })

})