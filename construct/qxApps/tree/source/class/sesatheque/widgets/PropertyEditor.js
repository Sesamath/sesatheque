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

qx.Class.define("sesatheque.widgets.PropertyEditor", {
  extend : qx.ui.container.Composite,

  construct : function(modal, context) {
    this.base(arguments, new qx.ui.layout.VBox());
    this.set({
      maxWidth: 350,
      minWidth: 350,
      padding: 10
    });

    this.modal = modal || false;
    if (context) this.modal = this.modal.bind(context);

    if (!modal) {
      var label1 = new qx.ui.basic.Label("Clickez sur un élément de gauche pour modifier ses propriétés.");
      label1.setRich(true);
      label1.setDecorator('tooltip');
      label1.setPadding(3);
      this.add(label1);
    }

    this.fields = {};
  },

  members : {
    addButton: function(label, callback, context) {
      var button = new qx.ui.form.Button(label);
      this.form.addButton(button);
      button.addListener("execute", callback, context);
      return button;
    },

    error: function(error) {
      for(var key in this.fields) {
        this.fields[key].resetInvalidMessage();
        this.fields[key].resetValid();
      }
      this.fields[error.field].set({invalidMessage: error.message, valid: false});
      console.log(error);
    },

    load: function(data) {
      this.fields = {};
      if (this.form) this.form.dispose();
      if (this.renderer) this.renderer.destroy();
      if (this.controller) this.controller.dispose();
      this.form = new qx.ui.form.Form();
      var classe = data.info.constructor;
      if (!data.info.getProperties) return;
      var properties = data.info.getProperties();
      var field;
      var validator;
      for (var propertyName in properties) {
        var property = properties[propertyName];
        if (!property.widget) continue;
        field = undefined;
        validator = null;
        if (!property.widget.type) {
          switch(property.type) {
            case 'String':
              property.widget.type = 'TextField';
              break;
            case 'Boolean':
              property.widget.type = 'CheckBox';
              break;
            case 'Number':
              property.widget.type = 'Spinner';
              break;
            case 'Date':
              property.widget.type = 'DateField';
              break;
          }
        }

        var widgetType = property.widget.type;
        if (widgetType == 'TimeBox') {
          console.log('here');
          property.widget.items = {};
          for (var i=0; i < 24*60/15; i++) {
            var minutes = i*15;
            var hours = Math.floor(minutes / 60);
            if (hours < 10) hours = '0'+hours;
            var minutes = Math.floor(minutes % 60);
            if (minutes < 10) minutes = '0'+minutes;
            property.widget.items[i] = hours+':'+minutes;
          }
          widgetType = 'SelectBox';
        }

        var binding = 'value';
        switch(widgetType) {
          case 'TextArea':
            field = new qx.ui.form.TextArea(data.info.get(propertyName));
            field.set({liveUpdate: true});
            break;

          case 'TextField':
            field = new qx.ui.form.TextField(data.info.get(propertyName));
            field.set({liveUpdate: true});
            break;

          case 'PasswordField':
            field = new qx.ui.form.PasswordField(data.info.get(propertyName));
            field.set({liveUpdate: true});
            break;

          case 'CheckBox':
            field = new qx.ui.form.CheckBox();
            field.setValue(data.info.get(propertyName));
            break;

          case 'Spinner':
            field = new qx.ui.form.Spinner();
            field.setValue(data.info.get(propertyName));
            if (property.widget.minimum) field.setMinimum(property.widget.minimum);
            if (property.widget.maximum) field.setMaximum(property.widget.maximum);
            break;

          case 'Slider':
            field = new qx.ui.form.Slider();
            field.setValue(data.info.get(propertyName));
            if (property.widget.minimum) field.setMinimum(property.widget.minimum);
            if (property.widget.maximum) field.setMaximum(property.widget.maximum);
            break;

          case 'DateField':
            field = new qx.ui.form.DateField();
            field.setValue(data.info.get(propertyName));
            break;

          case 'SelectBox':
            this.box = field = new qx.ui.form.SelectBox();
            var selected = data.info.get(propertyName);
            var items = property.widget.items;
            if (typeof items === 'function') {
              items = items();
            }
            for (var i in items) {
              var item = new qx.ui.form.ListItem(items[i], null, i);
              item.index = parseInt(i);
              field.add(item);
              if (item.index==selected) {
                field.setSelection([item]);
              }
            }
            binding=undefined;
            field.addListener('changeSelection', function(field, propertyName, data) {
              return function() {
                var selection = field.getSelection();
                var index = selection[0].index;
                data.info.set(propertyName, index);
              } }(field, propertyName, data));
            break;

        }
        if (field) {
          if (property.widget.help) {
            var tooltip = new qx.ui.tooltip.ToolTip(property.widget.help, "labomep/icons/22/help.png");
            tooltip.setWidth(200);
            tooltip.setRich(true);
            tooltip.setShowTimeout(1000);
            field.setToolTip(tooltip);
          }
          if (binding) field.bind(binding, data.info, propertyName);
          this.form.add(field, property.widget.label, validator, propertyName);
          this.fields[propertyName] = field;
        }
      }

      if (this.modal) {
        this.cancelButton = this.addButton('annuler', function() {
          this.modal(false);
        }, this);
        this.validateButton = this.addButton('valider', function() {
          this.modal(true);
        }, this);
      }
      this.controller = new qx.data.controller.Form(null, this.form);
      this.removeAll();
      this.add(this.renderer = new labomep.widgets.FormRendererSingle(this.form));
    }
  }
});
