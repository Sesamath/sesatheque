var uuid = require('an-uuid');

app.service('$job', function() {
  var jobs = {};

  function create(startCallback, initCallback, doneCallback) {
    var job = {
      id: uuid(),
      progress: 0,
      state: 0,
      total: undefined,
      init: function(total, limit) {
        job.total = total;
        initCallback(job);
        if (limit) {
          var ranges = [];
          var offset = 0
          while (total > limit) {
            ranges.push([offset, limit]);
            total -= limit;
            offset+= limit;
          }
          if (total > 0) ranges.push([offset, total]);
          return ranges;
        }
      },

      done: function(error) {
        job.state =  3;
        job.error = error?''+job.error:false;
        if (doneCallback) doneCallback();
      },

      tick: function(count) {
        count = count || 1;
        job.state = 2;
        job.progress+=count;
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
