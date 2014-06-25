'use strict';

/**
 * Le controleur de la home
 */
var homeController = lassi.Controller('/');

homeController.baseAction()
  .layout('page')
  .respond('html');

homeController.action()
  .registeredAs('home')
  .view('home')
  .do(function () {
    // On envoie les données à la vue
    /* (idem qu'ajouter ces propriétés à response.data et ne rien retourner) */
    return {
      title  : "Bienvenue dans la bibliothèque Sésamath",
      content: "On verra plus tard pour raconter notre vie <strong>ici</strong>."
    }
  })

module.exports = homeController;
