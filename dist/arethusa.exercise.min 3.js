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

"use strict";angular.module("arethusa.exercise",["arethusa.morph"]),angular.module("arethusa.exercise").directive("fillInTheBlankForm",function(){return{restrict:"A",scope:!0,link:function(a,b,c){a.validatedClass=function(){var b=a.plugin.report;if(b)return b.tokens[a.id].correct?"right-answer":"wrong-answer"}},templateUrl:"js/arethusa.exercise/templates/fill_in_the_blank_form.html"}}),angular.module("arethusa.exercise").service("fillInTheBlank",["configurator","morph","state",function(a,b,c){function d(){a.getConfAndDelegate("fillInTheBlank",f),f.started=!1,f.answers={}}function e(){return arethusaUtil.inject({},c.tokens,function(a,b,c){var d=c.morphology.attributes;if(d&&"verb"==d.pos&&d.mood){var e=c.morphology.lemma.replace(/\d/g,"");a[b]={hint:e,answer:c.string,token:c}}})}var f=this;d(),this.hintFor=function(a){return f.exercises[a].hint},this.isExerciseTarget=function(a){return a in f.exercises},this.validate=function(){var a={tokens:{},correct:0,wrong:0};return angular.forEach(f.exercises,function(b,c){var d={},e=b.answer,g=f.answers[c];e==g?(a.correct++,d.correct=!0):(a.wrong++,d.correct=!1,d.answer=e,d.input=g||"nothing"),a.tokens[c]=d}),f.report=a,a},this.init=function(){d(),delete f.report,f.exercises=e()}}]),angular.module("arethusa.exercise").service("instructor",["fillInTheBlank","configurator",function(a,b){function c(){b.getConfAndDelegate("instructor",e)}function d(){e.done=!1,e.startedAt=!1,e.stoppedAt=!1,e.report={}}var e=this;c(),this.start=function(){e.startedAt=new Date,a.started=!0,e.started=!0},this.stop=function(){e.stoppedAt=new Date,e.started=!1,e.report=a.validate(),e.time=e.timeElapsedFormatted(),e.done=!0},this.timeElapsed=function(){return Math.round(e.stoppedAt-e.startedAt)};var f=arethusaUtil;this.timeElapsedFormatted=function(){var a=Math.round(e.timeElapsed()/1e3),b=a/60,c=a%b;return f.formatNumber(b,2)+":"+f.formatNumber(c,2)},this.init=function(){c(),d()}}]),angular.module("arethusa.exercise").run(["$templateCache",function(a){a.put("js/arethusa.exercise/templates/fill_in_the_blank_form.html",'<input\n  class="inline-form"\n  ng-class="validatedClass()"\n  type="text"\n  ng-model="plugin.answers[id]">\n</input>\n'),a.put("js/arethusa.exercise/templates/fill_in_the_blank.html",'<div class="small-12 columns small-text-center" ng-hide="plugin.started">\n  <em>Read the instructions and hit start when you\'re ready</em>\n</div>\n\n<div class="small-12 columns" ng-show="plugin.started">\n  <p class="text-justify">\n  <span ng-repeat="(id, token) in state.tokens">\n    <span ng-if="plugin.isExerciseTarget(id)">\n      <span fill-in-the-blank-form></span>\n      <span class="note"><em>({{ plugin.hintFor(id) }})</em></span>\n    </span>\n    <span ng-if="! plugin.isExerciseTarget(id)"\n      hover="true"\n      token="token">\n    </span>\n    <br ng-if="aU.isTerminatingPunctuation(token.string)"/>\n  </span>\n  </p>\n</div>\n'),a.put("js/arethusa.exercise/templates/instructor.html",'<div class="small-text-center">\n  <em>Fill in the blanks!</em>\n</div>\n\n<div style="margin-top: 2em" class="small-text-center">\n  <button class="tiny radius" ng-click="plugin.start()" ng-show="! plugin.started">Start</button>\n  <button class="tiny radius" ng-click="plugin.stop()" ng-show="plugin.started">Stop</button>\n</div>\n\n\n<div style="margin-top: 2em" class="small-text-center" ng-if="plugin.done">\n  <div class="small-12 columns">\n    <span class="small-3 columns note">\n      <span class="right">Time elapsed</span>\n    </span>\n    <span class="small-9 columns end">\n      <span class="left">{{ plugin.time }}</span>\n    </span>\n  </div>\n</div>\n\n<div class="small-text-center" style="margin-top: 20px" ng-if="plugin.done">\n  <div style="margin-top: 20px" class="small-12 columns">\n    <span class="small-3 columns note">\n      <span class="right right-answer">Right answers</span>\n    </span>\n    <span class="small-9 columns end">\n      <span class="left">{{ plugin.report.correct }}</span>\n    </span>\n  </div>\n  <div class="small-12 columns">\n    <span class="small-3 columns note">\n      <span class="right wrong-answer">Wrong answers</span>\n    </span>\n    <span class="small-9 columns end">\n      <span class="left">{{ plugin.report.wrong }}</span>\n    </span>\n  </div>\n</div>\n<div style="margin-top: 30px" class="small-12 columns">\n  <ul>\n    <li ng-repeat="token in plugin.report.tokens" ng-if="! token.correct">\n      Right answer is {{ token.answer }}, you had {{ token.input }}\n    </li>\n  </ul>\n</div>\n')}]);
//# sourceMappingURL=arethusa.exercise.min.map