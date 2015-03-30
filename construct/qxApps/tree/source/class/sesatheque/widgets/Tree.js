/**
 * Composant 'arbre' utilisé un peu partout
 * dans sesatheque (partout en fait ;-)
 */
qx.Class.define("sesatheque.widgets.Tree", {
  extend : qx.ui.tree.VirtualTree,

  /**
   * Constucteur
   */
  construct: function(model) {
    this.base(arguments);

    // Assignation du modèle
    this.model = model || new sesatheque.widgets.TreeNode('Racine', null, {type: 'root', data:null});

    // Réglage des propriétés du composant
    this.set({
      draggable: true,
      droppable: true,
      labelPath: 'caption',
      iconPath: 'icon',
      childProperty: 'children',
      selectionMode: 'single',
      showTopLevelOpenCloseIcons: false,
      model: this.model,
      iconOptions: {
        converter : function(value, model) {
          if (model.getIcon()=='loading') return "resource/sesatheque/images/loading22.gif";
          return value;
        }
      },
      delegate : {
        configureItem : function(item) {
          item.set({droppable: true});
        },
        bindItem: this.bindItem.bind(this)
      }
    });

    var hoverDecorator = new qx.ui.decoration.Decorator().set({
      backgroundColor : '#E8E8E8',
      widthTop        : 1,
      styleTop        : "solid",
      colorTop        : "#D5D5D5",
      widthBottom     : 1,
      styleBottom     : "solid",
      colorBottom     : "#D5D5D5"
    });
    var dragDecoratorTop = new qx.ui.decoration.Decorator().set({
      backgroundColor : '#E8E8E8',
      widthTop        : 1,
      styleTop        : "dotted",
      colorTop        : "orange",
      widthBottom     : 1,
      styleBottom     : "solid",
      colorBottom     : "#D5D5D5"
    });
    var dragDecoratorBottom = new qx.ui.decoration.Decorator().set({
      backgroundColor : '#E8E8E8',
      widthBottom        : 1,
      styleBottom        : "dotted",
      colorBottom        : "orange",
      widthTop     : 1,
      styleTop     : "solid",
      colorTop     : "#D5D5D5"
    });

    this.addListener('mouseover', function(e) {
      var target = e.getTarget();
      if (target.classname == "qx.ui.tree.VirtualTreeItem") {
        target.setDecorator(hoverDecorator);
      }
    });
    this.addListener('mouseout', function(e) {
      var target = e.getTarget();
      if (target.classname == "qx.ui.tree.VirtualTreeItem") {
        target.setDecorator(null);
      }
    });
    var _this = this;
    this.addListener('dragstart', function(e) {
      console.log('there');
      e.addAction('move');
    });

    this.addListener('drag', function(e) {
      console.log('here');
      var target = e.getOriginalTarget();
      target.set({droppable: true});

      if (target.classname == "qx.ui.tree.VirtualTreeItem") {
        _this.dragTarget = target.getModel();
        var location = target.getContentLocation();
        var bounds = target.getBounds();
        var limit = location.top + bounds.height / 2;
        if (e.getDocumentTop() < limit) {
          target.setDecorator(dragDecoratorTop);
        } else {
          target.setDecorator(dragDecoratorBottom);
        }
      }
    });

    this.addListener('mousedown', function(event) {
      var isCtrlPressed = event.isCtrlPressed() || (qx.core.Environment.get("os.name") == "osx" && event.isMetaPressed());
      var isShiftPressed = event.isShiftPressed();
      if (!isCtrlPressed && !isShiftPressed) {
        var target = event.getTarget();
        if (typeof target.getModel === 'undefined') {
          this.getSelection().removeAll();
        } else {
          var item = target.getModel();

          var found = false;
          var selection = this.getSelection();
          for(var i=0; i < selection.getLength(); i++) {
            var equals = selection.getItem(i).toHashCode()==item.toHashCode();
            if (equals) {
              found = true;
              break;
            }
          }
          if (!found) {
            this.getSelection().removeAll();
            this.getSelection().push(item);
          }
        }
      }
    }, this);
    
  },
  members: {
    setSorted: function(state) {
      if (state) {
        this.getDelegate().sorter = function(a, b) {
          return a.sort(a,b);
        };
      } else {
        delete this.getDelegate().sorter;
      }
    },
    getDragSourceNodes: function(e) {
      var sourceSelection = e.getRelatedTarget().getSelection().toArray();
      //console.log(sourceSelection);
      ////if (sourceSelection.length === 0) {
      //var sourceSelection = [e.getDragTarget().getModel()];
      ////}
      return sourceSelection;
    },
    getSelectedNodes: function() {
      return this.getSelection().toArray();
    },
    getSelectedNode: function() {
      var items = this.getSelectedNodes();
      if (items.length) return items[0];
      return false;
    },
    getSelectedObject: function() {
      var item = this.getSelectedNode();
      if (item) return item.data;
      return false;
    },
    getDragSourceNode: function(e) {
      var nodes = this.getDragSourceNodes(e);
      if (nodes.length) return nodes[0];
      return false;
    },
    bindItem: function(controller, item, index) {
      controller.bindDefaultProperties(item, index);
    },

    clean: function() {
      this.model.clean.apply(this.model, arguments);
      this.refresh();
    },

    need: function() {
      return this.model.need.apply(this.model, arguments);
    }
  }
});

