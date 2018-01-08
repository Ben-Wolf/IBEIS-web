var session = angular
  .module("session.service", [])
  .service("Session", ["$http", "$rootScope", function($http, $rootScope) {

  this.create = function (sessionId, userId, userRole) {
    this.id = sessionId;
    this.userId = userId;
    this.userRole = userRole;
    $rootScope.id = sessionId;
    $rootScope.userId = userId;
    $rootScope.userRole = userRole;
  };
  this.delete = function () {
    this.id = null;
    this.userId = null;
    this.userRole = null;
    $rootScope.id = null;
    $rootScope.userId = null;
    $rootScope.userRole = null;
  };
}]);
