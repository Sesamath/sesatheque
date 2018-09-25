const path = require('path')

module.exports = {
  // attention au nom de l'entry, qui conditionne le nom de la fonction ajoutée en global dans le dom
  // (préfixe "st" ajouté par webpack) qui est utilisée par editgraphe.html
  'editGraphe': path.resolve(__dirname, 'editGraphe.js'),
  // et celui là utilisé par sesatheque-client:src/resultatFormatters/j3p.js
  'showParcours': path.resolve(__dirname, 'showParcours.js')
}
