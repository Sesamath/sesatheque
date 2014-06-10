'use strict';

/**
 * La route pour la home
 */
module.exports.home = {
  path: '/',
  template: 'home',
  get: function(request, response) {
    var attrs = [], p;
    for (p in request.application) {
      if (request.application.hasOwnProperty(p)) {
        attrs.push(p);
      }
    }
    response.eat({title:"Bienvenue dans la bibliothèque Sésamath", debug:request.application, debugStr:attrs.toString()});
    //response.render('hello', {name:"world"});
  },

};
