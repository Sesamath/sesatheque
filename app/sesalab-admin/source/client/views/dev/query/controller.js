module.exports = function($scope, $http) {
  var _ = require('lodash');
  function initialize() {
    $scope.query = {
      entity: undefined,
      fields: []
    }

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
    _.each($scope.operators, function(operator) {
      if (operator.types.indexOf(index.index.type)!==-1) {
        index.operator = operator;
        return true;
      }
    })
  }

  $scope.filterOperators = function(field) {
    return function(operator) {
      var result = operator.types.indexOf(field.index.type)!==-1;
      return result;
    }
  }

  function formatDate(date, fmt) {
  if (typeof fmt === 'undefined') {
    fmt = date;
    date = new Date();
  }
  if (typeof date === 'number') {
    if (date<10000000000) {
      date = new Date(1000*date);
    } else {
      date = new Date(date);
    }
  }
  if (typeof date == 'string') {
    date = new Date(date);
  }
  function pad(value) {
    return (value.toString().length < 2) ? '0' + value : value;
  }
  return fmt.replace(/%([a-zA-Z]+)/g, function (_, fmtCode) {
    switch (fmtCode) {
      case 'D':
        var days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[date.getDay()];
      case 'd':
        return pad(date.getDate());
      case 'M':
        return pad(date.getMonth() + 1);
      case 'MM':
        var months = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Dec'];
        return months[date.getMonth()];
      case 'MMM':
        var lmonths = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Decembre'];
        return lmonths[date.getMonth()];
      case 'Y':
        return date.getFullYear();
      case 'H':
        return pad(date.getHours());
      case 'm':
        return pad(date.getMinutes());
      case 's':
        return pad(date.getSeconds());
      case 'Z':
        var min = -date.getTimezoneOffset();
        var h = Math.floor(min / 60);
        var m = min % 60;
        return (min>0?'+':'-')+pad(h)+pad(m);
      case 'W':
        return date.getWeekNumber();
      default:
        throw new Error('Unsupported format code: ' + fmtCode);
    }
  });
}
  $scope.doAddField = function() {
    var fi;
    $scope.query.fields.push(fi ={
      index: $scope.query.entity.indexes[0],
      operator: undefined,
      value: '',
      date: formatDate(new Date(), '%d/%M/%Y')
    });
    $scope.doSelectFieldIndex(fi);
  }

  $scope.doExecute = function() {
    localStorage.setItem('query', JSON.stringify($scope.query));
    $http.post('/admin/api/query', $scope.query).success(function(response) {
      $scope.nbResults = response.rows.length;
      var result = h(response.rows);
      jQuery('#query-result').html(result);
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
        value = 'NULL';
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
