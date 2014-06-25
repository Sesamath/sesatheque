'use strict';

/**
 * Le controleur de la home
 */
var controller = lassi.Controller();

controller.baseAction()
  .layout('page')
  .respond('html');

controller.action()
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

module.exports = controller;
