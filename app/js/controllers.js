'use strict';

/* Controllers */

var controllers = angular.module('cartaflash.controllers', []);
//    .controller('MyCtrl1', ['$scope', function ($scope) {
//
//    }])
//    .controller('MyCtrl2', ['$scope', function ($scope) {
//
//    }])

controllers.controller('KeyEventController', ['$scope', 'KeyPressService',
    function ($scope, $keyPressService) {
        $scope.keypressed = function (event) {
            $keyPressService.setKeypress(event.keyCode);
            $scope.$broadcast("key-pressed");
        }

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

controllers.controller('CardController', ['$scope', '$http', '$timeout', 'KeyPressService',
    function ($scope, $http, $timeout, $keyPressService) {
        var currentCardIndex = 0;
        var totalNumberOfCards = 0;
        var answerIsRevealed = false;

        $scope.currentCard = {};
        $scope.testOutput = "init";

//        (function processKeyEvents() {
//            if ($keyPressService.hasKeyRevealAnswer()) {
//                $timeout(function () {
//                    $scope.revealAnswer();
//                    $scope.testOutput = "Reveal answer.";
//                }, 0);
//            }
//            else if ($keyPressService.hasKeyFail()
//                || $keyPressService.hasKeySuccess()) {
//                $timeout(function () {
//                    $scope.nextCard();
//                    $scope.testOutput = "Next card.";
//                }, 0);
//            }
//            $keyPressService.clearInput();
//            setTimeout(processKeyEvents, 100);
//        })();


        $http.get('cards.json').success(function (data) {
            $scope.cards = data;
            totalNumberOfCards = data.length;
        });

        $scope.$on("key-pressed", function () {
                console.log("KEYPRESS!");
                if ($keyPressService.hasKeyRevealAnswer()) {
                    $scope.revealAnswer();
                    $scope.testOutput = "Reveal answer.";
                }
                else if (($keyPressService.hasKeyFail()
                    || $keyPressService.hasKeySuccess())
                    && answerIsRevealed) {
                    $scope.nextCard();
                    $scope.testOutput = "Next card.";
                }
            }
        )

        $scope.nextCard = function () {
            answerIsRevealed = false,
                currentCardIndex++;
            if (currentCardIndex >= totalNumberOfCards) {
                currentCardIndex = 0;
            }
            console.log(currentCardIndex);
            $scope.currentCard.front = $scope.cards[currentCardIndex].front;
            $scope.currentCard.back = '';
            console.log("New card: " + $scope.currentCard.front + ' / ' + $scope.currentCard.back);
        }

        $scope.revealAnswer = function () {
            answerIsRevealed = true;
            $scope.currentCard.back = $scope.cards[currentCardIndex].back
//            console.log("Reveal!");
//            console.log("WHOO: " + $keyPressService.getKeypress());
        }

        $scope.passKeyboardInput = function (keyEvent) {
            console.log(keyEvent);
        }

        $scope.currentProgress = function () {
            return (currentCardIndex / totalNumberOfCards) * 100;
        }

        $scope.answerIsRevealed = function () {
            return answerIsRevealed;
        }


    }
]);


controllers.controller('CardCrudController', ['$scope', '$http', 'CardService',
    function ($scope, $http, $cardService) {
        $cardService.loadCards();
        var lastUpdatedCard = null;
        var lastDeletedCard = null;
        var cardForEdit = null;
        var cardBeforeEdit = null;

        $scope.getAllCards = function () {
            return $cardService.getAll();
        }

        $scope.addCard = function (card) {
            $cardService.add(card);
            lastUpdatedCard = angular.copy(card);
            $scope.card = null;
        }

        $scope.deleteCard = function (card) {
            lastUpdatedCard = null;
            lastDeletedCard = card;
            if ($scope.isEditing(card)) {
                $scope.cancelEdit();
            }
            $cardService.delete(card);
        }

        $scope.updateCard = function (card) {
            $cardService.update(card);
            $scope.cancelEdit();
            lastUpdatedCard = card;
        }

        $scope.isRecentlyAdded = function(card) {
            return lastUpdatedCard !== null
                && $cardService.getIdOf(card) === $cardService.getIdOf(lastUpdatedCard);
        }

        $scope.hasDeletedCard = function () {
            return lastDeletedCard !== null;
        }

        $scope.getLastDeletedCard = function () {
            return lastDeletedCard;
        }

        $scope.undoDelete = function () {
//            $scope.addCard(lastDeletedCard);
            $cardService.add(lastDeletedCard);
            lastUpdatedCard = angular.copy(lastDeletedCard);
            lastDeletedCard = null;

        }

        $scope.editCard = function (card) {
            cardForEdit = card;
            $scope.card = angular.copy(card);
            console.log("ZAP!");
        }

        $scope.isEditing = function (card) {
            return cardForEdit !== null && card !== null
                && $cardService.getIdOf(card) === $cardService.getIdOf(cardForEdit);
        }

        $scope.isInEditMode = function () {
            return cardForEdit !== null;
        }

        $scope.cancelEdit = function () {
            $scope.card = cardBeforeEdit;
            cardBeforeEdit = null;
            cardForEdit = null;
        }

    }
]);