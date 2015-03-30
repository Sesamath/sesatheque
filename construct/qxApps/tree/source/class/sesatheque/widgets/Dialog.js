/**
 * Dialogue basic que de gestion des formulaires.
 */
qx.Class.define("sesatheque.widgets.Dialog", {
  extend: qx.ui.window.Window,

  /**
   * Constructeur
   * @param title {String} Titre du formulaire.
   */
  construct: function(title) {
    this.base(arguments, title);

    // Layout
    this.set({
      layout:new qx.ui.layout.VBox(),
      modal:true,
      alwaysOnTop:true,
      movable: true,
      allowMaximize: false,
      allowMinimize: false,
      resizable: false,
      minWidth: 250
    });

    this.addListener("appear", function() {
      this.center();
      this.focus();
    }, this);

    this.addListener("resize", this.center, this);

    this.addListener('keypress', function(e) {
      if (this.validateButton && e.getKeyIdentifier()=='Enter') {
       this.validateButton.focus();
       this.validateButton.execute();
      }
      if (this.cancelButton && e.getKeyIdentifier()=='Escape') {
        this.cancelButton.execute();
      }
    }, this);
    this.validateButton = this.cancelButton = undefined;
  },

  members: {
    addButton: function(label, callback, context) {
      var button = new qx.ui.form.Button(label);
      if (!this.bar) {
        this.bar = new qx.ui.container.Composite();
        var layout = new qx.ui.layout.HBox(10);
        this.bar.set({layout: layout});
        layout.set({alignX: 'right'});
        this.add(this.bar);
      }
      this.bar.add(button);
      button.addListener("execute", callback, context);
      return button;
    },

    addValidateButton: function(label, callback, context) {
      return this.validateButton = this.addButton(label, callback, context);
    },

    addCancelButton: function(label, callback, context) {
      callback = callback || this.close.bind(this);
      return this.cancelButton = this.addButton(label, callback, context);
    }

  }
});

