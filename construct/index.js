/**
 * Définition de l'application
 */
'use strict';

// Récupération du module lassi (pas encore en var globale car c'est son 1er appel)
require('lassi');


// underscore que l'on va mettre en global
var underscore_ = require('underscore')._;

// Construction de l'application
lassi.Application().boot(function () {
  console.log("Boot de l'application Bibliothèque");
  // on ajoute _ en global
  if (GLOBAL._) {
    if (GLOBAL._ !== underscore_) {
      console.log("_ existe en GLOBAL mais ce n'est pas underscore._");
    }
  }
  GLOBAL._ = underscore_;
});
