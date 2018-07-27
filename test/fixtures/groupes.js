import utilisateurs from './utilisateurs'
const firstUser = utilisateurs[0]

module.exports = [
  {
    oid: '5b5050337309ec014b37c223',
    nom: 'Un premier groupe',
    description: 'Le premier groupe de test',
    ouvert: true,
    public: true,
    gestionnaires: [firstUser.oid]
  }
]
