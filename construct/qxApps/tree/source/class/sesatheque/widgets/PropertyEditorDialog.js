/**
 * Boite d'ajout de classes
 */
qx.Class.define("sesatheque.widgets.PropertyEditorDialog", {
  extend: labomep.widgets.Dialog,
  construct: function (title, data) {
    this.base(arguments, title);

    this.addListener('keypress', function(e) {
      if (this.validateButton && e.getKeyIdentifier()=='Enter') {
       this.controller.updateModel();
      }
    }, this)

    this.propertyEditor = new labomep.widgets.PropertyEditor(function(validate) {
      if (!validate) {
        this.close();
      } else {
        this.callback(validate);
      }
    }, this);
    this.propertyEditor.load(data);
    this.cancelButton =this.propertyEditor.cancelButton;
    this.validateButton =this.propertyEditor.validateButton ;
    this.add(this.propertyEditor);
    this.addListener("appear", function() {
      for(var name in this.propertyEditor.fields) {
        this.propertyEditor.fields[name].focus();
        break;
      }
    }, this);

  },

  members: {
    execute: function(callback) {
      this.callback = callback;
      this.open();
    },

    error: function(error) {
      this.propertyEditor.error(error);
    },

    onValidate: function () {
      if (this.invalid()) return;
      this.validate(this.model);
      this.close();
    }
  }
});
