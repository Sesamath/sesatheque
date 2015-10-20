var uuid = require('an-uuid');

app.service('$job', function() {
  var jobs = {};

  function create(startCallback, initCallback) {
    var job = {
      id: uuid(),
      progress: 0,
      state: 0,
      total: undefined,
      init: function(total) {
        job.total = total;
        initCallback(job);
      },

      done: function(error) {
        job.state =  3;
        console.log(error);
        job.error = error?error.toString():false;
      },
      tick: function() {
        job.state = 2;
        job.progress++;
      }
    }
    jobs[job.id] = job;
    startCallback(job);
  }

  function get(id) {
    return jobs[id];
  }

  return {
    create: create,
    get: get
  }
})

app.controller(function($job) {
  this.get('admin/api/job/:id', function(context) {
    var job = $job.get(context.arguments.id);
    context.json({job: job});
  });
})
