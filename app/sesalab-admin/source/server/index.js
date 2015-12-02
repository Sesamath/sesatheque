var config = require('../../../config')
if (config.admin) {
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
} else {
  console.error("config.admin n'existe pas, interface d'admin désactivée");
}
