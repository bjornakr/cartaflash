'use strict';


// Declare app level module which depends on filters, and services
angular.module('cartaflash', [
    'ngRoute',
    'cartaflash.filters',
    'cartaflash.services',
    'cartaflash.directives',
    'cartaflash.controllers'
]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/practice',
            {templateUrl: 'partials/practice.html', controller: 'CardController'});
        $routeProvider.when('/edit-cards',
            {templateUrl: 'partials/edit-cards.html', controller: 'CardCrudController'});
//        $routeProvider.when('/', {templateUrl: 'partials/practice.html', controller: 'CardController'});
        $routeProvider.when('/import-export-cards',
            { templateUrl: 'partials/import-export-cards.html', controller: 'ImportExportController' });
        $routeProvider.when('/config',
            { templateUrl: 'partials/config.html', controller: 'ConfigController' });
        $routeProvider.when('/todo', {templateUrl: 'partials/todo.html'});
        $routeProvider.otherwise({redirectTo: '/practice'});
    }]);
