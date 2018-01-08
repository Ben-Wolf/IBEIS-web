angular
  .module('register')
  .controller('register-controller', [
    '$location', '$rootScope', '$scope', '$mdDialog',
		function($location, $rootScope, $scope, $mdDialog) {
      $scope.dataLoading = false;

      //TODO: Uncomment server side code when its implemented -- also add the needed calls
      $scope.register = function() {
        if ($scope.email != $scope.confirmEmail) {
          $mdDialog.show($mdDialog.alert({
            title: "Error",
            content: "E-mails don't match",
            ok: "Close"
          }));
        }
        else if ($scope.pass != $scope.confirmPass) {
          $mdDialog.show($mdDialog.alert({
            title: "Error",
            content: "Passwords don't match",
            ok: "Close"
          }));
        }
        /* SERVER SIDE CODE BELOW */
        // $scope.dataLoading = true;
        // var credentials = {
        //   email : $scope.email,
        //   password : $scope.password,
        //   organization : $scope.organization
        // };
        // return $http
        //   .post('/login', credentials)
        //   .then(function (res) {
        // if (!res.success) {
        //   $mdDialog.show(
        //     $mdDialog.alert({
        //       title: "Error",
        //       content: res.errorText,
        //       ok: "Close"
        //     })
        //   );
        // }
        else {
          $mdDialog.show(
            $mdDialog.alert({
              title: "Success!",
              content: "Account created",
              ok: "Login"
            })
          ).then(function(response) {
            $rootScope.stored = $scope.email;
            $location.path('/login');
          });
        }
      };
}]);
