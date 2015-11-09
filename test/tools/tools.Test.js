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
var tools = require('../../app/tools')
// tools fait du log.error
GLOBAL.log = require('../../app/tools/log')

var CounterMulti = require('../../app/tools/CounterMulti')
//var flow = require('an-flow');
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

  describe('complete', function () {
    var src = {
      foo: 'bar',
      bar : {
        titi : {
          toto : 'foo',
          tata : 'bar',
          tutu : 42
        }
      },
      nullprop:null
    }
    var addons = {
      foo:"modif",
      bar : {
        titi : {
          tata : 'bartabac',
          tyty : 2
        },
        truc : 42,
      },
      baz: 43,
      nullprop : 42
    }
    var expected = {
      foo: 'bar',
      bar : {
        titi : {
          toto : 'foo',
          tata : 'bar',
          tutu : 42
        }
      },
      baz: 43,
      nullprop:null
    }
    it("ajoute les propriétés manquantes de la racine", function () {
      tools.complete(src, addons, false)
      assert.ok(_.isEqual(src, expected))
    })
    it("ajoute les propriétés manquantes récursivement", function () {
      expected.bar.titi.tyty = addons.bar.titi.tyty
      expected.bar.truc = addons.bar.truc
      tools.complete(src, addons)
      assert.ok(_.isEqual(src, expected))
    })
  })

  describe('encadre', function () {
    it("retourne la valeur fournie si dans l'intervalle", function () {
      assert.strictEqual(42, tools.encadre(42, -2, 48))
    })
    it("retourne la borne inf si trop petit", function () {
      assert.strictEqual(42, tools.encadre(-2, 42, 48))
    })
    it("retourne la borne sup si trop grand", function () {
      assert.strictEqual(42, tools.encadre(52, 2, 42))
    })
  })

  describe('integerify', function () {
    it("retourne le tableau avec les chaines représentant des entiers en entiers", function () {
      var tabResult = tools.integerify([0, "-2", 3, "4", "cinq", 6])
      var tabExpected = [0, -2, 3, 4, "cinq", 6]
      for (var i = 0; i < tabResult.length; i++) {
        assert.strictEqual(tabResult[i], tabExpected[i])
      }
      assert.strictEqual(tabResult.length, tabExpected.length)
    })
  })

  describe('merge', function () {
    var src = [0, "-2", 3, "4", "cinq", 6]
    var srcClone = tools.clone(src)
    var addons = [3, 8, -2, 'foo']
    var expected = [0, "-2", 3, "4", "cinq", 6, 8, -2, 'foo']
    tools.merge(src, addons)
    it("tableaux simple", function () {
      assert(!_.isEqual(src, srcClone))
      for (var i = 0; i < expected.length; i++) {
        assert.strictEqual(src[i], expected[i])
      }
      assert.strictEqual(src.length, expected.length)
    })
    it("tableaux mixtes", function () {
      src = [6, {foo:'bar', baz:'42'}, [1,2], {foo:'bar'}]
      addons = [{foo:'bar', baz:'42'}, {baz:'42'}, [3, 4, 5], [1,2], {foo:'baz'}]
      expected = [6, {foo:'bar', baz:'42'}, [1,2], {foo:'bar'}, {baz:'42'}, [3, 4, 5], {foo:'baz'}]
      tools.merge(src, addons)
      for (var i = 0; i < expected.length; i++) {
        if (typeof expected[i] === 'object') assert.ok(_.isEqual(src[i], expected[i]))
        else assert.strictEqual(src[i], expected[i])
      }
      assert.strictEqual(src.length, expected.length)
    })
    it("d'objets", function () {
      src = {
        foo: 'bar',
        arr: [1, 3, 'qat'],
        baz: '42',
        bar : {
          titi : {
            toto : 'foo',
            tata : 'bar',
            tutu : 42
          }
        }
      }
      addons = {
        baz: 43,
        bar : {
          titi : {
            tata : 'bartabac',
            tyty : 2
          }
        },
        arr : [3, 'cinq', -2],
        tutu : 'foo'
      }
      expected = {
        arr: [1, 3, 'qat', 'cinq', -2],
        foo: 'bar',
        baz: 43,
        bar : {
          titi : {
            toto : 'foo',
            tata : 'bartabac',
            tutu : 42,
            tyty : 2
          }
        },
        tutu : 'foo'
      }
      tools.merge(src, addons)
      assert.ok(_.isEqual(src, expected))
    })
  })

  describe('update', function () {
    it("d'objets", function () {
      var src = {
        foo: 'bar',
        arr: [1, 3, 'qat'],
        baz: '42',
        bar : {
          titi : {
            toto : 'foo',
            tata : 'bar',
            tutu : 42
          }
        }
      }
      var addons = {
        baz: 43,
        bar : {
          titi : {
            tata : 'bartabac',
            tyty : 2
          }
        },
        arr : [3, 'cinq', -2],
        tutu : 'foo'
      }
      var expected = {
        foo: 'bar',
        arr: [3, 'cinq', -2],
        baz: 43,
        bar : {
          titi : {
            tata : 'bartabac',
            tyty : 2
          }
        },
        tutu : 'foo'
      }
      tools.update(src, addons)
      assert.ok(_.isEqual(src, expected))
    })
  })
})
