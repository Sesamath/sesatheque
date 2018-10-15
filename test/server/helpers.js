import {expect} from 'chai'
import {isObjectPlain} from 'sesajstools'

const EntityGroupe = () => lassi.service('EntityGroupe')
const EntityPersonne = () => lassi.service('EntityPersonne')
const EntityRessource = () => lassi.service('EntityRessource')

/**
 * Login via l'api d'un utilisateur (qui doit exister en base)
 * @param {supertestAgent} agent
 * @param {Personne} personne
 * @return {Promise}
 */
export const login = async (agent, personne) => agent
  .post('/api/test/login')
  .set('Content-Type', 'application/json')
  .send({personne})
  .expect(200)

/**
 * Logout via l'API
 * @param {supertestAgent} agent
 * @return {Promise}
 */
export const logout = (agent) => agent
  .get('/api/test/logout')
  .set('Content-Type', 'application/json')
  .expect(200)

/**
 * Crée un utilisateur en base
 * @param {supertestAgent} agent
 * @param {Personne} personne
 * @return {Promise}
 */
export const createPersonne = (personne) => {
  return new Promise((resolve, reject) => {
    EntityPersonne().create(personne).store((error, entity) => {
      if (error) return reject(error)
      resolve(entity)
    })
  })
}

/**
 * Crée une ressource en base
 * @param {supertestAgent} agent
 * @param {Ressource} ressource
 * @return {Promise}
 */
export const createRessource = (ressource) => {
  return new Promise((resolve, reject) => {
    EntityRessource().create(ressource).store((error, entity) => {
      if (error) return reject(error)
      resolve(entity)
    })
  })
}

/**
 * Crée un groupe en base
 * @param {Groupe} groupe Un groupe
 * @param {Array.<string>} personneOids Tableau d'identifiants représentant les futurs gestionnaires du groupe
 */
export const createGroupe = (groupe, personneOids) => {
  return new Promise((resolve, reject) => {
    if (!personneOids) personneOids = []
    groupe.gestionnaires = [...groupe.gestionnaires, ...personneOids]

    EntityGroupe().create(groupe).store((error, entity) => {
      if (error) return reject(error)
      resolve(entity)
    })
  })
}

/**
 * Vérifie récursivement que toCheck est identique à expected pour chacune des propriétés de expected
 * (le test passe si toCheck a des propriétés en plus)
 * @param expected
 * @param toCheck
 * @param path
 */
const checkObj = (expected, toCheck, path = '') => {
  Object.entries(expected).forEach(([k, v]) => {
    const myPath = `${path}${path ? '.' : ''}${k}`
    expect(toCheck).to.have.property(k)
    const toCheckValue = toCheck[k]
    if (isObjectPlain(v)) checkObj(v, toCheckValue, myPath)
    else if (Array.isArray(v)) expect(toCheckValue).to.deep.equals(v, `Pb sur la propriété ${myPath}`)
    else if (v instanceof Date) expect(toCheckValue.toString()).to.equals(v.toString(), `Pb sur la propriété ${myPath}`)
    else expect(toCheckValue).to.equals(v, `Pb sur la propriété ${myPath}`)
  })
}

/**
 * Vérifie que la réponse est ok (et que son body contient expected si fourni)
 * @param response
 * @param {object} [expected]
 */
export const itIsSuccessfull = (response, expected) => {
  expect(response.status).to.equal(200)
  expect(response.body).to.have.property('message')
  expect(response.body.message).to.equal('OK', `Expected message: OK, got:  ${JSON.stringify(response.body)}`)
  if (expected) checkObj(expected, response.body.data)
}

/**
 * Vérifie qu'on prend le code d'erreur status, avec le bon message si fourni
 * @param response
 * @param {string|RegExp} [expectedErrorMessage]
 * @param {number} status
 */
export const itFails = (response, expectedErrorMessage, status) => {
  expect(response.status).to.equal(status)
  if (typeof expectedErrorMessage === 'string') {
    expect(response.body.message).to.equal(expectedErrorMessage)
  } else if (expectedErrorMessage) {
    expect(response.body.message).to.match(expectedErrorMessage)
  }
}

/**
 * Vérifie qu'on prend une 401, avec le bon message si fourni
 * @param response
 * @param {string|RegExp} [expectedErrorMessage]
 */
export const itNeedsAuth = (response, expectedErrorMessage) => itFails(response, expectedErrorMessage, 401)

/**
 * Vérifie qu'on prend une 403, avec le bon message si fourni
 * @param response
 * @param {string|RegExp} [expectedErrorMessage]
 */
export const itBlocksAuthUser = (response, expectedErrorMessage) => itFails(response, expectedErrorMessage, 403)
