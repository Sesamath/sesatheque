'use strict';

var controller = lassi.Controller();
controller.defineBaseAction().respond('html');

controller
  .Action('liste')
  .do(function (request, response) {
    lassi.entity.Ressource
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
  });

module.exports = controller;

