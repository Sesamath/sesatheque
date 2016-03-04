app.config(function($stateProvider) {
  $stateProvider.state('menu.query', {
    url: '/dev/query',
    views: {
      content: {
        template: require('./template.html'),
        controller: require('./controller')
      }
    }
  });
})


