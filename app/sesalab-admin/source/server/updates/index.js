var _ = require('lodash');
app.controller(function($entities, $job) {

  var updates = [require('./update1.js')];

  this.get('admin/api/updates', function(context) {
    var list = [];
    _.each(updates, function(u, index) {
      list.push({id: index, description: u.description});
    })
    context.json({list: list});
  })

  this.get('admin/api/update/:id', function(context) {
    $job.create(
      function(job) {
        console.log('startCallback');
        var id = parseInt(context.arguments.id);
        updates[id].job(job);
      },
      function(job) {
        console.log('initCallback');
        context.json({job: job});
      });
  })


});


