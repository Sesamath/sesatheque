/**
 * Ce script prend un fichier json en argument et le poste vers l'api
 * @deprecated Ces urls ne sont plus gérée par la bibli
 * --arbre fichier.json envoie vers /api/arbre
 * --arbreFull fichier.json envoie vers /api/arbre?populate=1 (ira chercher les enfants pour remplacer les références)
 * --ressource fichier.json envoie vers /api/ressource
 */
'use strict'

const path = require('path')
const request = require('request')
const moment = require('moment')
const fs = require('fs')

/**
 * Écrit en console avec le moment en préfixe
 * @param msg
 * @param objToDump
 */
function log (msg, objToDump) {
  const prefix = '[' + moment().format('HH:mm:ss.SSS') + '] '
  console.log(prefix + msg)
  if (objToDump) console.log(objToDump)
}

/**
 * Ajoute une ressource dans la bibli en appelant l'api en http
 * @param url
 * @param obj
 */
function postJson (url, obj) {
  const options = {
    url: url,
    headers: {
      'X-ApiToken': apiTokenEncoded
    },
    json: true,
    body: obj
  }
  request.post(options, function (error, response, body) {
    if (error) log('Erreur ' + error)
    else log('La réponse ', body)
    process.exit()
  })
}

function usage (exitCode, message) {
  log("Il faut appeler ce scrit avec --arbre ou --arbreFull ou --ressource ou --merge, suivi d'un fichier json (relatif au script)")
  if (message) log(message)
  process.exit(exitCode || 0)
}

/**
 * Main
 */

const argv = process.argv.slice(2)
if (argv.length < 2) usage(1)
let uri
switch (argv[0]) {
  case '--arbre': uri = 'api/arbre'; break
  case '--arbreFull': uri = 'api/arbre?populate=1'; break
  case '--ressource': uri = 'api/ressource'; break
  case '--merge': uri = 'api/ressource?merge=1'; break
  default : usage(1)
}

// conf de l'appli
const settings = require('../_private/config')
if (!settings.application.baseUrl) throw new Error('BaseUrl manquante en config')
if (!settings.apiTokens || !settings.apiTokens.length) throw new Error('apiTokens manquants en config')
const baseUrl = settings.application.baseUrl
const apiToken = settings.apiTokens[0]
const apiTokenEncoded = encodeURIComponent(apiToken)
const jsonFile = path.join(__dirname, argv[1])
if (!fs.existsSync(jsonFile)) usage(1, `${jsonFile} n’existe pas`)

const url = baseUrl + uri
log('post de ' + jsonFile + ' vers ' + url)
fs.readFile(jsonFile, function (error, jsonString) {
  try {
    if (error) throw error
    const objToPost = JSON.parse(jsonString)
    postJson(url, objToPost)
  } catch (error) {
    usage(1, jsonFile + ' ne contient pas de json valide : ' + error.toString())
  }
})
