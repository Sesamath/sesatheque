import config from '../../app/server/config'

const {application: {baseId}, sesatheques} = config

const otherSesatheque = sesatheques.find(({baseId: bid}) => bid !== baseId)
// il faut une baseId connue de sesatheque-client, si y'en a pas en config on prend la prod Sésamath
const otherBaseId = (otherSesatheque && otherSesatheque.baseId) || 'sesabibli'

export default [
  {
    oid: '1',
    rid: `${baseId}/1`,
    origine: baseId,
    idOrigine: '1',
    type: 'iep',
    titre: 'Mon exercice IEP',
    resume: '',
    description: '',
    commentaires: '',
    parametres: {},
    niveaux: [],
    categories: [7],
    typePedagogiques: [9, 2],
    typeDocumentaires: [9],
    relations: [],
    dateCreation: new Date(),
    dateMiseAJour: new Date(),
    $droits: 'RWD'
  },
  {
    oid: '2',
    rid: `${baseId}/2`,
    origine: baseId,
    idOrigine: '2',
    type: 'arbre',
    titre: 'Mon exercice ARBRE',
    resume: '',
    description: '',
    commentaires: '',
    parametres: {},
    niveaux: [],
    categories: [5],
    typePedagogiques: [3],
    typeDocumentaires: [6],
    relations: [],
    dateCreation: new Date(),
    dateMiseAJour: new Date(),
    $droits: 'RD'
  },
  {
    oid: '3',
    rid: `${baseId}/3`,
    origine: otherBaseId,
    idOrigine: '3',
    aliasOf: `${otherBaseId}/42`,
    type: 'url',
    titre: 'Un alias',
    categories: [5],
    dateCreation: new Date(),
    dateMiseAJour: new Date(),
    $droits: 'R'
  }
]
