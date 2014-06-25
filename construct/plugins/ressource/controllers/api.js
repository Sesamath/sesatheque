'use strict';

var apiController = lassi.Controller().namespace('api/ressource');

apiController.baseAction()
  .respond('json');

apiController.action()
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

module.exports = apiController;
