/*
 * Arethusa - a backend-independent client-side annotation framework
 * http://github.com/alpheios-project/arethusa
 *
 * Version 0.2.5
 * built from branch main
 * at 11f2326e8925e6f74267368ff4e5fead947f648d
 * on 2022-12-14T11:26:52.705Z
 *
 * Published under the MIT license
 */

"use strict";angular.module("arethusa.inlineComments",[]),angular.module("arethusa.inlineComments").directive("inlineComment",["state",function(a){return{restrict:"A",scope:{token:"=commentToken"},link:function(b,c,d){function e(c,d){var e=c,f=d;return function(){b.comment=f,a.change(e,"comment",f)}}function f(a){var c=a;return function(){b.comment=c}}b.comment=b.token.comment?b.token.comment:"",b.updateState=function(){b.comment!=b.token.comment&&a.change(b.token,"comment",b.comment,e(b.token,b.token.comment),f(b.comment))}},templateUrl:"js/arethusa.inline_comments/templates/inline_comment.html"}}]),angular.module("arethusa.inlineComments").service("inlineComments",["state","configurator","userPreferences",function(a,b,c){function d(){b.getConfAndDelegate(e,f)}var e=this;this.name="inlineComments";var f=[];this.init=function(){d()}}]),angular.module("arethusa.inlineComments").run(["$templateCache",function(a){a.put("js/arethusa.inline_comments/templates/inline_comment.html",'<input type="text" ng-model="comment" ng-blur="updateState()" class="no-margin"/>')}]);
//# sourceMappingURL=arethusa.inline_comments.min.map