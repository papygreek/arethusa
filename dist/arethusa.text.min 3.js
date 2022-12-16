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

"use strict";angular.module("arethusa.text",[]),angular.module("arethusa.text").directive("artificialTokenToggle",["text",function(a){return{restrict:"A",scope:{},link:function(b,c,d){b.text=a},templateUrl:"js/arethusa.text/templates/artificial_token_toggle.html"}}]),angular.module("arethusa.text").directive("textContext",["navigator",function(a){return{restrict:"A",scope:{sentence:"=textContext"},link:function(b,c,d){b.$watch("sentence",function(a,c){b.context=b.sentence?b.sentence.toString():""}),b.goToSentence=function(){b.sentence&&a.goTo(b.sentence.id)}},templateUrl:"js/arethusa.text/templates/text_context.html"}}]),angular.module("arethusa.text").service("text",["state","configurator","navigator","keyCapture","commons","userPreferences",function(a,b,c,d,e,f){function g(){b.getConfAndDelegate(l,m),l.hideArtificialTokens=!1}function h(a,b,c){c.artificial||(a[b]=c)}function i(a,b,c){c.artificial||delete a[b]}function j(){return arethusaUtil.inject({},a.tokens,h)}function k(){var a=!l.showContext;f.set(l.name,"showContext",a),l.showContext=a}var l=this;this.name="text";var m=["showContext"];this.setTokens=function(){l.tokens=l.hideArtificialTokens?j():a.tokens},a.on("tokenAdded",function(a,b){l.hideArtificialTokens&&h(l.tokens,b.id,b)}),a.on("tokenRemoved",function(a,b){l.hideArtificialTokens&&i(l.tokens,b.id,b)}),this.context=c.status.context,this.settings=[e.setting("Show Context","showContext")],d.initCaptures(function(a){return{text:[a.create("toggleContext",k,"k")]}}),this.init=function(){g(),l.setTokens()}}]),angular.module("arethusa.text").run(["$templateCache",function(a){a.put("js/arethusa.text/templates/artificial_token_toggle.html",'<label>\n  Hide artificial tokens\n  <input\n    type="checkbox"\n    style="margin: 0"\n    ng-model="text.hideArtificialTokens"\n    ng-change="text.setTokens()"/>\n</label>\n'),a.put("js/arethusa.text/templates/text_context.html",'<span\n  ng-click="goToSentence()"\n  class="text-context">\n  {{ context }}\n</span>\n')}]);
//# sourceMappingURL=arethusa.text.min.map