// import { wildbook.service } from './services/wildbook.service'

angular.module('ibeis', [
  // routes
  'ibeis.routes',
  // controllers
  'workspace',
  // services
  'wildbook.service',
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
// setup utility functions
.run(function($rootScope) {
  $rootScope.Utils = {
    keys: Object.keys
  };
});
