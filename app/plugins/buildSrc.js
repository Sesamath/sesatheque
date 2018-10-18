const fs = require('fs')
const {plugins, external} = require('./plugins')

const packageContent = {
  license: 'UNLICENSED',
  dependencies: external
}

fs.writeFileSync('./package.json', JSON.stringify(packageContent, null, 2))

const getImports = (suffix) => {
  return plugins.map((plugin, index) => `import * as plugin${index} from '${plugin}/${suffix}'\n`).join('') + '\n' +
  `const plugins = [${plugins.map((plugin, index) => `plugin${index}`).join(', ')}]`
}

const displays =
`${plugins.map((plugin, index) => `import type${index} from '${plugin}/type'`).join('\n')}

const displays = {}

${plugins.map((plugin, index) => `displays[type${index}] = () => import('${plugin}/display')`).join('\n')}

export default displays
`

const editors =
`${getImports('editor')}

const editors = {}

plugins.forEach(({type, ...others}) => {
  editors[type] = others
})

export default editors
`

const icons =
`${getImports('icon')}

const icons = {}

plugins.forEach(({type, icon}) => {
  icons[type] = icon
})

export default icons
`

fs.writeFileSync('./displays.js', displays)
fs.writeFileSync('./editors.js', editors)
fs.writeFileSync('./icons.js', icons)
