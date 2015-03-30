qx.Class.define('sesatheque.common.ArbreEntityInfo', {
  extend : sesatheque.common.EntityInfo,
  construct: function(data) {
    this.base(arguments, data);
    this.setIcon('sesatheque/icons/16/android-folder.png');
    this.setCaption(this.data.titre);
  },
  members: {
    mayHaveChildren: function() { return true; }
  }
});


