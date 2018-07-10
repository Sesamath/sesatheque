import {isEmpty} from 'lodash'

const requiredText = 'Ce champ est obligatoire'
const requiredFields = ['titre', 'type', 'categories', 'niveaux']

const validate = values => {
  const errors = {}
  requiredFields.forEach(key => {
    if (isEmpty(values[key])) {
      errors[key] = requiredText
    }
  })

  if (values.hasOwnProperty('parametres')) {
    const {parametres} = values
    if (typeof parametres === 'string') {
      try {
        JSON.parse(parametres)
      } catch (err) {
        errors.parametres = 'Le JSON est invalide'
      }
    }
  }

  return errors
}

export default validate
