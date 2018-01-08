var authentication = angular
.module("authentication.service", [])
.service('Authentication', ['$http', 'Session', function($http, Session) {

  var Authentication = {};

  // Clears credentials
  Authentication.clear = function() {
    Session.delete();
  }

  //TODO: When we have server side authentication the post will provide, role etc.
  Authentication.login = function (credentials) {
    // return $http
    //   .post('/login', credentials)
    //   .then(function (res) {
    var res = {};
    res.success = true;
    res.id = 1;
    res.user = 1;
    res.role = "Admin";
        Session.create(res.id, res.user,
                       res.role, res.success);
        return res;
      // });
  };

  Authentication.isAuthenticated = function () {
    return !!Session.userId;
  };

  Authentication.isAuthorized = function (authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (Authentication.isAuthenticated() &&
      authorizedRoles.indexOf(Session.userRole) !== -1);
  };

  return Authentication;
}]);
