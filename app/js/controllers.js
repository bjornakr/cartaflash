'use strict';

/* Controllers */

var controllers = angular.module('cartaflash.controllers', []);

controllers.controller('KeyEventController', ['$scope', 'KeyPressService',
    function ($scope, $keyPressService) {
        $scope.keypressed = function (event) {
            $keyPressService.setKeypress(event.keyCode);
            $scope.$broadcast("key-pressed");
        };

        $scope.getKeyCode = function () {
            return $keyPressService.getKeypress();
        }
    }
]);

controllers.controller('NavBarController', ['$scope', '$location',
    function ($scope, $location) {
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }
]);

controllers.controller('CardController',
    ['$scope', 'KeyPressService', 'CardRepository', 'PracticeSessionService',
        function ($scope, keyPressService, cardRepository, practiceSessionService) {
            var currentCardIndex = 0;
            var answerIsRevealed = false;
            var isSessionStarted = false;
            var isSessionFinished = false;
            var currentCard = null;
            var cards = [];
            var originalDeckSize = 0;
            var originalDeck = null;
            $scope.testOutput = "init";


            $scope.$on("key-pressed", function () {
                    if (isSessionStarted && !isSessionFinished) {
                        if (keyPressService.hasKeyRevealAnswer()) {
                            $scope.revealAnswer();
                            $scope.testOutput = "Reveal answer.";
                        }
                        else if (answerIsRevealed) {
                            if (keyPressService.hasKeyFail()) {
                                $scope.nextCard();
                            }
                            else if (keyPressService.hasKeySuccess()) {
                                $scope.win();
                            }
                        }
                    }
                }
            );

            $scope.getCurrentCard = function () {
                return currentCard;
            };

            $scope.nextCard = function () {
                if ($scope.getTotalNumberOfCards() === 0) {
                    isSessionFinished = true;
                }
                else {
                    answerIsRevealed = false;
                    currentCardIndex++;
                    console.log("cci2: " + currentCardIndex);

                    if (currentCardIndex >= $scope.getTotalNumberOfCards()) {
                        console.log("OUCH!");
                        currentCardIndex = 0;
                    }
//                    currentCard = cards[currentCardIndex];
                    console.log("cci: " + currentCardIndex);
                    currentCard = cardRepository.getById(cards[currentCardIndex].id);

//                    currentCard.front = cards[currentCardIndex].front;
//                    currentCard.back = '';
                }
            };

            $scope.win = function () {
                practiceSessionService.win(cards[currentCardIndex]);
                console.log(cards);
                cards.splice(currentCardIndex, 1);
                console.log(cards);
                currentCardIndex -= 1;
                $scope.nextCard();
            };

            // TODO: Change name
            $scope.lose = function () {
                practiceSessionService.lose(cards[currentCardIndex]);
                $scope.nextCard();
            };

            $scope.getTotalNumberOfCards = function () {
                return cards.length;
            };

            $scope.revealAnswer = function () {
                answerIsRevealed = true;
//                currentCard.back = cards[currentCardIndex].back;
            };

            $scope.passKeyboardInput = function (keyEvent) {
                console.log(keyEvent);
            };

            $scope.currentProgress = function () {
                return (1 - ($scope.getTotalNumberOfCards()) / originalDeckSize) * 100;
            };

            $scope.answerIsRevealed = function () {
                return answerIsRevealed;
            };

            $scope.isSessionStarted = function () {
                return isSessionStarted;
            };

            $scope.isSessionFinished = function () {
                return isSessionFinished;
            };

            $scope.startSession = function () {
//                var allCards = cardRepository.getAll();
                cards = practiceSessionService.createPracticeCardDeck();
                currentCardIndex = -1;
                originalDeckSize = cards.length;
                isSessionStarted = true;
                originalDeck = angular.copy(cards);
//                currentCard = cards[0];
                $scope.nextCard();
//            $scope.currentCard = $scope.cards[currentCardIndex];
            };

            $scope.getOriginalDeck = function () {
                return originalDeck;
            }

        }
    ]);


controllers.controller("ImportExportController", ["$scope",
   function ($scope) {
       $scope.click = function () {
           window.prompt("Copy to clipboard: Ctrl+C, Enter", "Ayayayayaya!");
           console.log("POW!");
       }
   }
]);


controllers.controller('CardCrudController', ['$scope', '$http', 'CardService',
    function ($scope, $http, cardService) {
        var lastUpdatedCard = null;
        var lastDeletedCard = null;
        var cardForEdit = null;
        var cardBeforeEdit = null;
        var importedCards = [];

        function hasInput(text) {
            return typeof text !== "undefined"
                && text !== null
                && text.trim() !== "";
        }

        function addCard (card) {
            cardService.add(card);
            lastUpdatedCard = angular.copy(card);
            $scope.card = null;
        }

        function updateCard (card) {
            cardService.update(card);
            $scope.cancelEdit();
            lastUpdatedCard = card;
        }

        $scope.getAllCards = function () {
            return cardService.getAll();
        };

        $scope.saveCard = function (card) {
            if ($scope.isEditing(card)) {
                updateCard(card);
            }
            else {
                addCard(card);
            }
        };

        $scope.deleteCard = function (card) {
            lastUpdatedCard = null;
            lastDeletedCard = card;
            if ($scope.isEditing(card)) {
                $scope.cancelEdit();
            }
            cardService.delete(card);
        };



        $scope.isRecentlyAdded = function (card) {
            return lastUpdatedCard !== null
                && card.id === lastUpdatedCard.id;
        };

        $scope.hasDeletedCard = function () {
            return lastDeletedCard !== null;
        };

        $scope.getLastDeletedCard = function () {

            return lastDeletedCard;
        };

        $scope.undoDelete = function () {
//            $scope.addCard(lastDeletedCard);
            cardService.add(lastDeletedCard);
            lastUpdatedCard = angular.copy(lastDeletedCard);
            lastDeletedCard = null;

        };

        $scope.editCard = function (card) {
            cardForEdit = card;
            $scope.card = angular.copy(card);
        };

        $scope.isEditing = function (card) {
            return cardForEdit !== null && card !== null
                && card.id === cardForEdit.id;
        };

        $scope.isInEditMode = function () {
            return cardForEdit !== null;
        };

        $scope.cancelEdit = function () {
            $scope.card = cardBeforeEdit;
            cardBeforeEdit = null;
            cardForEdit = null;
        };

        $scope.formHasValidInput = function () {
            return typeof $scope.card !== "undefined"
                && $scope.card !== null
                && hasInput($scope.card.front)
                && hasInput($scope.card.back);
        };

        $scope.exists = function (card) {
            return this.formHasValidInput(card) && cardService.exists(card);
        };

        $scope.isImported = function (card) {
            return importedCards.indexOf(card.id) >= 0;
        }

        $scope.importCards = function (rawCardData) {
            var lines = rawCardData.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var sides = lines[i].split("|");
                if (sides.length === 2) {
                    var card = {};
                    card.front = sides[0];
                    card.back = sides[1];
                    cardService.add(card);
                    importedCards.push(card.id);
                }
            }
        }
    }
]);