'use strict';

/* Services */

var services = angular.module('cartaflash.services', []);

services.factory('KeyPressService', [
        function () {
            var LEFT_ARROW = 37;
            var RIGHT_ARROW = 39;
            var DOWN_ARROW = 40;
            var ENTER = 13;
            var _keyCode = 0;

            return {
                getKeypress: function () {
                    return _keyCode;
                },
                setKeypress: function (keyCode) {
                    _keyCode = keyCode;
                },
                hasRightArrow: function () {
                    return _keyCode === RIGHT_ARROW;
                },
                hasLeftArrow: function () {
                    return _keyCode === LEFT_ARROW;
                },
                hasDownArrow: function () {
                    return _keyCode === DOWN_ARROW;
                },
                hasEnterKey: function () {
                    return _keyCode === ENTER;
                }
//                clearInput: function () {
//                    _keyCode = 0;
//                }
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
                    card.timesAnswered = 0;
                    card.timesAnsweredCorrectly = 0;
                    card.lastVisitedTime = null;
//                    card.lastUpdated = Date.now();

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
                },

                refresh: function () {
                    cards = cardRepository.getAll();
                }
            }
        }]
);


services.factory('PracticeSessionService', ['CardRepository',
    function (cardRepository) {
        var PRACTICE_CARD_DECK_SIZE = 20;
        var REQUIRED_WINSTREAK_FOR_LEARN = 3;

        var remainingCards = null;
//        var originalDeck = null;
        var currentCardIndex = 0;
        var completedCards = [];

//        function saveSession() {
//            cardRepository.saveSession(remainingCards, currentCardIndex, originalDeck);
//        }

        function createPracticeCardDeck() {
            var cardsForPractice = [];
            var learnedCards = [];
            var activeCards = [];
            var pendingCards = [];
            var cards = cardRepository.getAll();
            var currentPracticeCardDeckSize = PRACTICE_CARD_DECK_SIZE;

            if (cards.length < currentPracticeCardDeckSize) {
                currentPracticeCardDeckSize = cards.length;
            }


            var i;

            // Initialiing card decks.
            for (i = 0; i < cards.length; i++) {
                if (cards[i].lastVisitedTime === null) {
                    pendingCards.push(cards[i]);
                }
                else {
                    if (cards[i].winstreak >= REQUIRED_WINSTREAK_FOR_LEARN) {
                        learnedCards.push(cards[i]);
                    }
                    else {
                        activeCards.push(cards[i]);
                    }
                }
            }

            console.log(PRACTICE_CARD_DECK_SIZE);
            console.log(activeCards.length);
            console.log(learnedCards.length);
            console.log(pendingCards.length);

            // 1) Add learned cards for repetition
            for (i = 0; i < learnedCards.length
                && cardsForPractice.length < currentPracticeCardDeckSize; i++) {
                if (isEligibleForReview(learnedCards[i])) {
                    learnedCards[i].origin = "Learned card for repetition.";
                    cardsForPractice.push(learnedCards[i]);
                    console.log("Adding learned card " + learnedCards[i].id + " for repetition.");
                }

            }

            // 2) Add cards that are currently being practiced
            activeCards.sort(compareScore);
            for (i = 0; i < activeCards.length
                && cardsForPractice.length < currentPracticeCardDeckSize; i++) {
                activeCards[i].origin = "Currently practicing.";
                cardsForPractice.push(activeCards[i]);
                console.log("Adding currently practiced card " + activeCards[i].id)
            }

            // 3) Add new cards
            for (i = 0; i < pendingCards.length
                && cardsForPractice.length < currentPracticeCardDeckSize; i++) {
                cardsForPractice.push(pendingCards[i]);
                pendingCards[i].origin = "New, fresh card.";
                console.log("Adding new card " + pendingCards[i].id)
            }

            // 4) If there is still space, add more already learned cards
            if (cardsForPractice.length < currentPracticeCardDeckSize) {
                learnedCards.sort(function (card1, card2) {
                    if (card1.lastVisitedTime > card2.lastVisitedTime) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                });
                for (i = 0; i < learnedCards.length
                    && cardsForPractice.length < currentPracticeCardDeckSize; i++) {
                    if (cardsForPractice.indexOf(learnedCards[i]) < 0) {
                        learnedCards[i].origin = "Already learned, but needed to fill the deck.";
                        cardsForPractice.push(learnedCards[i]);
                        console.log("Adding additional already learned card " + learnedCards[i].id)
                    }
                }
            }

            cardsForPractice = shuffle(cardsForPractice);
            return cardsForPractice;
        }

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }

        function calculateDayDiff(time1, time2) {
            var oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            return Math.round(Math.abs((time1.getTime() - time2.getTime()) / oneDay));
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
            var daysSinceLastVisit = calculateDayDiff(new Date(card.lastVisitedTime), new Date());
            console.log()
            console.log("Id: " + card.id + ", " + "DSLV: " + daysSinceLastVisit, ", WD: " + waitDays);
            return (waitDays - daysSinceLastVisit <= 0);
        }

        return {

            loadSession: function () {
                var sessionState = cardRepository.loadSession();
                if (sessionState !== null) {
                    remainingCards = sessionState.remainingCards;
                    completedCards = sessionState.completedCards;
//                    originalDeck = sessionState.originalDeck;
                    currentCardIndex = sessionState.currentCardIndex;
                }
            },

            endSession: function () {
                cardRepository.deleteSession();
            },

            nextCard: function () {
                cardRepository.saveSession(remainingCards, currentCardIndex, completedCards);
                currentCardIndex++;

                if (currentCardIndex >= remainingCards.length) {
                    currentCardIndex = 0;
                }

                var nextCard = cardRepository.getById(remainingCards[currentCardIndex].id);
                if (nextCard != null) { // Card was deleted during practice session
                    nextCard.origin = remainingCards[currentCardIndex].origin;
                    return nextCard;
                }
                else {
                    remainingCards.splice(currentCardIndex, 1);
                    currentCardIndex -= 1;
                    return this.nextCard();
                }
            },

            success: function () {
                var card = cardRepository.getByInternalId(remainingCards[currentCardIndex].ID);
                card.winstreak += 1;
                card.timesAnswered += 1;
                card.timesAnsweredCorrectly += 1;
                card.lastVisitedTime = Date.now();
                cardRepository.update(card);
                remainingCards.splice(currentCardIndex, 1);
                completedCards.push(card);
                currentCardIndex -= 1;
            },

            fail: function () {
                var card = cardRepository.getByInternalId(remainingCards[currentCardIndex].ID);
                card.winstreak = 0;
                card.timesAnswered += 1;
                card.lastVisitedTime = Date.now();
                cardRepository.update(card);
            },

            startSession: function () {
                remainingCards = createPracticeCardDeck();
//                originalDeck = angular.copy(remainingCards);
                currentCardIndex = -1;
            },

            isSessionStarted: function () {
                return remainingCards !== null;
            },

            isSessionFinished: function () {
                return remainingCards !== null && remainingCards.length === 0;
            },

            terminateSession: function () {
                remainingCards = [];
            },

//            getOriginalDeck: function () {
//                return originalDeck;
//            },

            currentProgress: function () {
                var totalNoOfCards = completedCards.length + remainingCards.length;
                return (1 - ((remainingCards.length - 1) / totalNoOfCards)) * 100;
            },

            resetSession: function () {
                cardRepository.deleteSession();
                remainingCards = null;
//                originalDeck = null;
                completedCards = [];
                currentCardIndex = 0;
            },

            hasRequiredWinstreak: function (card) {
                return card.winstreak >= REQUIRED_WINSTREAK_FOR_LEARN;
            },

            getCompletedCards: function () {
                return completedCards;
            }
        };
    }
])
;


