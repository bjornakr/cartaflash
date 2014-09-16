'use strict';

/* Services */

var services = angular.module('cartaflash.services', []);

services.factory('KeyPressService', [
        function () {
            var LEFT_ARROW = 37;
            var RIGHT_ARROW = 39;
            var DOWN_ARROW = 40;
            var _keyCode = 0;

            return {
                getKeypress: function () {
                    return _keyCode;
                },
                setKeypress: function (keyCode) {
                    _keyCode = keyCode;
                },
                hasKeySuccess: function () {
                    return _keyCode === RIGHT_ARROW;
                },
                hasKeyFail: function () {
                    return _keyCode === LEFT_ARROW;
                },
                hasKeyRevealAnswer: function () {
                    return _keyCode === DOWN_ARROW;
                },
                clearInput: function () {
                    _keyCode = 0;
                }
            }
        }]
);

services.factory('CardService', ['CardRepository',
        function (cardRepository) {
            var cards = cardRepository.getAll();

            function generateId(card) {
                return card.front.toUpperCase() + "|" + card.back.toUpperCase();
            }

            return {
                getAll: function () {
                    return cards;
                },

                add: function (card) {
                    card.front = card.front.trim();
                    card.back = card.back.trim();
                    card.id = generateId(card);
                    card.winstreak = 0;
                    card.timesAnswered += 0;
                    card.timesAnsweredCorrectly = 0;
                    card.lastVisitedTime = null;

                    if (!this.exists(card)) {
                        cardRepository.add(card);
                    }
                    cards = cardRepository.getAll();
                },

                delete: function (card) {
                    cardRepository.delete(card.id);
                    cards = cardRepository.getAll();
                },

                update: function (card) {
                    cardRepository.update(card);
                    cards = cardRepository.getAll();

                },

                exists: function (card) {
                    return cardRepository.exists(generateId(card), card.ID);
                }
            }
        }]
);


services.factory('PracticeSessionService', ['CardRepository',
    function (cardRepository) {
        var PRACTICE_CARD_DECK_SIZE = 3; // TODO: Move to configuration service
        var REQUIRED_WINSTREAK_FOR_LEARN = 2;


        function calculateDayDiff(time1, time2) {
            var oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            return (time1 - time2) / oneDay;
        }

        function compareScore(card1, card2) {
            var card1Score = card1.timesAnsweredCorrectly / card1.timesAnswered;
            var card2Score = card2.timesAnsweredCorrectly / card2.timesAnswered;

            if (card1Score < card2Score)
                return -1;
            if (card1Score > card2Score)
                return 1;
            return 0;
        }

        function isEligibleForReview(card) {
            var additionalWinstreak = card.winstreak - REQUIRED_WINSTREAK_FOR_LEARN;
            var waitDays = Math.pow(2, additionalWinstreak);
            var daysSinceLastVisit = calculateDayDiff(card.lastVisitedTime, Date.now());
            return (waitDays - daysSinceLastVisit <= 0);
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

            createPracticeCardDeck: function () {
                var cardsForPractice = [];
                var learnedCards = [];
                var activeCards = [];
                var pendingCards = [];
                var cards = cardRepository.getAll();

                if (cards.length < PRACTICE_CARD_DECK_SIZE) {
                    PRACTICE_CARD_DECK_SIZE = cards.length;
                }

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

//                learnedCards.sort(function (card1, card2) {
//                    if (card1.lastVisitedTime > card2.lastVisitedTime) {
//                        return 1;
//                    }
//                    else {
//                        return -1;
//                    }
//                });
//                console.log(learnedCards);

                // 1) Add learned cards for repetition
                for (i = 0; i < learnedCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
//                    var additionalWinstreak = learnedCards[i].winstreak - REQUIRED_WINSTREAK_FOR_LEARN;
//                    var waitDays = Math.pow(2, additionalWinstreak);
//                    console.log("LVD: " + learnedCards[i].lastVisitedTime);
//                    console.log("NOW: " + Date.now());
//                    var daysSinceLastVisit = calculateDayDiff(learnedCards[i].lastVisitedTime, Date.now()); // 0; //TODO: Something
//                    if (waitDays - daysSinceLastVisit <= 0) {
                    if (isEligibleForReview(learnedCards[i])) {
                        cardsForPractice.push(learnedCards[i]);
                        console.log("Adding learned card " + learnedCards[i].id + " for repetition.");
                    }

                }

                // 2) Add cards that are currently being practiced
                activeCards.sort(compareScore);
                for (i = 0; i < activeCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                    cardsForPractice.push(activeCards[i]);
                    console.log("Adding currently practiced card " + activeCards[i].id)
                }

                // 3) Add new cards
                for (i = 0; i < pendingCards.length
                    && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                    cardsForPractice.push(pendingCards[i]);
                    console.log("Adding new card " + pendingCards[i].id)
                }

                // 4) If there is still space, add more already lerned cards
                if (cardsForPractice.length < PRACTICE_CARD_DECK_SIZE) {
                    for (i = 0; i < learnedCards.length
                             && cardsForPractice.length < PRACTICE_CARD_DECK_SIZE; i++) {
                        if (cardsForPractice.indexOf(learnedCards[i]) < 0) {
                            cardsForPractice.push(learnedCards[i]);
                            console.log("Adding additional already learned card " + learnedCards[i].id)
                        }
                    }
                }

                return cardsForPractice;
            }
        };
    }
]);


services.factory("ImportExportService", [
    function () {

    }
]);


services.factory("CardRepository", [
    function () {
        var db = new localStorageDB("cartaflash", localStorage);

        if (true) {
            db.dropTable("cards");
            db.createTable("cards",
                ["id", "front", "back", "timesAnswered", "timesAnsweredCorrectly",
                    "winstreak", "lastVisitedTime", "lastUpdated"]);
            db.insert("cards", { id: "SER|TO BE", front:"Ser", back:"To be"});
            db.insert("cards", { id: "HACER|TO DO", front:"Hacer", back:"To do"});
            db.insert("cards", { id: "DESVANECER|TO FADE", front:"Desvanecer", back:"To fade"});
            db.insert("cards", { id: "NALGEAR|TO SPANK", front:"Nalgear", back:"To spank"});
            db.insert("cards", { id: "CHIFLADO|MADMAN", front:"Chiflado", back:"Madman"});
            db.commit();
        }

        return {
            getAll: function () {
                var result = db.queryAll("cards", { sort: [
                    ["lastUpdated", "DESC"]
                ] });
                return result;
            },

            getById: function (id) {
                var result = db.query("cards", { id: id });
                return result[0];
            },

            add: function (card) {
                card.lastUpdated = Date.now();
                var id = db.insert("cards", card);
                db.commit();
                return id;
            },

            update: function (card) {
                card.lastUpdated = Date.now();
                db.update("cards", { id: card.id }, function (modifiedCard) {
                    modifiedCard = angular.copy(card);
                    return modifiedCard;
                });
                db.commit();
            },

            delete: function (id) {
                db.deleteRows("cards", { id: id });
                db.commit();
            },

            exists: function (id, excludeId) {
                var result = null;
                if (typeof excludeId !== "undefined") {
                    result = db.query("cards", function (row) {
                        return row.id === id && row.ID !== excludeId;
                    });
                }
                else {
                    result = db.query("cards", { id: id });
                }
                return result.length > 0;
            }
        }
    }
])
;
