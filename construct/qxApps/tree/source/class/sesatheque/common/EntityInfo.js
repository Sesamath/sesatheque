var _ = require('lodash');

qx.Class.define('sesatheque.common.EntityInfo', {
  extend : qx.core.Object,
  construct: function(data) {
    this.data = data;
  },
  properties: {
    caption: {
      init: 'sans-titre',
      event: 'changeCaption'
    },
    icon: {
      init: 'sesatheque/icons/16/alerte.png',
      event: 'changeIcon'
    }

  },
  members: {
    mayHaveChildren: function() { return false; }
  },
  statics: {

    __firstUpper: function (text) {
      return text.charAt(0).toUpperCase()+text.substr(1);
    },

    build: function(classDesc, properties) {
      classDesc.init = classDesc.init || function() {};
      var desc = {
        extend : sesatheque.common.EntityInfo,
        construct: function(data) {
          this.base(arguments, data);
          this.setIcon(classDesc.icon);
          for(name in properties) {
            if (!data.hasOwnProperty(name)) {
              data[name] = properties[name].defaults;
            }
            if (!properties[name].hidden) {
              this['init'+sesatheque.common.EntityInfo.__firstUpper(name)](data[name]);
            }
          }
          this.init(data);
        },
        statics: {
          create: function(data) {
            data = data || {};
            var result = {};
            for(var name in properties) {
              result[name] = properties[name].defaults;
            }
            for(var name in data) {
              result[name] = data[name];
            }
            Object.defineProperty(result, 'info', {value: new sesatheque.common[classDesc.name](result)});
            return result;
          },
          check: function(data) {
            return data.info.constructor === sesatheque.common[classDesc.name];
          }

        },
        members: {
          clone: function() {
            return this.constructor.create(this.data);
          },
          apply: function(values) {
            for(var name in values) {
              if (this.hasProperty(name)) {
                console.log('>>>', name, '"',values[name],'"');
                this.set(name, values[name]);
              } else {
                console.log('>>)', name, '"',values[name],'"');
                this.data[name] = values[name];
              }
            }
          },
          hasProperty: function(name) {
            return properties.hasOwnProperty(name);
          },
          getProperties: function() {
            return properties;
          },
          init: classDesc.init
        },
        properties: {}
      };
      _.each(properties, function(p, n) {
        if (!p.hidden) {
          desc.properties[n] = {
            check: p.type || 'String',
            deferredInit: true,
            nullable: p.nullable || false,
            event: 'change'+sesatheque.common.EntityInfo.__firstUpper(n),
            apply: 'apply'+sesatheque.common.EntityInfo.__firstUpper(n)
          };
          desc.members['apply'+sesatheque.common.EntityInfo.__firstUpper(n)] = p.apply || new Function('value', 'this.data.'+n+' = value');
        }
      });
      return desc;
    }
  }
});

