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

services.factory('CardService', ['CardRepository',
        function (cardRepository) {
            var cards = cardRepository.loadCards();
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
//                    console.log("!!!!!!!!");
//                    console.log(cardRepository.loadCards());
//                    return cardRepository.loadCards();
                    return cards;
                },

                add: function (card) {
                    card.id = card.front + card.back;
                    card.winstreak = 0;
                    card.timesAnswered += 0;
                    card.timesAnsweredCorrectly = 0;
                    card.lastVisitedTime = null;

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
                }
            }
        }]
);


services.factory('PracticeSessionService', ['CardRepository',
    function (cardRepository) {
        var PRACTICE_CARD_DECK_SIZE = 3;
        var REQUIRED_WINSTREAK_FOR_LEARN = 2;


        function calculateDayDiff(time1, time2) {
            var oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            return (time1 - time2) / oneDay;
        }

        function compareLearnedCards(card1, card2) {
            var card1Score = card1.timesAnsweredCorrectly / card1.timesAnswered;
            var card2Score = card2.timesAnsweredCorrectly / card2.timesAnswered;

            if (card1Score < card2Score)
                return -1;
            if (card1Score > card2Score)
                return 1;
            return 0;
        }

        return {

            win: function (card) {
                card.winstreak += 1;
                card.timesAnswered += 1;
                card.timesAnsweredCorrectly += 1;
                card.lastVisitedTime = Date.now();
                cardRepository.update(card);
            },

            lose: function (card) {
                card.winstreak += 0;
                card.timesAnswered += 1;
                card.lastVisitedTime = Date.now();
                cardRepository.update(card);
            },

            createPracticeCardDeck: function (cards) {
                var cardsForPractice = [];
                var learnedCards = [];
                var activeCards = [];
                var pendingCards = [];

                var i;

                // Initialiing card decks.
                for (i = 0; i < cards.length; i++) {
                    if (cards[i].lastVisitedTime === null) {
                        pendingCards.push(cards[i]);
                    }
                    else {
                        if (cards[i].winstreak > REQUIRED_WINSTREAK_FOR_LEARN) {
                            learnedCards.push(cards[i]);
                        }
                        else {
                            activeCards.push(cards[i]);
                        }
                    }
                }

                // 1) Add learned cards for repetition
                for (i = 0; i < learnedCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                    var additionalWinstreak = learnedCards[i].winstreak - REQUIRED_WINSTREAK_FOR_LEARN;
                    var waitDays = Math.pow(2, additionalWinstreak);
                    console.log("LVD: " + learnedCards[i].lastVisitedTime);
                    console.log("NOW: " + Date.now());
                    var daysSinceLastVisit = calculateDayDiff(learnedCards[i].lastVisitedTime, Date.now()); // 0; //TODO: Something
                    if (waitDays - daysSinceLastVisit <= 0) {
                        cardsForPractice.push(learnedCards[i]);
                    }
                }

                // 2) Add cards that are currently being practiced
                activeCards.sort(compareLearnedCards);
                for (i = 0; i < activeCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                    cardsForPractice.push(activeCards[i]);
                }

                // 3) Add new cards
                for (i = 0; i < pendingCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                    cardsForPractice.push(pendingCards[i]);
                }

                // 4) If there is still space, add more already lerned cards
                for (i = 0; i < learnedCards.length; i++)
                {

                }

                return cardsForPractice;
            }
        };
    }
]);

services.factory("CardRepository", ["$http",
        function ($http) {
            var idCounter = 0;

            function loadCardsFromFile() {
                var cards = [];

                $http.get('cards.json').success(function (data) {
//                    var cards = [];
                    for (var i = 0; i < data.length; i++) {
                        cards.push(data[i]);
                        cards[i].id = cards[i].front + cards[i].back;
                        console.log("pushing: " + cards[i]);
                        idCounter++;
                    }
//                        totalNumberOfCards = cards.length;
//                        console.log("Final: " + JSON.stringify(cards));
//                        localStorage["cards"] = JSON.stringify(cards);
                });
                return cards;
            };
//                loadCurrentCardDeck: function () {
//                    return loadCards()["current"];
//                }
            function loadCardsFromStorage() {
                var cardsFromStorage = [];
//                localStorage.removeItem("cards");
                if (typeof(localStorage["cards"]) !== "undefined") {
                    cardsFromStorage = JSON.parse(localStorage["cards"]);
                }
                var cards = [];
                for (var i = 0; i < cardsFromStorage.length; i++) {
//                    console.log(cardsFromStorage[i]);
                    cards.push(cardsFromStorage[i]);
                    cards[i].id = cards[i].front + cards[i].back;
                    idCounter++;
                }
                return cards;
//                console.log(localStorage["cards"]);
            };


            return {
                loadCards: function () {
                    var cards = loadCardsFromStorage();
                    console.log("CARDS:");
                    console.log(cards);
                    return cards;
                },

                getNextId: function () {
                    var nextId = idCounter;
                    idCounter++;
                    return nextId;
                },

                update: function (card) {
                    console.log("UPDATE");
                    console.log(card);
                    var allCards = this.loadCards();

                    for (var i = 0; i < allCards.length; i++) {
                        if (card.id === allCards[i].id) {
                            console.log("MEGAMATCH!");
                            allCards[i] = card;
                        }
                    }
                    localStorage["cards"] = JSON.stringify(allCards);
                }
            }
        }]
);

