// import { wildbook.service } from './services/wildbook.service'

angular.module('ibeis', [
  // routes
  'ibeis.routes',
  // controllers
  'workspace',
  'login',
  'register',
  // services
  'wildbook.service',
  'authentication.service',
  'session.service',
  // imports
  'ngMaterial', // angular material
  'ngMessages',
  'smart-table',
  'ui-leaflet',
  'angularLazyImg',
  'infinite-scroll',
  'lfNgMdFileInput',

])

// setup theme
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
      // Available palettes: red, pink, purple, deep-purple,
      //   indigo, blue, light-blue, cyan, teal, green, light-green,
      //   lime, yellow, amber, orange, deep-orange, brown, grey,
      //   blue-grey
    .primaryPalette('green')
    .accentPalette('blue');
})
// Setup Constants
.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})
.constant('USER_ROLES', {
  member: 'member',
  admin: 'admin'
})
// setup utility functions
.run(function($rootScope, $location, $mdDialog, AUTH_EVENTS, Authentication) {
  $rootScope.Utils = {
    keys: Object.keys
  };

  $rootScope.account = {};
  $rootScope.account.id = 1;  // TEMPORARY CODE TO PREVENT HAVING TO SIGN IN AFTER EVERY REFRESH!!!!

  $rootScope.$on('$locationChangeStart', function (event, next, current) {
    // restrict access to certain pages if not logged in
    var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
    var loggedIn = $rootScope.account.id;
    if (restrictedPage && !loggedIn) {
      // If not even on the wildbook ui just redirect to login
      if (next == current) {
        $location.path('/login');
      }
      // If on the login/register page just gracefully handle this error
      else {
        event.preventDefault();
        $mdDialog.show(
          $mdDialog.alert({
            title: "Error",
            content: "You need to be logged in to access that",
            ok: "Close"
          })
        );
      }
    }
  });
});
