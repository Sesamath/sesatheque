"use strict";

var cacheTTL = 3600


lassi.Entity('Groupe', {
    /**
     * Définition de l'entity Groupe
     * @constructor
     * @extends EntityInstance
     */
  construct: function() {
    /**
     * Id
     * @type {Number}
     */
    this.id = 0;
    /**
     * Nom
     * @type {string}
     */
    this.nom = '';
    /**
     * Visible dans la liste générale des groupes, tout le monde peut rentrer ou sortir à sa guise
     * @type {boolean}
     */
    this.open = false
  },
  configure: function() {
    this
    .on('beforeStore', function(next) {
      log.dev('beforeStore groupe ' +this.nom)
      next()
    })
    .on('afterStore', function(next) {
      // on met en cache
      lassi.cache.set('groupe_' +this.id, this, cacheTTL)
      lassi.cache.set('groupeNom_' +this.nom, this, cacheTTL)
      // et on passe au suivant sans se préoccuper du retour
      next()
    })
    .defineIndex('id', 'integer')
    .defineIndex('nom', 'string')
    .defineIndex('open', 'boolean')
  }
});

