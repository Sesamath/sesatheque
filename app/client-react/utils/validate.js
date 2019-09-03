import {isEmpty} from 'lodash'
import sjt from 'sesajstools'
const { hasProp } = sjt

const requiredText = 'Ce champ est obligatoire'

const validate = ({
  requiredFields = [],
  jsonFields = []
}) => values => {
  const errors = {}
  requiredFields.forEach(key => {
    if (isEmpty(values[key])) {
      errors[key] = requiredText
    }
  })

  jsonFields.forEach(key => {
    if (hasProp(values, key)) {
      const value = values[key]
      if (typeof value === 'string') {
        try {
          JSON.parse(value)
        } catch (err) {
          errors[key] = 'Le JSON est invalide'
        }
      }
    }
  })

  return errors
}

export default validate
