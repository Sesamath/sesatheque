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

/* global describe,it */

var assert = require('assert')
var CounterMulti = require('../../app/server/tools/CounterMulti')

describe('CounterMulti', function () {
  var cm = new CounterMulti()
  it('construct retourne un objet avec une propriété length de 0', function () {
    assert.strictEqual(0, cm.length)
  })
  it('inc incrémente ', function () {
    cm.inc('foo')
    cm.inc('foo')
    cm.inc('bar')
    assert.strictEqual(2, cm.length)
    assert.strictEqual(2, cm.foo)
    assert.strictEqual(1, cm.bar)
  })
  it('dec décrémente ', function () {
    cm.dec('foo')
    cm.dec('baz')
    assert.strictEqual(3, cm.length)
    assert.strictEqual(1, cm.foo)
    assert.strictEqual(-1, cm.baz)
  })
  it('delete efface ', function () {
    cm.delete('foo')
    assert.strictEqual(2, cm.length)
    assert.strictEqual(undefined, cm.foo)
  })
  it('resetLength recalcule la longueur si on ajoute manuellement des compteurs', function () {
    cm.foo = 4
    cm.resetLength()
    assert.strictEqual(3, cm.length)
  })
  it('total additionne tout', function () {
    assert.strictEqual(4, cm.total())
    cm.delete('baz')
    assert.strictEqual(5, cm.total())
  })
})
