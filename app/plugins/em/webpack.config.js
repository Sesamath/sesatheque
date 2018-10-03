const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = () => ({
  entries: {},
  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, 'public', 'images', '*.gif'),
      to: 'plugins/em/images',
      flatten: true
    }])
  ],
  rules: []
})
