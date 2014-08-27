'use strict';

/* Directives */


var directives = angular.module('cartaflash.directives', []);

directives.directive('appVersion', ['version', function (version) {
    return function (scope, elm, attrs) {
        elm.text(version);
    };
}]);

directives.directive('showOnHover',
    function () {
        return {
            link: function (scope, element, attrs) {
                element.parent().parent().bind('mouseenter', function () {
                    element.show();
                });
                element.parent().parent().bind('mouseleave', function () {
                    element.hide();
                });
            }
        };
    }
);