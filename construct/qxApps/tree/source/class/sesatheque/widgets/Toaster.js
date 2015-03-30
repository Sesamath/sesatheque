qx.Class.define("sesatheque.widgets.Toaster", {
  extend: qx.ui.popup.Popup,

  /**
   * Constructeur
   * @param title {String} Titre du formulaire.
   */
  construct: function() {
    this.base(arguments, new qx.ui.layout.VBox());

    // Layout
    this.set({
      backgroundColor: "#201D00",
      padding: [2, 4],
      offset : 3,
      width: 200,
      offsetBottom : 20
    });
    this.message = new qx.ui.basic.Label("Hello World");
    this.add(this.message);
  },

  members: {
    toast: function(title) {
      this.message.set({
        value: title,
        rich: true,
        textColor: '#DCDCDC'
      });
      var width = qx.bom.Viewport.getWidth();
      this.moveTo((width - 200)/2,30);
      this.show();
      var _this = this;
      setTimeout(function() {
        _this.hide();
      },10000);
    }
  }
});


