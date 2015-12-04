var _ = require('lodash');
var flow = require('an-flow');
var serializer = require('an-serializer');
var fs = require('fs');

app.entity('AppliedUpdate', function() {
  this.defineIndex('id', 'string');
  this.defineIndex('date', 'date');
});

app.service('$update', function(AppliedUpdate) {
  var _updates;

  function list(cb) {
    if (_updates) return cb(null, _updates);
    _updates = {};
    var tmp = fs.readFileSync(__dirname+'/updates.json').toString();
    var updates = serializer.unserialize(tmp);
    updates.forEach(function(update, index) {
      update.id = index+1;
      _updates[update.id] = update;
    })

    flow()
    .seq(function() { AppliedUpdate.match().grab(this) })
    .seq(function(updates) {
      updates.forEach(function(update) {
        _updates[update.id] = _.extend(_updates[update.id], update);
      })
      cb(null, _updates);
    })
    .catch(cb);
  }

  return {
    list  : list
  }
})


app.controller(function($entities, $job, $update, AppliedUpdate) {

  this.get('admin/api/updates', function(context) {
    flow()
    .seq(function() { $update.list(this) })
    .seq(function(updates) {
      console.log(updates);
      context.json({list: _.values(updates)});
    })
    .catch(context.next);
  })

  this.get('admin/api/update/:id', function(context) {
    var id = context.arguments.id;
    flow()
    .seq(function() { $update.list(this) })
    .seq(function(updates) {
      console.log(updates);
      var fn = require(updates[id].file);
      $job.create(

      function(job) {
        console.log('startCallback');
        var id = parseInt(id);
        fn(job);
      },

      function(job) {
        console.log('initCallback');
        context.json({job: job});
      },

      function() {
        AppliedUpdate.create({
          id: id,
          done: new Date()
          }).store(function() {
          console.log('Update logged');
        })
      });
    })
    .catch(context.next);
  })


});


