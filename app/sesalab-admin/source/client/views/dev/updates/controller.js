var formatDate = require('an-format-date');
module.exports = function($scope, $http) {
  function initialize() {
    $http.get('/admin/api/updates').success(function(response) {
      $scope.updates = response.list;
      response.list.forEach(function(update) {
        update.$date = formatDate(new Date(update.date), '%d/%M/%Y %H:%M');
        update.$done = update.done?formatDate(new Date(update.done), '%d/%M/%Y %H:%M'):'';
      })
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
            update.done = new Date();
            update.$done = formatDate(update.done, '%d/%M/%Y %H:%M');

          }
        })
      }
      setTimeout(doUpdate, 1000);

    })
  }


  initialize();
}
