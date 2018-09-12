const fs = require('fs')
const {plugins: {internal, external}} = require('../server/config')

const lists = [
  ...internal.map(plugin => `./${plugin}`),
  ...Object.keys(external)
]

const packageContent = {
  license: 'UNLICENSED',
  dependencies: external,
  plugins: lists
}

fs.writeFileSync('./package.json', JSON.stringify(packageContent, null, 2))
