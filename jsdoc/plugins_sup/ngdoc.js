exports.defineTags = function(dictionary) {
  dictionary.defineTag('entity', {
    mustHaveValue: true,
    onTagged : function(doclet, tag) {
      doclet.addTag('kind', 'class');
      doclet.addTag('name', tag.value);
      doclet.exkind='entity';
    }
  });
  dictionary.defineTag('service', {
    mustHaveValue: true,
    onTagged : function(doclet, tag) {
      doclet.addTag('kind', 'class');
      doclet.addTag('name', tag.value);
      doclet.exkind='service';
    }
  });
  dictionary.defineTag('controller', {
    mustHaveValue: true,
    onTagged : function(doclet, tag) {
      doclet.addTag('kind', 'class');
      doclet.addTag('name', tag.value);
      doclet.exkind='controller';
    }
  });
  dictionary.defineTag('route', {
    mustHaveValue: true,
    onTagged : function(doclet, tag) {
      doclet.addTag('kind', 'function');
      doclet.addTag('name', tag.value);
      doclet.api = doclet.api || {};
      doclet.api.path='route'
    }
  });
};

var currentNamespace;
exports.handlers = {
  newDoclet: function(e){
    if(e.doclet.exkind) {
      currentNamespace = {
        parent: e.doclet.name,
        file: e.doclet.meta.path
      }
    } else {
      if (e.doclet.undocumented) return;
      if (!currentNamespace) return;
      if (currentNamespace.file!==e.doclet.meta.path) return;
      e.doclet.memberof=currentNamespace.parent;
    }
  }
};

