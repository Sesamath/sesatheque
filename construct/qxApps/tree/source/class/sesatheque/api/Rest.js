/**
 * Pour faire du get ajax sur la bibliotheque courante (mix de labomep.api.Bibliotheque et labomep.common.Tools)
 */
qx.Class.define("sesatheque.api.Rest", {
  extend : qx.core.Object,

  construct: function() {
    this.base(arguments);
  },
  statics: {
    xhr: function(verb, url, data, callback) {
      var xhr;
      if (typeof window.XMLHttpRequest !== 'undefined') {
        xhr = new window.XMLHttpRequest();
      } else {
        var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"]

        for (var i = 0; i < versions.length; i++) {
          try {
            xhr = new window.ActiveXObject(versions[i]);
            break;
          }
          catch(e){}
        } // end for
      }
      if (typeof xhr === 'undefined') throw new VError('Aucun XHR utilisable sur ce navigateur');
      xhr.withCredentials = true;
      xhr.open(verb, url);
      //SI j'active ceci, cela déclenche cela : http://stackoverflow.com/questions/8153832/xmlhttprequest-changes-post-to-option
      //lorsque l'on accède à Bibliothèque
      if (verb != 'GET') {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      xhr.onreadystatechange = function() {
        if (this.readyState == this.DONE) {
          if (this.status != 200) return callback(new VError('Erreur lors de la requête AJAX'));
          try {
            var json = JSON.parse(this.response);
          } catch(e) {
            return new callback(new VError(e, "Erreur lors de l'interprétation JSON"));
          }
          return callback(null, json);
        }
      }
      if (data) data = JSON.stringify(data);
      xhr.send(data);
    },

    get: function(id, origine, callback) {
      var url = 'http://localhost:3001/api/ressource/'+(origine ? origine +'/' : '') +id;
      console.log("on appelle url");
      this.xhr('GET', url, undefined, callback);
    },
    post: function(ressource, callback) {
      var url = '/api/ressource/';
      if (ressource.id > 0) url += ressource.id;
      else url += 'add';
      this.xhr('POST', url, ressource, callback);
    }
  }

});

