/**
 * Ce composant est avant tout un helper
 * qui permet d'ajouter plus facilement
 * des éléments.
 */
qx.Class.define('labomep.widgets.PopupMenu', {
  extend : qx.ui.menu.Menu,

  /**
   * Constucteur
   */
  construct: function() {
    this.base(arguments);
    this.buttons = {};
  },
  statics: {
    /**
     * On attache le menu à un composant
     */
    attach: function(component) {
      var menu = new labomep.widgets.PopupMenu();
      component.setContextMenu(menu);
      return menu;
    }
  },

  members: {
    /**
     * On surcharge la méthode add pour en changer les arguments
     * @param name string le nom du composant
     * @param caption string le libellé
     * @param icon string un icone en 16x16
     * @param listener function le listener
     * @return qx.ui.menu.Button Le bouton ajouté
     */
    add: function(name, caption, icon, listener, context) {
      var button = this.buttons[name] = new qx.ui.menu.Button(caption, 'labomep/icons/16/'+icon+'.png');
      button.set({enabled: false});
      button.addListener('execute', listener, context);
      this.base(arguments, button);
      return button;
    },

    setEnabled: function(items, value) {
      for(var i in items) {
        this.buttons[items[i]].set({enabled: value});
      }
    }
  }

});

