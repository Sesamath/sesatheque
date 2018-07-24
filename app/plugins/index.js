const plugins = {}

const importAll = (r) => {
  r.keys().forEach(path => {
    const {types, editor, validate} = r(path)
    const plugin = {editor, validate}
    types.forEach(type => {
      plugins[type] = plugin
    })
  })
}

importAll(require.context('.', true, /^\.\/([^/]+)\/index.js$/))

export default plugins
