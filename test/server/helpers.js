import {expect} from 'chai'

const EntityGroupe = () => lassi.service('EntityGroupe')
const EntityPersonne = () => lassi.service('EntityPersonne')

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
    const personneEntity = EntityPersonne().create(personne)
    personneEntity.store((error, entity) => {
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
    groupe.gestionnaires = [...groupe.gestionnaires, ...personneOids]

    const groupeEntity = EntityGroupe().create(groupe)
    groupeEntity.store((error, entity) => {
      if (error) return reject(error)
      resolve(entity)
    })
  })
}

export const itIsSuccessfull = (response) => {
  expect(response.status).to.equal(200)
  expect(response.body.success).to.equal(true, `Expected success: true, got:  ${JSON.stringify(response.body)}`)
}

export const itFails = (response, expectedErrorMessage) => {
  expect(response.status).to.equal(200)
  expect(response.body.success).to.equal(false, `Expected success: false, got:  ${JSON.stringify(response.body)}`)
  expect(response.body.error).to.equal(expectedErrorMessage)
}

export const itNeedsAuth = (response, expectedErrorMessage) => {
  expect(response.status).to.equal(401)
  expect(response.body.success).to.equal(false, `Expected success: false, got:  ${JSON.stringify(response.body)}`)
  expect(response.body.error).to.equal(expectedErrorMessage)
}

export const itBlocksUser = (response, expectedErrorMessage) => {
  expect(response.status).to.equal(403)
  expect(response.body.success).to.equal(false, `Expected success: false, got:  ${JSON.stringify(response.body)}`)
  expect(response.body.error).to.equal(expectedErrorMessage)
}
