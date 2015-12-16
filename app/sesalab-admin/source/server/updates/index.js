var _ = require('lodash');
var flow = require('an-flow');
var serializer = require('an-serializer');
var fs = require('fs');

app.entity('AppliedUpdate', function() {
  this.defineIndex('id', 'string');
  this.defineIndex('done', 'date');
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
    .seq(function() { AppliedUpdate.match().sort('oid','desc').grab(this) })
    .seq(function(updates) {
      updates.forEach(function(update) {
        if (!_updates[update.id].done) {
        _updates[update.id] = _.extend(_updates[update.id], update);
        }
      })
      cb(null, _updates);
    })
    .catch(cb);
  }

  return {
    list  : list,
    reset : function() { _updates = undefined; }
  }
})


app.controller(function($entities, $job, $update, AppliedUpdate) {

  this.get('admin/api/updates', function(context) {
    flow()
    .seq(function() { $update.list(this) })
    .seq(function(updates) {
      context.json({list: _.values(updates)});
    })
    .catch(context.next);
  })

  this.get('admin/api/update/:id', function(context) {
    var id = context.arguments.id;
    flow()
    .seq(function() {
      var fn = require(__dirname+'/update'+id+'.js');
      $job.create(

      function(job) {
        var id = parseInt(id);
        fn(job);
      },

      function(job) {
        context.json({job: job});
      },

      function() {
        AppliedUpdate.create({
          id: id,
          done: new Date()
          }).store(function() {
            $update.reset();

        })
      });
    })
    .catch(context.next);
  })


});


