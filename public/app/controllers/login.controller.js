angular
.module('login')
.controller('login-controller', [
  '$location', '$rootScope', '$scope', 'Authentication', '$mdDialog',
  function($location, $rootScope, $scope, Authentication, $mdDialog) {

    $scope.dataLoading = false;
    $scope.email = "";
    $scope.password = "";

    // Clears credentials when visiting login page, cant login and be logged in.
    Authentication.clear();

    // TODO: Use following login after server-side authentication added.
    // $scope.login = function() {
    //   $scope.dataLoading = true;
    //   Authentication.login($scope.username, $scope.password).then(function (response) {
    //     if (response.success) {
    //       $location.path('/workspace');
    //     } else {
    //       $mdDialog.show(
    //         $mdDialog.alert({
    //           title: "Error",
    //           content: "Incorrect Username and Password combination.",
    //           close: "ok"
    //         })
    //       );
    //       $scope.dataLoading = false;
    //     }
    //   });
    // };

    $scope.login = function() {
      Authentication.login($scope.username, $scope.password);
      $location.path('/workspace');
    };
}]);
