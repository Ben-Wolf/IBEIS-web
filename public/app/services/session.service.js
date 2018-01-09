var session = angular
  .module("session.service", [])
  .service("Session", ["$http", "$rootScope", function($http, $rootScope) {

  this.create = function (id, role) {
    this.id = id;
    this.role = role;
    $rootScope.account.id = id;
    $rootScope.account.role = role;
  };
  this.delete = function () {
    this.id = null;
    this.role = null;
    $rootScope.account.id = null;
    $rootScope.account.role = null;
  };
}]);
