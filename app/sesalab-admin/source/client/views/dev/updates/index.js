app.config(function($stateProvider) {
  $stateProvider.state('menu.updates', {
    url: '/dev/updates',
    views: {
      content: {
        template: require('./template.html'),
        controller: require('./controller')
      }
    }
  });
})


