'use strict';

/**
 * Le controleur de la home
 */
var controller = lassi.Controller();

controller
    .respond('html')
    .Action('/', 'home')
    .do(function (next) {
      next(null, {
        title  : "Bienvenue dans la bibliothèque Sésamath",
        content: "Ce site est encore un prototype expérimental."
      });
    })

module.exports = controller;
