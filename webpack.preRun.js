/* Ce fichier sert à copier dans le dossier de build les deux preLoader (client et client-react)
 * en y ajoutant baseUrl et timestamp, avec éventuelle minification.
 * Il vide le dossier de build au préalable
 */
const fs = require('fs')
const path = require('path')

const Terser = require('terser')

function rmAll (dir, parentToo = true) {
  fs.readdirSync(dir).forEach(entry => {
    const absPath = path.resolve(dir, entry)
    if (fs.lstatSync(absPath).isDirectory()) return rmAll(absPath)
    fs.unlinkSync(absPath)
  })
  if (parentToo) fs.rmdirSync(dir)
}

/**
 * @param {Object} options
 * @param {string} options.baseUrl
 * @param {string} options.buildDir
 * @param {Object} options.files Les fichiers à copier
 * @param {boolean} [options.isProd=true]
 */
module.exports = function preRun ({baseUrl, buildDir, files}) {
  // on vide le dossier de build, on fait ça à la main ici (clean-webpack-plugin semble s'arrêter à webpack3
  // et de toute façon on va copier iepLoad dans build ici, donc avant que webpack ne digère la conf => il ne
  // faut pas que ce soit lui qui vide le dossier)
  try {
    if (fs.existsSync(buildDir)) {
      rmAll(buildDir, false)
      console.log(buildDir, 'vidé')
    } else {
      fs.mkdirSync(buildDir)
      console.log(buildDir, 'créé')
    }
  } catch (error) {
    console.error(error)
    console.log('La suppression des anciens fichiers de build a planté mais on continue la compilation')
  }
  // on copie le preLoad en y ajoutant timestamp et baseUrl dans son source
  Object.entries(files).forEach(([name, srcFile]) => {
    const srcContent = fs.readFileSync(srcFile, { encoding: 'utf8' }) // faut préciser encoding pour récupérer une string
    const dstContent = srcContent
      .replace(/var timestamp = '[^']*'/, `var timestamp = '${Math.round(Date.now() / 1000)}'`)
      .replace(/var baseUrl = '[^']*'/, `var baseUrl = '${baseUrl}'`)
    const dstName = name + '.js'
    const dstFile = path.resolve(buildDir, dstName)
    // minify tout le temps, cf https://github.com/terser/terser#api-reference
    const result = Terser.minify(dstContent, {
      output: {
        comments: false
      },
      // cf https://github.com/terser/terser#source-map-options
      sourceMap: {
        filename: dstName,
        url: dstName + '.map'
      }
    })
    fs.writeFileSync(dstFile, result.code)
    fs.writeFileSync(dstFile + '.map', result.map)
    console.log(`${dstName} copié dans build (avec timestamp et baseUrl substitués)`)
  })
}
