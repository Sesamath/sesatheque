app.config(function($stateProvider) {
  $stateProvider.state('menu.entities', {
    url: '/dev/entities',
    views: {
      content: {
        template: require('./template.html'),
        controller: require('./controller')
      }
    }
  });
})


