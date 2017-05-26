module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon-chai', 'chai-as-promised', 'chai-things'],
    client: {
      mocha: {
        timeout: 500
      }
    },
    files: [
      // bower:js
      'public/bower_components/jquery/dist/jquery.js',
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-animate/angular-animate.js',
      'public/bower_components/angular-aria/angular-aria.js',
      'public/bower_components/angular-messages/angular-messages.js',
      'public/bower_components/angular-material/angular-material.js',
      'public/bower_components/angular-smart-table/dist/smart-table.js',
      'public/bower_components/flow.js/dist/flow.js',
      'public/bower_components/aws-sdk/dist/aws-sdk.js',
      'public/bower_components/underscore/underscore.js',
      'public/bower_components/d3/d3.js',
      'public/bower_components/leaflet/dist/leaflet-src.js',
      'public/bower_components/angular-simple-logger/dist/angular-simple-logger.js',
      'public/bower_components/ui-leaflet/dist/ui-leaflet.js',
      'public/bower_components/angular-route/angular-route.js',
      'public/bower_components/jquery-alphanum/jquery.alphanum.js',
      'public/bower_components/exif-js/exif.js',
      'public/bower_components/ng-exif/ng-exif.js',
      'public/bower_components/angular-lazy-img/release/angular-lazy-img.js',
      'public/bower_components/lazysizes/lazysizes.js',
      'public/bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'public/bower_components/lf-ng-md-file-input/dist/lf-ng-md-file-input.js',
      'public/bower_components/photoswipe/dist/photoswipe.js',
      'public/bower_components/photoswipe/dist/photoswipe-ui-default.js',
      'public/bower_components/ng-photoswipe/angular-photoswipe.min.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/bower_components/ng-flow/dist/ng-flow.js',
      // endbower
      "public/app/ibeis.js",
      "public/app/ibeis.routes.js",
      "public/{app,components}/**/*.js",
      "public/{app,components}/**/*.controller.js",
      "public/{app,components}/**/**.html",
      // tests
      'public/{app,components}/**/*.{spec,mock}.js'
    ],
    exclude: [],
    port: 9090,
    logLevel: config.LOG_INFO,
    reporters: ['spec', 'coverage'],
    preprocessors: {
      'public/{app,components}/**/!(*.spec|*.mock).js': ['coverage']
    },
    coverageReporter: {
      type: 'html',
      dir: 'coverage/'
    },
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
