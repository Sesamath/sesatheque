//var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './construct/ressource/public/init.js',
    output: {
        path: __dirname +"/construct/ressource/public/",
        filename: 'wpdisplay.js'
    },
    /* module: {
        loaders: [
            {test: path.join(__dirname, 'es6'), loader: 'babel-loader'}
        ]
    }, */
    plugins: [
        // Avoid publishing files when compilation failed
        new webpack.NoErrorsPlugin()
    ],
    stats: {
        // Nice colored output
        colors: true
    },
    // Create Sourcemaps for the bundle
    devtool: 'source-map'

};