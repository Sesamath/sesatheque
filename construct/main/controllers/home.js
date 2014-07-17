'use strict';

/**
 * Le controleur de la home
 */
var controller = lassi.Controller();

controller
    .respond('html')
    .Action('/', 'home') // on lui donne un nom pour la retrouver dans
    // .renderWith('home')
    .do(function (next) {
      next(null, {
        title  : "Bienvenue dans la bibliothèque Sésamath",
        content: "On verra plus tard pour raconter notre vie <strong>ici</strong>."
      });
    })

module.exports = controller;
