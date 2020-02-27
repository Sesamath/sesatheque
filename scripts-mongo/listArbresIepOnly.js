// script à utiliser pour lister tous les xml sources
// ./scripts/mongoApp -f scripts-mongo/listJ3pSections.js -q > j3p.list
// pour compter par section faire ensuite
// awk '{print $1}' < j3p.list |sort|uniq -c
// ou bien
// awk '{print $1}' < j3p.list |sort|uniq -c|sed -e 's/^ *//; s/ /\t/'|sort -nr -k1

/* global print fr */
/**
 * Retourne true si y'a au moins un enfant de type iep (récursif)
 * @private
 * @param {Ressource} arbre Arbre
 * @return {boolean}
 */
function hasIepChild (arbre) {
  if (arbre.type !== 'arbre') return false
  if (!arbre.enfants || !arbre.enfants.length) return false
  return arbre.enfants.some(e => e.type === 'iep' || (e.type === 'arbre' && hasIepChild(e)))
}

/**
 * Retourne false si y'a un enfant ni iep ni arbre (récursif)
 * (retourne donc true pour les arbre d'arbres sans autre type de ressource)
 * @param {Ressource} arbre
 * @return {boolean}
 */
function allChildrenAreIepOrArbre (arbre) {
  if (arbre.type === 'iep') return true
  if (arbre.type === 'arbre') {
    if (!arbre.enfants || !arbre.enfants.length) return true
    return arbre.enfants.every(allChildrenAreIepOrArbre)
  }
  return false
}

fr({'_data.type': 'arbre'}).forEach(r => allChildrenAreIepOrArbre(r._data) && hasIepChild(r._data) && print(r._id, r._data.titre))
