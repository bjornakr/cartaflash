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
            var idCounter = 1;
            var cards = [];
//            var totalNumberOfCards = 0;

            return {
//                loadCards: function () {
//                    $http.get('cards.json').success(function (data) {
//                        cards = [];
//                        for (var i = 0; i < data.length; i++) {
//                            cards.push(data[i]);
//                            cards[i].id = idCounter;
//                            idCounter++;
//                        }
//                        totalNumberOfCards = cards.length;
//                        console.log("Final: " + JSON.stringify(cards));
//                        localStorage["cards"] = JSON.stringify(cards);
//                    });
//                },

//                loadCards: function () {
//
//                    var cardsFromStorage = JSON.parse(localStorage["cards"]);
//                    cards = [];
//                    for (var i = 0; i < cardsFromStorage.length; i++) {
//                        console.log(cardsFromStorage[i]);
//                        cards.push(cardsFromStorage[i]);
//                        cards[i].id = idCounter;
//                        idCounter++;
//                    }
//                    totalNumberOfCards = cards.length;
//                    console.log(localStorage["cards"]);
//                },

                getAll: function () {
                    return cards;
                },

                add: function (card) {
                    card.id = idCounter;
                    idCounter++;
                    cards.unshift(angular.copy(card));

                    localStorage["cards"] = JSON.stringify(cards);
                    console.log(localStorage["cards"]);
                },

                // TODO: Rename
                delete: function (card) {
                    console.log("Delete: " + card);
                    var cardIndex = cards.indexOf(card);
                    if (cardIndex !== -1) {
                        cards.splice(cardIndex, 1);
                    }
                    localStorage["cards"] = JSON.stringify(cards);
                },

                update: function (card) {
                    console.log("Update: " + card)
                    var cardToBeUpdated = null;
                    for (var i = 0; i < cards.length; i++) {
                        if (card.id === cards[i].id) {
                            cardToBeUpdated = cards[i];
                        }
                    }
                    this.delete(cardToBeUpdated);
                    this.add(card);
                },

                getIdOf: function (card) {
                    return card.id;
                }
            }
        }]
);


services.factory("CardRepository", [function () {
        return {
            loadCards: function () {
                var cardsFromStorage = JSON.parse(localStorage["cards"]);
                var cards = [];
                var idCounter = 0;
                for (var i = 0; i < cardsFromStorage.length; i++) {
                    console.log(cardsFromStorage[i]);
                    cards.push(cardsFromStorage[i]);
                    cards[i].id = idCounter;
                    idCounter++;
                }
                console.log(localStorage["cards"]);
            }
        }
    }]
);

