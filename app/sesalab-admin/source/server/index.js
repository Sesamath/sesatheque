var config = require('../../../config')
app.controller(function() {
  var basicAuth = require('basic-auth-connect');
  var auth = basicAuth(function(user, pass) {
    return (config.admin[user] === pass);
  })
  this.all('/admin*', function(context) {
    context.timeout=100000;
    auth(context.request, context.response, function() {
      context.next();
    })
  })
  this.serve('/admin', __dirname+'/../../public');
});
