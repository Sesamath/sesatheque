/**
 * Boite d'ajout de classes
 */
qx.Class.define("sesatheque.widgets.ConfirmationDialog", {
  extend: labomep.widgets.Dialog,
  construct: function (message) {
    this.base(arguments, 'Question');
    var content = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
    this.add(content);
    content.add(new qx.ui.basic.Label(message));
  },

  statics:{
    execute : function(caption, callback, context) {
      var dialog = new labomep.widgets.ConfirmationDialog(caption);
      dialog.addValidateButton('Oui', function() {
        dialog.close();
        callback = callback.bind(context);
        callback();
      });
      dialog.addCancelButton('Non');
      dialog.open();
    }
  }

});
