![IBEIS Web](http://i.imgur.com/sIi8pad.png)

[![Tasks on Trello](https://img.shields.io/badge/tasks-on%20trello-blue.svg)](https://trello.com/b/SHDAvm7L)
[![Build Status](https://travis-ci.org/Danlowe95/IBEIS-web.svg?branch=master)](https://travis-ci.org/Danlowe95/IBEIS-web)
[![Dependency Status](https://david-dm.org/Ben-Wolf/IBEIS-web.svg)](https://david-dm.org/Ben-Wolf/IBEIS-web)
[![devDependency Status](https://david-dm.org/Ben-Wolf/IBEIS-web/dev-status.svg)](https://david-dm.org/Ben-Wolf/IBEIS-web#info=devDependencies)

**IBEIS Web** is the new front-end solution for the [**IBEIS image analysis**](https://github.com/Erotemic/ibeis) suite. It provides a researcher friendly interface with the goal of providing animal identification to fuel biological and ecological insight.

This repository is purely for the development of an angular front-end. All node modules and server code is for development and testing.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
- [Bower](http://bower.io/) (`npm install --g bower`)
- [Grunt](http://gruntjs.com/) (`npm install --g grunt-cli`)

### Developing

##### First Time Setup

1. Run `npm install` to install server dependencies.
2. Run `grunt develop` to install all dependencies.
3. Run `grunt serve` to preview the site in a browser.

##### Commands

- `grunt develop`: refresh all of the dependencies
- `grunt serve`: preview the site in a browser
- `grunt test`: run the test suite

##### Code Coverage

By running `grunt test` a *coverage* folder will be generated in the root directory of this project. Open `index.html` to view code coverage.
