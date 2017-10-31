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
var url = require('../../app/tools/url')

// @todo tester toutes les méthodes de url

describe('tools.url', function () {
  it('update', function () {
    const {update} = url
    let urlWithoutAnchor = 'https://user:pass@sub.domain.tld:123/path/foo/bar/url.html'
    let anchor = '#anchor'
    let urlStr = urlWithoutAnchor + anchor
    assert.strictEqual(urlStr, update(urlStr))
    assert.strictEqual(urlStr, update(urlStr, null))
    assert.strictEqual(urlStr, update(urlStr, {}))
    assert.strictEqual(urlStr, update(urlStr, {}, {replace: true}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=bar${anchor}`, update(urlStr, {foo: 'bar'}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=true${anchor}`, update(urlStr, {foo: true}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=${anchor}`, update(urlStr, {foo: null}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=false${anchor}`, update(urlStr, {foo: false}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=${anchor}`, update(urlStr, {foo: undefined}))
    let qs = '?foo=bar&baz&titi=42'
    urlStr = urlWithoutAnchor + qs + anchor
    assert.strictEqual(urlStr, update(urlStr))
    assert.strictEqual(urlStr, update(urlStr, null))
    assert.strictEqual(urlStr, update(urlStr, {}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=&baz=&titi=42${anchor}`, update(urlStr, {foo: undefined}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=${anchor}`, update(urlStr, {foo: undefined}, {replace: true}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=bar&baz=&titi=42${anchor}`, update(urlStr, {foo: 'bar'}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=bar${anchor}`, update(urlStr, {foo: 'bar'}, {replace: true}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=barbar&baz=3&titi=42${anchor}`, update(urlStr, {foo: 'barbar', baz: 3}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=barbar${anchor}`, update(urlStr, {foo: 'barbar'}, {replace: true}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=barbar&baz=3&titi=42${anchor}`, update(urlStr, {foo: 'barbar', baz: 3}))
    assert.strictEqual(`${urlWithoutAnchor}?foo=barbar&baz=3${anchor}`, update(urlStr, {foo: 'barbar', baz: 3}, {replace: true}))
  })
})
