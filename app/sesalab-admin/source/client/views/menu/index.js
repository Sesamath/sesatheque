app.config(function($stateProvider) {
  $stateProvider.state({
    name: 'menu',
    url: '',
    template: require('./template.html'),
    controller: require('./controller')
  })
})

