import subtypes from './subtypes'

const validate = ({parametres: {fichierjs}}, errors) => {
  if (!subtypes.includes(fichierjs)) {
    errors.parametres = errors.parametres || {}
    errors.parametres.fichierjs = 'Le type d’exercice est invalide'
  }
}

export default validate
