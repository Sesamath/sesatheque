qx.Class.define("sesatheque.widgets.AutoCompleteField", {
  extend : qx.ui.form.TextField,
  construct: function(completeCb) {
    this.base(arguments, '');
    this.addListener("keypress", function() {
      clearTimeout(this.timer);
      this.timer = setTimeout(function() {
        this.fireDataEvent('complete');
      }.bind(this), 500);
    }, this);
  },

  members: {
    resetCompletion: function() {
      if (this.popup) {
        this.list.destroy();
        this.popup.destroy();
        this.popup = null;
      }
    },
    addCompletionItem: function(caption, data) {
      if (!this.popup) {
        this.popup = new qx.ui.popup.Popup(new qx.ui.layout.Canvas()).set({
          backgroundColor: "#FFFAD3",
          padding: 0,
          offset : 0,
          offsetBottom : 20
        });
        var bounds = this.getBounds();
        this.list = new qx.ui.form.List().set({
          backgroundColor: 'transparent',
          padding: 0,
          minWidth: bounds.width
        });
        this.list.addListener("changeSelection", function(e) {
          var selection = e.getData();
          if (!selection.length) return;
          this.fireDataEvent('completed', selection[0].data);
          this.resetCompletion();
        }, this);
        this.popup.add(this.list);
      }
      var item = new qx.ui.form.ListItem(caption);
      item.data = data;
      this.list.add(item);
    },
    showCompletion: function() {
      this.popup.placeToWidget(this);
      this.popup.show();
    }

    /*
    onComplete: function(error, result) {

      fields.structures.removeAll();
      var items = this
      for (var i in result.sequences) {
        item = new qx.ui.form.ListItem(result.sequences[i].code + ' - ' + result.sequences[i].nom);
        item.data = result.sequences[i];
        list.add(item);
      };
      //fields.structures.visibility('visible');
    }) {
function() {

      var popup = new qx.ui.popup.Popup(new qx.ui.layout.Canvas()).set({
        backgroundColor: "#FFFAD3",
        padding: 0,
        offset : 0,
        offsetBottom : 20
      });
      var list = new qx.ui.form.List()
      var bounds = fields.structure.getBounds();
      list.set({
        backgroundColor: 'transparent',
        padding: 0,
        minWidth: bounds.width
      });
      list.addListener("changeSelection", function(e) {
        var selection = e.getData();
        if (!selection.length) return;
        fields.structure.setValue(selection[0].data.code);
        fields.structures.visibility('excluded');
        popup.destroy();
      }, this);
      popup.add(list);

      fields.structures.removeAll();
      for (var i in result.sequences) {
        item = new qx.ui.form.ListItem(result.sequences[i].code + ' - ' + result.sequences[i].nom);
        item.data = result.sequences[i];
        list.add(item);
      };
      //fields.structures.visibility('visible');
      popup.placeToWidget(fields.structure);
      popup.show();
    }    }
    */
  }
});

