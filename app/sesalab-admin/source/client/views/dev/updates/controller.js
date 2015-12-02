module.exports = function($scope, $http) {
  function initialize() {
    $http.get('/admin/api/updates').success(function(response) {
      $scope.updates = response.list;
    })
  }

  $scope.doUpdate = function(update) {
    $http.get('/admin/api/update/'+update.id).success(function(response) {
      update.job = response.job;
      function doUpdate() {
        $http.get('/admin/api/job/'+update.job.id).success(function(response) {
          if (response.job.state<3) {
            update.job = response.job;
            setTimeout(doUpdate, 1000);
          } else {
            delete update.job;
          }
        })
      }
      setTimeout(doUpdate, 1000);

    })
  }


  initialize();
}
