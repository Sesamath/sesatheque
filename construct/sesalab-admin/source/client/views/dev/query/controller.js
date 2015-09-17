module.exports = function($scope, $http) {
  var _ = require('lodash');
  function initialize() {
    $scope.query = {
      entity: undefined,
      fields: []
    }
    //var data = localStorage.getItem('query');
    //if (data) {
      //$scope.query = JSON.parse(data);
    //}
    //console.log($scope.query);

    $http.get('/admin/api/entities').success(function(response) {
      $scope.entities = response.entities;
      $scope.query.entity = $scope.query.entity || $scope.entities[0];
    });

    $scope.operators = [
      { name: 'equals', types: ['integer', 'string'] },
      { name: 'different', types: ['integer', 'string'] },
      { name: 'true', types: ['boolean'] },
      { name: 'false', types: ['boolean'] },
      { name: 'before', types: ['date'] },
      { name: 'after', types: ['date'] },
      //{ name: 'between', types: ['integer', 'date'] },
      { name: 'greaterThan', types: ['integer'] },
      { name: 'greaterThanOrEquals', types: ['integer'] },
      { name: 'in', types: ['integer', 'string'] },
      { name: 'like', types: ['string'] },
      { name: 'lowerThan', types: ['integer'] },
      { name: 'lowerThanOrEquals', types: ['integer'] },
      { name: 'notIn', types: ['string'] },
    ]

    $scope.$watch('query.entity', function() {
      $scope.query.fields = [];
    })
  }

  $scope.doSelectFieldIndex = function(index) {
    console.log(index);
    _.each($scope.operators, function(operator) {
      console.log(operator.types, index.index, operator.types.indexOf(index.index.type));
      if (operator.types.indexOf(index.index.type)!==-1) {
        index.operator = operator;
        return true;
      }
    })
    console.log(index);
  }

  $scope.filterOperators = function(field) {
    return function(operator) {
      var result = operator.types.indexOf(field.index.type)!==-1;
      return result;
    }
  }

  $scope.doAddField = function() {
    var fi;
    $scope.query.fields.push(fi ={
      index: $scope.query.entity.indexes[0],
      operator: undefined,
      value: '',
      date: _.formatDate(new Date(), '%d/%M/%Y')
    });
    $scope.doSelectFieldIndex(fi);
  }

  $scope.doExecute = function() {
    localStorage.setItem('query', JSON.stringify($scope.query));
    $http.post('/admin/api/query', $scope.query).success(function(response) {
      $scope.nbResults = response.rows.length;
      var result = h(response.rows);
      jQuery('#query-result').html(result);
      //console.log('===');
    })
  }

  function h(obj) {
    var output = ['<div class="object" onclick="jQuery(this).toggleClass(\'visible\')">'];
    _.each(obj, function(value, key) {
      output.push('<div class="property">');
      output.push('<span class="name">');
      output.push(key);
      output.push('</span>');
      output.push('<div class="value">');
      if (value === null) {
        value = "NULL";
      } else if (_.isObject(value) || _.isArray(value)) {
        value = h(value);
      } else {
        value = value.toString();
      }
      output.push(value);
      output.push('</div>');
      output.push('</div>');
    });
    output.push('</div>');
    output = output.join('\n');
    return output;
  }

  initialize();
}
