import {constantes, listes} from '../../server/ressource/config'

/**
 * La string à afficher correspondant à la restriction, pour afficher restriction : <string>
 * sur les pages de description ou de recherche
 * @param {object} ressource
 * @param {object} ressource.restriction
 * @param {object} ressource.groupes
 */
export function getRestrictionString ({restriction, groupes}) {
  let restrictionString = listes.restriction[restriction] || 'inconnue'
  if (restriction === constantes.restriction.groupe) {
    // pour la restriction groupe on ajoute les noms des groupes concernés (si on fourni groupes)
    if (groupes) {
      if (groupes.length) restrictionString += ' ' + groupes.join(', ')
      // si c'est un tableau vide on signale l'erreur
      else restrictionString = 'ERREUR : restriction à un groupe alors que la ressource n’est publiée dans aucun'
    } // sinon on a pas l'info et on dit rien (form de recherche par ex)
  }
  console.log(`restriction ${restriction} donne ${restrictionString}`)
  return restrictionString
}
