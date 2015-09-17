var _ = require('lodash');
var flow = require('an-flow');
app.controller(function($entities, $job) {

  this.get('admin/api/entities', function(context) {
    console.log('here', $entities.definitions());
    var entities = [];
    _.each($entities.definitions(), function(definition, name) {
      var entity = {name: name, indexes:[]};
      entity.indexes.push({name: 'oid', type: 'integer'});
      _.each(definition.indexes, function(index) {
        entity.indexes.push({name: index.fieldName, type: index.fieldType});
      });
      entities.push(entity);
    })
    flow(entities)
    .seqEach(function(entity) {
      var Entity = lassi.service(entity.name);
      flow()
      .seq(function() {
        Entity.match().count(this)
      })
      .seq(function(count) {
        entity.count = count;
        this();
      })
      .empty().seq(this).catch(this);
    })
    .seq(function() {
      context.json({entities: entities});
    })
    .catch(context.next);
  });

  this.post('admin/api/query', function(context) {
    function callback(error, rows) {
      console.log('result:', rows.length);
      context.json({rows: rows});
    }
    var query = context.post;
    var code = 'Entity';
    if (query.fields.length===0) {
      code += '.match()';
    } else {
      _.each(query.fields, function(field) {
        code += '.match("'+field.index.name+'").'+field.operator.name+'(';
        switch(field.index.type) {
          case 'integer': code+= field.value; break;
          case 'string': code+= '"'+field.value+'"'; break;
          case 'date': {
            var tokens = field.date.split('/');
            var date = new Date(
              parseInt(tokens[2]),
              parseInt(tokens[1])-1,
              parseInt(tokens[0])
            )
            code+= 'new Date("'+date+'")'; break;
          }
        }
        code += ')';
      })
    }
    code += '.grab(callback);';
    console.log(query, code);
    var Entity = lassi.service(query.entity.name);
    eval(code);
  });


  function reindex(entityName, job) {
    var Entity = lassi.service(entityName);
    var limit = 1000;
    flow()
    .seq(function() { Entity.match().count(this); })
    .seq(function(count) {
      job.init(count);
      var ranges = [];
      var offset = 0
      while (count > limit) {
        ranges.push([offset, limit]);
        count -= limit;
        offset+= 1000;
      }
      if (count > 0) ranges.push([offset, count]);
      flow(ranges).seqEach(function(range) {
        flow()
        .seq(function() {
          Entity.match().grab(range[1], range[0], this);
        })
        .seq(function(entities) {
          flow(entities).seqEach(function(row) {
            job.tick();
            row.reindex(this);
          }).empty().seq(this).catch(this);
        }).empty().seq(this).catch(this);
      }).empty().seq(this).catch(this);
    })
    .empty().seq(job.done).catch(job.done);
  }

  this.get('admin/api/reindex/:name', function(context) {
    console.log('reindex');
    $job.create(
      function(job) {
        console.log('startCallback');
        reindex(context.arguments.name, job);
      },
      function(job) {
        console.log('initCallback');
        context.json({job: job});
      });
  })


});

