'use strict';

var controller = lassi.Controller().namespace('api/ressource');

controller.baseAction()
  .respond('json');

controller.action()
    .match('add')
    .do(function(request, response) {
        var ressource = this.application.entity('Ressource');
        // @todo vérif d'intégrité
        ressource
            .create({
              titre  : request.query.titre,
              resume : request.query.resume
            })
            .store(function(err, ressource) {
               if (err) {
                 response.send({error: err.toString()});
                 throw err;
               }
               response.send({result: 'ok', oid:ressource.oid});
            })
    })

module.exports = controller;

