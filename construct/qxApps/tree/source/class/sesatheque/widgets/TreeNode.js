qx.Class.define("sesatheque.widgets.TreeNode", {
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,

  /**
   * Constructeur
   */
  construct : function(caption, icon, mayHaveChildren, data) {
    this.base(arguments);
    this.leaf = true;
    if (!caption && data) {
      data.info.bind('caption', this, 'caption');
    } else {
      this.setCaption(caption?caption:'root');
    }
    if (!caption && data) {
      data.info.bind('icon', this, 'icon');
    } else {
      this.setIcon(icon);
    }
    this.data = data;
    this.leaf = false;
    this.setChildren(new qx.data.Array());
    if (mayHaveChildren) {
      this.getChildren().push(this.loadingPlaceHolder = qx.data.marshal.Json.createModel({
        caption: 'loading...',
        icon: 'loading',
        childen: []
      }, true))
    }
  },


  //////////////////////////////////////////////////////////////////////
  // Propriétés
  //////////////////////////////////////////////////////////////////////
  properties : {
    /** L'icone associée à la feuille.  */
    icon : {
      check    : "String",
      event : "changeIcon",
      nullable: true
    },

    /** Le texte de la feuille. */
    caption : {
      check    : "String",
      event : "changeCaption"
    },

    /** Noeuds enfants. */
    children : {
      check : "qx.data.Array",
      event : "changeChildren"
    }

  },


  //////////////////////////////////////////////////////////////////////
  // Membres
  //////////////////////////////////////////////////////////////////////
  members : {
    getData : function() {
      return this.data;
    },

    instanceOf: function(classe) {
      return this.data.info instanceof classe;
    },

    addChildren: function(caption, icon, mayHaveChildren, data) {
      if (typeof caption === 'object') {
        data=caption;
        if (typeof data.info.caption !== "function") {
          caption = undefined;
          icon = undefined;
        } else {
          caption = data.info.caption();
          icon = data.info.icon();
        }
        mayHaveChildren = data.info.mayHaveChildren();
      }
      var node = new sesatheque.widgets.TreeNode(caption, icon, mayHaveChildren, data);
      this.clean();
      this.getChildren().push(node);
      node.parentNode = this;
      return node;
    },

    clean: function() {
      if (this.loadingPlaceHolder) {
        this.getChildren().pop();
        delete this.loadingPlaceHolder;
      }
    },

    removeChild: function(child) {
      this.getChildren().remove(child);
    },

    remove: function() {
      this.parentNode.removeChild(this);
    },

    nbChildren: function() {
      return this.getChildren().getLength();
    },

    sort: function(a,b) {
      switch (a.data.entityName) {
        case 'sequence':
          return a.data.nom == b.data.nom ?  0 : (a.data.nom > b.data.nom ? 1 : -1);
        case 'classe':
          return a.data.nom == b.data.nom ?  0 : (a.data.nom > b.data.nom ? 1 : -1);
        case 'niveau':
          return b.data.getId() - a.data.getId();
        case 'eleve':
          return a.data.nom == b.data.nom ?  0 : (a.data.nom > b.data.nom ? 1 : -1);
        default:
          return 0;
      }
    },

    find: function(criterias) {
      var models = this.getChildren().toArray();
      var node, valid, value;
      for(var i in models) {
        node = models[i];
        if (!node.data) continue;
        valid = true;
        for(var key in criterias) {
          value = criterias[key];
          if (typeof node.data[key] == 'undefined') key = '$$user_'+key;
          if (node.data[key]!=value) {
            valid = false;
            break;
          }
        }
        if (valid) return node;
      }
    },
    need : function(item, criterias, newCallback) {
      var node = this.find(criterias);
      if (!node) {
        node = this.addChildren(item)
        if (newCallback) newCallback(node);
      }
      return node;
    },
    commit: function() {
      this._applyEventPropagation(this.getChildren(), 'Z', 'children');
    }
  }
});



