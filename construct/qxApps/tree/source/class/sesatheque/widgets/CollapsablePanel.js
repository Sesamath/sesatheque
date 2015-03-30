/*
 * @preserve This file is part of "sesamath-labomep".
 *    Copyright 2009-2014, arNuméral
 *    Author : Yoran Brault
 *    eMail  : yoran.brault@arnumeral.fr
 *    Site   : http://arnumeral.fr
 *
 * "sesamath-labomep" is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * "sesamath-labomep" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with "sesamath-labomep"; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */

qx.Class.define("sesatheque.widgets.CollapsablePanel", {
  extend : qx.ui.core.Widget,
  include : [
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.core.MRemoteLayoutHandling,
    qx.ui.core.MContentPadding
  ],
  implement : [ qx.ui.form.IRadioItem ],

  construct : function(group, caption) {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    var bar = this.getChildControl("bar");
    bar.setCursor('pointer');
    var children = bar.getChildren();
    children[0].set({
      value: caption,
      appearance: 'collapsable-panel/bar/label'
    });
    this.icon = children[1];
    this.icon.setAppearance('collapsable-panel/bar/icon');
    this.initValue();
    this.setLayout(new qx.ui.layout.VBox());
    this.group = group;
    this.setGroup(group);
  },

  properties : {
    appearance : {
      refine : true,
      init   : "collapsable-panel"
    },

    value : {
      check : "Boolean",
      init  : true,
      apply : "_applyValue",
      event : "changeValue"
    },

    group : {
      check    : "qx.ui.form.RadioGroup",
      nullable : true,
      apply    : "_applyGroup"
    }
  },

  members : {
    // overridden
    _forwardStates : {
      "opened"     : true
    },

    // overridden
    _createChildControlImpl : function(id) {
      var control;

      switch(id) {
        case "bar":
          control = new qx.ui.container.Composite(new qx.ui.layout.Dock());
          control.add(new qx.ui.basic.Label('xxxxxxxxxxxxxxxxx'), {edge:'west', height:'100%'});
          control.add(new qx.ui.basic.Image("labomep/icons/22/ios7-arrow-down.png", {height:30}), {edge: 'east'});
          control.addListener("click", this.toggleValue, this);
          this._add(control, {flex : 1});
          break;

        case "container":
          control = new qx.ui.container.Composite();
          this._add(control, {flex : 1});
          break;
      }

      return control || this.base(arguments, id);
    },


    /**
     * {@link qx.ui.core.MRemoteChildrenHandling}
     */
    getChildrenContainer : function() {
      return this.getChildControl("container");
    },

    /**
     * {@link qx.ui.core.MRemoteChildrenHandling}
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("container");
    },

    _applyValue : function(value /*, old*/) {
      if (value) {
        this.addState("opened");
        this.getChildControl("container").show();
        this.icon.set({
          source: "labomep/icons/22/ios7-arrow-down.png",
          enabled: false
        });
        if (this.getLayoutParent() && this.getGroup()) {
          var p = this.getLayoutParent().getBounds().height;
          p-= 41*this.getGroup().__items.length;
          this.setHeight(p);
        }
      } else {
        this.removeState("opened");
        this.getChildControl("container").exclude();
        this.icon.set({
          source: "labomep/icons/22/ios7-arrow-right.png",
          enabled: true
        });
      }
    },

    _applyGroup : function(value, old) {
      if (old)   old.remove(this);
      if (value) value.add(this);
    },

    // overridden
    _computeSizeHint : function() {
      var hint = this.base(arguments);
      if (!this.getValue()) {
        var child = this.getChildControl("bar").getSizeHint();
        hint.maxHeight = Math.min(hint.maxWidth, child.height + this.getPaddingTop() + this.getPaddingBottom());
      }
      return hint;
    }
  }
});
