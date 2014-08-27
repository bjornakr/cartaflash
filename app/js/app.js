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
        $routeProvider.when('/edit-cards',
            {templateUrl: 'partials/edit-cards.html', controller: 'CardCrudController'});
        $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
        $routeProvider.when('/', {templateUrl: 'partials/card.html', controller: 'CardController'});
        $routeProvider.when('/todo', {templateUrl: 'partials/todo.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);
