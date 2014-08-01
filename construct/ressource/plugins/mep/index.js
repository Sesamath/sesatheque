/**
 * Plugin mep
 */

function sendPageData(ctx, data, next) {

}

module.exports = {
  /**
   * Fonction facultative qui peut s'intercaler entre le contrôleur et la vue
   */
  display : sendPageData,
  // le nom de la fct js à appeler dans le dom pour produire le résultat à sauvegarder
  saveResult : 'saveResult'
}