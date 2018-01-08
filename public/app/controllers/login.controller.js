angular
  .module('login')
  .controller('login-controller', [
    '$location', '$rootScope', '$scope',
		function($location, $rootScope, $scope) {

    //TODO: Can do more after server side authentication is implemented
    $scope.login = function() {
      // vm.dataLoading = true;
      $location.path('/workspace');
      // AuthenticationService.Login(vm.username, vm.password, function (response) {
      //   if (response.success) {
      //     AuthenticationService.SetCredentials(vm.username, vm.password);
      //     $location.path('/');
      //   } else {
      //       FlashService.Error(response.message);
      //       vm.dataLoading = false;
      //   }
      // });
    };
  }
]);
