'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var services = angular.module('cartaflash.services', []);

services.factory('KeyPressService', [
        function () {
            var LEFT_ARROW = 37;
            var RIGHT_ARROW = 39;
            var DOWN_ARROW = 40;
            this.keyCode = 0;

            return {
                getKeypress: function () {
                    return this.keyCode;
                },
                setKeypress: function (keyCode) {
                    console.log("Setting...");
                    this.keyCode = keyCode;
                },
                hasKeySuccess: function () {
                    return this.keyCode === RIGHT_ARROW;
                },
                hasKeyFail: function () {
                    return this.keyCode === LEFT_ARROW;
                },
                hasKeyRevealAnswer: function () {
                    return this.keyCode === DOWN_ARROW;
                },
                clearInput: function () {
                    this.keyCode = 0;
                }
            }
        }]
);

services.factory('CardService', ['$http',
        function ($http) {
            var cards = [];
            var totalNumberOfCards = 0;

            return {
                loadCards: function () {
                    $http.get('cards.json').success(function (data) {
                        cards = data;
                        totalNumberOfCards = data.length;
                    });
                },
                getAll: function () {
                    return cards;
                },
                add: function(card) {
                    cards.unshift(angular.copy(card));
                },
                delete: function (card) {
                    var cardIndex = cards.indexOf(card);
                    if (cardIndex !== -1) {
                        cards.splice(cardIndex, 1);
                    }
                },
                getIdOf: function(card) {
                    return card.front + card.back;
                }
            }
        }]
);


//phonecatServices.factory('Phone', ['$resource',
//    function ($resource) {
//        return $resource('phones/:phoneId.json', {}, {
//            query: {method: 'GET', params: {phoneId: 'phones'}, isArray: true}
//        });
//    }]
//);
