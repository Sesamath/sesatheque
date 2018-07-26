const plugins = {}
const displays = {}
const icons = {}

const importAll = (r) => {
  r.keys().forEach(path => {
    const {type, editor, validate, icon, display} = r(path)
    plugins[type] = {editor, validate}
    displays[type] = display
    icons[type] = icon
  })
}

importAll(require.context('.', true, /^\.\/([^/]+)\/index.js$/))

export default plugins
export {displays, icons}
