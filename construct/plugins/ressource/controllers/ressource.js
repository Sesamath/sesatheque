'use strict';

var lassi = require('lassi');

module.exports.liste = lassi.Controller()
    .action('liste')
    .do(function (request, response) {
      this.application.entity('Ressource')
      .find({})
      .limit(10)
      .orderBy('id', 'asc')
      .execute(function (error, ressources) {
        if (!response.data) response.data = {};
        response.data.ressources = ressources;
        if (error) {
          response.data.error = error;
        }
      })
    })
    .render('liste');

module.exports.add = lassi.Controller()
    .action('/api/ressource/add')
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
    .render('result');
