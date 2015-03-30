/**
 * Boite d'ajout de classes
 */
qx.Class.define("sesatheque.widgets.InputDialog", {
  extend: labomep.widgets.Dialog,
  construct: function (title, caption) {
    this.base(arguments, title);
    var content = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
    content.set({padding:[0,10,10,10]});
    this.add(content);
    content.add(new qx.ui.basic.Label(caption));
    content.add(this.field = new qx.ui.form.TextField(), {flex: 1});
    this.addListener("appear", function() { this.field.focus(); });
  },

  statics:{
    execute : function(title, caption, callback, context) {
      var dialog = new this(title, caption);
      dialog.addValidateButton('Valider', function() {
        dialog.close();
        callback = callback.bind(context);
        callback(this.field.getValue());
      }, dialog);
      dialog.addCancelButton('Annuler');
      dialog.open();
      dialog.field.focus();
    }
  }
});
