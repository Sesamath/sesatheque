const path = require('path')

module.exports = {
  // attention au nom de l'entry, qui conditionne le nom de la fonction ajoutée en global dans le dom
  // (préfixe "st" ajouté par webpack) qui est utilisée par mathgraph-editor.html
  'pluginMathgraphEditor': path.resolve(__dirname, 'public', 'mathgraph-editor.js')
}
