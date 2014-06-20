'use strict';

/**
 * Le controleur de la home
 */
module.exports.home = require('lassi').controller('/')
    .renderWith('home')
    .do(function(request, response) {
      // On envoie les données à la vue
      /* (idem qu'ajouter ces propriétés à response.data et ne rien retourner) */
      return {
        title   : "Bienvenue dans la bibliothèque Sésamath",
        content : "On verra plus tard pour raconter notre vie <strong>ici</strong>."
      }
    })
    .render()
