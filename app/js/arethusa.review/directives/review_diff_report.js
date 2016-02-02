"use strict";

angular.module('arethusa.review').directive('reviewDiffReport', [
  'review',
  'state',
  function(review, state) {
    return {
      restrict: 'A',
      scope: {},
      compile: function() {
        return {
          pre: function(scope, element, attrs) {
            scope.rev = review;
          }
        };
      },
      templateUrl: 'js/arethusa.review/templates/review_diff_report.html'
    };
  }
]);

