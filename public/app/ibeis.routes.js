angular.module('ibeis.routes', ['ngRoute'])
.config(function($routeProvider) {
  $routeProvider
    .when('/login', {
        templateUrl: 'app/views/pages/login.html',
        controller: 'login-controller',
        controllerAs: 'loginCtrl'
    })
    .when('/register', {
      templateUrl: 'app/views/pages/register.html',
      controller: 'register-controller',
      controllerAs: 'registerCtrl'
    })
    .when('/workspace', {
        templateUrl: 'app/views/pages/workspace.html',
        controller: 'workspace-controller',
        controllerAs: 'wsCtrl'
    })
    .otherwise({
        redirectTo: '/login'
  });
});
