module.exports = function($scope, $state, $rootScope) {

  function  updateState(state) {
    $scope.stateId="state-"+state.name.replace('.', '-');
  }
  function initialize() {
    $rootScope.$on('$stateChangeSuccess', function(event, toState){
      updateState(toState);
    })
    updateState($state.current);
    $scope.menu = {
      open: undefined,
      items: [
        {
          label: 'Développement',
          items: [
            { label: 'Entitées', state: 'menu.entities' },
            { label: 'Requêtes', state: 'menu.query' },
          ]
        }
      ]
    }
  }


  /**
   * Vérifie dans quelle section l'on est.
   */
  $scope.isItemActive = function(path) {
    return $state.current.name === path;
  }

  $scope.isOpenMenu = function(item) {
    return $scope.menu.open === item;
  }

  $scope.openMenu = function(item) {
    if ($scope.isOpenMenu(item)) {
      $scope.menu.open =undefined;
    } else {
      $scope.menu.open = item;
    }
  }

  initialize();
}
