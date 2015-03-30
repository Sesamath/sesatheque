/**
 * Pour faire du get ajax sur la bibliotheque courante (mix de labomep.api.Bibliotheque et labomep.common.Tools)
 */
qx.Class.define("sesatheque.api.Bibliotheque", {
  extend : qx.core.Object,

  construct: function() {
    this.base(arguments);
  },
  statics: {
    xhr: function(verb, url, data, callback) {
      var xhr;
      if (typeof window.XMLHttpRequest !== 'undefined') {
        xhr = new XMLHttpRequest();
      } else {
        var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"]

        for(var i = 0, len = versions.length; i < len; i++) {
          try {
            xhr = new ActiveXObject(versions[i]);
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

    get: function(id, origine, callback, context) {
      callback = callback.bind(context);
      var url = '/api/ressource/'+(origine ? origine +'/' : '') +id;
      this.xhr('GET', url, undefined, function(error, result) {
        if (error) return new VError(error, "Impossible de récupérer les données sur l'API : "+path);
        callback(null, result);
      });
    }
  }

});

