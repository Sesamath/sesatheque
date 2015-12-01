var _ = require('lodash');
var flow = require('an-flow');
app.controller(function($entities, $job) {

  this.get('admin/api/entities', function(context) {
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
      .done(this);
    })
    .seq(function() {
      context.json({entities: entities});
    })
    .catch(context.next);
  });

  this.post('admin/api/query', function(context) {
    function callback(error, rows) {
      console.log(error, rows);
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
    //code+= '.sort("oid", "asc")';
    if (query.limit) {
      code += '.grab('+query.limit+', callback);';
    } else {
      code += '.grab(callback);';
    }
    var Entity = lassi.service(query.entity.name);
    eval(code);
  });


  function reindex(entityName, job) {
    var Entity = lassi.service(entityName);
    var limit = 1000;
    flow()
    .seq(function() { Entity.match().count(this); })
    .seq(function(count) {
      var ranges = job.init(count, limit);
      console.log(count, ranges);
      flow(ranges).seqEach(function(range) {
        console.log('=>', range);
        flow()
        .seq(function() {
          Entity.match().sort('oid', 'asc').grab(range[1], range[0], this);
        })
        .seq(function(entities) {
          flow(entities).seqEach(function(row) {
            console.log(row.oid);
            job.tick();
            row.reindex(this);
          }).done(this);
        }).done(this);
      }).done(this);
    })
    .done(job.done);
  }

  this.get('admin/api/reindex/:name', function(context) {
    $job.create(
      function(job) {
        reindex(context.arguments.name, job);
      },
      function(job) {
        context.json({job: job});
      });
  })


});

