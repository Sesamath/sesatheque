'use strict';

exports.liste = {
  path: 'liste',
  template: 'liste',
  get: function(request, response) {
    response.application.entity('Ressource')
      .find({})
      .limit(10)
      .orderBy('id', 'asc')
      .execute(function(err, ressources) {
        response.eat({ressources: ressources});
      });
  }
};

exports.add = {
  path: 'api/ressource/add',
  template: 'result',
  all: function(request, response) {
    var Ressource = request.application.entity('Ressource');
    // @todo vérif d'intégrité
    Ressource
        .create({
          titre  : request.params.titre,
          resume : request.params.resume,
          datecrea : new Date()
        })
        .store(function(err, ressource) {
           if (err) {
             response.send({error: err.toString()});
             throw err;
           }
           response.send({result: 'ok', oid:ressource.oid});
        })
  }
}