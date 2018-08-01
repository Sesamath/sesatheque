// fonction qui permet l'ajout d'une baseUrl
// devant la route. Pas utile si les routes
// sont uniquement utilisées dans le cadre
// du front react mais pourrait servir dans
// sesatheque-client

const addPrefix = route => (params, baseUrl) => {
  if (baseUrl !== undefined) {
    return route(params, `${baseUrl}api`)
  }

  return route(params, '/api')
}

// Routes de l'api utilisées dans le
// front react:

const ressourceList = ({search}, prefix) => `${prefix}/liste?${search}`

export const ressourceListUrl = addPrefix(ressourceList)

const personneByOid = ({oid}, prefix) => `${prefix}/personne/byOid/${oid}`

export const personneByOidUrl = addPrefix(personneByOid)

const groupesOuverts = (_, prefix) => `${prefix}/groupes/ouverts`

export const groupesOuvertsUrl = addPrefix(groupesOuverts)

const groupesPublics = (_, prefix) => `${prefix}/groupes/publics`

export const groupesPublicsUrl = addPrefix(groupesPublics)

const currentPersonne = (_, prefix) => `${prefix}/personne/current`

export const currentPersonneUrl = addPrefix(currentPersonne)

const ressourceClone = ({oid}, prefix) => `${prefix}/clone/${oid}`

export const ressourceCloneUrl = addPrefix(ressourceClone)

const ressource = ({oid, format}, prefix) => {
  const search = format ? `?format=${format}` : ''
  if (oid) {
    return `${prefix}/ressource/${oid}${search}`
  }

  return `${prefix}/ressource${search}`
}

export const ressourceUrl = addPrefix(ressource)

const ressourceCreateAlias = ({baseId, oid}, prefix) => `${prefix}/createAlias/${baseId}/${oid}`

export const ressourceCreateAliasUrl = addPrefix(ressourceCreateAlias)

const ressourceForkAlias = ({oid}, prefix) => `${prefix}/forkAlias/${oid}`

export const ressourceForkAliasUrl = addPrefix(ressourceForkAlias)

const currentPersonneGroupes = (_, prefix) => `${prefix}/groupes/perso`

export const currentPersonneGroupesUrl = addPrefix(currentPersonneGroupes)

const saveGroupe = (_, prefix) => `${prefix}/groupe`

export const saveGroupeUrl = addPrefix(saveGroupe)

const groupe = ({nom}, prefix) => `${prefix}/groupe/${encodeURIComponent(nom)}`

export const groupeUrl = addPrefix(groupe)

const groupeJoin = ({nom}, prefix) => `${prefix}/groupe/rejoindre/${encodeURIComponent(nom)}`

export const groupeJoinUrl = addPrefix(groupeJoin)

const groupeFollow = ({nom}, prefix) => `${prefix}/groupe/suivre/${encodeURIComponent(nom)}`

export const groupeFollowUrl = addPrefix(groupeFollow)

const groupeLeave = ({nom}, prefix) => `${prefix}/groupe/quitter/${encodeURIComponent(nom)}`

export const groupeLeaveUrl = addPrefix(groupeLeave)

const groupeIgnore = ({nom}, prefix) => `${prefix}/groupe/ignorer/${encodeURIComponent(nom)}`

export const groupeIgnoreUrl = addPrefix(groupeIgnore)
