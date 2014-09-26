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

controllers.controller('PracticeSessionController',
    ['$scope', 'KeyPressService', 'CardRepository', 'PracticeSessionService',
        function ($scope, keyPressService, cardRepository, practiceSessionService) {
//            var currentCardIndex = 0;
            var answerIsRevealed = false;
            var currentCard = null;
//            var remainingCards = null;
//            var originalDeck = null;


            (function () {
                practiceSessionService.loadSession();
                if (practiceSessionService.isSessionStarted()
                    && !practiceSessionService.isSessionFinished()) {
                    currentCard = practiceSessionService.nextCard();
                }
            })();


            $scope.$on("key-pressed", function () {
                    if (!$scope.isSessionStarted()) {
                        if (keyPressService.hasEnterKey()) {
                            $scope.startSession();
                        }
                    }
                    else if ($scope.isSessionStarted() && !$scope.isSessionFinished()) {
                        if (keyPressService.hasDownArrow()) {
                            $scope.revealAnswer();
                        }
                        else if (answerIsRevealed) {
                            if (keyPressService.hasLeftArrow()) {
                                $scope.fail();
                            }
                            else if (keyPressService.hasRightArrow()) {
                                $scope.success();
                            }
                        }
                    }
                    else if ($scope.isSessionFinished()) {
                        if (keyPressService.hasEnterKey()) {
                            $scope.restart();
                        }
                    }
                }
            );

            $scope.getCurrentCard = function () {
                return currentCard;
            };

            $scope.nextCard = function () {
                if (!practiceSessionService.isSessionFinished()) {
                    answerIsRevealed = false;
                    currentCard = practiceSessionService.nextCard();
                }
                else {
                    console.log("Ru!");
//                    currentCard = null;
//                if (!practiceSessionService.isSessionFinished()) {
                    practiceSessionService.endSession();
                }
            };

            $scope.success = function () {
                practiceSessionService.success();
                $scope.nextCard();
            };

            $scope.fail = function () {
                practiceSessionService.fail();
                $scope.nextCard();
            };

            $scope.revealAnswer = function () {
                answerIsRevealed = true;
            };

            $scope.currentProgress = function () {
                return practiceSessionService.currentProgress();
            };

            $scope.answerIsRevealed = function () {
                return answerIsRevealed;
            };

            $scope.isSessionStarted = function () {
                return practiceSessionService.isSessionStarted();
            };

            $scope.isSessionFinished = function () {
                return practiceSessionService.isSessionFinished();
            };

            $scope.startSession = function () {
                practiceSessionService.startSession();
//                remainingCards = practiceSessionService.createPracticeCardDeck();
//                originalDeck = angular.copy(remainingCards);
//                currentCardIndex = -1;
                $scope.nextCard();
            };

            $scope.getOriginalDeck = function () {
                return practiceSessionService.getOriginalDeck();
            }

            $scope.restart = function() {
                practiceSessionService.resetSession()
            }

        }
    ]);


controllers.controller("ImportExportController", ["$scope", "ImportExportService", "CardRepository",
    function ($scope, importExportService, cardRepository) {
        $scope.exportState = function () {
            return cardRepository.exportAsJson();
        };

        $scope.importState = function (pastedState) {
            importExportService.loadState(pastedState);
        };
    }
]);


controllers.controller("ConfigController", ["$scope",
    function ($scope) {

    }
]);

controllers.controller('CardCrudController', ['$scope', '$http', 'CardService',
    function ($scope, $http, cardService) {
        var lastUpdatedCard = null;
        var lastDeletedCard = null;
        var cardForEdit = null;
        var cardBeforeEdit = null;
        var importedCards = [];

        (function () {
            console.log("SLAP!");
            cardService.refresh();
        }());

        function hasInput(text) {
            return typeof text !== "undefined"
                && text !== null
                && text.trim() !== "";
        }

        function addCard(card) {
            cardService.add(card);
            lastUpdatedCard = angular.copy(card);
            $scope.card = null;
        }

        function updateCard(card) {
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
            $scope.pastedCards = "";
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