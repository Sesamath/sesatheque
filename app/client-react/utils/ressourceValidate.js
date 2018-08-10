import validate from './validate'

const requiredFields = ['titre', 'type', 'categories', 'niveaux']

const ressourceValidate = validate({
  requiredFields,
  jsonFields: ['parametres']
})

export default ressourceValidate
