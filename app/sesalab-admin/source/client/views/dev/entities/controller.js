module.exports = function($scope, $http) {
  function initialize() {
    $http.get('/admin/api/entities').success(function(response) {
      $scope.entities = response.entities;
    })
  }

  $scope.doReindex = function(entity) {
    $http.get('/admin/api/reindex/'+entity.name).success(function(response) {
      entity.job = response.job;
      function update() {
        $http.get('/admin/api/job/'+entity.job.id).success(function(response) {
          if (response.job.state<3) {
            entity.job = response.job;
            setTimeout(update, 1000);
          } else {
            delete entity.job;
          }
        })
      }
      setTimeout(update, 1000);

    })
  }


  initialize();
}