services.factory("ImportExportService", ["CardRepository",
    function (cardRepository) {
        return {
            loadState: function (pastedState) {
                var stateAsJson = JSON.parse(pastedState);
                cardRepository.resetTo(stateAsJson);
            }
        }
    }
]);


services.factory("CardRepository", [
    function () {
        var db = new localStorageDB("cartaflash", localStorage);
//        var db = new localStorageDB("cf_test", localStorage);
        createNonexistingTables();

        if (!true) {
//            if (db.tableExists("cards")) {
//                db.dropTable("cards");
//            }
            if (db.tableExists("session")) {
                db.dropTable("session");
            }
//            db.createTable("cards",
//                ["id", "front", "back", "timesAnswered", "timesAnsweredCorrectly",
//                    "winstreak", "lastVisitedTime", "lastUpdated"]);
//
            db.createTable("session",
                ["remainingCards", "currentCardIndex", "completedCards"]);
//
//            db.insert("cards", { id: "SER|TO BE", front: "Ser", back: "To be"});
//            db.insert("cards", { id: "HACER|TO DO", front: "Hacer", back: "To do"});
//            db.insert("cards", { id: "DESVANECER|TO FADE", front: "Desvanecer", back: "To fade"});
//            db.insert("cards", { id: "NALGEAR|TO SPANK", front: "Nalgear", back: "To spank"});
//            db.insert("cards", { id: "CHIFLADO|MADMAN", front: "Chiflado", back: "Madman"});

//            db.commit();
        }

        function createNonexistingTables() {
            if (!db.tableExists("cards")) {
                db.createTable("cards",
                    ["id", "front", "back", "timesAnswered", "timesAnsweredCorrectly",
                        "winstreak", "lastVisitedTime", "lastUpdated"]);
                db.commit();
            }

            if (!db.tableExists("session")) {
                db.createTable("session",
                    ["remainingCards", "currentCardIndex", "completedCards"]);
                db.commit();
            }
        }

        function firstOrNull(result) {
            if (result.length > 0) {
                return result[0];
            }
            else {
                return null;
            }
        }

        return {
            getAll: function () {
                var result = db.query("cards");
                return result.sort(function (x, y) {
                    if (x.lastUpdated > y.lastUpdated) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                });
            },

            getById: function (id) {
                var result = db.query("cards", { id: id });
                return firstOrNull(result);
            },


            getByInternalId: function (ID) {
                var result = db.query("cards", { ID: ID });
                return firstOrNull(result);
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
            },

            saveSession: function (remainingCards, currentCardIndex, completedCards) {
                this.deleteSession();
                db.insert("session", {
                    remainingCards: remainingCards,
                    currentCardIndex: currentCardIndex,
                    completedCards: completedCards
                });
                db.commit();
            },

            loadSession: function () {
                var session = db.query("session");
                if (session.length > 0) {
                    return session[0];
                }
                else {
                    return null;
                }
            },

            deleteSession: function () {
                db.truncate("session");
                db.commit();
            },

            exportAsJson: function () {
                return db.serialize();
            },

            resetTo: function (serializedDb) {
                db.truncate("cards");
                db.truncate("session");
                db.commit();

                var serializedCards = serializedDb.data.cards;
                for (var cardKey in serializedCards) {
                    db.insert("cards", serializedCards[cardKey]);
                }
                db.commit();
            }
        }
    }
])
;
