'use strict';

var controller = lassi.Controller();

controller.baseAction()
  .layout('page')
  .respond('html');

controller.action()
    .match('liste')
    .view('liste')
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

