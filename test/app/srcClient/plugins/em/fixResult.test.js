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

import {expect} from 'chai'
import fixResult from '../../../../../app/srcClient/plugins/em/fixResult'

describe('plugins/em/fixResult', () => {
  it('laisse inchangé un résultat correct', (done) => {
    const result = {
      reponse: 'rvprv',
      score: 3
    }
    expect(fixResult(result)).to.deep.equals(result)
    result.reponse = 'vrprv'
    expect(fixResult(result)).to.deep.equals(result)
    result.reponse = 'vrprvrr'
    expect(fixResult(result)).to.deep.equals(result)
    done()
  })

  it('si le score est cohérent, rectifie les j en r (sauf le dernier)', (done) => {
    const result = {
      reponse: 'jvjprv',
      score: 3
    }
    let fixed = fixResult(result)
    expect(fixed.score).to.equals(3)
    expect(fixed.reponse).to.equals('rvrprv')
    expect(fixed.errors).to.deep.equals([])

    // on ajoute un j à la fin
    result.reponse += 'j'
    fixed = fixResult(result)
    expect(fixed.score).to.equals(3)
    expect(fixed.reponse).to.equals('rvrprvj')
    expect(fixed.errors).to.deep.equals([])
    done()
  })

  it('sinon, rectifie les j en v si ça rend le score cohérent', (done) => {
    const result = {
      reponse: 'jvjprv',
      score: 5
    }
    let fixed = fixResult(result)
    expect(fixed.score).to.equals(5)
    expect(fixed.reponse).to.equals('vvvprv')
    expect(fixed.errors).to.deep.equals([])

    // on ajoute un j à la fin et incrémente le score
    result.reponse += 'j'
    result.score++
    fixed = fixResult(result)
    expect(fixed.score).to.equals(6)
    expect(fixed.reponse).to.equals('vvvprvv')
    expect(fixed.errors).to.deep.equals([])
    done()
  })

  it('sinon, laisse la réponse intacte et prend le meilleur score', (done) => {
    const result = {
      reponse: 'jvjprv',
      score: 2
    }
    let fixed = fixResult(result)
    expect(fixed.score).to.equals(3)
    expect(fixed.reponse).to.equals(result.reponse)
    expect(fixed.errors).to.deep.equals(['réponse incohérente avec le score'])
    result.score = 6
    fixed = fixResult(result)
    expect(fixed.score).to.equals(6)
    expect(fixed.reponse).to.equals(result.reponse)
    expect(fixed.errors).to.deep.equals(['réponse incohérente avec le score'])
    done()
  })
})
