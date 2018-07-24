import {expect} from 'chai'

const EntityGroupe = () => lassi.service('EntityGroupe')
const EntityPersonne = () => lassi.service('EntityPersonne')

/**
 * Crée un utilisateur et le log via l'API
 * @param {string} agent
 * @param {Object} personne
 * @param {function} done
 */
export const createAndLogUser = async (agent, personne) => {
  // On s'assure qu'il n'y a pas une autre session en cours
  await agent
    .post('/api/logout')
    .set('Content-Type', 'application/json')

  // On crée l'utilisateur en base
  const personneEntity = await createPersonne(personne)

  // On se connecte à l'aide de ce nouvel utilisateur
  await agent
    .post('/api/login')
    .set('Content-Type', 'application/json')
    .send({personne: personneEntity})
    .expect(200)
}

/**
 * Crée un utilisateur en base
 * @param {string} agent
 * @param {string} user
 * @return {Promise} Une promesse
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
