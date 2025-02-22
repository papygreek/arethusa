/**
 * @ngdoc overview
 * @name arethusa.util
 *
 * @description
 * Module of Arethusa's utility services
 */
angular.module('arethusa.util', []);

'use strict';
// Provides the global arethusaUtil object which comes with several
// utility functions
var arethusaUtil = {
    formatNumber: function (number, length) {
      // check if number is valid, otherwise return
      var parsed = parseInt(number, 10);
      if (isNaN(parsed)) {
        return number;
      } else {
        // coerce a fixnum to a string
        var n = '' + parsed;
        while (n.length < length) {
          n = '0' + n;
        }
        return n;
      }
    },

    formatKeyHint: function(mapping) {
      return mapping ? '(' + mapping +')' : '';
    },

    map: function (container, fn, args) {
      if (typeof fn === 'object') {
        var obj = fn;
        fn = function(el) { return obj[el]; };
      }

      if (typeof fn === 'string') {
        var str = fn;
        fn = function(el) { return el[str]; };
      }
      var result = [];
      container.forEach(function (e) {
        if (args) {
          var myArgs = [e];
          myArgs.push(args.slice(0));
          result.push(fn.apply(null,myArgs));
        } else {
          result.push(fn(e));
        }
      });
      return result;
    },

    inject: function (memo, container, fn) {
      if (arethusaUtil.isArray(container)) {
        container.forEach(function (el) {
          fn(memo, el);
        });
      } else {
        for (var key in container) {
          fn(memo, key, container[key]);
        }
      }
      return memo;
    },

    flatten: function(arr) {
      var res = [];
      for (var i = 0; i < arr.length; i ++) {
        var el = arr[i];
        if (el || el === false) res.push(el);
      }
      return res;
    },

    pushAll: function (target, pusher) {
      target.push.apply(target, pusher);
      return target;
    },

    findObj: function (object, fn) {
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          var val = object[key];
          if (fn(val)) {
            return val;
          }
        }
      }
    },

    findNestedProperties: function (nestedObj, properties) {
      var props = arethusaUtil.toAry(properties);
      return arethusaUtil.inject({}, props, function (memo, targetKey) {
        var fn = function (obj, key) {
          var res = [];
          if (obj.hasOwnProperty(key)) {
            res.push(obj);
          }
          for (var k in obj) {
            var v = obj[k];
            if (typeof v == 'object' && (v = fn(v, key))) {
              arethusaUtil.pushAll(res, v);
            }
          }
          return res;
        };
        memo[targetKey] = fn(nestedObj, targetKey);
      });
    },

    isArray: function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    },

    toAry: function (el) {
      if (!el) return [];

      if (arethusaUtil.isArray(el)) {
        return el;
      } else {
        return [el];
      }
    },

    intersect: function(a, b) {
      var t; // temp
      if (a.length < b.length) {
        t = b;
        b = a;
        a = t;
      }
      function isIncluded(el) { return arethusaUtil.isIncluded(b, el); }
      return a.filter(isIncluded);
    },

    isIncluded: function(arr, el) {
      return arr.indexOf(el) !== -1;
    },

    empty: function(obj) {
      if (arethusaUtil.isArray(obj)) {

        obj.splice(0, obj.length);
      } else {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            delete obj[key];
          }
        }
      }
    },

    last: function(arr) {
      return arr[arr.length - 1];
    },

    replaceAt: function (str, i, replacement) {
      return str.substring(0, i) + replacement + str.substring(i + 1);
    },

    isTerminatingPunctuation: function (str) {
      return str.match(/^[\.;:]$/);
    },

    /* global X2JS */
    xmlParser: new X2JS(),

    xml2json: function (xml) {
      return arethusaUtil.xmlParser.xml_str2json(xml);
    },

    json2xml: function(json) {
      return arethusaUtil.xmlParser.json2xml_str(json);
    },

    // Taken from https://gist.github.com/sente/1083506
    formatXml: function (xml) {
      var formatted = '';
      var lastNode = '';
      var appendedToLastNode;
      var reg = /(>)(<)(\/*)/g;
      xml = xml.toString().replace(reg, '$1\r\n$2$3');
      var pad = 0;
      var nodes = xml.split('\r\n');
      for(var n in nodes) {
        var node = nodes[n];
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\/\w/)) {
          if (pad !== 0) {
            pad -= 1;
          }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
          padding += '  ';
        }

        appendedToLastNode = false;
        var closingTag = node.match(/<\/(\w*)>/, '$1');
        if (closingTag) {
          var tag = closingTag[1];
          var regexp = new RegExp('<' + tag);
          if (lastNode.match(regexp)) {
            formatted = formatted.substring(0, formatted.length - 3) + '/>\r\n';
            appendedToLastNode = true;
          }
        }

        if (!appendedToLastNode) {
          formatted += padding + node + '\r\n';
        }

        lastNode = node;
        pad += indent;
      }
      return formatted;
    },

    getProperty: function(obj, getter) {
      var props = getter.split('.');
      for (var i = 0; i  < props.length; i ++) {
        obj = obj[props[i]];
        if (!obj) break;
      }
      return obj;
    },

    setProperty: function(obj, propertyPath, value) {
      var props = propertyPath.split('.');
      var lastProp = props.pop();
      for (var i = 0; i  < props.length; i ++) {
        var prop = props[i];
        var next = obj[prop];
        if (next) {
          obj = next;
        } else {
          obj = obj[prop] = {};
        }
      }
      obj[lastProp] = value;
    },

    copySelection: function(obj, getters){
      var newVal;
      return arethusaUtil.inject({}, getters, function(memo, el) {
        newVal = arethusaUtil.getProperty(obj, el);
        if (angular.isObject(newVal)) newVal = angular.copy(newVal);
        arethusaUtil.setProperty(memo, el, newVal);
      });
    },

    percentToRgb: function(percent, saturation) {
      var h = Math.floor((100 - percent) * 120/ 100);
      var s = saturation || 1, v = 1;

      var rgb, i, data = [];
      h = h / 60;
      i = Math.floor(h);
      data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
      switch(i) {
        case 0:
          rgb = [v, data[2], data[0]]; break;
        case 1:
          rgb = [data[1], v, data[0]]; break;
        case 2:
          rgb = [data[0], v, data[2]]; break;
        case 3:
          rgb = [data[0], data[1], v]; break;
        case 4:
          rgb = [data[2], data[0], v]; break;
        default:
          rgb = [v, data[0], data[1]]; break;
      }

      return '#' + rgb.map(function(x){
        return ("0" + Math.round(x*255).toString(16)).slice(-2);
      }).join('');
    },

    toPercent: function(total, part){
      return (part / total) * 100;
    },

    resolveFn: function(deferred) {
      return function() { deferred.resolve(); };
    },

    rejectFn: function(deferred) {
      return function() { deferred.reject(); };
    },

    isArethusaMainApplication: function() {
      var ngApp = document.querySelector('html').attributes['ng-app'];
      return ngApp && ngApp.value == 'arethusa';
    },

    isUrl: function(str) {
      return str.match(/^https?:\/\//);
    },

    capitalize: function(str) {
      return str[0].toUpperCase() + str.slice(1);
    },

    find: function(arr, fn) {
      var res;
      for (var i=0; i < arr.length; i++) {
        var el = arr[i];
        if (fn(el)) {
          res = el;
          break;
        }
      }
      return res;
    },

    unique: function(arr, fn) {
      var unique = [];
      for (var i = 0; i  < arr.length; i ++) {
        var el = arr[i];
        var isUnique = true;
        for (var oI = arr.length - 1; oI >= i + 1; oI--){
          var otherEl = arr[oI];
          if (fn(el, otherEl)) {
            isUnique = false;
            break;
          }
        }
        if (isUnique) unique.push(el);
      }
      return unique;
    }
  };

  var aU = arethusaUtil;

"use strict";

/**
 * @ngdoc service
 * @name arethusa.util.commons
 *
 * @description
 * Provides several constructors for commonly used classes in Arethusa.
 *
 */

angular.module('arethusa.util').service('commons', [
  function ArethusaClasses() {
    // Used to define plugin settings
    function Setting(label, model, changeOrDirective) {
      this.label = label;
      this.model = model;
      if (angular.isFunction(changeOrDirective)) {
        this.change = changeOrDirective;
      } else {
        // comment from @balmas: I'm not sure but I think this 
        // leverages the {@link arethusa.core.directives#dynamicDirective}
        // functionality to create a dumb directive which just sets the 
        // new value on the model.
        this.directive = changeOrDirective;
      }
    }


    /**
     * @ngdoc function
     * @name arethusa.util.commons#setting
     * @methodOf arethusa.util.commons
     *
     * @description
     * Creates a new {@link arethusa.util.commons.Setting} object
     *
     * @param {String} l the name of the seeting
     * @param {String} m the name of the model object
     * @param {Function} c optional callback function to be called when 
     *   the setting is changed.
     */
    this.setting = function(l, m, c) { return new Setting(l, m, c); };


    function Doc(xml, json, conf) {
      this.xml = xml;
      this.json = json;
      this.conf = conf;
    }

    /**
     * @ngdoc function
     * @name arethusa.util.commons#doc
     * @methodOf arethusa.util.commons
     *
     * @description
     * Returns a new Arethusa document.
     *
     * Retrievers should use this constructor for all documents they want to
     * save inside the {@link arethusa.core.documentStore documentStore}.
     *
     * Either `xml` or `json` are mandatory, but both can be present.
     *
     * @param {String} xml XML representation of a document.
     * @param {Object} json JSON represenation of a document.
     * @param {Object} conf Additional configuration files specified in the document.
     *   Should contain configuration names as keys and paths to the files as values.
     *
     */
    this.doc = function(x, j, c) { return new Doc(x, j, c); };

    // Used by retrievers to define sentences
    function Sentence(tokens, cite) {
      var self = this;

      this.tokens = tokens;
      this.cite = cite || '';

      this.toString = function() {
        return arethusaUtil.inject([], self.tokens, function(memo, id, token) {
          memo.push(token.string);
        }).join(' ');
      };
    }

    /**
     * @ngdoc function
     * @name arethusa.util.commons#doc
     * @methodOf arethusa.util.commons
     *
     * @description
     * TODO
     *
     */
    this.sentence = function(t, cite) { return new Sentence(t, cite); };

    // Used by retrievers to define constituents
    function Constituent(cl, role, id, sentenceId, parentId) { // might want to add more here
      this.class = cl;
      this.role = role;
      this.id = id;
      this.sentenceId = sentenceId;
      this.parent = parentId;

      this.isConstituent = true;
    }

    /**
     * @ngdoc function
     * @name arethusa.util.commons#constituent
     * @methodOf arethusa.util.commons
     *
     * @description
     * TODO
     *
     */
    this.constituent = function(c, r, i, sId, h) { return new Constituent(c, r, i, sId, h); };

    /**
     * @ngdoc function
     * @name arethusa.util.commons#token
     * @methodOf arethusa.util.commons
     *
     * @description
     * TODO
     *
     */
    function Token(string, sentenceId) {
      this.string = string;
      this.sentenceId = sentenceId;

      this.isToken = true;
    }

    this.token = function (s, sentenceId) { return new Token(s, sentenceId); };
  }
]);

"use strict";

// Generators for Arethusa code for things such as
// - useful directives

angular.module('arethusa.util').service('generator', [
  function ArethusaGenerator() {
    this.panelTrigger = function (conf) {
      return {
        restrict: 'A',
        compile: function(element) {
          var hint;

          function updateTitle(translation) {
            var title = translation();
            if (hint) title += ' (' + hint + ')';
            element.attr('title', title);
          }

          return function link(scope, element, attrs) {
            function executeToggle() {
              element.toggleClass('on');
              conf.service.toggle();
            }

            function toggle() {
              // Need to check for a running digest. When we trigger this
              // function through a hotkey, the keyCapture service will
              // have launched a digest already.
              if (scope.$$phase) {
                executeToggle();
              } else {
                scope.$apply(executeToggle);
              }
            }

            conf.trsl(conf.trslKey, updateTitle);

            element.bind('click', toggle);

            if (conf.kC) {
              var keys = conf.kC.initCaptures(function(kC) {
                var mapping = {};
                mapping[conf.mapping.name] = [
                  kC.create('toggle', function() { toggle(); }, conf.mapping.key)
                ];
                return mapping;
              });

              hint = keys[conf.mapping.name].toggle;
            }
          };
        },
        template: conf.template
      };
    };

    this.historyTrigger = function (history, translator, type, icon) {
      // type is either undo or redo
      icon = icon || type;
      return {
        restrict: 'A',
        scope: {},
        link: function(scope, element, attrs) {
          scope.history = history;

          scope.$watch('history.mode', function(newVal, oldVal) {
            if (newVal === 'editor') {
              element.show();
            } else {
              element.hide();
            }
          });

          scope.$watch('history.can' + aU.capitalize(type), function(newVal, oldVal) {
            if (newVal) {
              element.removeClass('disabled');
            } else {
              element.addClass('disabled');
            }
          });

          element.bind('click', function() {
            scope.$apply(history[type]());
          });


          var trsl, hint;

          scope.$watch('history.activeKeys.' + type, function(key) {
            if (key) {
              hint = aU.formatKeyHint(key);
              setTitle();
            }
          });

          translator('history.' + type, function(translation) {
            trsl = translation();
            setTitle();
          });

          function setTitle() {
            element.attr('title', trsl + ' ' + hint);
          }
        },
        template: '<i class="fa fa-' + icon + '"/>'
      };
    };
  }
]);


'use strict';
/* global console */

/**
 * @ngdoc service
 * @name arethusa.util.logger
 *
 * @description
 * Simple logging wrapper.
 *
 */
angular.module('arethusa.util').service('logger', [
  function() {
    /**
     * @ngdoc function
     * @name arethusa.util.logger#log
     * @methodOf arethusa.util.logger
     *
     * @description
     * Wrapper around `console.log`
     *
     * @param {String} msg Message to log
     *
     */
    this.log = function(msg) {
      console.log(msg);
    };
  }
]);

/**
 * @ngdoc overview
 * @name arethusa.core
 *
 * @description
 * Module of Arethusa's core functionality
 */
angular.module('arethusa.core', [
  'angulartics',
  //'angulartics.google.analytics',
  'arethusa.util',
  'ngResource',
  'ngCookies',
  'ngAnimate',
  'duScroll',
  'pascalprecht.translate',
  'toaster',
  'oc.lazyLoad',
  'gridster',
  'hljs',
  'mm.foundation',
  'LocalStorageModule',
  'angularUUID2',
  'dndLists'
])
  .value('BASE_PATH', '..')
  .constant('_', window._);

"use strict";

angular.module('arethusa.core').animation('.slider', [
  '$timeout',
  function($timeout) {
    function enter(element, done) {
      var duration = 500;
      var h = element[0].clientHeight;
      var y = 0;
      var interval  = duration / 30;
      var increment = h / interval;

      function slideDown() {
        element.height(y + 'px');

        if (y < h) {
          $timeout(function() {
            y += increment;
            slideDown();
          }, interval);
        }
      }

      slideDown();
    }

    function leave(element, done) {
      angular.element(element).slideUp(500, done);
    }
    return {
      enter: enter,
      leave: leave,
      addClass: function(element, className, done) {
        if (className === 'ng-hide') leave(element, done);
      },
      removeClass: function(element, className, done) {
        if (className === 'ng-hide') enter(element, done);
      }
    };
  }
]);

'use strict';
angular.module('arethusa.core').controller('ArethusaCtrl', [
  'GlobalErrorHandler',
  '$scope',
  'configurator',
  'state',
  'documentStore',
  'notifier',
  'saver',
  'history',
  'plugins',
  'translator',
  '$timeout',
  'globalSettings',
  'routeChangeWatcher',
  function (GlobalErrorHandler, $scope, configurator, state, documentStore, notifier,
            saver, history, plugins, translator, $timeout, globalSettings, routeChangeWatcher) {
    // This is the entry point to the application.

    var translations = translator(['loadInProgress', 'loadComplete']);

    $scope.$on('confLoaded', bootstrap);

    function bootstrap() {
      documentStore.reset();
      $scope.aU = arethusaUtil;
      $scope.debug = false;
      $scope.toggleDebugMode = function () {
        $scope.debug = !$scope.debug;
      };

      var conf = configurator.configurationFor('main');

      $scope.state = state;
      $scope.plugins = plugins;
      $scope.gS = globalSettings;

      // The application has to fulfil a specific load order.
      // The ArethusaCtrl starts his work only when the configurator has received
      // its main configuration file (handled by the MAIN_ROUTE constant).
      //
      // Loading all state retrievers is an asynchronous step we want to see
      // completed before going on.
      // State broadcasts another event when it is done, after that the ArethusaCtrl
      // can finally start to initialize itself and all all participating plugins.
      //
      // Everytime the state is reloaded, we need to reinitialize plugins (if they
      // declare to do so by implementing an init() function- it's not a necessity),
      // so that they can update their internal state after the main state tokens
      // have changed. There is no need to reinit the ArethusaCtrl - the arethusaLoaded
      // variable takes care of this.
      //
      //
      // Note that this was much more complex (and clever) at an earlier stage, but was refactored
      // in http://github.com/latin-language-toolkit/arethusa/pull/365
      //
      // In case we every need this added complexity again, check out this PR to find
      // some advice.

      // The timeout helps to load the translation, otherwise we can't see a
      // notification that the load is in progress.
      $timeout(function() {
        notifier.init();
        notifier.wait(translations.loadInProgress());
        state.arethusaLoaded = false;
        state.init();
        saver.init();
        history.init();
      });

      $scope.$on('stateLoaded', function () {
        state.postInit();
        if (state.arethusaLoaded) {
          // We don't have to retrieve all plugins again, but we have
          // to reload them so that they can update their internal state
          plugins.init();
        } else {
          $scope.init();
        }
      });

      $scope.init = function () {
        plugins.start(conf.plugins).then(function() {
          state.arethusaLoaded = true;
          notifier.success(translations.loadComplete());

          if (aU.isArethusaMainApplication()) {
            //UserVoice.push(['addTrigger', '#uservoicebutton', { mode: 'contact' }]);
          }

          // start listening for events
          state.silent = false;
        });
      };
    }
  }
]);

"use strict";

angular.module('arethusa.core').controller('LandingCtrl', [
  '$scope',
  '$window',
  function ($scope, $window) {
    $scope.template = 'js/templates/landing_page.html';

    var imgPath = '../dist/examples/images/';


    function Example(name, caption, img, url) {
      this.name = name;
      this.caption = caption;
      this.img = imgPath + img;
      this.url = '#/' + url;
    }

    function UseCase(name, examples) {
      this.name = name;
      this.examples = examples;
    }

    function Partner(name, img, href) {
      this.name = name;
      this.img = imgPath + img;
      this.href = href;
    }

    $scope.useCases = [
      new UseCase('Treebanking', [
        new Example('depTrees', '', 'create1.png', 'example_tb_create?doc=athenaeus12'),
        new Example('review', '', 'tb_review.png', 'example_tb_review?doc=11&gold=1'),
        new Example('landing.tryYourself', '', 'create2.png', 'example_tb_create?doc=clean')
      ]),
      //new UseCase('Reading Environmnent', [])
    ];

    $scope.partners = [
      new Partner('DH Leipzig', 'dh_logo.png', 'http://www.dh.uni-leipzig.de'),
      new Partner('Perseids', 'perseids_logo.png', 'http://sites.tufts.edu/perseids'),
      new Partner('Alpheios', 'alpheios_logo.png', 'http://www.alpheios.net'),
      new Partner('Perseus', 'perseus_logo.jpg', 'http://www.perseus.tufts.edu')
    ];

    $scope.awards = [
      new Partner('ELCH Uni Graz', 'elch_banner.png', 'http://elch.uni-graz.at/?page_id=3158'),
    ];

    $scope.goTo = function(url) {
      $window.open(url);
    };
  }
]);

'use strict';
angular.module('arethusa.core').controller('NavigatorCtrl', [
  '$scope',
  'navigator',
  'translator',
  'keyCapture',
  function ($scope, navigator, translator, keyCapture) {
    $scope.next = function () {
      navigator.nextChunk();
    };
    $scope.prev = function () {
      navigator.prevChunk();
    };
    $scope.goToFirst = function() {
      navigator.goToFirst();
    };
    $scope.goToLast = function() {
      navigator.goToLast();
    };
    $scope.goTo = function(id) {
      navigator.goTo(id);
    };
    $scope.nav = navigator;

    $scope.$watch('nav.status', function(newVal, oldVal) {
      $scope.navStat = newVal;
    });

    // Converts an array of ids to something more readable, e.g.
    // [ 1, 2, 3, 4, 6, 8, 9] becomes 1-4, 6, 8-9
    function formatIds(ids) {
      var res =   [];
      var range = [];
      res.push(range);

      if (ids) {
        angular.forEach(ids, function(id, i) {
          var last = aU.last(range);
          if (!last || parseInt(last) + 1 === parseInt(id)) {
            range.push(id);
          } else {
            range = [id];
            res.push(range);
          }
        });
      }

      return arethusaUtil.map(res, function(range) {
        if (range.length > 1) {
          var first = range[0];
          var last  = range[1];
          return first + '-' + last;
        } else {
          return range[0];
        }
      }).join(', ');
    }

    $scope.$watchCollection('navStat.currentIds', function(newVal, oldVal) {
      if (newVal) {
        $scope.ids = formatIds(newVal);
      }
    });

    $scope.trsls = translator({
      'navigator.goToNext': 'goToNext',
      'navigator.goToPrev': 'goToPrev',
      'navigator.goToFirst': 'goToFirst',
      'navigator.goToLast': 'goToLast',
      'list': 'list'
    });

    $scope.keys = {};
    $scope.$watch('nav.keys', function(newValue) {
      if (newValue) {
        $scope.keys.nextChunkKey = aU.formatKeyHint(newValue.navigation.nextChunk);
        $scope.keys.prevChunkKey = aU.formatKeyHint(newValue.navigation.prevChunk);
        $scope.keys.listKey = aU.formatKeyHint(newValue.navigation.list);
      }
    });
  }
]);

'use strict';
angular.module('arethusa.core').controller('SearchCtrl', [
  '$scope',
  '$location',
  'translator',
  function ($scope, $location, translator) {
    $scope.search = function () {
      $location.search('doc', $scope.query);
    };

    translator('search_documents', function(translation) {
      $scope.search_documents = translation();
    });
  }
]);

"use strict";

angular.module('arethusa.core').directive('arethusaGridHandle', [
  '$timeout',
  'plugins',
  function($timeout, plugins) {
    return {
      restrict: 'E',
      scope: true,
      link: function(scope, element, attrs, ctrl, transclude) {
        var enter;
        function mouseEnter() {
          enter = $timeout(function() { scope.visible = true; }, 100);
        }

        function mouseLeave() {
          $timeout.cancel(enter);
        }

        function dragLeave() {
          scope.$apply(function() { scope.visible = false; });
        }

        var trigger = element.find('.drag-handle-trigger');
        var handle  = element.find('.drag-handle');

        trigger.bind('mouseenter', mouseEnter);
        trigger.bind('mouseleave', mouseLeave);
        handle.bind('mouseleave', dragLeave);

        scope.$on('pluginsLoaded', function() {
          scope.plugin = plugins.get(scope.item.plugin);
        });

        scope.$watch('visible', function(newVal, oldVal) {
          if (!newVal) scope.settingsOn = false;
        });
      },
      templateUrl: 'js/arethusa.core/templates/arethusa_grid_handle.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('arethusaGrid', [
  'arethusaGrid',
  'plugins',
  'globalSettings',
  '$timeout',
  function(arethusaGrid, plugins, globalSettings, $timeout) {
    return {
      restrict: 'A',
      scope: true, // inherit from ArethusaCtrl's scope
      link: function(scope, element, attrs) {
        angular.element(document.body).css('overflow', 'auto');

        scope.grid = arethusaGrid;

        function addSettings() {
          globalSettings.defineSetting('grid', 'custom', 'grid-setting');
          globalSettings.defineSetting('gridItems', 'custom', 'grid-items');
        }

        function removeSettings() {
          globalSettings.removeSetting('grid');
          globalSettings.removeSetting('gridItems');
        }

        // We need to timeout this, so that we can give globalSettings
        // time to define its own default settings - only afterwards
        // we add our own grid settings
        $timeout(addSettings);

        scope.$on('$destroy', removeSettings);
      },
      templateUrl: 'js/arethusa.core/templates/arethusa_grid.html'
    };
  }
]);

'use strict';
/* Configurable navbar
 *
 * The following variables can be declared in a conf file
 *   disable - Boolean
 *   search - Boolean
 *   navigation - Boolean
 *   template - String
 *
 * Example;
 *
 * {
 *   "navbar" : {
 *     "search" : true,
 *     "navigation" : true,
 *     "template" : "js/templates/navbar.html"
 *   }
 *
 */
angular.module('arethusa.core').directive('arethusaNavbar', [
  'configurator',
  '$window',
  function (configurator, $window) {
    return {
      restrict: 'AE',
      scope: true,
      link: function (scope, element, attrs) {
        var conf = configurator.configurationFor('navbar');

        var win = angular.element($window);

        function setScreenValues() {
          setWindowWidth();
          setLogo();
        }

        function setWindowWidth() {
          scope.windowWidth = win.width();
        }

        function setLogo() {
          var icon = scope.windowWidth > 1300 ? '' : 'icon-';
          scope.logo = "images/arethusa-" + icon + "small.png";
        }

        function isVisible(threshold, defaultVal) {
          if (defaultVal) {
            return scope.windowWidth > threshold;
          }
        }

        setScreenValues();
        win.on('resize', setScreenValues);

        scope.template = conf.template;
        scope.disable = conf.disable;

        scope.showSearch = function () {
          return conf.search;
        };

        scope.showNavigation = function () {
          return conf.navigation;
        };

        // Foundation's topbar doesn't seem to work properly - could be an issue
        // with angular. If we make it fixed, it overlaps our body and no padding
        // is added. We do it manually through this directive.
        angular.element(document.body).css({ padding: '25px 0'});
      },
      template: '<div ng-if="!disable" ng-include="template"></div>'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('arethusaTabs', [
  'plugins',
  'state',
  'arethusaLocalStorage',
  '_',
  function(
    plugins,
    state,
    arethusaLocalStorage,
    _
  ) {
    var LOCAL_STORAGE_KEY = 'tabsConfiguration';

    return {
      restrict: 'A',
      scope: {
        tabs: "=arethusaTabs"
      },
      link: function(scope, element, attrs) {
        var tabMap;
        var tabConf = getFromLocalStorage();

        scope.plugins = plugins;
        scope.state = state;

        scope.moveTab = moveTab;
        scope.toggleTab = toggleTab;

        scope.isActive = isActive;

        scope.$watch('tabs', init);

        function init(tabs) {
          if (!tabs) return;
          // Dragging and dropping can be a bit buggy when working on our large
          // object. We therefore only work on a small dataset and update the real
          // tabs once it changes.
          scope.list = createListItems(tabs);
          tabMap = createTabMap(tabs);
          activateSettings();
          doInitialActivation(tabs);
          updateVisibleTabs();
        }

        function createListItems(tabs) {
          return _.map(tabs, createListItem);
        }

        function createListItem(tab) {
          return {
            name: tab.name,
            label: tab.displayName
          };
        }

        function createTabMap(tabs) {
          return _.inject(tabs, function(memo, tab) {
            memo[tab.name] = tab;
            return memo;
          }, {});
        }

        function activate(tab) {
          getConf(tab).active = true;
        }

        function deactivate(tab) {
          getConf(tab).active = false;
        }

        function isActive(tab) {
          return getConf(tab).active;
        }

        function getConf(tab) {
          var conf = tabConf[tab.name];
          if (!conf) conf = tabConf[tab.name] = {};
          return conf;
        }

        function moveTab(i, event) {
          // The splice happens a little delayed, which means that for a short
          // while we'll have one item in the list twice - let's hide it to
          // avoid the flicker.
          angular.element(event.toElement).hide();
          scope.list.splice(i, 1);
          updateVisibleTabs();
        }

        function toggleTab(tab) {
          if (isActive(tab)) {
            deactivate(tab);
          } else {
            activate(tab);
          }
          updateVisibleTabs();
          setLocalStorage();
        }

        function activateSettings() {
          scope.showSettingsTab = true;
        }

        function doInitialActivation(tabs) {
          _.forEach(tabs, function(tab) {
            // If a setting is already present, don't do anything,
            // otherwise activate it.
            if (!angular.isDefined(isActive(tab))) {
              activate(tab);
            }
          });
        }

        function updateVisibleTabs() {
          scope.visibleTabs =_.inject(scope.list, function(memo, item) {
            if (isActive(item)) {
              memo.push(tabMap[item.name]);
            }
            return memo;
          }, []);
        }

        function getFromLocalStorage() {
          return arethusaLocalStorage.get(LOCAL_STORAGE_KEY) || {};
        }

        function setLocalStorage() {
          arethusaLocalStorage.set(LOCAL_STORAGE_KEY, tabConf);
        }
      },
      templateUrl: 'js/arethusa.core/templates/arethusa_tabs.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('arethusaUser', [
  function() {
    return {
      restrict: 'A',
      scope: {
        user: '=arethusaUser',
        withMail: '@'
      },
      link: function(scope, element, attrs) {
        function nameToString() {
          var string = '';
          var user = scope.user;

          if (user.fullName) {
            string += user.fullName;
            if (user.name) string += ' (' + user.name + ')';
          } else {
            string += user.name;
          }

          scope.name = string;
        }

        // We could add watchers to the name properties of
        // the user and the user itself - but they are most
        // likely not going to change, so we don't for now.
        nameToString();
      },
      templateUrl: 'js/arethusa.core/templates/arethusa_user.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('chunkModeSwitcher', [
  'navigator',
  'notifier',
  'translator',
  function(navigator, notifier, translator) {
    var MAX_CHUNK_SIZE = 10;
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.navi = navigator;

        var tr = translator({
          'navigator.chunkSizeError':  'chunkSizeError'
        });

        scope.$watch('navi.chunkSize', function(newVal) { scope.size = newVal; });

        scope.tryToSetChunkSize = function() {
          var size = scope.size;
          if (navigator.chunkSize === size) {
            return;
          }
          if (size < 1 || size > MAX_CHUNK_SIZE) {
            notifier.error(tr.chunkSizeError({ max: MAX_CHUNK_SIZE }));
            scope.size = navigator.chunkSize;
          } else {
            navigator.changeChunkSize(scope.size);
          }
        };
      },
      templateUrl: 'js/arethusa.core/templates/chunk_mode_switcher.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('closeOnEnter', [
  '$document',
  function($document) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        function confirm(event) {
          if (event.keyCode === 13) scope.$close(true);
        }

        $document.on('keyup', confirm);
        scope.$on('$destroy', function() { $document.off('keyup', confirm); });
      },
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('collectedPluginSettings', [
  'plugins',
  function(plugins) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.plugins = plugins;
      },
      templateUrl: 'js/arethusa.core/templates/collected_plugin_settings.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('colorizerSetting', [
  'globalSettings',
  function(globalSettings) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.gS = globalSettings;

        scope.$watch('gS.settings.colorizer', function(newVal, oldVal) {
          scope.setting = newVal;
        });
      },
      templateUrl: 'js/arethusa.core/templates/colorizer_setting.html'
    };
  }
]);

'use strict';
angular.module('arethusa.core').directive('debug', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var obj;
      // We set a watch for the given param in the parent scope,
      // so that we can stay in the game even when a reassignment
      // happens.
      scope.$watch(attrs.debug, function (newVal, oldVal) {
        obj = newVal;
      });
      scope.$watch('debug', function (newVal, oldVal) {
        if (newVal) {
          element.show();
        } else {
          element.hide();
        }
      });
      scope.prettyTokens = function () {
        return JSON.stringify(obj, null, 2);
      };
    },
    template: '<pre>{{ prettyTokens() }}</pre>'
  };
});
"use strict";

angular.module('arethusa.core').directive('delimiter', function() {
  return {
    restrict: 'A',
    replace: true,
    template: '<div class="small-12 columns" style="padding: 0.5rem 0"/>'
  };
});

'use strict';
angular.module('arethusa.core').directive('deselector', [
  'state',
  'translator',
  function (state, translator) {
    return {
      restrict: 'AE',
      scope: {},
      link: function (scope, element, attrs) {
        element.bind('click', function (e) {
          state.deselectAll();
          scope.$apply();
        });

        var trsl, hint;

        scope.$on('keysAdded', function(_, keys) {
          var sel = keys.selections;
          if (sel) {
            hint = aU.formatKeyHint(sel.deselect);
            setTitle();
          }
        });

        translator('deselectAll', function(translation) {
          trsl = translation();
          setTitle();
        });

        function setTitle() {
          element.attr('title', trsl + ' ' + hint);
        }
      },
      template: '<i class="fi-unlock"/>'
    };
  }
]);

"use strict";


/**
 * @ngdoc directive
 * @name arethusa.core.directives:dynamicDirective
 * @restrict A
 * @scope
 *
 * @description
 * Allows to dynamically add a self-contained directive
 *
 * A very dumb directive which just takes an input string and tries to
 * append this input string as compiled directive.
 *
 * Mind that this is not very sophisticated yet (limited to our current
 * use case):
 *
 * - The directive needs to be self contained, i.e. it cannot take any
 *   arguments on its own.
 * - It needs to be valid as attribute directive
 * - The compilation is only done once - no watcher is placed on the
 *   attribute, so if its value changes nothing happens.
 *
 * The directive tries to honor the tag the directive was placed on,
 * two examples:
 *
 * ```html
 * <div dynamic-directive="layout-setting"></div>
 *
 * <span dynamic-direcitve="layout-setting"></span>
 * ```
 *
 * The first `layoutSetting` directive will be compiled on a `div` element,
 * the second on a `span` element.
 *
 * ```html
 * <div layout-setting></div>
 *
 * <span layout-setting></span>
 * ```
 *
 * @param {string} dynamicDirective The name of the directive to be compiled
 *
 * @requires $compile
 */
angular.module('arethusa.core').directive('dynamicDirective', [
  '$compile',
  function($compile) {
    return {
      restrict: 'A',
      scope: {
        directive: '@dynamicDirective'
      },
      link: function(scope, element, attrs) {
        var tag = element[0].tagName.toLowerCase();
        var tmpl = '<' + tag + ' ' + scope.directive + '></' + tag + '>';
        element.append($compile(tmpl)(scope.$parent));
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('editors', [
  'editors',
  function(editors) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.editors = editors;
      },
      templateUrl: 'js/arethusa.core/templates/editors.html'
    };
  }
]);

"use strict";

/**
 * @ngdoc directive
 * @name arethusa.core.directives:exit
 * @restrict A
 *
 * @description
 * Adds a click event and an exit icon, which triggers
 * {@link arethusa.core.exitHandler#methods_leave exitHandler#leave},
 * when an exit route is defined in the {@link arethusa.core.exitHandler exitHandler},
 * otherwise will hides the element decorated with this directive.
 *
 * @requires arethusa.core.exitHandler
 * @requires arethusa.core.translator
 */
angular.module('arethusa.core').directive('exit', [
  'exitHandler',
  'translator',
  function(exitHandler, translator) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        if (exitHandler.defined) {
          element.bind('click', function(event) {
            var targetWin;
            var button = event.button;
            // Mirroring the different behavior of left and middle click
            if (button === 0) targetWin = "_self";
            if (button === 1) targetWin = "_blank";

            // We don't pass targetWin and hardcode _self for now as we don't
            // want the user to exit to a new tab - we leave the code in
            // though, in case we change our mind one day.

            exitHandler.leave("_self");
          });

          translator('exitHandler.exitTo', function(trsl) {
            element.attr('title', trsl({ title: exitHandler.title }));
          });
        } else {
          element.hide(); // or even remove?
        }


      },
      template: '<i class="fa fa-sign-out"></i>'
    };
  }
]);

'use strict';
angular.module('arethusa.core').directive('fireEvent', [
  'state',
  function (state) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          var attrs = $scope.$eval($attrs.fireEvent);
          var target = $scope[attrs.target];
          var property = $scope[attrs.property];
          $scope.$watch(attrs.value, function (newVal, oldVal) {
            if (oldVal !== newVal) {
              state.fireEvent(target, property, oldVal, newVal);
            }
          });
        }
      ]
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('focusMe', [
  function() {
    return {
      restrict: 'A',
      scope: {
        focus: '=focusMe'
      },
      link: function(scope, element, attrs) {
        scope.$watch('focus', function(newVal, oldVal) {
          if (newVal) element.focus();
        });
      },
    };
  }
]);

'use strict';

// TODO
//
// Extract a foreignKeys service which handles common operations

angular.module('arethusa.core').directive('foreignKeysHelp', [
  'keyCapture',
  'languageSettings',
  '$timeout',
  function(keyCapture, languageSettings, $timeout) {
    return {
      restrict: 'AE',
      scope: true,
      link: function(scope, element, attr) {
        var shiftersBound = false;

        // Will be added lazily through a watch
        var shifters;

        function generateKeys() {
          var lang = (languageSettings.getFor('treebank') || languageSettings.getFor('hebrewMorph') || {}).lang;
          scope.keys = keyCapture.mappedKeyboard(lang, scope.shifted);
        }

        function bindShift() {
          scope.$apply(function() {
            scope.shifted = !scope.shifted;
            generateKeys();
          });
        }

        var shifterWatch = scope.$watch('visible', function(newVal, oldVal) {
          if (newVal && !shiftersBound) {
            shifters = element.find('.shifter');
            shifters.bind('click', bindShift);
            shifterWatch();
          }
        });

        scope.$watch('shifted', function(newVal, oldVal) {
          if (shifters) {
            if (newVal) {
              shifters.addClass('key-hit');
            } else {
              shifters.removeClass('key-hit');
            }
          }
        });

        scope.$on('convertingKey', function(event, keyCode) {
          if (scope.visible) {
            // Not using jQuery selectors here, as we have to deal with
            // colons and the like!
            var el = document.getElementById(keyCapture.codeToKey(keyCode));
            var key = angular.element(el);
            key.addClass('key-hit');
            $timeout(function() {
              key.removeClass('key-hit');
            }, 450);
          }
        });

        function FakeEvent(keyCode) {
          this.keyCode  = keyCode;
          this.shiftKey = scope.shifted;
        }

        function doShift(event, bool) {
          if (keyCapture.codeToKey(event.keyCode) === 'shift') {
            scope.$apply(function() {
              scope.shifted = bool;
              generateKeys();
            });
          }
        }

        scope.element.on('keydown', function(event) {
          doShift(event, true);
        });

        scope.element.on('keyup', function(event) {
          doShift(event, false);
        });

        scope.generate = function(key) {
          var keyCode = keyCapture.keyToCode(key);
          scope.parseEvent(new FakeEvent(keyCode), true);
          scope.shifted = false;
          generateKeys();
        };

        generateKeys();
      },
      templateUrl: './js/arethusa.core/templates/foreign_keys_help.html'
    };
  }
]);

'use strict';
angular.module('arethusa.core').directive('foreignKeys',[
  'keyCapture',
  'languageSettings',
  '$compile',
  'globalSettings',
  function (keyCapture, languageSettings, $compile, globalSettings) {
    return {
      restrict: 'A',
      scope: {
        ngChange: '&',
        ngModel: '@',
        foreignKeys: '='
      },
      link: function (scope, element, attrs) {
        scope.enabled = !globalSettings.disableKeyboardMappings;
        scope.element = element;

        var parent = scope.$parent;

        function extractLanguage() {
          return (languageSettings.getFor('treebank') || languageSettings.getFor('hebrewMorph') || {}).lang;
        }

        function lang() {
          return scope.foreignKeys || extractLanguage();
        }

        function activeLanguage() {
          return languageSettings.langNames[lang()];
        }

        // This will not detect changes right now
        function placeHolderText() {
          var language = activeLanguage();
          var status = scope.enabled ? 'enabled' : 'disabled';
          return  language ? language + ' input ' + status + '!' : '';
        }

        function broadcast(event) {
          scope.$broadcast('convertingKey', event.keyCode);
        }

        function appendCompiled(parent, elements) {
          angular.forEach(elements, function(el, i) {
            parent.append($compile(el)(scope));
          });
        }

        scope.togglerClass = function() {
          return scope.enabled ? 'success-message-dark' : 'error-message-dark';
        };

        function appendHelp() {
          if (!activeLanguage()) return;

          var parent = element.parent();
          var margin = element.css('margin');

          var trigger   = '<span ng-click="visible = !visible">⌨</span>';
          var toggler   = '\
            <span\
              ng-click="enabled = !enabled"\
              class="settings-span-button">\
              <i\
                ng-class="togglerClass()"\
                class="fa fa-power-off"/>\
            </span>\
          ';
          var help      = '<div foreign-keys-help/>';
          var newMargin = '<div style="margin: ' + margin + '"/>';


          element.css('margin', 0);
          appendCompiled(parent, [trigger, toggler, help]);
          parent.append(newMargin);
        }

        element.attr('placeholder', placeHolderText);
        appendHelp();

        function applyModifiedKey(parent, input, fK) {
          parent.$eval(scope.ngModel + ' = i + k', { i: input, k: fK });
          scope.ngChange();
        }

        scope.parseEvent = function (event, noApply) {
          var input = element[0].value;
          var l = lang();
          if (l) {
            var fK = keyCapture.getForeignKey(event, l);
            if (fK === false) {
              broadcast(event);
              return false;
            }
            if (fK === undefined) {
              return true;
            } else {
              broadcast(event);
              element.value = input + fK;

              // When we call this method from an ng-click we might
              // already be digesting!
              if (noApply) {
                applyModifiedKey(parent, input, fK);
              } else {
                scope.$apply(applyModifiedKey(parent, input, fK));
              }

              return false;
            }
          } else {
            return true;
          }
        };

        scope.$watch('enabled', function(newVal, oldVal) {
          if (newVal) {
            element.bind('keydown', scope.parseEvent);
          } else {
            element.unbind('keydown', scope.parseEvent);
          }
          element.attr('placeholder', placeHolderText);
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('fullHeight', [
  '$window',
  function($window) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var win = angular.element($window);
        var body = angular.element(document.body);
        var border = angular.element(document.getElementById('canvas-border')).height();
        var margin = element.css("margin-bottom").replace('px', '');
        var padding = element.css("padding-bottom").replace('px', '');
        var additionalBorder = attrs.fullHeight || 0;

        function resize(args) {
          var fullHeight = body.height();
          element.height(fullHeight - margin - padding - additionalBorder);
        }
        win.bind('resize', function() {
          resize();
        });

        resize();
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('globalClickAction', [
  'globalSettings',
  function(globalSettings) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.gS = globalSettings;
        scope.setting = globalSettings.settings.clickAction;
      },
      templateUrl: 'js/arethusa.core/templates/global_click_action.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('globalSettingsPanel', [
  'globalSettings',
  'keyCapture',
  '$timeout',
  function(globalSettings, keyCapture, $timeout) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.gS = globalSettings;
        scope.kC = keyCapture;

        scope.$watch('gS.active', function(newVal, oldVal) {
          scope.active = newVal;
          // Timeout to give the animation some breathing room.
          // In the first digest we activate the panel through ngIf,
          // in the following we make the element visible.
          $timeout(function() {
            if (newVal) element.slideDown(); else element.slideUp();
          }, 0, false);
        });

        scope.togglePluginSettings = togglePluginSettings;

        function togglePluginSettings() {
          scope.pluginSettingsVisible = !scope.pluginSettingsVisible;
        }
      },
      templateUrl: 'js/arethusa.core/templates/global_settings_panel.html'
    };
  }
]);


"use strict";

angular.module('arethusa.core').directive('globalSettingsTrigger', [
  'generator',
  'globalSettings',
  'translator',
  'keyCapture',
  function(generator, globalSettings, translator, keyCapture) {
    return generator.panelTrigger({
      service: globalSettings,
      trsl: translator,
      trslKey: 'globalSettings.title',
      template: '<i class="fi-widget"/>',
      kC: keyCapture,
      mapping: {
        name: 'globalSettings',
        key:  'S'
      }
    });
  }
]);

"use strict";

angular.module('arethusa.core').directive('gridItems', [
  'arethusaGrid',
  'plugins',
  function(arethusaGrid, plugins) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.grid = arethusaGrid;
        scope.plugins = plugins;
      },
      templateUrl: 'js/arethusa.core/templates/grid_items.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('gridSetting', [
  'arethusaGrid',
  function(arethusaGrid) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.grid = arethusaGrid;
        scope.settings = arethusaGrid.settings;

        var options = ['dragging', 'resizing', 'floating', 'pushing'];
        angular.forEach(options, function(option) {
          scope.$watch('settings.' + option, function(newVal, oldVal) {
            if (newVal !== oldVal) {
              arethusaGrid['set' + aU.capitalize(option)](newVal);
            }
          });
        });
      },
      templateUrl: 'js/arethusa.core/templates/grid_setting.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('helpPanelHeading', [
  function() {
    return {
      restrict: 'A',
      scope: {
        toggler: '@',
        heading: '@'
      },
      link: function(scope, element, attrs) {
        scope.toggle = function() {
          scope.$parent.toggle(scope.toggler);
        };
      },
      template: '\
        <p\
          class="text underline clickable"\
          translate="{{ heading }}"\
          ng-click="toggle()">\
        </p>\
      '
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('helpPanelItem', [
  function() {
    return {
      restrict: 'A',
      scope: true,
      transclude: true,
      link: function(scope, element, attrs) {
        scope.toggler = attrs.toggler;
        scope.heading = attrs.heading;
        scope.height  = attrs.height;
      },
      templateUrl: 'js/arethusa.core/templates/help_panel_item.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('helpPanel', [
  'help',
  'keyCapture',
  'globalSettings',
  'versioner',
  'notifier',
  '$timeout',
  function(help, keyCapture, globalSettings, versioner, notifier, $timeout) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.help = help;
        scope.kC = keyCapture;
        scope.gS = globalSettings;
        scope.vers = versioner;
        scope.notifier = notifier;

        scope.visible = {};

        // Extract to a service
        scope.tools = [
          {
            label: 'Import/Export your morphological data',
            hint: 'Vla',
            href: '#/morph_tools'
          }
        ];

        scope.toggle = function(param) {
          scope.visible[param] = !scope.visible[param];
        };

        scope.$watch('help.active', function(newVal, oldVal) {
          scope.active = newVal;
          $timeout(function() {
            if (newVal) {
              element.slideDown();
            } else {
              element.slideUp();
              scope.visible = {};
            }
          });
        });
      },
      templateUrl: 'js/arethusa.core/templates/help_panel.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('helpTrigger', [
  'generator',
  'help',
  'translator',
  'keyCapture',
  function(generator, help, translator, keyCapture) {
    return generator.panelTrigger({
      service: help,
      trsl: translator,
      trslKey: 'help',
      template: '<i class="fa fa-question"/>',
      kC: keyCapture,
      mapping: {
        name: 'help',
        key: 'H'
      }
    });
  }
]);

'use strict';

/**
 * @ngdoc directive
 * @name arethusa.core.directives:keyCapture
 * @restrict A
 *
 * @description
 * Captures keydown and keyup events on the element and
 * delegates the event handling to the keyCapture service.
 *
 * @requires arethusa.core.keyCapture
 */
angular.module('arethusa.core').directive('keyCapture', [
  'keyCapture',
  function (keyCapture) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('keydown', function (event) {
          keyCapture.keydown(event);
        });
        element.on('keyup', function (event) {
          keyCapture.keyup(event);
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('keysToScreen', [
  '$timeout',
  'configurator',
  'keyCapture',
  function($timeout, configurator, keyCapture) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        var conf = configurator.configurationFor('main');

        function Key(key) {
          this.str = key === "PLUS" ? '+' : key;
          this.joiner = key === 'PLUS';
        }

        function parseKey(key) {
          // Producing new objects here in purpose, so that angular
          // has to redo the html element in the ngRepeat - we can
          // benefit from renewing the nice css animations then.
          //
          // We need || [] in case we encounter a numeric modifier.
          scope.actions = arethusaUtil.map(keyCapture.keyList[key] || [], function(el) {
            return { str: el };
          });

          var keys, elements;
          // This looks a bit ugly, but a regular + might also be a
          // valid keybinding - we therefore use an unambigous value here.
          //
          // Key can also be a number - we therefore typecast.
          keys = (key + '').replace(/-/g, '-PLUS-').split('-');
          elements = arethusaUtil.inject([], keys, function(memo, key) {
            if (key.match(/^[A-Z]$/)) {
              arethusaUtil.pushAll(memo, ['shift', 'PLUS', key.toLowerCase()]);
            } else {
              memo.push(key);
            }
          });
          return arethusaUtil.map(elements, function(el) { return new Key(el); });
        }

        // This isn't updated know - it's either activated on startup, or
        // it isn't.
        if (conf.showKeys) {
          scope.keys = [];
          scope.actions = [];

          var clear, override, readyToOverride;
          scope.$on('keyCaptureLaunched', function(event, key) {
            var keys = parseKey(key);
            scope.$apply(function() {
              if (readyToOverride) {
                scope.keys = keys;
                readyToOverride = false;
              } else {
                arethusaUtil.pushAll(scope.keys, keys);
              }
            });

            if (override) $timeout.cancel(override);
            if (clear) $timeout.cancel(clear);

            override = $timeout(function() {
              readyToOverride = true;
            }, 1500);

            clear = $timeout(function() {
              scope.keys = [];
              scope.actions = [];
            }, 3200);
          });
        }

      },
      templateUrl: 'js/arethusa.core/templates/keys_to_screen.html'
    };
  }
]);

'use strict';

angular.module('arethusa.core').directive('langSpecific', [
  'languageSettings',
  function(languageSettings) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var settings = languageSettings.getFor('treebank') || languageSettings.getFor('hebrewMorph');
        if (settings) {
          element.attr('lang', settings.lang);
          element.attr('dir', settings.leftToRight ? 'ltr' : 'rtl');
          element.css('font-family', settings.font);
        }
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('layoutSetting', [
  'globalSettings',
  function(globalSettings) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.gS = globalSettings;
        scope.setting = globalSettings.settings.layout;
      },
      templateUrl: 'js/arethusa.core/templates/layout_setting.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('navbarButtons', [
  'translator',
  function(translator) {
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        scope.$watch('windowWidth', function(newVal, oldVal) {
          var coll = newVal > 1150 ? '' : '_collapsed';
          scope.bTemplate = 'js/arethusa.core/templates/navbar_buttons' + coll + '.html';
        });

        translator('menu', function(trsl) {
          scope.menuTitle = trsl();
        });
      },
      template: '<ul class="has-form button-group right" ng-include="bTemplate"/>'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('navbarNavigation', function() {
  return {
    restrict: 'A',
    replace: true,
    controller: 'NavigatorCtrl',
    templateUrl: 'js/arethusa.core/templates/navbar_navigation.html'
  };
});

"use strict";

angular.module('arethusa.core').directive('navbarNotifier', function() {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'js/arethusa.core/templates/navbar_notifier.html'
  };
});


"use strict";

angular.module('arethusa.core').directive('navbarSearch', function() {
  return {
    restrict: 'A',
    replace: true,
    controller: 'SearchCtrl',
    templateUrl: 'js/arethusa.core/templates/navbar_search.html'
  };
});

'use strict';

angular.module('arethusa.core').directive('nextToken', [
  'state',
  function (state) {
    return {
      restrict: 'AE',
      link: function (scope, element, attrs) {
        element.bind('click', function (e) {
          scope.$apply(state.selectNextToken());
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('notifications', [
  'notifier',
  function(notifier) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
      },
      templateUrl: 'js/arethusa.core/templates/notifications.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('outputter', [
  '$modal',
  'saver',
  'translator',
  function($modal, saver, translator) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.saver = saver;
        element.bind('click', function() {
          $modal.open({
            templateUrl: 'js/arethusa.core/templates/outputter.html',
            windowClass: 'full-modal',
            scope: scope
          });
        });

        translator('saver.previewAndDownload', function(trsl) {
          element.attr('title', trsl());
        });
      },
      template: '<i class="fa fa-download"/>'
    };
  }
]);

angular.module('arethusa.core').directive('outputterItem', [
  'fileHandler',
  '$window',
  function(fileHandler, $window) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.addClass('item');

        // This scope will be destroyed once the modal is destroyed.
        // When a user wants to look at a document once, we can therefore
        // cache it - it can never go out of sync, because making changes
        // to it would require leaving the modal.
        var data;
        scope.data = function() {
          if (!data) data = scope.obj.output();
          return data;
        };

        scope.togglePreview = function() { scope.preview = !scope.preview; };

        scope.download = function() {
          var fileName = scope.obj.identifier + '.' + scope.obj.fileType;
          var mime = scope.obj.mimeType;

          fileHandler.download(fileName, scope.data(), mime);
        };
      },
      templateUrl: 'js/arethusa.core/templates/outputter_item.html',
    };
  }
]);

'use strict';
angular.module('arethusa.core').directive('pluginSetting', [
  'userPreferences',
  function (userPreferences) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, element, attrs) {
        scope.change = function() {
          var model = scope.setting.model;
          var value = scope.plugin[model];
          var change = scope.setting.change;
          userPreferences.set(scope.plugin.name, model, value);
          if (angular.isFunction(change)) change();
        };
      },
      templateUrl: 'js/arethusa.core/templates/plugin_setting.html'
    };
  }
]);


'use strict';

/**
 * @ngdoc directive
 * @name arethusa.core.directive:pluginSettings
 * @restrict A
 *
 * @description
 * Iterates over a plugin's `settings` array of {@link arethusa.util.commons#methods_setting settings}.
 *
 * Either renders the default {@link arethusa.core.directive:pluginSetting pluginSetting}
 * directive or a custom directive. (cf. {@link arethusa.util.commons#methods_setting commons.setting}).
 *
 * Awaits the `plugin` scope variable to be present.
 *
 */

angular.module('arethusa.core').directive('pluginSettings', [
  function () {
    return {
      restrict: 'A',
      templateUrl: 'js/arethusa.core/templates/plugin_settings.html'
    };
  }
]);

'use strict';

/**
 * @ngdoc directive
 * @name arethusa.core.directives:plugin
 * @restrict AE
 * @scope
 *
 * @description
 * Renders a plugin, identified by the plugin's name.
 *
 * The template found in the plugins `template` property is used to do this.
 *
 * The plugin itself is bound to the newly created child scope. Templates can
 * access it through the `plugin` scope variable.
 *
 * @param {string} plugin The name of the plugin used in this scope.
 * @param {boolean} [withSettings=false] Determines if the template should
 *   include plugin settings through the use of the {@link arethusa.core.directives:pluginSettings pluginSettings}
 *   directive.
 *
 * @requires plugins
 */
angular.module('arethusa.core').directive('plugin', [
  'plugins',
  function (plugins) {
    return {
      restrict: 'AE',
      scope: true,
      link: function (scope, element, attrs) {
        var nameMap = {
          'aT' : 'artificialToken',
          'SG' : 'sg'
        };

        scope.name = nameMap[attrs.name] || attrs.name;
        scope.plugin = plugins.get(scope.name);
        scope.withSettings = attrs.withSettings;

        scope.$on('pluginAdded', function(event, name, plugin) {
          if (name === scope.name) {
            scope.plugin = plugin;
          }
        });
      },
      templateUrl: 'js/arethusa.core/templates/plugin.html'
    };
  }
]);

'use strict';

angular.module('arethusa.core').directive('prevToken', [
  'state',
  function (state) {
    return {
      restrict: 'AE',
      link: function (scope, element, attrs) {
        element.bind('click', function (e) {
          scope.$apply(state.selectPrevToken());
        });
      }
    };
  }
]);

"use strict";

/**
 * @ngdoc directive
 * @name arethusa.core.directives:relocate
 * @restrict A
 *
 * @description
 * display a list of one or more locations each of which triggers
 * a click event which triggers
 * {@link arethusa.core.relocateHandler#methods_relocate relocateHandler#relocate},
 * when one or more relocate url is defined in the {@link arethusa.core.relocateHandler relocateHandler},
 *
 * @requires arethusa.core.relocateHandler
 * @requires arethusa.core.translator
 */
angular.module('arethusa.core').directive('relocate', [
  'relocateHandler',
  'translator',
  function(relocateHandler, translator) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        if (relocateHandler.defined) {
          scope.locations = relocateHandler.locations;
          scope.relocate = function(loc) {
              relocateHandler.relocate(loc);
            };
        } 
      },
      templateUrl: 'js/arethusa.core/templates/relocate.html'
    };
  }
]);

'use strict';
angular.module('arethusa.core').directive('resizable', [
  '$window',
  '$document',
  'keyCapture',
  function (
    $window,
    $document,
    keyCapture
  ) {

    var STEP = 25;

    return {
      restrict: 'AEC',
      link: function (scope, element, attrs) {
        var main = angular.element(document.getElementById('main-body'));
        var win = angular.element($window);
        var panel = element.parent();

        var panelMin = 260;
        var mainMin  = 260;

        element.on('mousedown', function (event) {
          event.preventDefault();
          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });

        // This is very unstable and chaotic.
        // We substract 0.5 in the last step to deal with a viewport with
        // a width that is not a round number.
        // There is a possibility that the divs that are resized shrinked by
        // this though.
        //
        // A better solution might be to really recompute the size of
        // the resized diffs - right now we are moving them around step
        // by step.
        function mousemove(event) {
          resize(Math.floor(event.pageX));
        }

        function resize(x) {
          var leftPos = Math.round(panel.position().left);
          var width = Math.round(panel.width());
          var border = leftPos + width;
          var diff = x - leftPos;
          var panelSize = width - diff;
          var mainSize  = main.width() + diff;

          if (withinBoundaries(panelSize, mainSize)) {
            panel.width(panelSize);
            main.width(mainSize);
          }
        }

        function shrink() {
          var pos = Math.round(panel.position().left);
          resize(pos + STEP);
        }

        function grow() {
          var pos = Math.round(panel.position().left);
          resize(pos - STEP);
        }

        function withinBoundaries(panel, main) {
          return panel > panelMin && main > mainMin;
        }

        function mouseup() {
          win.trigger('resize');
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }

        var keys = keyCapture.initCaptures(function(kC) {
          return {
            sidepanelResizing: [
              kC.create('grow', grow, '←'),
              kC.create('shrink', shrink, '→')
            ]
          };
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('revealToggle', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var tId = attrs.revealToggle;
      var alwaysReveal = attrs.alwaysReveal;
      var slide = attrs.slide;


      function el() {
        return angular.element(document.getElementById(tId));
      }

      element.bind('click', function() {
        var t = el();
        if (alwaysReveal || t.hasClass('hide')) {
          if (slide) t.slideDown();
          t.removeClass('hide');
          t.trigger('show-' + tId);
        } else {
          if (slide) t.slideUp();
          t.addClass('hide');
          t.trigger('hide-' + tId);
        }
      });
    }
  };
});

"use strict";

// The root token is only relevant in a dependency tree context -
// it's therefore completely valid to hardcode a few things here and
// not react to dynamic click handle changes.
angular.module('arethusa.core').directive('rootToken', [
  'state',
  'globalSettings',
  'depTree',
  function(state, globalSettings, depTree) {
    return {
      restrict: 'A',
      scope: {
        id: '@rootId',
        sentenceId: '@'
      },
      link: function(scope, element, attrs) {
        var actionName = 'change head';

        function apply(fn) {
          scope.$apply(fn());
        }

        function hoverActions() {
          return globalSettings.clickActions[actionName][1];
        }

        function doHoverAction(type, event) {
          if (globalSettings.clickAction === actionName) {
            hoverActions()[type](scope.id, element, event);
          }
        }

        function MockToken() {
          this.id = scope.id;
          this.sentenceId = scope.sentenceId;
        }

        element.bind('click', function() {
          if (globalSettings.clickAction === actionName) {
            apply(function() {
              depTree.changeHead(new MockToken());
            });
          }
        });

        element.bind('mouseenter', function (event) {
          apply(function() {
            element.addClass('hovered');
            doHoverAction('mouseenter', event);
          });
        });
        element.bind('mouseleave', function (event) {
          apply(function() {
            element.removeClass('hovered');
            doHoverAction('mouseleave', event);
          });
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('saver', [
  'saver',
  'translator',
  function(saver, translator) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.saver = saver;
        var saveWatch;

        element.bind('click', function() {
          scope.$apply(saver.save());
        });

        scope.$watch('saver.canSave', function(newVal, oldVal) {
          if (newVal) {
            element.show();
            addSaveWatch();
          } else {
            element.hide();
            removeSaveWatch();
          }
        });

        function addSaveWatch() {
          // Safety measure, so that we never register the watch twice, which
          // might never happen anyway, but who knows.
          removeSaveWatch();

          saveWatch = scope.$watch('saver.needsSave', function(newVal, oldVal) {
            if (newVal) {
              element.addClass('alert');
              element.removeClass('disabled');
            } else {
              element.addClass('disabled');
              element.removeClass('alert');
            }
          });
        }

        function removeSaveWatch() {
          if (saveWatch) saveWatch();
        }


        var trsl, hint;

        scope.$on('keysAdded', function(_, keys) {
          var sel = keys.saver;
          if (sel) {
            hint = aU.formatKeyHint(sel.save);
            setTitle();
          }
        });

        translator('save', function(translation) {
          trsl = translation();
          setTitle();
        });

        function setTitle() {
          element.attr('title', trsl + ' ' + hint);
        }
      },
      template: '<i class="fi-save"/>'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('sentenceList', [
  '$compile',
  'navigator',
  function($compile, navigator) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, element, attrs) {
        scope.n = navigator;

        function createList() {
          // We want this to load only once, and only if
          // a user requests it!
          if (! navigator.hasList) {
            var template = '\
              <div class="canvas-border"/>\
              <div id="canvas" class="row panel full-height scrollable" full-height>\
                <ul class="sentence-list">\
                  <li \
                    class="sentence-list"\
                    sentence="s"\
                    ng-repeat="s in n.sentences">\
                  </li>\
                </ul>\
              </div>\
            ';

            navigator.list().append($compile(template)(scope));
            navigator.hasList = true;
          }
        }

        scope.$on('viewModeSwitched', createList);

        element.bind('click', function() {
          createList();
          scope.$apply(function() {
            navigator.switchView();
          });
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('sentence', [
  'navigator',
  function(navigator) {
    return {
      restrict: 'A',
      scope: {
        sentence: '='
      },
      link: function(scope, element, attrs) {
        function getCitation() {
          navigator.getCitation(scope.sentence, function(citation) {
            scope.citation = citation;
          });
        }

        scope.goTo = function(id) {
          navigator.goTo(id);
          navigator.switchView();
        };

        scope.sentenceString = scope.sentence.toString();
        scope.id = scope.sentence.id;

        getCitation();
      },
      templateUrl: 'js/arethusa.core/templates/sentence.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('settingsTrigger', [
  'translator',
  function(translator) {
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        var dir = attrs.settingsTrigger || 'left';
        var margin = 'margin-' + (dir === 'left' ? 'right' : 'left');
        var r = dir === 'left' ? '' : 'bw-';

        element.addClass(dir);
        element.addClass('rotate-' + r + 'on-hover');
        element.css(margin, '10px');

        translator('settings', function(translation) {
          element.attr('title', translation());
        });
      },
      templateUrl: 'js/arethusa.core/templates/settings_trigger.html'
    };
  }
]);

'use strict';

angular.module('arethusa.core').directive('sidepanelFolder', [
  'sidepanel',
  '$window',
  'translator',
  function(sidepanel, $window, translator) {
    return {
      scope: {},
      link: function (scope, element, attrs) {
        var win = angular.element($window);

        scope.translations = translator({
          'sidepanel.show': 'show',
          'sidepanel.fold': 'fold'
        });

        scope.$watch('translations', function(newVal, oldVal) {
          if (newVal !== oldVal) {
            setIconClassAndTitle();
          }
        }, true);

        function setIconClassAndTitle() {
          var icon = sidepanel.folded ? 'expand' : 'compress';
          var text = sidepanel.folded ? 'show' : 'fold';
          var key  = arethusaUtil.formatKeyHint(sidepanel.activeKeys.toggle);
          scope.iconClass = 'fi-arrows-' + icon;
          element.attr('title', scope.translations[text]() + " " + key);
        }

        element.on('click', function () {
          sidepanel.toggle();
          scope.$apply(setIconClassAndTitle());
        });

        scope.sp = sidepanel;

        var foldWatch = function() {};
        scope.$watch('sp.active', function(newVal) {
          if (newVal) {
            element.show();
            foldWatch = scope.$watch('sp.folded', function(newVal, oldVal) {
              setIconClassAndTitle();
              win.trigger('resize');
            });
          } else {
            element.hide();
            foldWatch();
          }
        });
      },
      template: '<i ng-class="iconClass"/>'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('sidepanel', [
  'sidepanel',
  'keyCapture',
  'plugins',
  function(sidepanel, keyCapture, plugins) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var minIndex = 0;

        function currentIndex() {
          return plugins.sub.indexOf(plugins.active);
        }

        function maxIndex() {
          return plugins.sub.length - 1;
        }

        function selectPluginByIndex(index) {
          var plugin = plugins.sub[index];
          plugins.setActive(plugin);
        }

        function moveToNext() {
          var current = currentIndex();
          var index = current === maxIndex() ? minIndex : current + 1;
          selectPluginByIndex(index);
        }

        function moveToPrev() {
          var current = currentIndex();
          var index = current === minIndex ? maxIndex() : current - 1;
          selectPluginByIndex(index);
        }

        var keys = keyCapture.initCaptures(function(kC) {
          return {
            sidepanel: [
              kC.create('nextTab', function() { kC.doRepeated(moveToNext); }, 'W'),
              kC.create('prevTab', function() { kC.doRepeated(moveToPrev); }, 'E'),
              kC.create('toggle',  function() { sidepanel.toggle(); }, 'q'),
            ]
          };
        });
        angular.extend(sidepanel.activeKeys, keys.sidepanel);
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('spinner', [
  'spinner',
  function(spinner) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.spinner = spinner;

        scope.$watch('spinner.spinning', function(newVal, oldVal) {
          scope.visible = newVal;
        });
      },
      template: '<i ng-show="visible" class="fa fa-spinner fa-spin info-message"></i>'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('toBottom', [
  '$window',
  '$timeout',
  function($window, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var canvas, win;

        function gridItem() {
          return element.parents('.gridster-item');
        }

        if (aU.isArethusaMainApplication()) {
          var grid = gridItem();
          if (grid[0]) {
            canvas = win = grid;
          } else {
            canvas = angular.element(document.getElementById('canvas'));
            win  = angular.element($window);
          }
        } else {
          canvas = win = element.parents('[ng-controller="ArethusaCtrl"]');
        }

        angular.element($window).on('resize', setHeight);
        scope.$on('stateLoaded', setHeight);

        function setHeight() {
          $timeout(function() {
            var offset = element.offset().top;
            var bottom = canvas.offset().top + canvas.height();
            element.height(bottom - offset);
            var svg = element.find('svg');
            if (svg[0]) {
              var elBottom = element[0].getBoundingClientRect().bottom;
              var svgTop = svg.offset().top;
              svg.height(elBottom - svgTop);
            }
          });
        }

        setHeight();
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('tokenSelector', [
  'state', '_', 'StateChangeWatcher', 'Highlighter', 'translator',
  function(state, _, StateChangeWatcher, Highlighter, translator) {
    return {
      restrict: 'A',
      scope: {
        tokens: "=tokenSelector"
      },
      link: function(scope, element, attrs) {
        var hasNoTokensSelected = true;
        var hasAllTokensSelected = false;
        var style = scope.style || { "background-color": "rgb(255, 216, 216)" }; // a very light red
        scope.state = state;

        scope.$watch('state.hasClickSelections()', function(newValue, oldValue) {
          hasNoTokensSelected = newValue === 0;
          hasAllTokensSelected = newValue === state.totalTokens;

          updateSelectors();
        });

        var callbacks = {
          newMatch: function(token) {
            if (unusedHighlighter.isActive) state.addStyle(token.id, style);
          },
          lostMatch: function(token) {
            if (unusedHighlighter.isActive) highlighter.removeStyle(token.id);
          },
          changedCount: function(newCount) {
            unusedSelector.count = newCount;
            translator("selector.unused", setLabel(unusedSelector));
          }
        };
        var unusedWatcher = new StateChangeWatcher('head.id', callbacks);

        var highlighter = new Highlighter(unusedWatcher, style);

        var selectAll = function() {
          state.multiSelect(Object.keys(scope.tokens));
        };

        var selectUnused = function() {
          highlighter.unapplyHighlighting();
          state.multiSelect(Object.keys(unusedWatcher.matchingTokens));
        };


        function switchHighlighting() {
          if (unusedHighlighter.isActive) {
            highlighter.unapplyHighlighting();
          } else {
            highlighter.applyHighlighting();
          }
          unusedHighlighter.isActive = !unusedHighlighter.isActive;
        }

        function setLabel(obj) {
          return function(translationFn) {
              obj.label = translationFn(obj);
          };
        }

        function setTooltip(obj) {
          return function(translationFn) {
              obj.tooltip = translationFn(obj);
          };
        }

        function translateSelector(selector, name) {
          var translationId = "selector." + name;
          translator(translationId, setLabel(selector));
          translator(translationId + "Tooltip", setTooltip(selector));
        }

        scope.selection = {};
        translateSelector(scope.selection, "selection");

        var noneSelector = {
          action: function() {
            state.deselectAll();
            highlighter.applyHighlighting();
          },
          isActive: true
        };
        translateSelector(noneSelector, "none");

        var allSelector = {
          action: selectAll,
          isActive: false
        };
        translateSelector(allSelector, "all");

        var unusedSelector = {
          action: selectUnused,
          isActive: false,
          count: 0
        };
        translateSelector(unusedSelector, "unused");

        var unusedHighlighter = {
          action: switchHighlighting,
          styleClasses: 'unused-highlighter',
          isActive: false
        };
        translateSelector(unusedHighlighter, "highlightUnused");

        scope.selectors = [
          noneSelector,
          // allSelector, // not used right now for performance reasons
          unusedSelector,
          unusedHighlighter
        ];

        var areAllSelected = function(tokens) {
          return _.all(Object.keys(tokens), function(tokenId) {
            return state.isClicked(tokenId);
          });
        };

        var updateSelectors = function() {
          noneSelector.isActive = hasNoTokensSelected;
          allSelector.isActive = hasAllTokensSelected;

          unusedSelector.isActive = !hasNoTokensSelected &&
            state.hasClickSelections() === unusedWatcher.count &&
            areAllSelected(unusedWatcher.matchingTokens);
        };

        scope.$watch('state.tokens', function(newVal, oldVal) {
          unusedWatcher.initCount();
        });
      },
      templateUrl: 'js/arethusa.core/templates/token_selector.html'
    };
  }
]);


'use strict';
angular.module('arethusa.core').directive('tokenWithId', [
  'idHandler',
  function (idHandler) {
    return {
      restrict: 'A',
      scope: {
        value: '=',
        tokenId: '='
      },
      link: function (scope, element, attrs) {
        function formatId(newId) {
          scope.formatted = idHandler.formatId(newId, '%s-%w');
        }

        scope.$watch('tokenId', formatId);

      },
      template: '<span>{{ value }} <sup class="note">{{ formatted }}</sup>'
    };
  }
]);


'use strict';

// The directive currently looks at the depTree plugin to derive info whether
// the head of token can be changed through a click event or not.
//
// This is NOT a final solution, as it is flawed in several aspects.
// There might be no depTree plugin present at all - that way it will not
// be possible to check it. The way it is handled right now, this would
// lead to problems: Even if the depTree plugin isn't included in the
// application, the directive would still import it and be able to change heads,
// as 'editor' is the default mode of all plugins.
//
// The solution is to abstract plugin handling one step more. This has been planned
// for a while now, just never got the chance to really do it.
// Abstracting plugins will also clean up the MainCtrl, who has far too many
// responsibilites at the moment.
angular.module('arethusa.core').directive('token', [
  'state',
  'globalSettings',
  function (state, globalSettings) {
    return {
      restrict: 'AE',
      scope: {
        token: '=',
        colorize: '=',
        click: '@',
        hover: '@',
        highlight: '@'
      },
      link: function (scope, element, attrs) {
        if (!scope.token) return;
        if (!angular.isObject(scope.token)) {
          scope.token = state.getToken(scope.token);
        }

        scope.state = state;
        var id = scope.token.id;

        function apply(fn) {
          scope.$apply(fn());
        }

        function bindClick() {
          element.bind('click', function (event) {
            apply(function() {
              var clickType = event.ctrlKey ? 'ctrl-click' : 'click';
              if (clickType === 'click' && state.hasClickSelections()) {
                globalSettings.clickFn(id);
              } else {
                state.toggleSelection(id, clickType);
              }
            });
          });
        }

        function bindHover() {
          element.bind('mouseenter', function () {
            apply(function () {
              state.selectToken(id, 'hover');
            });
          });
          element.bind('mouseleave', function () {
            apply(function () {
              state.deselectToken(id, 'hover');
            });
          });
        }

        scope.selectionClass = function () {
          if (state.isSelected(id)) {
            if (state.selectionType(id) == 'hover') {
              return 'hovered';
            } else {
              return 'selected';
            }
          }
        };

        function bindPreClick() {
          var preClick = globalSettings.preClickFn;
          if (preClick) {
            angular.forEach(preClick, function(fn, eventName) {
              element.bind(eventName, function(event) {
                apply(function() {
                  fn(id, element, event);
                });
              });
            });
          }
        }

        function addBindings() {
          // It's imperative to bind any preClickFn which might hover here -
          // otherwise it will fail to register
          if (scope.click) {
            bindClick();
            element.addClass('clickable');
            bindPreClick();
          }
          if (scope.hover) bindHover();
        }

        function unbind() {
          element.removeClass('clickable');
          element.unbind();
        }

        function updateBindings() {
          unbind();
          addBindings();
        }

        scope.$on('clickActionChange', updateBindings);


        function cleanStyle() {
          angular.forEach(scope.token.style, function (val, style) {
            element.css(style, '');
          });
        }

        // We have two possibilities here:
        // When the colorize contains an attribute, the user wants
        // to set a custom style.
        // When it was just a boolean value of true, we look if the
        // token itself contains style information.
        scope.$watch('colorize', function (newVal, oldVal) {
          if (newVal) {
            if (angular.isObject(newVal)) {
              element.css(newVal);
            } else {
              element.css(scope.token.style || {});
            }
          } else {
            cleanStyle();
          }
        });
        scope.$watch('token.style', function (newVal, oldVal) {
          if (newVal !== oldVal) {
            if (newVal) {
              element.removeAttr('style'); // css() only modifies properties!
              element.css(newVal);
            } else {
              cleanStyle();
            }
          }
        }, true);

        // Special handling of articial tokens
        if (scope.token.artificial) {
          element.addClass(scope.token.type);
        }

        element.addClass('token');

        addBindings();
      },
      templateUrl: 'js/templates/token.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('translateLanguage', [
  '$translate',
  'translator',
  'LOCALES',
  function($translate, translator, LOCALES) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        var langKey;

        function useKey(key) {
          langKey = key || $translate.use() || 'en';
          $translate.use(langKey);
          scope.lang = langKey;
        }

        function toggleLang() {
          var i;
          i = LOCALES.indexOf(langKey) + 1;
          i = i > LOCALES.length - 1 ? 0 : i;
          useKey(LOCALES[i]);
        }

        element.bind('click', function() {
          scope.$apply(toggleLang);
        });

        var parent = element.parent();
        translator('language', function(translation) {
          parent.attr('title', translation());
        });

        useKey();
      },
      templateUrl: 'js/arethusa.core/templates/translate_language.html'
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('unusedTokenHighlighter', [
  'state',
  '$window',
  'translator',
  'StateChangeWatcher',
  'Highlighter',
  function(state, $window, translator, StateChangeWatcher, Highlighter) {
    return {
      restrict: 'A',
      scope: {
        highlightMode: '@unusedTokenHighlighter',
        style: '=unusedTokenStyle',
        uthCheckProperty: '@',
        uthAuxiliaryProperty: '@'
      },
      link: function(scope, element, attrs) {
        var style = scope.style || { "background-color": "rgb(255, 216, 216)" }; // a very light red
        var highlightMode = !!scope.highlightMode;
        scope.s = state;
        scope.total = state.totalTokens;

        var callbacks = {
          newMatch: function(token) {
            if (highlightMode) state.addStyle(token.id, style);
          },
          lostMatch: function(token) {
            if (highlightMode) highlighter.removeStyle(token.id);
          },
          changedCount: function(newCount) {
            scope.unusedCount = newCount;
          }
        };
        var stateChangeWatcher = new StateChangeWatcher(
          scope.uthCheckProperty,
          callbacks,
          scope.uthAuxiliaryProperty
        );
        stateChangeWatcher.initCount();

        var highlighter = new Highlighter(stateChangeWatcher, style);

        if (highlightMode) highlighter.applyHighlighting();

        function selectUnusedTokens() {
          highlighter.unapplyHighlighting();
          state.multiSelect(Object.keys(stateChangeWatcher.matchingTokens));
        }

        element.bind('click', function() {
          scope.$apply(function() {
            if (highlightMode) {
              highlighter.unapplyHighlighting();
            } else {
              highlighter.applyHighlighting();
            }
          });
          highlightMode = !highlightMode;
        });

        element.bind('dblclick', function(event) {
          scope.$apply(function() {
            selectUnusedTokens();
          });

          // Trying to prevent the native browser behaviour
          // for dblclicks - they are pretty browser-dependent
          event.preventDefault();
          $window.getSelection().empty();
          return false;
        });

        scope.$watch('s.tokens', function(newVal, oldVal) {
          scope.total = state.totalTokens;
          stateChangeWatcher.initCount();
        });

        scope.$on('tokenAdded', function(event, token) {
          scope.total++;
          stateChangeWatcher.initCount();
          if (highlightMode) highlighter.applyHighlighting();
        });

        scope.$on('tokenRemoved', function(event, token) {
          scope.total--;
        });

        translator('uth.tooltip', function(trsl) {
          scope.tooltip = trsl();
        });
      },
      template: '\
      <span\
      tooltip-html-unsafe="{{ tooltip }}"\
      tooltip-popup-delay="700"\
      tooltip-placement="left"\
      translate="uth.count"\
      translate-value-count="{{ unusedCount }}"\
      translate-value-total="{{ total }}">\
      '
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('uservoiceEmbed', [
  'translator',
  'uuid2',
  function(translator,uuid2) {
    return {
      restrict: 'A',
      scope: {
        target: "@"
      },
      link: function(scope, element, attrs) {
          // this is a little convoluted but we could have multiple
          // embedded uservoice elements so we need to be sure each
          // has a unique id
          var embedded_elem_id = "data-uv-embed-" + uuid2.newuuid();
          angular.forEach(element.children(), function(elem,i) {
            if (angular.element(elem).hasClass(scope.target)) {
              angular.element(elem).attr('id',embedded_elem_id);
            }
          });
          translator('errorDialog.sendMessage', function(translation) {
            scope.hint = translation();
            // it would be nice to do this as a result of the confirm modal action
            // but it's more work to include a screenshot of the error in that case
            // we could do this as custom key/value pair but we are only allowed one
            // and might hit field length limitations.
            UserVoice.push(['embed', '#'+embedded_elem_id, {
              mode: 'contact',
              contact_title: '',
              strings: { contact_message_placeholder: scope.hint }
            }]);
        });
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').directive('uservoiceTrigger', [
  'translator',
  function(translator) {
    return {
      restrict: 'A',
      compile: function(element, attributes) {
        element.attr('id', 'uservoicebutton');
        element.attr('data-uv-trigger', 'contact');

        return function link(scope, element) {
          var parent = element.parent();
          translator('contactUs', function(translation) {
            parent.attr('title', translation);
          });
        };
      },
      template: '<i class="fi-comment"/>'
    };
  }
]);

'use strict';

angular.module('arethusa.core').directive('valueWatch', function () {
  return {
    restrict: 'A',
    scope: {
      target: '=',
      property: '@',
      emptyVal: '@'
    },
    link: function(scope, element, attrs) {
      scope.$watch('target.' + scope.property, function(newVal, oldVal) {
        if (newVal) {
          scope.value = newVal;
          element.removeClass('bold');
        } else {
          scope.value = scope.emptyVal || '';
          element.addClass('bold');
        }
      });
    },
    template: '<span>{{ value }}</span>'
  };
});

'use strict';
angular.module('arethusa.core').factory('Auth', [
  '$resource',
  '$cookies',
  '$timeout',
  '$injector',
  'translator',
  function ($resource, $cookies, $timeout, $injector, translator) {
    var lazyNotifier;
    function notifier() {
      if (!lazyNotifier) lazyNotifier = $injector.get('notifier');
      return lazyNotifier;
    }

    function Pinger(url,withCredentials) {
      if (url) {
        var resource = $resource(url, null, { get: { withCredentials: withCredentials, headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')} } });
        this.checkAuth = function(success, error) {
          resource.get(success, error);
        };
      } else {
        this.checkAuth = function(success, error) {
          success();
        };
      }
    }

    function noop() {}

    var translations = translator('auth.notLoggedIn', translations, 'notLoggedIn');

    return function(conf, modeFn) {
      var self = this;
      self.conf = conf;
      var skipModes = conf.skipModes || [];

      var authFailure;

      function modeToSkip() {
        return arethusaUtil.isIncluded(skipModes, modeFn());
      }

      function loginWarning() {
        authFailure = true;
        notifier().warning(translations.notLoggedIn(), null, 500);
      }

      function checkForAuthFailure(res) {
        if (res.status === 403 || res.status === 400) loginWarning();
      }

      this.withCredentials = conf.crossDomain ? true : false;

      var pinger = new Pinger(conf.ping,this.withCredentials);


      this.checkAuthentication = function() {
        if (modeToSkip()) return;
        pinger.checkAuth(noop, checkForAuthFailure);
      };

      this.withAuthentication = function(q, callback) {
        var err = function(res) {
          checkForAuthFailure(res);
          q.reject(res);
        };

        var suc = function(res) {
          authFailure = false;
          q.resolve(res);
        };

        var launch = function() {
          callback().then(suc, err);
        };

        // If we had no authFailure before, avoid the indirection and
        // launch the callback right away.
        if (!authFailure || modeToSkip()) {
          launch();
        } else {
          // Check auth will ideally restore our session cookie - we need to
          // $timeout, otherwise we don't see it updated!
          // Angular is polling every 100ms for new cookies, we therefore
          // have to wait a little.
          var authSuc = function() { $timeout(launch, 150); };
          pinger.checkAuth(authSuc, err);
        }
      };

      this.transformRequest = function(headers) {
        if (self.conf.type == 'CSRF') {
          headers()[self.conf.header] = $cookies[self.conf.cookie];
        } else if (self.conf.type == 'bearer') {
          headers()[self.conf.header] = 'Bearer '+localStorage.getItem('token')
        }
      };
    };
  }
]);

'use strict';
// Handles params concerning configuration files in the $routeProvider phase
angular.module('arethusa.core').factory('confUrl', [
  'CONF_PATH',
  '$route',
  function (CONF_PATH, $route) {
    // The default route is deprectated and can be refactored away
    return function (useDefault) {
      var params = $route.current.params;
      var confPath = CONF_PATH + '/';
      // Fall back to default and wrong paths to conf files
      // need to be handled separately eventually
      if (params.conf) {
        return confPath + params.conf + '.json';
      } else if (params.conf_file) {
        return params.conf_file;
      } else {
        if (useDefault) {
          return confPath + 'default.json';
        }
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').factory('DocumentResolver', [
  'configurator',
  '_',
  function(configurator, _) {
    return function DocumentResolver(conf) {
      var resource = configurator.provideResource(conf.resource);

      this.resolve = resolve;

      function resolve(retrievers, onSuccessFnGenerator) {
        resource.get().then(function(res) {
          var docs = res.data;
          _.forEach(docs, function(link, type) {
            var retriever = getRetriever(retrievers, type);
            if (retriever) {
              var params = { doc: link };
              retriever.get(params, onSuccessFnGenerator(retriever));
            }
          });
        });
      }

      function getRetriever(retrievers, type) {
        var name = conf.map[type];
        if (name) return retrievers[name];
      }
    };
  }
]);

"use strict";

angular.module('arethusa.core').factory('globalStore', [
  function() {
    return {};
  }
]);

'use strict';
/**
 * @ngdoc service
 * @name arethusa.core.Highlighter
 * @description
 * # Highlighter
 * Provides functions apply or unapply a given highlighting style
 * to matching tokens of a given StateChangeWatcher.
 *
 * @requires arethusa.core.state
 * @requires arethusa.core.StateChangeWatcher
 */
angular.module('arethusa.core').factory('Highlighter', [
  'state',
  function (state) {
    return function(stateChangeWatcher, style) {
      var self = this;

      this.applyHighlighting = function() {
        stateChangeWatcher.applyToMatching(function(id) {
          state.addStyle(id, style);
        });
      };

      this.removeStyle = function(id) {
        var styles = Object.keys(style);
        state.removeStyle(id, styles);
      };

      this.unapplyHighlighting = function() {
        stateChangeWatcher.applyToMatching(function(id) {
          self.removeStyle(id);
        });
      };
    };
  }
]);

// Formerly used by configurator to merge configuration files on runtime.
//
// Became obsolete through http://github.com/latin-language-toolkit/arethusa/pull/365
//
// It might be handy again at a later stage, so we keep the code, but comment it
// out as to ignore it in minification.
//
//
//"use strict";

//angular.module('arethusa.core').factory('Loader', function() {
  //return function() {
    //var objectsToWaitFor = [];
    //var loadCounter = {};

    //function objIndex(obj) {
      //return objectsToWaitFor.indexOf(obj);
    //}

    //function incrementCounter(obj) {
      //var i = objIndex(obj);
      //if (loadCounter[i]) {
        //loadCounter[i]++;
      //} else {
        //loadCounter[i] = 1;
      //}
    //}

    //function decrementCounter(obj) {
      //var i = objIndex(obj);
      //loadCounter[i]--;

      //if (loadCounter[i] === 0) {
        //delete loadCounter[i];
      //}
    //}


    //this.declareUnloaded = function(obj) {
      //objectsToWaitFor.push(obj);
      //incrementCounter(obj);
    //};

    //this.counter = function() {
      //return loadCounter;
    //};

    //this.declareLoaded = function(obj) {
      //decrementCounter(obj);
    //};

    //this.allLoaded = function() {
      //return Object.keys(loadCounter).length === 0;
    //};
  //};
//});

'use strict';
// A newable factory that spawns new resource
// objects, whichare a wrapper around ngResource
//
// Note that this approach right now doesn't work with totally freeform URL passed
// as route, because ngResource will always encode slashes.
// There is a pending issue for this https://github.com/angular/angular.js/issues/1388
//
// As it's not a top priority right now, we don't do anything. The quickest workaround
// (apart from patching angular) would be to fall back to $http.get()
//
angular.module('arethusa.core').factory('Resource', [
  '$resource',
  '$q',
  'locator',
  'spinner',
  function ($resource, $q, locator, spinner) {
    function paramsToObj(params) {
      return arethusaUtil.inject({}, params, function (obj, param, i) {
        obj[param] = locator.get(param);
      });
    }

    function isJson(header) {
      if (header) return header.match('json');
    }

    function collectedParams(a, b) {
      return angular.extend(paramsToObj(a), b) || {};
    }

    function parseResponse(data, headers) {
      var res = {};
      res.data = isJson(headers()['content-type']) ? JSON.parse(data) : data;
      res.headers = headers;
      res.source = 'tbd';
      // we need to define and http interceptor
      return res;
    }

    function createAborter() {
      return $q.defer();
    }

    return function (conf, auth) {
      var self = this;
      this.route = conf.route;
      this.params = conf.params || [];
      this.auth = auth;

      // Check right away if the user is logged in and notify
      // him when he isn't
      auth.checkAuthentication();

      var aborter;

      function createResource() {
        aborter = createAborter();
        return $resource(self.route, null, {
          get: {
            method: 'GET',
            withCredentials: auth.withCredentials,
            transformResponse: parseResponse,
            timeout: aborter.promise
          },
          save: {
            // TODO we need save and partial save -- latter will use PATCH
            method: 'POST',
            withCredentials: auth.withCredentials,
            transformRequest: function(data,headers) {
              var contentType = self.mimetype || 'application/json';
              headers()["Content-Type"] = contentType;
              if (isJson(contentType)) {
                data = angular.toJson(data);
              }
              self.auth.transformRequest(headers);
              return data;
            },
            transformResponse: parseResponse
          }
        });
      }
      this.resource = createResource();

      this.get = function (otherParams) {
        //spinner.spin();
        var params = collectedParams(self.params, otherParams);
        var promise = self.resource.get(params).$promise;
        //promise['finally'](spinner.stop);
        return promise;
      };

      var authFailure;
      this.save = function (data,mimetype) {
        //spinner.spin();

        var params = collectedParams(self.params,{});
        self.mimetype = mimetype;

        var q = $q.defer();
        var promise = q.promise;

        auth.withAuthentication(q, function() {
          return self.resource.save(params, data).$promise;
        });

        //promise['finally'](spinner.stop);
        return promise;
      };

      this.post = this.save;

      // This is not ideal - we have to re-create the complete resource, just
      // because we need one with a new resolvable promises, so that we can
      // abort it again.
      //
      // Needs another look. What I tried to do is to renew just the promise,
      // but not the complete promise. Wasn't really able to pull it off.
      // I guess the promise needs to be wrapped by another promise?!
      // It's no big deal to renew the resource, it just would be a little less
      // expensive to deal with a new promise only and leave the resource
      // untouched.
      this.abort = function() {
        aborter.resolve();
        self.resource = createResource();
      };
    };
  }
]);

'use strict';
/**
 * @ngdoc service
 * @name arethusa.core.StateChangeWatcher
 * @description
 * # StateChangeWatcher
 * Watches changes to the given `propertyToWatch`, which must
 * be given as a string.
 *
 * The callbacks object must have the following functions:
 *
 * - newMatch(token): This is called when a token changes its `propertyToWatch`
 *   to a truthy value.
 * - lostMatch(token): This is called when a token changes its `propertyToWatch`
 *   from a truthy value to a falsy value.
 * - changedCount(newCount): This is called if the count of tokens with a
 *   truthy `propertyToWatch` changes
 *
 * @requires arethusa.core.state
 * @requires $parse
 */
angular.module('arethusa.core').factory('StateChangeWatcher', [
  'state', '$parse',
  function (state, $parse) {
    return function(propertyToWatch, callbacks, auxiliaryProperty) {
      var self = this;
      this.checkFunction = getCheckFunction(propertyToWatch, auxiliaryProperty);
      this.auxiliaryProperty = auxiliaryProperty;

      this.initCount = function() {
        self.count = 0;
        self.matchingTokens = {};
        angular.forEach(state.tokens, function(token) {
          if (!self.checkFunction(token)) {
            self.count++;
            self.matchingTokens[token.id] = true;
          }
        });
        callbacks.changedCount(self.count);
      };

      this.watchChange = function(newVal, oldVal, event) {
        var id = event.token.id;
        if (parseValue(newVal)) {
          // Check if the token was used before!
          if (!parseValue(oldVal)) {
            self.count--;
            delete self.matchingTokens[id];
            callbacks.lostMatch(event.token);
            callbacks.changedCount(self.count);
          }
        } else {
          self.count++;
          self.matchingTokens[id] = true;
          callbacks.newMatch(event.token);
          callbacks.changedCount(self.count);
        }
      };

      this.applyToMatching = function(fn) {
        angular.forEach(self.matchingTokens, function(value, id) {
          fn(id);
        });
      };

      state.watch(propertyToWatch, this.watchChange);

      state.on('tokenAdded',   function(event, token) {
        if (!self.checkFunction(token)) {
          self.matchingTokens[token.id] = true;
          callbacks.newMatch(token);

          self.count++;
          callbacks.changedCount(self.count);
        }
      });

      state.on('tokenRemoved', function(event, token) {
        if (!self.checkFunction(token)) {
          delete self.matchingTokens[token.id];
          callbacks.lostMatch(token);

          self.count--;
          callbacks.changedCount(self.count);
        }
      });

      function getCheckFunction(main, aux) {
        var mainCheck = $parse(main);
        if (aux) {
          return function(token) {
            var m = mainCheck(token);
            return m && m[aux];
          };
        } else {
          return mainCheck;
        }
      }

      function parseValue(val) {
        var auxProp = self.auxiliaryProperty;
        return auxProp ? val && val[auxProp] : val;
      }
    };
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.StateChange
 *
 * @description
 * Returns a constructor function, which is `new`'ed during a
 * the execution {@link arethusa.core.state#methods_change state.change}.
 *
 * Generally not meant to be executed by hand. The resulting object
 * is the third argument to the callback registered through a call
 * of {@link arethusa.core.state#methods_watch state.watch}.
 *
 * @property {Token} token The token object, which has been changed.
 * @property {String} property The property which has changed, e.g. `'head.id'`
 * @property {*} newVal New value of the `property` after the change
 * @property {*} oldVal Old value of the `property` before the change
 * @property {Date} time Time when the change has happened
 * @property {fn} undoFn Function to undo a change. Typically triggers another
 *   {@link arethusa.core.state#methods_change state.change} call.
 * @property {fn} exec Function to trigger the change - setting the `newVal`
 *   on the `property` of the `token`.
 *
 *   Broadcasts a `tokenChange` event on the `$rootScope` with itself
 *   (the `StateChange` object) as argument and notifies all listeners
 *   registered through {@link arethusa.core.state#methods_watch state.watch}.
 *
 *   Returns itself.
 *
 */
angular.module('arethusa.core').factory('StateChange', [
  '$parse',
  function($parse) {
    function getToken(state, tokenOrId) {
      if (angular.isObject(tokenOrId)) {
        return tokenOrId;
      } else {
        return state.getToken(tokenOrId);
      }
    }

    return function(state, tokenOrId, property, newVal, undoFn, preExecFn) {
      var self = this;

      var get = $parse(property);
      var set = get.assign;

      this.token = getToken(state, tokenOrId);
      this.property = property;
      this.newVal = newVal;
      this.oldVal = get(self.token);
      this.type   = 'change';
      this.time = new Date();

      function inverse() {
        state.change(self.token, property, self.oldVal);
      }

      this.undo   = function() {
        return angular.isFunction(undoFn) ? undoFn() : inverse();
      };

      this.exec   = function() {
        if (angular.isFunction(preExecFn)) preExecFn();

        set(self.token, self.newVal);

        // It might seem redundant to broadcast this event, when listeners
        // could just use state.watch().
        // But it's not: Depending the time of init, a listener might not
        // have the chance to inject state - he has to listen through a
        // $scope then. In addition, $on brings some additional info about
        // the scope in use etc., which might be handy at times. We won't
        // replicate this in state.watch(), as most of the time it's overkill.
        state.broadcast('tokenChange', self);
        state.notifyWatchers(self);

        return self;
      };
    };
  }
]);

'use strict';

/**
 * @ngdoc service
 * @name arethusa.core.translatorNullInterpolator
 *
 * @description
 * Additional interpolation service for angular-translate.
 * Requirement for {@link arethusa.core.translator}.
 *
 * This interpolator service does nothing and allows to disable
 * `angular-translate`'s interpolation.
 *
 * Use it by calling `$translateProvider.addInterpolator('nullInterpolator')`.
 */
angular.module('arethusa.core').factory('translatorNullInterpolator', function() {
  return {
    getInterpolationIdentifier: function() { return 'nullInterpolator'; },
    interpolate: function(string) { return string; },
    setLocale: function() {}
  };
});

"use strict";

/**
 * @ngdoc function
 * @name arethusa.core.translator
 *
 * @description
 * Flexible Wrapper around `angular-translate`'s `$translate` service.
 *
 * Is intended to be used when it's impossible to use the `translate` directive
 * directly, e.g. when a service needs to work with a localized string. While
 * the `$translate` service can be used directly to achieve this, it is a bit
 * cumbersome to do so. This wrapper avoids dealing with promises of the
 * `$translate` service directly and thus reduces all boilerplate code attached
 * to proper localization.
 *
 * The function also registers a listener to the `$translateChangeSuccess`
 * event and can therefore be safely used to switch localizations on the fly.
 *
 * Requires {@link arethusa.core.translatorNullInterpolator nullInterpolator}
 * to be active.
 *
 * The two most common usage options of this service can be found in the
 * examples below, given a translation/localization file like this:
 *
 * ```
 *   {
 *     "greetings" : {
 *       "hello": "Hello {{ friend }}!"
 *       "bye" : "Goodspeed, my friend!"
 *     }
 *   }
 * ```
 *
 * <pre>
 *   // With a dictionary as sole argument
 *   var translations = translator({
 *     'greetings.hello': 'hi'
 *     'greetings.bye':  'bye'
 *   });
 *
 *   translations.hi({ friend: "comrade" }); // -> returns "Hello comrade!"
 *   translations.bye();                     // -> returns "Goodspeed, my friend!"
 * </pre>
 *
 * <pre>
 *   // With an id and a function as arguments
 *   translator('greetings.hello', function(translationFn) {
 *     greet(translationsFn({ friend: 'comrade' }));
 *   });
 *
 *   // Will call the greet function on initialization and everytime the
 *   // locale is changed on the fly.
 * </pre>
 *
 * @param {String|Array|Object} id The prime job ob this argument is to define
 *   the `translationId(s)` used with the `$translate` service. The argument
 *   can either be
 *
 *   - a String to define a single id. When a string is given, the third
 *     argument to this function is mandatory.
 *   - an Array to define multiple ids at once. The ids are not only used
 *     for lookup, but also as identifier to store the result in the Object
 *     of the second argument to this function
 *   - an Object used as map of `translationIds` and identifiers used to store
 *     the results. The keys serve as lookup ids, while the values are used
 *     as keys in the resulting object of this function.
 * @param {Object|Function} [objOrFn={}] When this argument is an object or not
 *   given at all - in which case an empty object will be used as default - it
 *   will be the data container to store the results of the translation process
 *   to.
 *
 *   When this argument is a Function, the
 *   first argument should be a string, although other combinations are not
 *   explicitly prohibited. One argument is passed to this function: the
 *   `$interpolate` function which returns a localized string.
 * @param {String} [propertyPath] Only effective when the first argument
 *   is a string. Generally deprecated - better use the Object or Array options
 *   to define this path.
 *
 * @returns {Object or Function} Returns the second argument of the function,
 *   which is either the given `Object`, the given `Function` or the newly
 *   generated `Object`, when no second argument was given.
 *
 *   The object is a dictionary where its keys are defined through the
 *   `propertyPath` (either directly through the third argument or indirectly
 *   through the first argument). Its values are {@link $interpolate} functions
 *   that take a an optional context object. The string returned by this
 *   function will be properly localized.
 *
 * @requires $rootScope
 * @requires $translate
 * @requires $interpolate
 * @requires arethusa.core.LOCALES
 */
angular.module('arethusa.core').factory('translator', [
  '$rootScope',
  '$translate',
  '$interpolate',
  function($rootScope, $translate, $interpolate) {
    function noop() {}

    function translate(id, objOrFn, propertyPath) {
      var isFunction = angular.isFunction(objOrFn);
      var set = function(fn) {
        arethusaUtil.setProperty(objOrFn, propertyPath, fn);
      };

      // Immediately set a value - especially useful with unit tests.
      // This way we don't need to promise to resolve prior to a first
      // call of this
      if (!isFunction) set(noop);

      $translate(id, null, 'nullInterpolator').then(function(translation) {
        var interpolate = $interpolate(translation);
        if (isFunction) {
          objOrFn(interpolate);
        } else {
          set(interpolate);
        }
      });
    }

    function registerAndTranslate(id, objOrFn, propertyPath) {
      // needs to run when intialized
      translate(id, objOrFn, propertyPath);

      $rootScope.$on('$translateChangeSuccess', function() {
        translate(id, objOrFn, propertyPath);
      });
    }

    return function(idOrObj, objOrFn, propertyPath) {
      objOrFn = objOrFn || {};
      if (angular.isObject(idOrObj)) {
        if (angular.isArray(idOrObj)) {
          angular.forEach(idOrObj, function(idAndPath) {
            registerAndTranslate(idAndPath, objOrFn, idAndPath);
          });
        } else {
          angular.forEach(idOrObj, function(path, id) {
            registerAndTranslate(id, objOrFn, path);
          });
        }
      } else {
        registerAndTranslate(idOrObj, objOrFn, propertyPath);
      }

      return objOrFn;
    };
  }
]);

"use strict";

/* global dagreD3 */
angular.module('arethusa.core').factory('Tree', [
  '$compile',
  'languageSettings',
  'keyCapture',
  'idHandler',
  '$window',
  'state',
  '$timeout',
  'translator',
  'plugins',
  'navigator',
  function ($compile, languageSettings, keyCapture, idHandler, $window,
            state, $timeout, translator, plugins, navigator) {
    return function(scope, element, conf) {
      var self = this;

      // General margin value so that trees don't touch the canvas border.
      var treeMargin = 15;

      // We don't use a template in this directive on purpose and
      // append our tree to the element. This way a view can create
      // wrapping elements around the tree, where information about
      // the tree can be displayed. This space is also the place
      // where the tree settings can be triggered.
      //
      // It's imperative that appending the svg is the first action
      // inside this directive, otherwise it would fail: The link
      // function already works with this element - so it needs to be
      // there before any other computations can be made.
      //
      // The svg element is held in a variable. This is one step closer
      // to create independent subtrees (as individual g elements)!
      var treeTemplate = '\
        <svg class="full-height full-width">\
          <g transform="translate(' + treeMargin + ',' + treeMargin + ')"/>\
        </svg>\
      ';
      var tree = angular.element(treeTemplate);

      // Common duration for all transitions of the graph
      var transitionDuration = 700;


      // Values for the synthetic root node on top of the dependency tree
      var rootText = "[ROOT]";
      var rootId;

      // This function will be used to store special function that can move
      // and resize the tree, such as a perfectWidth mode. If this function
      // is set resize events of the window or direction changes of the tree
      // will trigger it.
      var viewModeFn;

      // Will contain the dagreD3 graph, including all nodes, edges and label.
      this.g = undefined;

      // The g element contained in the svg canvas.
      this.vis = undefined;

      // The svg itself.
      var svg = d3.select(element[0]);

      // Introspective variables about the tree canvas
      var height, width, xCenter, yCenter;

      // d3 object responsible for zooming and dragging
      var zoomer = d3.behavior.zoom();

      // Register listener for zooming and dragging.
      //
      // Add scale boundaries so that a user cannot go to unreasonable
      // zoom levels.
      svg.call(zoomer.on('zoom', zoomAndDrag).scaleExtent([0.3, 2.5]));

      // Zoom and Drag function
      //
      // Unsets viewModeFn: When a user wants to a focus on a particular area
      // we don't want to use automatic resizings and movements.
      function zoomAndDrag() {
        unsetViewModeFn();
        var ev, val;
        ev  = d3.event;
        val = 'translate(' + ev.translate + ') scale(' + ev.scale + ')';
        self.vis.attr('transform', val);
      }

      // dagre renderer
      var renderer = new dagreD3.Renderer();

      // Use transitions for all movements inside the graph
      renderer.transition(function(selection) {
        return selection.transition().duration(transitionDuration);
      });

      // control variable for show/hide status of the tree's settings panel
      scope.settingsOn = false;


      // Templates to be compiled in the course of this directive
      function rootTokenHtml() {
        return '<span root-token root-id="' + rootId + '" sentence-id="' + inferSentenceId() + '">' +
          rootText +
        '</span>';
      }

      var tokenHtml = '\
        <span token="token"\
          style="white-space: nowrap"\
          class="no-transition"\
          colorize="STYLE"\
          click="true"\
          hover="true"/>\
      ';

      var edgeLabelTemplate = '\
        <span\
         value-watch\
         target="obj"\
         property="label"\
         empty-val="NIL"/>\
      ';

      // Templates driven out to their own files
      function templatePath(name) {
        return "js/arethusa.dep_tree/templates/" + name + ".html";
      }

      function prependTemplate(template) {
        var el = '<span class="right" ng-include="' + template + '"/>';
        angular.element(element[0].previousElementSibling).append($compile(el)(scope));
      }

      scope.panelTemplate = templatePath('settings');


      // Placeholder values during the intial drawing phase of the tree.
      // They will get replaced by fully functional directives afterwards.
      //
      // Needed so that properly sized boxed inside the graph are accessible.
      function rootPlaceholder() {
        return '<div id="tph' + rootId + '">' + rootText + '</div>';
      }

      function tokenPlaceholder(token) {
        return '<div class="node token-node" id="tph' + token.id + '">' + token.string + '</div>';
      }

      function labelPlaceholder(token) {
        var label = 'xxxxxxxxxxx';
        var id = token.id;
        var classes = 'text-center tree-label';
        return '<div id="' + labelId(id) + '" class="' + classes + '">' + label + '</div>';
      }

      // Compile functions
      //
      // Their return values will be inserted into
      // the tree and replace the placeholders.
      function compiledEdgeLabel(token) {
        var childScope = scope.$new();
        self.childScopes.push(childScope);
        childScope.obj = token.relation;
        return $compile(edgeLabelTemplate)(childScope)[0];
      }

      function compiledToken(token) {
        var childScope = scope.$new();
        self.childScopes.push(childScope);
        childScope.token = token;
        // Ugly but working...
        // We replace the colorize value in our token template string.
        // If custom styles are given, we check if one is available for
        // this token. If yes, we use it, otherwise we just pass one
        // undefined which leaves the token unstyled.
        //
        // Without custom styles we let the token itself decide what color
        // it has.
        var style;
        if (scope.styles) {
          if (tokenHasCustomStyling(token)) {
            applyTokenStyling(childScope, token);
          }
          // else we just stay undefined
          style = 'style';
        } else {
          style = 'true';
        }
        return $compile(tokenHtml.replace('STYLE', style))(childScope)[0];
      }

      // Styling functions
      // Responsible for formatting edges with a custom styling
      //
      // If an edge style is overridden, we safe the old value in the
      // styleResets object. the resetEdgeStyling() function will now
      // how to operate with this then.
      function tokenHasCustomStyling(token) {
        var t = scope.styles[token.id] || {};
        return t.token;
      }

      function applyTokenStyling(childScope, token) {
        childScope.style = scope.styles[token.id].token;
      }

      var edgeStyleResets = {};
      var labelStyleResets = {};
      function applyCustomStyling() {
        var edges = self.vis.selectAll('g.edgePath path');
        angular.forEach(scope.styles, function (style, id) {
          var labelStyle = style.label;
          var edgeStyle = style.edge;
          var oldLabel = label(id);
          var oldEdge = edge(id);
          if (labelStyle && oldLabel[0][0]) {
            saveOldStyles(id, oldLabel, labelStyle, labelStyleResets);
            oldLabel.style(labelStyle);
          }
          if (edgeStyle && oldEdge[0][0]) {
            saveOldStyles(id, oldEdge, edgeStyle, edgeStyleResets);
            oldEdge.style(edgeStyle);
          }
        });
      }

      function saveOldStyles(id, el, properties, resets) {
        if (properties) {
          var style = {};
          angular.forEach(properties, function (_, property) {
            style[property] = el.style(property);
          });
          resets[id] = style;
        }
      }

      function resetEdgeStyling() {
        angular.forEach(edgeStyleResets, function (style, id) {
          edge(id).style(style);
        });
        edgeStyleResets = {};  // clean up, to avoid constant resetting
      }

      function resetLabelStyling() {
        angular.forEach(labelStyleResets, function (style, id) {
          label(id).style(style);
        });
        labelStyleResets = {};  // clean up, to avoid constant resetting
      }

      // Getter functions for nodes, labels, edges,  generators for
      // properly namespaced ids and query methods for these elements.
      function edges() {
        return self.vis.selectAll('g.edgePath path');
      }
      function edge(id) {
        return self.vis.select('#' + edgeId(id));
      }
      function edgePresent(id) {
        return edge(id)[0][0];  // yes, that's valid d3 syntax
      }
      function edgeId(id) {
        return 'tep' + id;
      }
      function label(id) {
        return self.vis.select('#' + labelId(id));
      }
      function labelId(id) {
        return 'tel' + id;
      }
      function nodeId(id) {
        return 'tph' + id;
      }
      function node(id) {
        return self.vis.select('#' + nodeId(id));
      }
      function nodes() {
        return self.vis.selectAll('div.node');
      }
      function tokenNodes() {
        return self.vis.selectAll('div.node.token-node');
      }

      // A bug in webkit makes it impossible to select camelCase tags...
      // We work around by using a function.
      // http://stackoverflow.com/questions/11742812/cannot-select-svg-foreignobject-element-in-d3
      function foreignObjects() {
        return self.vis.selectAll(function () {
          return this.getElementsByTagName('foreignObject');
        });
      }

      function nodePresent(id) {
        return self.g._nodes[id];
      }
      function hasHead(token) {
        return aU.getProperty(token, conf.mainAttribute);
      }

      function stillSameTree(a, b) {
        if (a && b) {
          return angular.equals(Object.keys(a), Object.keys(b));
        }
      }


      // Functions to create, update and render the graph
      //
      // They are solely called by watches.

      // REVIEW plugin is not able to use this well right now - need to refactor
      function createGraph(noRegroup) {
        if (isMainTree()) {
          if (!noRegroup) groupTokens();
          var oldTree = scope.current;
          scope.current = scope.groupedTokens[scope.currentFocus];

          if (stillSameTree(scope.current, oldTree)) return;
        } else {
          scope.current = scope.tokens;
        }

        clearOldGraph();
        self.g = new dagreD3.Digraph();
        if (conf.syntheticRoot) createRootNode();
        createEdges();
        render();
      }

      function groupTokens() {
        scope.groupedTokens = aU.map(navigator.currentSentences, 'tokens');
        scope.groupSize = scope.groupedTokens.length;
      }

      function clearOldGraph() {
        if (self.vis) self.vis.selectAll('*').remove();
      }

      function inferSentenceId() {
        for (var first in scope.current) break;
        return scope.current[first].sentenceId;
      }

      function createRootNode() {
        rootId = idHandler.getId('0', inferSentenceId());
        self.g.addNode(rootId, { label: rootPlaceholder() });
      }
      function createNode(token) {
        self.g.addNode(token.id, { label: tokenPlaceholder(token) });
      }
      function createEdges() {
        angular.forEach(scope.current, function (token, index) {
          if (hasHead(token)) self.drawEdge(token);
        });
      }

      // This function serves dependencyTrees and can be overriden
      // for other usages.
      this.drawEdge = function drawEdge(token) {
        var id = token.id;

        // This is a hack - we have some troubles here on
        // tokenRemoved events which I don't really understand -
        // can't think of a scenario where a token without an id
        // comes in here. It's actually a token that has just a
        // single property (head) - really have no clue.
        //
        // This prevents it, but the root cause for this needs to
        // be investigated.
        if (!angular.isDefined(id)) return;

        var headId = aU.getProperty(token, conf.mainAttribute);

        if (!nodePresent(id)) {
          createNode(token);
        }

        if (!nodePresent(headId)) {
          createNode(scope.current[headId]);
        }
        self.g.addEdge(id, id, headId, { label: labelPlaceholder(token) });
      };

      function updateEdge(token) {
        if (edgePresent(token.id)) {
          self.g.delEdge(token.id);
        }
        self.drawEdge(token);
      }

      function destroy(childScope) {
        childScope.$destroy();
      }

      function clearChildScopes() {
        angular.forEach(self.childScopes, destroy);
        self.childScopes = [];
      }

      function customizeGraph() {
        // Customize the graph so that it holds our directives
        clearChildScopes();
        if (conf.syntheticRoot) insertRootDirective();
        self.insertNodeDirectives();
        self.insertEdgeDirectives();
      }

      function render() {
        self.vis = svg.select('g');
        renderer.layout(scope.layout).run(self.g, self.vis);
        customizeGraph();

        // Not very elegant, but we don't want marker-end arrowheads right now
        // We also place an token edge path (tep) id on these elements, so that
        // we can access them more easily later on.
        edges().each(function (id) {
          angular.element(this).attr('id', edgeId(id));
        }).attr('marker-end', '');

        var foreignObjs = foreignObjects();
        foreignObjs.each(function () {

          // We sometimes encounter bugs with hyphenated strings that outgrow
          // their bounding box by one pixel and therefore make the rest of
          // the string disappear.
          var el = angular.element(this);
          if (el.find('.node').length) {
            var width = el.attr('width');
            el.attr('width', parseInt(width) + 1);
          }
          angular.element(this.children[0]).attr('style', 'float: center;');
          // The content of the foreignObject element can overflow its bounding
          // box, which would lead to clipped display.
          angular.element(this).attr('overflow', 'visible');

        });

        // Reactivate Transitions - as we recompile the token directives during
        // render, we deactivated the color transition temporarily to avoid
        // color flickering.
        // Has to be timeouted (which means running after the current $digest),
        // as otherwise we wouldn't be able to find the freshly appended tokens
        // through a selector.
        $timeout(function() {
          element.find('.token').removeClass('no-transition');
        });
      }

      function insertRootDirective() {
        node(rootId).append(function() {
          this.textContent = '';
          return $compile(rootTokenHtml())(scope)[0];
        });
      }

      function insertNodeDirectives() {
        self.insertTokenDirectives();
      }

      function insertTokenDirectives() {
        tokenNodes().append(function () {
          // This is the element we append to and we created as a placeholder
          // We clear out its text content so that we can display the content
          // of our compiled token directive.
          // The placholder has an id in the format of tphXXXX where XXXX is the id.
          this.textContent = '';
          return compiledToken(scope.current[this.id.slice(3)]);
        });
      }

      function insertEdgeDirectives() {
        angular.forEach(scope.current, function (token, id) {
          label(id).append(function () {
            this.textContent = '';
            var label = compiledEdgeLabel(token);
            return label;
          });
        });
      }

      // Tree manipulations
      //
      // Change the trees layout, position and size

      function compactTree() {
        scope.nodeSep = 30;
        scope.edgeSep = 10;
        scope.rankSep = 30;
      }

      function wideTree () {
        scope.nodeSep = 80;
        scope.edgeSep = 5;
        scope.rankSep = 40;
      }

      scope.changeDir = function() {
        var horDir;
        if (sortRankByIdAscending()) {
          horDir = "RL";
        } else {
          horDir = "LR";
          scope.textDirection = !scope.textDirection;
        }
        scope.rankDir = scope.rankDir === "BT" ? horDir : "BT";
      };

      scope.centerGraph = function() {
        setViewModeFn(scope.centerGraph);
        var xPos = (width - graphSize().width) / 2;
        moveGraph(xPos, treeMargin);
      };

      scope.perfectWidth = function() {
        setViewModeFn(scope.perfectWidth);
        var gWidth  = graphSize().width;
        var targetW = width - treeMargin * 2;
        var scale = targetW / gWidth;
        moveGraph(treeMargin, treeMargin, scale);
      };

      scope.focusRoot = function() {
        setViewModeFn(scope.focusRoot);
        focusNode(rootId);
      };

      scope.focusSelection = function() {
        setViewModeFn(scope.focusSelection);
        focusNode(state.firstSelected(), height / 3);
      };

      function sortRankByIdAscending() {
        var langSettings = languageSettings.getFor('treebank');
        return langSettings ? langSettings.leftToRight : true;
      }

      function moveGraph(x, y, sc) {
        syncZoomAndDrag(x, y, sc);
        var translate = 'translate(' + x + ',' + y +' )';
        var scale = sc ? ' scale(' + sc+ ')' : '';
        self.vis.transition()
          .attr('transform', translate + scale)
          .duration(transitionDuration)
          .ease();
      }

      function focusNode(id, offset) {
        if (id) {
          offset = offset || treeMargin;
          var nodePos = nodePosition(id);
          var newX = xCenter - nodePos.x;
          var newY = 0 - nodePos.y + offset;
          moveGraph(newX, newY);
        }
      }

      // We have saved our d3 zoom behaviour in a variable. The offsets
      // need to be updated manually when we do transformations by hand!
      function syncZoomAndDrag(x, y, scale) {
        zoomer.translate([x, y]);
        zoomer.scale(scale || 1);
      }

      function graphSize() {
        return self.vis.node().getBBox();
      }

      function calculateSvgHotspots() {
        width   = tree.width();
        height  = tree.height();
        xCenter = width  / 2;
        yCenter = height / 2;
      }

      function Point(x, y) {
        this.x = x;
        this.y = y;
      }

      function parseTransformTranslate(node) {
        var translate = node.attr('transform');
        var match = /translate\((.*),(.*?)\)/.exec(translate);
        return new Point(match[1], match[2]);
      }

      function nodePosition(id) {
        var n = angular.element(node(id)[0]);
        return parseTransformTranslate(n.parents('.node'));
      }



      // Functions for automated tree movements
      function applyViewMode() {
        if (angular.isDefined(viewModeFn)) {
          viewModeFn();
        }
      }

      function setViewModeFn(fn) {
        viewModeFn = fn;
      }

      function unsetViewModeFn() {
        viewModeFn = undefined;
      }

      function moveToStart() {
        if (graphSize().width > width - treeMargin * 2) {
          scope.perfectWidth();
        } else {
          scope.centerGraph();
        }
      }


      // Watches and Event listeners

      function init(noRegroup) {
        createGraph(noRegroup);
        moveToStart();
        if (isMainTree()) plugins.declareReady(conf.parentPlugin);
      }

      scope.$watch('styles', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          customizeGraph();
          if (newVal) {
            applyCustomStyling();
          } else {
            resetEdgeStyling();
            resetLabelStyling();
          }
        }
      });

      // Settings watches
      var watches = {
        'nodeSep': function(newVal) { scope.layout.nodeSep(newVal); },
        'edgeSep': function(newVal) { scope.layout.edgeSep(newVal); },
        'rankSep': function(newVal) { scope.layout.rankSep(newVal); },
        'rankDir': function(newVal) { scope.layout.rankDir(newVal); },
        'textDirection': function(newVal) { scope.layout.sortRankByIdAscending(newVal); }
      };

      angular.forEach(watches, function(fn, attr) {
        scope.$watch(attr, function(newVal, oldVal) {
          if (newVal !== oldVal) {
            fn(newVal);
            render();
            // We need to timeout this call. The render() function uses
            // a transition as well. D3 transitions work with keyframes -
            // if we call our method during the start and end frame, we
            // will not get the values we want when we call for the size
            // of the new graph (and all viewMode functions operate on
            // them, because they will be built gradually against the
            // end keyframe. We therefore wait until the end of this
            // transition before we do the next move.
            $timeout(applyViewMode, transitionDuration);
          }
        });
      });

      function isMainTree() {
        return scope.tokens === state.tokens;
      }

      function inActiveTree(id) {
        return scope.current[id];
      }

      function isDisconnected(val) {
        // The new head value might be undefined or set to an
        // empty string to indicate disconnection.
        return !(angular.isDefined(val) && val !== "");
      }

      // only do this if we are the main tree!
      if (isMainTree()) {
        state.on('tokenAdded', function(event, token) {
          if (inActiveTree(token.id)) {
            createNode(token);
            customizeGraph();
            render();
          }
        });

        state.on('tokenRemoved', function(event, token) {
          var id = token.id;
          if (inActiveTree(id) && nodePresent(id)) {
            self.g.delNode(id);
            render();
          }
        });

        // Listen for batch changes - when one, which we are interested
        // in, is in progress, we wait for its end to re-render the tree
        // only once and not several times for each head change.
        var queuedChangesPresent;
        state.watch(conf.mainAttribute, function(newVal, oldVal, event) {
          var token = event.token;
          if (inActiveTree(token.id)) {
            // Very important to do here, otherwise the tree will
            // be render a little often on startup...
            if (newVal !== oldVal) {
              // If a disconnection has been requested, we just
              // have to delete the edge and do nothing else
              if (isDisconnected(newVal)) {
                self.g.delEdge(token.id);
              } else {
                updateEdge(token);
              }
            }
            if (state.batchChange) {
              queuedChangesPresent = true;
              return;
            }

            render();
            $timeout(applyViewMode, transitionDuration);
          }
        });

        state.on('batchChangeStop', function() {
          if (queuedChangesPresent) {
            render();
            $timeout(applyViewMode, transitionDuration);
            queuedChangesPresent = false;
          }
        });
      }

      angular.element($window).on('resize', function() {
        calculateSvgHotspots();
        applyViewMode();
      });


      // Keybindings for this directive
      function keyBindings(kC) {
        return {
          tree: [
            kC.create('directionChange', function() { scope.changeDir(); }, 'x'),
            kC.create('centerTree', function() { scope.centerGraph(); }, 's'),
            kC.create('focusRoot', function() { scope.focusRoot(); }),
            kC.create('focusSelection', function() { scope.focusSelection(); }, 'a'),
            kC.create('perfectWidth', function() { scope.perfectWidth(); }, 'd'),
          ]
        };
      }


      function setLayout() {
        scope.compactTree = self.compactTree;
        scope.wideTree = self.wideTree;

        scope.textDirection = sortRankByIdAscending();
        scope.rankDir = 'BT';
        if (conf.direction === 'vertical') scope.changeDir();

        scope.compactTree();
        scope.layout = dagreD3.layout()
          .sortRankByIdAscending(scope.textDirection)
          .rankDir(scope.rankDir)
          .nodeSep(scope.nodeSep)
          .edgeSep(scope.edgeSep)
          .rankSep(scope.rankSep);
      }

      function start() {
        setLayout();

        // This watch is responsible for firing up the directive
        scope.currentFocus = 0;

        scope.$watch('tokens', function() { init(); } );

        scope.$watch('currentFocus', function(newVal, oldVal) {
          if (newVal !== oldVal) init(true);
        });

        checkBorderStyle();

        // Append and prepend all templates
        element.append(tree);
        prependTemplate('panelTemplate');
        element.prepend($compile('<div dep-tree-navigator/>')(scope));

        // Initialize some more starting values
        calculateSvgHotspots();
      }


      // This is a dirty hack for backwards compatibility of
      // commonly used layouts. We don't want the tree bordered
      // all the time. Can go away once we move on to the Grid
      // as main layout.
      var canvas = element.parents('.tree-canvas');
      function checkBorderStyle() {
        if (isPartOfGrid() || isPartOfSidepanel()) {
          canvas.addClass('no-border');
        } else {
          canvas.removeClass('no-border');
        }
      }

      var keys = keyCapture.initCaptures(keyBindings);

      scope.keyHints = arethusaUtil.inject({}, keys.tree, function(memo, name, key) {
        memo[name] = arethusaUtil.formatKeyHint(key);
      });

      scope.$on('$destroy', keys.$destroy);

      scope.translations = {};
      var translateValues = [
        'changeDir', 'focusRoot', 'focusSel', 'centerTree',
        'perfectWidth', 'compact', 'widen'
      ];
      angular.forEach(translateValues, function(val, i) {
        translator('tree.' + val, scope.translations, val);
      });

      function grid() { return element.parents('.gridster'); }
      function isPartOfGrid() { return grid().length; }
      function gridReady() { return grid().hasClass('gridster-loaded'); }

      function sidepanel() { return element.parents('#sidepanel'); }
      function isPartOfSidepanel() { return sidepanel().length; }

      // Special handling for an edge case:
      // When we change the layout which uses this directive on the fly
      // to a grid based one, we need to wait a little, so that the grid
      // item which holds our tree has the correct size, otherwise our
      // tree will render too little (where too little could also mean
      // with a width of 0...)
      this.launch = function() {
        if (isPartOfGrid() && !gridReady()) {
          $timeout(start, 130);
        } else {
          start();
        }
      };

      // Functions to be overridden by directives that use this
      function noop() {}

      this.createEdges = noop;
      this.nodePresent = nodePresent;
      this.createNode  = createNode;
      this.insertNodeDirectives  = insertNodeDirectives;
      this.insertTokenDirectives = insertTokenDirectives;
      this.insertEdgeDirectives  = insertEdgeDirectives;

      this.compactTree = compactTree;
      this.wideTree = wideTree;

      this.childScopes = [];
    };
  }
]);

"use strict";

// Currently not in use - but will be soon when we resume work on the
// Permalink feature.

angular.module('arethusa.core').factory('urlParser', [
  function() {
    function parseSearch(hrefParser) {
      var search = hrefParser.search.slice(1);
      var params = search.split('&');
      return arethusaUtil.inject({}, params, function(memo, param) {
        var parts = param.split('=');
        var key = parts[0];
        var val = parts[1] || true;
        var array = memo[key];
        var newVal  = array ? arethusaUtil.toAry(array).concat([val]) : val;
        memo[key] = newVal;
      });
    }

    function toParam(k, v) {
      return k + '=' + v;
    }

    function updateUrl(parser, href) {
      var newUrl = parser.url.replace(href.search, '?');
      var params = [];
      angular.forEach(parser.params, function(value, key) {
        if (angular.isArray(value)) {
          angular.forEach(value, function(el) {
            params.push(toParam(key, el));
          });
        } else {
          params.push(toParam(key, value));
        }
      });
      parser.url = newUrl + params.join('&');
    }

    function UrlParser(url) {
      var self = this;
      var parser = document.createElement('a');
      parser.href = url;

      this.url = url;
      this.params = parseSearch(parser);

      this.set = function(paramsOrKey, val) {
        if (angular.isString(paramsOrKey) && val) {
          this.params[paramsOrKey] = val;
        }

        updateUrl(self, parser);
      };
    }

    return function(url) {
      return new UrlParser(url);
    };
  }
]);

"use strict";

angular.module('arethusa.core').factory('User', [
  function() {
    return function(args) {
      this.name     = args.name;
      this.fullName = args.fullName;
      this.mail     = args.mail;
      this.page     = args.page;
    };
  }
]);

"use strict";

angular.module('arethusa.core').filter('keys', function() {
  return function(input) {
    if (!input) {
      return [];
    }
    return Object.keys(input);
  };
});

'use strict';
angular.module('arethusa.core').constant('LANDING', {
  controller: 'LandingCtrl',
  template: '\
    <div style="height: 100%; overflow: auto">\
      <div\
        ng-include="template"\
         class="fade slow">\
      </div>\
    </div>\
  ',
  resolve: {
    scrollBody: function() {
      angular.element(document.body).css('overflow', 'auto');
    },
    conf: ['configurator', function(configurator) {
      configurator.defineConfiguration({
        navbar: {
          template: 'js/templates/navbar_landing.html'
        }
      });
    }]
  }
});

'use strict';
angular.module('arethusa.core').constant('MAIN_ROUTE', {
  controller: 'ArethusaCtrl',
  template: '\
    <div>\
      <arethusa-navbar></arethusa-navbar>\
      <div\
        ng-include="gS.layout.template"\
         class="fade slow">\
      </div>\
    </div>\
  ',
  resolve: {
    loadConfiguration: [
      '$http',
      'confUrl',
      'configurator',
      function ($http, confUrl, configurator) {
        var url = confUrl(true);
        return $http.get(url).then(function (res) {
          configurator.defineConfiguration(res.data, url);
        }
      );
    }]
  }
});

'use strict';
angular.module('arethusa.core').constant('MORPH_TOOLS', {
  controller: 'MorphToolsCtrl',
  templateUrl: 'js/arethusa.tools/templates/morph_tools.html',
  resolve: {
    latinAttrs: [
      '$http',
      function($http) {
        return $http.get('js/arethusa.morph/configs/morph/lat_attributes.json');
      }
    ],
    greekAttrs: [
      '$http',
      function($http) {
        return $http.get('js/arethusa.morph/configs/morph/gr_attributes2.json');
      }
    ]
  }
});

"use strict";

angular.module('arethusa.core').service('arethusaGrid', [
  'gridsterConfig',
  '$window',
  'plugins',
  '$rootScope',
  'notifier',
  'globalSettings',
  function(gridsterConfig, $window, plugins, $rootScope, notifier, globalSettings) {
    var self = this;

    var win = angular.element($window);

    this.settings = {
      dragging: true,
      resizing: true,
      pushing:  true,
      floating: true,
    };

    this.setDragging = function(val) { self.options.draggable.enabled = val; };
    this.setResizing = function(val) { self.options.resizable.enabled = val; };
    this.setPushing  = function(val) { self.options.pushing  = val; };
    this.setFloating = function(val) { self.options.floating = val; };

    this.options = angular.extend(gridsterConfig, {
      columns: 48,
      rowHeight: 'match',
      defaultSizeX: 6,
      defaultSizeY: 4,
      resizable: {
        enabled: self.settings.resizing,
        handles: ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'],
        stop: function() { win.triggerHandler('resize'); }
      },
      draggable: {
        enabled: self.settings.dragging,
        handle: '.drag-handle'
      }
    });

    function Item(plugin, size, position, style) {
      size = size || [];
      position = position || [];
      return {
        sizeX: size[0],
        sizeY: size[1],
        row: position[0],
        col: position[1],
        plugin: plugin,
        style: style
      };
    }

    this.addItem = function(name) {
      self.items.push(new Item(name));
      notifier.success(name + ' added to the grid!');
    };

    function findItem(name) {
      var res;
      for (var i = self.items.length - 1; i >= 0; i--){
        var el = self.items[i];
        if (el.plugin === name) {
          res = el;
          break;
        }
      }
      return res;
    }

    this.removeItem = function(name) {
      var i = self.items.indexOf(findItem(name));
      self.items.splice(i, 1);
      notifier.info(name + ' removed from grid!');
    };

    this.toggleItem = function(name) {
      // Mind that these function is inverted due to its
      // usage in an input checkbox.
      // We already can read the updated value here and
      // therefore need to invert our action.
      if (self.itemList[name]) {
        self.addItem(name);
      } else {
        self.removeItem(name);
        //self.itemList[name] ;
      }
    };

    function loadLayout(event, layout) {
      if (layout.grid) {
        loadGridItems();
        loadItemList();
      }
    }

    function loadGridItems() {
      self.items = arethusaUtil.map(globalSettings.layout.grid, function(item) {
        return new Item(item.plugin, item.size, item.position, item.style);
      });
    }

    function getCleanItemList() {
      self.itemList = arethusaUtil.inject({}, plugins.all, function(memo, name, pl) {
        memo[name] = false;
      });
    }

    function activateActiveItems() {
      angular.forEach(self.items, function(el, i) {
        self.itemList[el.plugin] = true;
      });
    }

    function loadItemList(args) {
      getCleanItemList();
      activateActiveItems();
    }

    this.init = function() {
      // Set a listener for future layout changes
      $rootScope.$on('layoutChange', loadLayout);
      // And startup the initial layout
      loadLayout(null, globalSettings.layout);
    };

    // Immediately set first grid items. The plugins which are held by them, will
    // only load in a following digest cycle when the plugins load - but we want
    // to present the user with something immediately, for aesthetic reasons only.
    loadGridItems();

    // Scenario 1: When the application starts
    $rootScope.$on('pluginsLoaded', self.init);
    // Scenario 2: When a layout is changed on the fly
    if (plugins.loaded) self.init();
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.arethusaLocalStorage
 *
 * @description
 * Arethusa's API to communicate with `localStorage`. All values stored are
 * prefixed with `arethusa.`.
 *
 * Performs type coercion upon retrieval for Booleans, so that `true`, `false`
 * and `null` can be used properly.
 *
 * @requires localStorageService
 */
angular.module('arethusa.core').service('arethusaLocalStorage', [
  'localStorageService',
  function(localStorageService) {
    /**
     * @ngdoc function
     * @name arethusa.core.arethusaLocalStorage#get
     * @methodOf arethusa.core.arethusaLocalStorage
     *
     * @param {String} key The key
     * @returns {*} The stored value
     */
    this.get = function(key) {
      return coerce(localStorageService.get(key));
    };

    /**
     * @ngdoc function
     * @name arethusa.core.arethusaLocalStorage#set
     * @methodOf arethusa.core.arethusaLocalStorage
     *
     * @param {String} key The key
     * @param {*} value The value
     */
    this.set = localStorageService.set;

    this.keys = localStorageService.keys;

    var JSONBooleans = ['true', 'false', 'null'];
    function coerce(value) {
      if (JSONBooleans.indexOf(value) === -1) {
        return value;
      } else {
        return JSON.parse(value);
      }
    }
  }
]);

'use strict';

/**
 * @ngdoc service
 * @name arethusa.core.configurator
 *
 * @description
 * Service to handle the configuration of the application.
 *
 * A key component of Arethusa, typically injected by every plugin and many core services.
 *
 * Provides an API to
 * - access configurations
 * - create Retriever, Persister and Resource instances
 *
 * *Commented example configuration*
 * <pre>
 *   {
       // TODO
 *   }
 * </pre>
 *
 * @requires $injector
 * @requires $http
 * @requires $rootScope
 * @requires arethusa.core.Resource
 * @requires arethusa.core.Auth
 * @requires $timeout
 * @requires $location
 * @requires $q
 */
angular.module('arethusa.core').service('configurator', [
  '$injector',
  '$http',
  '$rootScope',
  'Resource',
  'Auth',
  '$timeout',
  '$location',
  '$q',
  function ($injector, $http, $rootScope, Resource, Auth,
            $timeout, $location, $q) {
    var self = this;
    var includeParam = 'fileUrl';
    var uPCached;
    var mainSections = ['main', 'navbar', 'notifier'];
    var subSections = ['plugins'];
    
    // CONF UTILITY FUNCTIONS
    // ----------------------

    /** Returns an empty configuration files with all sections
     /* as empty object properties.
     /* Useful for the configuration editor.
     */
    this.getConfTemplate = function () {
      return new Template();

      function Template() {
        this.main = {};
        this.plugins = {};
        this.resources = {};
      }
    };

    this.mergeConfigurations = function (a, b) {
      // Merges two configuration objects.
      // There is a clear contract that has to be fulfilled to make this work:
      //
      // The datatypes of individual properties need to be static.
      // E.g.
      //
      // {
      //   plugins: {
      //     morph: {
      //       retrievers: ['x']
      //     }
      //   }
      // }
      //
      // If plugins.morph.retrievers is an Array, it can only be an Array and nothing
      // else. The same goes for Objects, Strings, and Numbers.
      //
      // Objects call the function recursively.
      // Arrays are flat-pushed.
      // Strings and Numbers are overwritten.
      // a is extended with properties in b, that are not present in a.
      //
      // Currently unused after the events in
      //    http://github.com/latin-language-toolkit/arethusa/pull/365
      var that = this;
      angular.forEach(b, function (value, key) {
        var origVal = a[key];
        if (origVal) {
          // Every Array is an Object, but not every Object is an Array!
          // This defines the order of the if-else conditional.
          if (angular.isArray(origVal)) {
            arethusaUtil.pushAll(origVal, value);
          } else if (angular.isObject(origVal)) {
            that.mergeConfigurations(origVal, value);
          } else {
            a[key] = value;
          }
        } else {
          a[key] = value;
        }
      });
      return a;
    };

    this.shallowMerge = function(a, b) {
      // Merges two configuration files
      //
      // The markup of Arethusa config files needs special handling for merging.
      // The main sections can plainly merged through angular.extend, while
      // subSections can only be merged one level deeper.
      mergeMainSections(a, b);
      mergeSubSections(a, b);
      return a;
      function mergeMainSections(a, b) {
        angular.forEach(mainSections, function(section, i) {
          var sectionA = a[section];
          var sectionB = b[section];
          if (!sectionB) return;

          mergeOrAdd(section, sectionA, sectionB, a);
        });
        var mainA = a.main;
        var mainB = b.main;
        if (!mainB) return;

        angular.extend(mainA, mainB);
      }
      function mergeSubSections(a, b) {
        var pluginsA = a.plugins;
        var pluginsB = b.plugins;
        if (!pluginsB) return;

        angular.forEach(pluginsB, function(conf, plugin) {
          var origConf = pluginsA[plugin];
          mergeOrAdd(plugin, origConf, conf, a);
        });
      }
      function mergeOrAdd(key, a, b, target) {
        if (a) {
          angular.extend(a, b);
        } else {
          target[key] = b;
        }
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#delegateConf
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Delegates configuration properties to an object, frequently a plugin,
     * for easier access.
     *
     * The object needs to come with his configuration file attached in a `conf`
     * property.
     *
     * A set of standard properties is always delegated to the object (view the source
     * code to see which), but `additionalProperties` can be given as an
     * Array of Strings.
     *
     * The configuration value to is determined according to the following order
     * of precedence:
     *
     * 1. {@link arethusa.core.userPreferences userPreferences} stored in a category
     *      determined by `object.name`
     * 2. The attached configuration in `object.conf`
     * 3. An objects optional default configuration in `object.defaultConf`
     * 4. globalDefaults specified in the ``main` section of the configuration file
     *
     * The optional `sticky` param determines what happens if an already configured
     * object is passed to this function.
     *
     * When `sticky` is true and a property is already set (this means it is not
     * `undefined`), it will not be overridden - the configuration will be 'sticky'.
     *
     *
     * @param {Object} object Object to delegate to
     * @param {Array} additionalProperties Additional properties to delegate in
     *   addition to the standard ones
     * @param {Boolean} [sticky=false] Whether or not delegation should be done sticky
     */
    this.delegateConf = function (obj, otherKeys, sticky) {
      var standardProperties =  [
        'displayName',
        'main',
        'template',
        'external',
        'contextMenu',
        'contextMenuTemplate',
        'noView',
        'mode'
      ];
      var props = sticky ? otherKeys : arethusaUtil.pushAll(standardProperties, otherKeys);
      var defConf = obj.defaultConf || {};
      var isDef = function(arg) { return arg !== undefined && arg !== null; };
      angular.forEach(props, function (property, i) {
        if (sticky && isDef(obj[property])) return;

        var userProp = userPreferences().get(obj.name, property);
        var confProp = obj.conf[property];

        var val = isDef(userProp) ?
            userProp :
            isDef(confProp) ? confProp : defConf[property];

        obj[property] = val;
      });

      if (!obj.displayName) {
        obj.displayName = obj.name;
      }

      setGlobalDefaults(obj);
      function userPreferences() {
        if (!uPCached) uPCached = $injector.get('userPreferences');
        return uPCached;
      }
      function setGlobalDefaults(obj) {
        angular.forEach(getGlobalDefaults(), function(value, key) {
          // Explicitly ask for undefined, as a false value can be a
          // valid configuration seting!
          if (obj[key] === undefined) {
            obj[key] = value;
          }
        });
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getConfAndDelegate
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Retrieves an objects configuration defined by its `name` property and delegates
     * configuration properties to the object.
     *
     * Cf. {@link arethusa.core.configurator#methods_delegateConf delegateConf}.
     *
     * @param {Object} object Object to add configuration to. Frequently a plugin.
     * @param {Array} additionalProperties Additional properties passed to
     *   {@link arethusa.core.configurator#methods_delegateConf delegateConf}.
     * @returns {Object} The updated `object`.
     */
    this.getConfAndDelegate = function (obj, keys) {
      obj.conf = self.configurationFor(obj.name);
      self.delegateConf(obj, keys);
      return obj;
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getStickyConf
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Works the same as {@link arethusa.core.configurator#methods_getConfAndDelegate getConfAndDelegate},
     * but with activated `sticky` mode (cf. {@link arethusa.core.configurator#methods_delegateConf delegateConf}).
     *
     * @param {Object} object Object to add configuration to. Frequently a plugin.
     * @param {Array} additionalProperties Additional properties passed to
     *   {@link arethusa.core.configurator#methods_delegateConf delegateConf}.
     * @returns {Object} The updated `object`.
     */
    this.getStickyConf = function(obj, keys) {
      obj.conf = self.configurationFor(obj.name);
      self.delegateConf(obj, keys, true);
      return obj;
    };

    // SET AND RETRIEVE CONFIGURATIONS
    // -------------------------------
    
    /**
     * @ngdoc property
     * @name configuration
     * @propertyOf arethusa.core.configurator
     *
     * @description
     * Stores the current configuration. Typically **NOT** meant to be accessed
     * directly.
     *
     * Use the getter
     * {@link arethusa.core.configurator#methods_configurationFor configurationFor}
     * and the setter
     * {@link arethusa.core.configurator#methods_defineConfiguration defineConfiguration}
     * instead.
     */
    this.configuration = this.getConfTemplate();

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#defineConfiguration
     * @methodOf arethusa.core.configurator
     *
     * @description Apply new configuration and broadcast confLoaded event
     *
     *
     * @params
     */
    this.defineConfiguration = function (confFile, location) {
      this.configuration = angular.extend(self.getConfTemplate(), confFile);
      this.confFileLocation = location;

      /**
       * @ngdoc event
       * @name arethusa.core.configurator#confLoaded
       * @eventOf arethusa.core.configurator
       *
       * @description
       * Broadcasted through {@link $rootScope} when the application's
       * configuration is ready to use. Before this event is launched, it is
       * **not** safe to instantiate services and/or plugins!
       *
       * Typically broadcased by {@link arethusa.core.configurator#methods_defineConfiguration defineConfiguration}.
       */
      // As this could be called from a resolve event through
      // $routeProvider, we $timeout to call, so that we are
      // guaranteed to see it in the ArethusaCtrl
      $timeout(function() {
        $rootScope.$broadcast('confLoaded');
      });
    };
    
    /**
     * @ngdoc function
     * @name arethusa.core.configurator#loadAdditionalConf
     * @methodOf arethusa.core.configurator
     *
     * @description
     * TODO
     */
    this.loadAdditionalConf = function(confs) {
      var proms = arethusaUtil.inject([], confs, function(memo, plugin, url) {
        var promise;
        // Use the notifier for error handling!
        if (plugin == 'fullFile') {

          var success = function(res) {
            self.shallowMerge(self.configuration, res.data);
            notifier().info(url + ' configuration loaded!');
          };

          var error = function() {
            notifier().warning('Failed to retrieve ' + url);
          };
          promise = $http.get(parseConfUrl(url)).then(success, error);
        } else {
          promise = $http.get(url).then(function(res) {
            angular.extend(self.configurationFor(plugin), res.data);
          });
        }
        memo.push(promise);
      });
      return $q.all(proms);

      function parseConfUrl(url) {
        if (url.match('^http:\/\/')) {
          return url;
        } else {
          return auxConfPath() + '/' + url + '.json';
        }

        function auxConfPath() {
          return self.configuration.main.auxConfPath;
        }
      }
      function notifier() {
        return $injector.get('notifier');
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#configurationFor
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Getter to retrieve configurations conveniently.
     *
     * Looks for the configuration in the main section, the plugins and
     * the resource section. Returns `{}` when no configuration is present.
     *
     * @param {String} name Name of the requested configuration
     * @returns {Object} A configuration.
     */
    this.configurationFor = function (plugin) {
      var conf = self.configuration;
      return conf[plugin] || conf.plugins[plugin] || conf.resources[plugin] || {};
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#addPluginConf
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Adds a plugin configuration.
     *
     * @param {String} name The name of the plugin
     * @param {Object} conf Configuration of the plugin
     */
    this.addPluginConf = function(name, conf) {
      self.configuration.plugins[name] = conf;
    };

    // GET SERVICES AND RETRIEVERS/PERSISTERS
    // --------------------------------------

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getRetrievers
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Creates new Retriever instances.
     * TODO
     * @param {Object} retrievers *Keys:* Name of the Retriever class;
     *   *Values*: Retriever configuration
     *
     * @returns {Object} *Keys:* Name of the Retriever class; *Values:* The Retriever instance.
     */
    this.getRetrievers = function (retrievers) {
      return arethusaUtil.inject({}, retrievers, function (memo, name, conf) {
        var Retriever = self.getService(name);
        memo[name] = new Retriever(conf);
      });
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getPersisters
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Creates new Persister instances.
     * TODO
     * @param {Object} retrievers *Keys:* Name of the Persister class;
     *   *Values*: Persister configuration
     *
     * @returns {Object} *Keys:* Name of the Persister class; *Values:* The Persister instance.
     * TODO
     */
    // We alias this for now as the function has to do the same -
    // we might need a new name for it but we'll fix that later
    this.getPersisters = this.getRetrievers;

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getRetriever
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Similar to {@link arethusa.core.configurator#methods_getRetrievers getRetrievers}
     * operates on a single instance only.
     *
     * @param {Object} retrievers *Key:* Name of the Retriever class;
     *   *Value*: Retriever configuration
     *
     * @returns {Object} A new retriever instance.
     * TODO
     */
    this.getRetriever = function(retrievers) {
      var retrs = self.getRetrievers(retrievers);
      return retrs[Object.keys(retrs)[0]];
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getService
     * @methodOf arethusa.core.configurator
     *
     * @description
     * TODO
     */
    this.getService = function (serviceName) {
      return $injector.get(serviceName);
    };

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#getServices
     * @methodOf arethusa.core.configurator
     *
     * @description
     * TODO
     */
    this.getServices = function (serviceNames) {
      if (serviceNames) {
        var that = this;
        // inject to an object, we want the names as well
        return arethusaUtil.inject({}, serviceNames, function (obj, name) {
          obj[name] = that.getService(name);
        });
      } else {
        return {};
      }
    };

    // UTILITIES FOR ACCESSING REMOTE RESOURCES
    // ----------------------------------------

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#provideResource
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Creates a new {@link arethusa.core.Resource Resource} instance, including
     * proper {@link arethusa.core.Auth Auth} support.
     *
     * Returns `undefined` when no configuration for a the given resource is present.
     *
     * @param {String} name The name of the resource as specified in a conf file
     * @returns {Resource} A new {@link arethusa.core.Resource Resource} instance
     */
    this.provideResource = function (name) {
      var conf = self.configuration.resources[name];
      if (!conf) return;
      return new Resource(conf, self.provideAuth(conf.auth));
    };

    /**
     * Creates an Auth instance for name if available
     * @param name of Auth configuration to instantiate
     * @returns {*} Auth object
       */
    this.provideAuth = function(name) {
      return new Auth(auths()[name] || {}, self.mode);

      function auths() {
        return self.configuration.auths || {};
      }
    };

    // GLOBAL DEFAULT CONFIG
    // ---------------------

    /**
     * @ngdoc function
     * @name arethusa.core.configurator#mode
     * @methodOf arethusa.core.configurator
     *
     * @description
     * Getter to read the current global mode of the application.
     *
     * @returns {String} The current mode, e.g. `'editor'` or `'viewer'`.
     */
    this.mode = function() {
      return getGlobalDefaults().mode;
    };

    function getGlobalDefaults() {
      var globalDefaults = { 'mode' : 'editor' };
      var customDefaults = getGlobalCustomDefaults();
      var routeDefaults  = getGlobalDefaultsFromRoute();
      return angular.extend({}, globalDefaults, customDefaults, routeDefaults);

      function getGlobalCustomDefaults() {
        return self.configuration.main.globalDefaults || {};
      }
      function getGlobalDefaultsFromRoute() {
        var routeParams = ['mode'];
        return arethusaUtil.inject({}, routeParams, function(memo, param) {
          var value = $location.search()[param];
          if (value) memo[param] = value;
        });
      }
    }
  }
]);

"use strict";

angular.module('arethusa.core').service('confirmationDialog', [
  '$modal',
  '$rootScope',
  function($modal, $rootScope) {
    this.ask = function(message) {
      var scope = $rootScope.$new();
      scope.message = message;
      var promise = $modal.open({
        templateUrl: 'js/arethusa.core/templates/confirmation_dialog.html',
        windowClass: 'confirmation-modal',
        scope: scope
      }).result;
      promise['finally'] = function() { scope.$destroy(); };
      return promise;
    };
  }
]);

"use strict";

/**
 * The service is a wrapper for $ocLazyLoad that can be applied to arrays and makes sure paths are URLs
 */
angular.module('arethusa.core').service('dependencyLoader', [
  '$ocLazyLoad',
  '$q',
  'BASE_PATH',
  function($ocLazyLoad, $q, BASE_PATH) {

    var self = this;

    /**
     * Use $ocLazyLoad after assuring paths are URLs
     * @param args
     * @returns {*}
       */
    this.load = function(args) {
      return $ocLazyLoad.load(expandPath(args));

      /**
       * Apply URL conversion to different kinds of path containers
       * @param path
       * @returns {*}
       */
      function expandPath(path) {
        var res = [];
        if (angular.isArray(path)) {
          return aU.map(path, expand);
        } else {
          if (angular.isString(path)) {
            return expand(path);
          } else {
            var files = aU.map(path.files, expand);
            path.files = files;
            return path;
          }
        }

        /**
         * Convert relative path to URL if necessary
         * @param p
         * @returns {*}
         */
        function expand(p) {
          if (aU.isUrl(p)) {
            return p;
          } else {
            return BASE_PATH + '/' + p;
          }
        }
      }
    };

    /**
     * Chains $ocLazyLoad promises for paths together and returns last promise
     * @param args
     * @returns {*}
       */
    this.loadInOrder = function(args) {
      var start = $q.defer();
      var promises = [start.promise];
      angular.forEach(args, function(el, i) {
        var deferred = $q.defer();
        promises.push(deferred.promise);
        promises[i].then(function() {
          self.load(el)['finally'](aU.resolveFn(deferred));
        });
      });
      start.resolve();
      return aU.last(promises);
    };
  }
]);

'use strict';

/**
 * Global hash table for Document instances
 */
angular.module('arethusa.core').service('documentStore', function () {
  var self = this;

  /**
   * Remove documents and configurations
   */
  this.reset = function () {
    this.store = {};
    this.confs = {};
  };

  /**
   * Store Document instance in associative array
   * @param location
   * @param doc
     */
  this.addDocument = function (location, doc) {
    self.store[location] = doc;
    extractConf(doc);

    function extractConf(doc) {
      angular.extend(self.confs, doc.conf);
    }
  };

  /**
   * Check if documentStore has stored configs from the documents
   * @returns {boolean}
     */
  this.hasAdditionalConfs = function() {
    return !angular.equals(self.confs, {});
  };

  this.reset();
});

"use strict";

angular.module('arethusa.core').service('editors', [
  'User',
  function(User) {
    var self = this;

    this.perDocument = {};

    this.addEditor = function(docId, editor) {
      var doc = self.perDocument[docId];
      if (!doc) doc = self.perDocument[docId] = [];
      doc.push(new User(editor));
      self.editorsPresent = true;
    };

    this.editorsPresent = false;
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.errorDialog
 *
 * @description
 * A general purpose error dialog service
 * which offers the user the option to email
 * a stack trace.
 *
 * @requires $modal
 * @requires $rootScope
 */
angular.module('arethusa.core').service('errorDialog', [
  '$modal',
  '$rootScope',
  function($modal, $rootScope, uuid2) {
    function ask(message,trace) {
      var scope = $rootScope.$new();
      scope.message = message;
      scope.trace = trace;
      var promise = $modal.open({
        templateUrl: 'js/arethusa.core/templates/error_dialog.html',
        windowClass: 'error-modal',
        scope: scope
      }).result;
      promise['finally'] = function() { scope.$destroy(); };
      return promise;
    }

/***************************************************************************
 *                            Public Functions                             *
 ***************************************************************************/
    /**
     * @ngdoc function
     * @name arethusa.core.errorDialog#sendError
     * @methodOf arethusa.core.errorDialog
     *
     * @description
     * Displays a dialog notification of an error and provides an option
     * for the user to send an email with a stacktrace from the calling code
     *
     * @param {String} message a brief description of the message
     * @param {Exception} exception (optional - if not supplied stack trace of
     *   the calling function is sent)
     *
     */
    this.sendError = function(message, exception) {
      // this comes from the stacktrace-js library
      var trace = exception ? printStackTrace({e: exception}) : printStackTrace();
      // it's a little pointless to do this as a modal dialog really
      // the idea was to send the stack trace on accept but it is a pain
      // to get the coordination of the modal dialog with the uservoice widget right
      // so the errordialog has the user voice widget embedded in it for now
      ask(message,trace).then((function(){ }));
    };
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.exitHandler
 *
 * @description
 * Allows to define an exit route of the application.
 *
 * Needs to be defined in a configuration file and uses the following format
 *
 * ```
 *   "exitHandler" : {
 *     "title" : "readable string of the route",
 *     "route" : "http path to your exit target",
 *     "params" : [ 'query', 'params' ]
 *   }
 * ```
 *
 * @requires $location
 * @requires $window
 * @requires arethusa.core.configurator
 *
 */

angular.module('arethusa.core').service('exitHandler', [
  "$location",
  "$window",
  "configurator",
  "$analytics",
  '$rootScope',
  function(
    $location,
    $window,
    configurator,
    $analytics,
    $rootScope
  ) {
    var LEAVE_EVENT = 'exit:leave';
    var self = this;

    var conf = configurator.configurationFor('exitHandler') || {};

    // when it's not configured, we don't do anything
    this.defined = !angular.equals({}, conf);
    this.title = conf.title;

    var route = conf.route;
    var params = conf.params;

    function getParams() {
      return arethusaUtil.inject({}, params, function(memo, param) {
        memo[param] = $location.search()[param];
      });
    }

    function routeWithQueryParams(route, params) {
      if (!angular.equals({}, params)) {
        route = route+ "?";
        var queryStrings = arethusaUtil.inject([], params, function(memo, k, v) {
          memo.push(k + "=" + v);
        });
        route = route + queryStrings.join('&');
      }
      return route;
    }

    function exitUrl() {
      var params = getParams();
      var parsedRoute = route;
      var queryParams = arethusaUtil.inject({}, params, function(memo, param, val) {
        // checking for www.test.com/:param
        if (parsedRoute.indexOf(':' + param) > -1) {
          parsedRoute = parsedRoute.replace(':' + param, val);
        } else {
          memo[param] = val;
        }
      });

      return routeWithQueryParams(parsedRoute, queryParams);
    }

    this.leave = leave;
    this.onLeave = onLeave;
    this.triggerLeaveEvent = triggerLeaveEvent;

    /**
     * @ngdoc function
     * @name arethusa.core:exitHandler#leave
     * @methodOf arethusa.core.exitHandler
     *
     * @description
     * Leaves arethusa to the configured route.
     *
     * @param {string} [targetWin='_self'] The target window.
     */
    function leave(targetWin) {
      $analytics.eventTrack('exit', {
        category: 'actions', label: 'exit'
      });

      targetWin = targetWin || '_self';
      triggerLeaveEvent();
      $window.open(exitUrl(), targetWin);
    }

    function onLeave(cb) {
      $rootScope.$on(LEAVE_EVENT, cb);
    }

    function triggerLeaveEvent() {
      $rootScope.$broadcast(LEAVE_EVENT);
    }
  }
]);

"use strict";

angular.module('arethusa.core').service('fileHandler', [
  '$window',
  function($window) {
    var uploader, downloader;

    this.upload = upload;
    this.download = download;

    // Only supports JSON uploads so far!
    function upload(cb, type) {
      if (!angular.isDefined($window.FileReader)) {
        /* global alert */
        alert("Your browser does not support this feature - use Chrome, Firefox or Opera");
        return;
      }

      if (!uploader) {
        uploader = document.createElement('input');
        uploader.setAttribute('type', 'file');
        uploader.addEventListener('change', onFileSelectFn(cb, type));
      }
      simulateClick(uploader);
    }

    function download(name, data, mimeType) {
        if (!downloader) downloader = document.createElement('a');

        // This should detect that Safari is used...
        if (!angular.isDefined(downloader.download)) {
          /* global alert */
          alert("Your browser does not support this feature - use Chrome, Firefox or Opera");
          return;
        }
        var blob = new Blob([data], { type: mimeType + ';charset=utf-8'});
        downloader.setAttribute('href', createUrl(blob));
        downloader.setAttribute('download', name);

        simulateClick(downloader);
    }

    function createUrl(blob) {
      return ($window.URL || $window.webkitURL).createObjectURL(blob);
    }

    function onFileSelectFn(cb, type) {
      return function(event) {
        var file = event.target.files[0];
        var reader = new $window.FileReader();
        reader.onload = function(event) {
          cb(parseFile(event.target.result, type));
        };
        reader.readAsText(file);
      };
    }

    function parseFile(file, type) {
      switch (type) {
        default:
          return JSON.parse(file);
      }
    }

    // Firefox cannot handle the click event correctly when the element
    // is not attached to the DOM - we therefore hack this temporarily
    function simulateClick(el) {
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    }
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.globalSettings
 *
 * @description
 * Service to define and manipulate application-wide settings.
 *
 * @requires arethusa.core.configurator
 * @requires arethusa.core.plugins
 * @requires $injector
 * @requires $rootScope
 * @requires arethusa.core.notifier
 * @requires arethusa.core.translator
 * @requires arethusa.core.keyCapture
 * @requires $timeout
 */
angular.module('arethusa.core').service('globalSettings', [
  'configurator',
  'plugins',
  '$injector',
  '$rootScope',
  'notifier',
  'translator',
  'keyCapture',
  '$timeout',
  function(configurator,  plugins, $injector, $rootScope, notifier,
           translator, keyCapture, $timeout) {
    var self = this;

    self.name = 'globalSettings'; // configurator will ask for this
    self.layout = {};

    var lazyState;
    function state() {
      if (!lazyState) lazyState = $injector.get('state');
      return lazyState;
    }

    var lazyUserPref;
    function userPreferences() {
      if (!lazyUserPref) lazyUserPref = $injector.get('userPreferences');
      return lazyUserPref;
    }

    /**
     * @ngdoc property
     * @name colorizers
     * @propertyOf arethusa.core.globalSettings
     *
     * @description
     * Dictionary of usable colorizers, registered through {@link arethusa.core.globalSettings#methods_addColorizer globalSettings.addColorizer}.
     *
     * Colorizers are used to add styling to tokens through the functions
     * {@link arethusa.core.state#methods_addStyle state.addStyle},
     * {@link arethusa.core.state#methods_removeStyle state.removeStyle} and
     * {@link arethusa.core.state#methods_unsetStyle state.unsetStyle}.
     * Before plugins use one of these functions, they typically need to ask
     * if they are the currently active colorizer through {@link arethusa.core.globalSettings#methods_isColorizer globalSettings.isColorizer}.
     *
     * A plugin **NEEDS** to define two public functions to function as a colorizer:
     *
     * - *applyStyling*
     *
     *    This function is called when a colorizer is changed on the fly and all tokens
     *    needs to be recolored.
     *
     * - *colorMap*
     *
     *    Function called to produce a color legend so that users can look up the
     *    meaning of a colorization scheme.
     *    The markup of a colorMap object shall be as follows:
     *    ```
     *      // TODO
     *    ```
     *
     * The values in this dictionary are irrelevant, we use a dictionary only for fast lookups.
     *
     * Comes with the standard option to disable colorization altogether.
     *
     * Used by the {@link arethusa.core.directive:colorizerSetting colorizerSetting}
     * directive to allow the user to choose a colorizer.
     *
     */
    self.colorizers = { disabled: true };

    var trsls = translator({
      'globalSettings.layoutLoaded' : 'layoutLoaded'
    });

    var confKeys = [
      "alwaysDeselect",
      "colorizer",
      "persistSettings",
      "disableKeyboardMappings"
    ];

    self.defaultConf = {
      alwaysDeselect: false,
      colorizer: 'morph',
      persistSettings: true,
      disableKeyboardMappings: false
    };

    function configure() {
      self.conf = configurator.configurationFor('main').globalSettings || {};
      configurator.delegateConf(self, confKeys, true); // true makes them sticky

      defineSettings();
    }

    function Conf(property, type, directive, label) {
      this.property = property;
      this.label = label || "globalSettings." + property;
      this.type = type || 'checkbox';
      this.directive = directive;
    }

    self.settings = {};
    function defineSettings() {
      self.defineSetting('persistSettings');
      self.defineSetting('chunkMode', 'custom', 'chunk-mode-switcher');
      self.defineSetting('clickAction', 'custom', 'global-click-action');
      self.defineSetting('alwaysDeselect');
      self.defineSetting('disableKeyboardMappings');
      self.defineSetting('colorizer', 'custom', 'colorizer-setting');
      self.defineSetting('layout', 'custom', 'layout-setting');
    }

    this.defineSetting = function(property, type, directive, label) {
      self.settings[property] = new Conf(property, type, directive, label);
    };

    this.removeSetting = function(setting) {
      delete self.settings[setting];
    };

    this.propagateSetting = function(property) {
      userPreferences().set(self.name, property, self[property]);
    };

    this.toggle = function() {
      self.active = !self.active;
    };

    var deselectors = {};

    this.deselectAfterAction = function(action) {
      deselectors[action] = true;
    };

    this.noDeselectAfterAction = function(action) {
      deselectors[action] = false;
    };

    this.shouldDeselect = function(action) {
      return self.alwaysDeselect || deselectors[action];
    };

    this.defaultClickAction = function(id) {
      state().toggleSelection(id, 'click');
    };

    this.clickActions = {};

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#addClickAction
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * Adds a handler to the selection of available click handlers.
     *
     * @param {String} name Name of the click action handler.
     * @param {Function} clickAction Callback to be executed when a click is made.
     * @param {Object} [preClickActions] Optional object to hold functions to be
     *   executed on `mouseenter` and `mouseleave`, i.e. prior to a possible
     *   click action. Keys have to be the event names, values the callback functions.
     */
    this.addClickAction = function(name, fn, preFn) {
      self.clickActions[name] = [fn, preFn];
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#removeClickAction
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * Removes a click action handler from the selection of available click
     * action handlers.
     *
     * When the removed handler was currently active, the click action is disabled.
     *
     * @param {String} name Name of the click action handler.
     */
    this.removeClickAction = function(name) {
      delete self.clickActions[name];
      if (self.clickAction === name) self.setClickAction('disabled');
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#setClickAction
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * Sets the active click action handler.
     *
     * @param {String} name Name of the click action handler.
     * @param {Boolean} [silent=false] Determines if the `clickActionChange`
     *   event should be supressed.
     */
    this.setClickAction = function(name, silent) {
      // When nothing changed, we don't need to do anything
      if (self.clickAction !== name) {
        self.clickAction = name;
        var actions = self.clickActions[self.clickAction];
        self.clickFn = actions[0];
        self.preClickFn = actions[1];
        if (!silent) {
          $rootScope.$broadcast('clickActionChange');
        }
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#addColorizer
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * Function to register a plugin as colorizer (cf. {@link arethusa.core.globalSettings#properties_colorizers globalSettings.colorizers}).
     *
     * @param {String} plugin Name of the colorizing plugin.
     */
    this.addColorizer = function(pluginName) {
      self.colorizers[pluginName] = true;
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#isColorizer
     * @methodOf arethusa.core.globalSettings
     *
     * @param {String} plugin Name of a plugin.
     *
     * @returns {Boolean} Whether a plugin is the active colorizer or not.
     */
    this.isColorizer = function(pluginName) {
      return self.colorizer === pluginName;
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#applyColorizer
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * TODO
     */
    this.applyColorizer = function() {
      if (self.colorizer === 'disabled') {
        state().unapplyStylings();
      } else {
        // Check if the colorizer is really present
        if (self.colorizers[self.colorizer]) {
          plugins.get(self.colorizer).applyStyling();
        }
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.globalSettings#colorMaps
     * @methodOf arethusa.core.globalSettings
     *
     * @description
     * TODO
     */
    this.colorMaps = function() {
      return arethusaUtil.inject({}, self.colorizers, function(memo, name, _) {
        if (name !== 'disabled') {
          memo[name] = plugins.get(name).colorMap();
        }
      });
    };

    function setLayout() {
      self.layout = configurator.configurationFor('main').template;
    }

    function loadLayouts() {
      self.layouts = configurator.configurationFor('main').layouts;
      self.layout  = self.layouts[0];
      self.broadcastLayoutChange();
    }

    // When Arethusa is used as widget, it's imperative to wait
    // for this event.
    $rootScope.$on('confLoaded', loadLayouts);

    this.broadcastLayoutChange = function() {
      // Postpone this a bit, so that it doesn't show up as first message - also
      // fixes a little bug with the notification window disappearing too fast on
      // a layout change (as the main html is reloaded with it, the container that
      // shows the notification also reloads)
      $timeout(function() {
        notifier.info(trsls.layoutLoaded({ layout: self.layout.name }));
      }, 500);
      $rootScope.$broadcast('layoutChange', self.layout);
    };

    function cycleLayouts() {
      if (self.layouts.length < 2) return;

      var next = ( self.layouts.indexOf(self.layout) + 1) % self.layouts.length;
      self.layout = self.layouts[next];
      self.broadcastLayoutChange();
    }

    keyCapture.initCaptures(function(kC) {
      return {
        layout: [
          kC.create('cycle', cycleLayouts, 'l')
        ]
      };
    });

    this.init = function() {
      configure();
      self.addClickAction('disabled', self.defaultClickAction);
      self.setClickAction('disabled', true);
    };

  }
]);

"use strict";

angular.module('arethusa.core').service('help', [
  function() {
    var self = this;

    this.toggle = function() {
      self.active = !self.active;
    };

    self.active = false;
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.idHandler
 *
 * @description
 * Translates, formats, increments token IDs.
 *
 */
angular.module('arethusa.core').service('idHandler', [
  'errorDialog',
  function(errorDialog) {
    var self = this;

    /**
     * @ngdoc property
     * @name assigned
     * @propertyOf arethusa.core.idHandler
     *
     * @description
     * Stores the currently assigned sourceIds
    */
    var assigned = {};

    /**
     * Returns either padded id or padded sentenceId and id
     * @param id
     * @param sentenceId
     * @returns {string}
       */
    this.getId = function(id, sentenceId) {
      var s = sentenceId ? arethusaUtil.formatNumber(sentenceId, 4) : '';
      var w = arethusaUtil.formatNumber(id, 4);
      return s ? s + '-' + w : w;
    };

    // Backwards compatibility function for TreebankRetriever -
    // can be removed at a later stage. Check the function
    // padWithSentenceId there.
    /**
     * Returns a formatted string of padded sentenceId and id
     * @param id
     * @param sentenceId
     * @returns {string}
       */
    this.padIdWithSId = function(id, sentenceId) {
      var s = aU.formatNumber(sentenceId, 4);
      return s + '-' + id;
    };

    /**
     * 
     * @param id
     * @param format
     * @returns {string|*}
       */
    this.formatId = function(id, format) {
      if (!id) return;

      format = format ? format : '%w';
      // in case we have an id formatted like 1-1 here
      var idParts = parseId(id);
      var wId = idParts.pop();
      var wParts = wIdParts(wId);
      var wIdNumericPart = arethusaUtil.formatNumber(wParts[1]);
      var sentenceId = arethusaUtil.formatNumber(idParts.pop(), 0);
      var res;
      res = format.replace('%w', wIdNumericPart + (wParts[2] || ''));
      if (format.indexOf('%s' > 1)) {
        res = sentenceId ? res.replace('%s', sentenceId) : res.replace('%s-', '');
      }
      return res;
    };
    
    /**
     * @ngdoc function
     * @name arethusa.core.idHandler#unassignSourceId
     * @methodOf arethusa.core.idHandler
     *
     * @description
     * clears out the idHandler's internal record of sourceids 
     * assigned for the supplied token
     *
     * @param {Token} token Token whose sourceids are being cleared
     *
     */
    this.unassignSourceId = function(token) {
      token.idMap.clearSourceIdAssignments(token.sentenceId);
    };

    /**
     * @ngdoc function
     * @name arethusa.core.idHandler#assignSourceId
     * @methodOf arethusa.core.idHandler
     *
     * @description
     * responds to a request to assign a new sourceId for a token
     *
     * @param {Token} token Token whose sourceids are being cleared
     *
     * @returns {Boolean} true if the sourceId can be assigned and
     *   false if the sourceId is already taken
     */
    function assignSourceId(sentenceId,sourceId,docId) {
      var canAssign = false;
      if (!angular.isDefined(assigned[docId])) {
        assigned[docId] = {};
      }
      if (! angular.isDefined(assigned[docId][sentenceId])) {
       assigned[docId][sentenceId] = {};
      }
      var alreadyAssigned = assigned[docId][sentenceId][sourceId];
      if (! alreadyAssigned) {
        canAssign = assigned[docId][sentenceId][sourceId] = true;
      }
      if (!canAssign) {
        errorDialog.sendError("Unexpected error calculating token mappings for sourceid: " + sourceId);
      }
      return canAssign;
    }

    function wIdParts(wId) {
      return /(\d*)(\w*)?/.exec(wId);
    }

    function parseId(id) {
      return id.split('-');
    }
    
    this.Map = function() {
      var self = this;
      this.mappings = {};

      this.add = function(identifier, internalId, sourceId, sentenceId) {
        // we only want to add sourceid mapping if the sourceid hasn't already
        // been assigned. We might want to do something other than quietly fail in this
        // case, but it's not clear what.
        // Note that sentences can get idMappings too, but in this case the source id mappings
        // are fairly useless so we can quietly fail in this case too
        if (angular.isDefined(sentenceId) && assignSourceId(sentenceId,sourceId,identifier)) {
          self.mappings[identifier] = new IdMapping(internalId, sourceId);
        }
        return self.mappings[identifier];

        function IdMapping(internalId, sourceId) {
          // We don't need the internalId here strictly speaking, but who knows...
          this.internalId = internalId;
          this.sourceId   = sourceId;
        }
      };

      this.sourceId = function(identifier) {
        var map = self.mappings[identifier];
        if (map) return map.sourceId;
      };

      this.clearSourceIdAssignments = function(sentenceId) {
        angular.forEach(Object.keys(self.mappings), function(docId,i) {
          assigned[docId][sentenceId][self.sourceId(docId)] = false;
        });
      };
    };

      /**
       * Revert internal Ids to sourceIds for exporting and persisting
       * @param tokens
       * @param docIdentifier
       * @param idCreator
       * @returns {*}
       */
    this.transformToSourceIds = function(tokens, docIdentifier, idCreator) {
      var transformation = new Transformation();
      return arethusaUtil.inject(transformation, tokens, function(memo, id, token) {
        memo.add(token, docIdentifier, idCreator);
      });
      
      function Transformation() {
        var self = this;
        this.mapped = {};
        this.unmapped = [];
        this.fullMap = {};
        this.add = function(token, identifier, idCreator) {
          var sourceId = token.idMap.sourceId(identifier);
          var internalId = token.id;
          if (sourceId) {
            self.mapped[sourceId] = token;
            self.fullMap[internalId] = sourceId;
          } else {
            self.unmapped.push(token);
            sourceId = idCreator();
            if (angular.isDefined(token.idMap.add(identifier, internalId, sourceId, token.sentenceId))) {
              // only add the sourceId to the fullMap if we actually were able to assign it
              // currently we silently fail if we can't but we may want to eventually throw an error notification
              // here
              self.fullMap[internalId] = sourceId;
            }
          }
        };
      }
    };

    var alphabet = [];
    for (var i = 97; i < 123; i++){
      alphabet.push(String.fromCharCode(i));
    }

    /**
     * Has the Id a letter at the last position?
     * @param id
     * @returns {*}
       */
    this.isExtendedId = function(id) {
      return id.match(/.*[a-z]$/);
    };

    var extender = 'e';
    /**
     * Append the character in 'extender' to the Id
     * @param id
     * @returns {string}
       */
    this.extendId = function(id) {
      return id + extender;
    };

    /**
     * Remove the letter in the last position if there is one
     * @param id
     * @returns {*}
       */
    this.stripExtension = function(id) {
      return self.isExtendedId(id) ? id.slice(0, -1) : id;
    };

    /**
     * Increment or decrement a wordId
     * @param id
     * @param increment
     * @returns {string}
       */
    function incDec(id, increment) {

      var idParts = parseId(id);
      var wId = idParts.pop();
      var sentenceId = idParts.pop();
      var wParts = wIdParts(wId);

      var newId  = wParts[1];
      var letter = wParts[2] || '';
      if (letter) {
        letter = increment ? letterAfter(letter) : letterInFront(letter);
      } else {
        if (increment) newId++; else newId--;
      }
      return self.getId(newId, sentenceId) + letter;

      function letterInFront(letter) {
        var i = alphabet.indexOf(letter) - 1;
        return alphabet[i];
      }
      function letterAfter(letter) {
        var i = alphabet.indexOf(letter) + 1;
        return alphabet[i];
      }

    }

    this.decrement = function(id) {
      return incDec(id, false);
    };

    this.increment = function(id) {
      return incDec(id, true);
    };
    
    this.nonSequentialIds = function(ids) {
      var nonSequential = {};
      angular.forEach(ids, function(id, i) {
        var next = ids[i + 1];
        if (next) {
          if (self.decrement(next) !== id) {
            nonSequential[i] = true;
          }
        }
      });
      return nonSequential;
    };
  }
]);

'use strict';

/**
 * @ngdoc service
 * @name arethusa.core.keyCapture
 *
 * @description
 * Service to handle Arethusa's keyboard shortcuts.
 *
 * While its API is fairly clean and comfortable to use, the implementation
 * is of very poor quality and very hard to read.
 *
 *
 * @requires arethusa.core.configurator
 * @requires $rootScope
 */
angular.module('arethusa.core').service('keyCapture', [
  'configurator',
  '$rootScope',
  function(configurator, $rootScope) {
    var self = this;

    this.conf = function(name) {
      var c = configurator.configurationFor('keyCapture') || {};
      return c[name] || {};
    };

    var keyCodes = {
      return: 13,
      '↵': 13,
      shift: 16,
      ctrl: 17,
      alt: 18,
      esc: 27,
      up: 38,
      down: 40,
      left:  37,
      right: 39,
      '←': 37,
      '→': 39,
      '↑': 38,
      '↓': 40,
      ":" : 186,
      "[" : 219,
      "'" : 222,
      "]" : 221
    };

    // a-z codes
    for (var i = 97; i < 123; i++){
      keyCodes[String.fromCharCode(i)] = i - 32;
    }

    var codesToKeys = arethusaUtil.inject({}, keyCodes, function(memo, key, code) {
      memo[code] = key;
    });

    this.codeToKey = function(keyCode) {
      return codesToKeys[keyCode];
    };

    this.keyToCode = function(key) {
      return keyCodes[key];
    };

    this.shiftModifier = 1000;
    this.ctrlModifier  = 2000;
    this.altModifier   = 4000;
    this.metaModifier  = 8000;

    this.getKeyCode = function(key) {
      var parsed = parseKey(key);
      var modifiers = parsed[0];
      var k = parsed[1];
      angular.forEach(modifiers, function(modifier, i) {
        var mod;
        switch (modifier) {
          case 'ctrl':  mod = self.ctrlModifier;  break;
          case 'shift': mod = self.shiftModifier; break;
          case 'alt':   mod = self.altModifier;   break;
          case 'meta':  mod = self.metaModifier;   break;
        }
        k = k + mod;
      });

      return k;
    };

    function parseKey(key) {
      var parts = key.split('-');
      var k = parts.pop();
      if (k.match(/[A-Z]/)) {
        // in case someone wants to do shift-J
        if (! arethusaUtil.isIncluded(parts, 'shift')) {
          parts.push('shift');
        }
        k = k.toLowerCase();
      }

      return [parts, keyCodes[k]];
    }

    function modifiers(keys) {
      return Object.keys(keys.modifiers);
    }

    var lookUpKey = [];
    this.getForeignKey = function(event, language) {

      // Disallow modifier keys except for shift
      if (event.altKey || event.ctrlKey) {
        return undefined;
      }

      var res = [];
      var keys = keysFor(language);
      var key = codesToKeys[event.keyCode];
      var mod = keys.modifiers;
      if (key) {
        // We don't want to match 'shift' as a key, so
        // we return if it's the case.
        if (key == 'shift') {
          return;
        }
        if (event.shiftKey) {
          res.push('shift');
        }
        if (arethusaUtil.isIncluded(modifiers(keys), key)) {
          res.push(key);
          var joined = res.join('-');
          lookUpKey.push(joined);
          return false;
        } else {
          if (arethusaUtil.isIncluded(res, 'shift')) {
            // Following lines provide that 'shift-a'
            // and 'A' is the same.
            var i = res.indexOf("shift");
            res.splice(i, 1);
            key = key.toUpperCase();
          }
          res.push(key);
        }
      }

      var lookUp = lookUpKey.concat(res);
      var sortedLookUp = sortLookUp(lookUp, mod);
      var foreignKey = keys[sortedLookUp.join('-')];
      lookUpKey = [];
      return foreignKey;
    };

    function sortLookUp(lookUp, modifiers) {
      var lastItem = lookUp.length - 1;
      var letter = lookUp[lastItem];
      var mod = lookUp.slice(0, lastItem);
      mod.sort(function(a,b) {
        return modifiers[a]-modifiers[b];
      });
      return mod.concat(letter);
    }

    function keysFor(language) {
      var keys = (self.conf('keys') || {})[language];
      return keys || {};
    }

    var keyPressedCallbacks = {};

    function modifiedKeyCode(event) {
      var k = event.keyCode;

      if (event.shiftKey) k = k + self.shiftModifier;
      if (event.ctrlKey)  k = k + self.ctrlModifier;
      if (event.altKey)   k = k + self.altModifier;
      if (event.metaKey)  k = k + self.metaModifier;

      return k;
    }

    var handleCallbacks = function(event) {
      var keyCode = modifiedKeyCode(event);
      var callbacks = keyPressedCallbacks[keyCode];
      if (callbacks) {
        resolveCallbacks(callbacks, event);
        resumePropagation();
      }
    };

    function broadcastKey(key) {
      $rootScope.$broadcast('keyCaptureLaunched', keyList[key] || key);
    }

    var forbiddenTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    this.keydown = function (event) {
      if (arethusaUtil.isIncluded(forbiddenTags, event.target.tagName) ||
          isRepeater(event.keyCode)) {
        return;
      }

      var keyCode = modifiedKeyCode(event);
      if (keyPressedCallbacks[keyCode]) {
        broadcastKey(keyCode);
      }
    };

    var repeater = '';

    this.keyup = function (event) {
      if (arethusaUtil.isIncluded(forbiddenTags, event.target.tagName)) {
        return;
      }
      if (isRepeater(event.keyCode)) {
        var rep = event.keyCode - 48;
        // A number needs to be broadcasted here, as it doesn't have a keydown
        // event at all.
        broadcastKey(rep);
        repeater = repeater + rep;
        return;
      }
      handleCallbacks(event);
      resetRepeater();
    };

    this.doRepeated = function(fn) {
      var rep = parseInt(repeater, 10) || 1; // default value (and beware octals!)
      for (; rep > 0; rep--) {
        fn();
      }
    };

    function isRepeater(code) {
      if (! isNaN(code)) {
        var numeric = parseInt(code) - 48;
        return numeric > -1 && numeric < 10;
      }
    }

    function resetRepeater() {
      repeater = '';
    }

    function Callback(callback, priority) {
      this.callback = callback;
      this.priority = priority || 0;
    }

    // The keyList is just a dictionary of string representations
    // of the keyCode we use internally.
    var keyList = {};
    function addToKeyList(code, key) {
      keyList[code] = key;
    }

    /**
     * @ngdoc function
     * @name arethusa.core.keyCapture#onKeyPressed
     * @methodOf arethusa.core.keyCapture
     *
     * @description
     * TODO
     */
    this.onKeyPressed = function(key, callback, priority) {
      var keyCode = self.getKeyCode(key);
      addToKeyList(keyCode, key);
      var callbacks = keyPressedCallbacks[keyCode] || [];
      var cb = new Callback(callback, priority);
      callbacks.push(cb);
      keyPressedCallbacks[keyCode] = sortedByPriority(callbacks);
      return function() { removeElement(keyPressedCallbacks[keyCode], cb); };
    };

    function sortedByPriority(callbacks) {
      return callbacks.sort(function(a, b) {
        return b.priority - a.priority;
      });
    }

    var propagationStopped = false;

    /**
     * @ngdoc function
     * @name arethusa.core.keyCapture#stopPropagation
     * @methodOf arethusa.core.keyCapture
     *
     * @description
     * TODO
     */
    this.stopPropagation = function() {
      propagationStopped = true;
    };

    function resumePropagation() {
      propagationStopped = false;
    }

    function resolveCallbacks(callbacks, event) {
      angular.forEach(callbacks, function(callbackObj, key) {
        if (! propagationStopped) {
          callbackObj.callback(event);
        }
      });
    }

    function Capture(confKey, fn, defaultKey) {
      this.confKey = confKey;
      this.fn = fn;
      this.defaultKey = defaultKey;
    }

    this.create = function(confKey, fn, defaultKey) {
      return new Capture(confKey, fn, defaultKey);
    };

    function addToKeys(keys, sec, name, key) {
      if (!keys[sec]) keys[sec] = {};
      keys[sec][name] = key;
    }

    function addToKeyLists(keys) {
      var destructors = [];
      angular.extend(self.activeKeys, keys);
      angular.forEach(keys, function(captures, section) {
        angular.forEach(captures, function(key, capture) {
          var keysDefined = self.keyList[key];
          if (!keysDefined) keysDefined = self.keyList[key] = [];
          var listKey = section + '.' + capture;
          keysDefined.push(listKey);
          destructors.push(function() {
            // only remove when these elements haven't been redefined by someone
            // else
            var sec = self.activeKeys[section] || {};
            var k   = sec[capture];
            if (key === k) delete sec[capture];
            removeElement(keysDefined, listKey);
          });
        });
      });

      return destructorFn(destructors);
    }

    function destructorFn(arr) {
      return function() {
        for (var i = arr.length - 1; i >= 0; i--) { arr[i](); }
      };
    }

    function removeElement(arr, el) {
      var i = arr.indexOf(el);
      arr.splice(i, 1);
    }

    /**
     * @ngdoc function
     * @name arethusa.core.keyCapture#initCaptures
     * @methodOf arethusa.core.keyCapture
     *
     * @description
     * TODO
     */
    this.initCaptures = function(callback) {
      var destructors = [];
      var keys = arethusaUtil.inject({}, callback(self), function(memo, section, captures) {
        var conf = self.conf(section);
        angular.forEach(captures, function(capture, i) {
          var key = conf[capture.confKey] || capture.defaultKey;
          if (angular.isDefined(key)) {
            addToKeys(memo, section, capture.confKey, key);
            var destructor = self.onKeyPressed(key, function() {
              $rootScope.$apply(capture.fn);
            });
            destructors.push(destructor);
          }
        });
      });

      if (!angular.equals({}, keys)) {
        $rootScope.$broadcast('keysAdded', keys);
        destructors.push(addToKeyLists(keys));
      }
      keys.$destroy = destructorFn(destructors);
      return keys;
    };

    // Help
    function usKeyboardLayout() {
      var layout = self.conf("keys");
      return layout.us;
    }

    function setStyle(kKey, cas) {
      // 0 and 1 as properties of kKey.style.class may seem cryptic:
      // ng-repeat in the foreign-keys-help-template iterates
      // over the kKey.show array and provides class names with the
      // $index value. The first element is always the lower case
      // char, the second one the upper case char. This function
      // handles cases, where we want to set either the lower
      // case or the upper case key inactive.

      var style = kKey.style;
      var number = { "lower" : "0", "upper" : "1"};
      style.class = style.class || {};
      if (kKey.hide === undefined) {
        style.class[number[cas]] = "inactive";
      }
    }

    function pushKeys(fKeys, kKey, cas) {
      var display = kKey.show;
      var typeCase = kKey[cas];
      if (!typeCase) return;

      if (fKeys[typeCase]) {
        display.push(fKeys[typeCase]);
      } else {
        setStyle(kKey, cas);
        display.push(typeCase);
      }
    }

    this.mappedKeyboard = function(language, shifted) {
      var fKeys = keysFor(language);
      var keyboardKeys = usKeyboardLayout();
      var res = [];
      var modes = ['lower', 'upper'];
      modes = shifted ? modes.reverse() : modes;
      angular.forEach(keyboardKeys, function(kKey, i) {
        kKey.show = [];
        angular.forEach(modes, function(mode, i) {
          pushKeys(fKeys, kKey, mode);
        });
        res.push(kKey);
      });
      return res;
    };

    /**
     * @ngdoc property
     * @name activeKeys
     * @propertyOf arethusa.core.keyCapture
     *
     * @description
     * TODO
     */
    this.activeKeys = {};

    /**
     * @ngdoc property
     * @name keyList
     * @propertyOf arethusa.core.keyCapture
     *
     * @description
     * TODO
     */
    this.keyList = {};
  }
]);

"use strict";

angular.module('arethusa.core').service('languageSettings', [
  'documentStore',
  function(documentStore) {
    var self = this;

    this.languageSpecifics = {
      'ara' : {
        name: 'Arabic',
        lang: 'ar',
        leftToRight: false,
        font: 'Amiri'
      },
      'grc' : {
        name: 'Greek',
        lang: 'gr',
        leftToRight: true
      },
      'heb' : {
        name: 'Hebrew',
        lang: 'he',
        leftToRight: false
      }
    };

    this.langNames = arethusaUtil.inject({}, self.languageSpecifics, function(memo, code, obj) {
      memo[obj.lang] = obj.name;
    });

    var settings = {};
    this.setFor = function(documentName, lang) {
      settings[documentName] = self.languageSpecifics[lang];
    };

    this.getFor = function(documentName) {
      var cached = settings[documentName];
      if (cached) {
        return cached;
      } else {
        var document = documentStore.store[documentName];
        if (document === undefined) {
          return undefined;
        }

        // This is not robust at all - just a very temporary solution
        var doc = document.json.treebank || document.json.book;
        if (doc) {
          var lang = doc["_xml:lang"];
          if (lang in self.languageSpecifics) {
            var langObj = self.languageSpecifics[lang];
            self.setFor('treebank', langObj);
            return langObj;
          }
        }

        return undefined;
      }
    };
  }
]);

'use strict';
// deprecated for now
// but still in use, no?

/**
 * This service wraps url parameters for routed views and
 * provides a unified access to url- and manually-set parameters
 */
angular.module('arethusa.core').service('locator', [
  '$location',
  function ($location) {
    var noUrlParams;
    var manualParams = {};

    /**
     * Acess parameters by name
     * @param name
     * @returns {*}
       */
    this.get = function(name) {
      return noUrlParams ? manualParams[name] : $location.search()[name];
    };

    /**
     * Toggle url- or manually-set parameters
     * @param bool
       */
    this.watchUrl = function(bool) {
      noUrlParams = !bool;
    };

    /**
     * Manually set parameters.
     * @param paramOrParams
     * @param value
       */
    this.set = function(paramOrParams, value) {
      if (value) {
        manualParams[paramOrParams] = value;
      } else {
        angular.extend(manualParams, paramOrParams);
      }
    };
  }
]);

'use strict';
angular.module('arethusa.core').service('navigator', [
  '$injector',
  'configurator',
  '$cacheFactory',
  'keyCapture',
  '$rootScope',
  'globalSettings',
  function ($injector, configurator, $cacheFactory,
            keyCapture, $rootScope, globalSettings) {

    var MOVE_EVENT = 'navigator:move';
    var self = this;
    var citeMapper;
    var context = {};
    var citationCache = $cacheFactory('citation', { number: 100 });
    var currentChunk;

    // CITATIONS: GROUPED, ORDERED, CHECKED.in[updateCitation->updateId].ex[sentences.js]
    function citationToString(citation, sec) {
      return [citation.author, citation.work, sec].join(' ');
    }
    function splitCiteString(cite) {
      var i = cite.lastIndexOf(':');
      return [cite.slice(0, i), cite.slice(i + 1)];
    }
    function parseCtsUrn(cite, callback) {
      var citation;
      var citeSplit = splitCiteString(cite);
      var doc = citeSplit[0];
      var sec = citeSplit[1];
      citation = citationCache.get(doc);
      if (! citation) {
        citeMapper.get({ cite: doc }).then(function(res) {
          citation = res.data;
          citationCache.put(doc, citation);
          callback(citationToString(citation, sec));
        }).catch(function() {
          callback(cite);
        });
      } else {
        callback(citationToString(citation, sec));
      }
    }
    function hasCtsUrn(cite) {
      // CTS urns might be prefixed with a uri
      // prefix and not appear at the beginng of the doc id
      return cite.match(/urn:cts/);
    }
    this.getCitation = function(sentences, callback) {
      if (!citeMapper) return;
      var sentence = sentences[0];
      if (!sentence) return;

      var cite = sentence.cite;
      if (cite) {
        if (hasCtsUrn(cite)) {
          parseCtsUrn(cite, callback);
        } else {
          callback(cite);
        }
      }
    };
    function resetCitation() {
      delete self.status.citation;
    }
    function storeCitation(citationString) {
      self.status.citation = citationString;
    }
    function updateCitation() {
      resetCitation();
      self.getCitation(currentSentenceObjs(), storeCitation);
    }

    // SENTENCES: GROUPED,
    function findSentence(id) {
      var res;
      for (var i = self.sentences.length - 1; i >= 0; i--){
        if (self.sentences[i].id === id) {
          res = self.sentences[i];
          break;
        }
      }
      return res;
    }
    function currentSentenceObjs () {
      var pos = self.currentPosition;

      if (!self.currentSentences) {
        self.currentSentences = self.sentences.slice(pos, pos + self.chunkSize) || [];
      }
      return self.currentSentences;
    }
    function currentIds () {
      return arethusaUtil.map(currentSentenceObjs(), 'id');
    }
    this.sentenceToString = function(sentence) {
      return arethusaUtil.inject([], sentence.tokens, function(memo, id, token) {
        memo.push(token.string);
      }).join(' ');
    };
    this.addSentences = function(sentences) {
      arethusaUtil.pushAll(self.sentences, sentences);
      angular.forEach(sentences, function(sentence, i) {
        self.sentencesById[sentence.id] = sentence;
      });
      updateNextAndPrev();
      updateChunks();
    };
    function updatePosition(pos) {
      self.currentPosition = pos;
    }
    this.goToFirst = function() {
      updatePosition(0);
      updateState();
    };
    this.goTo = function(id) {
      var s = findSentence(id);
      if (s) {
        var i = self.sentences.indexOf(s);
        updatePosition(i);
        updateState();
        return true;
      } else {
        // Not totally sure what we want to do here -
        //  maybe add a notification?

        /* global alert */

        alert('No sentence with id ' + id + ' found');
      }
    };
    this.goToByPosition = function(pos) {
      if (self.sentences.length > pos) {
        updatePosition(pos);
        updateState();
      }
    };
    this.goToLast = function() {
      updatePosition(self.sentences.length - self.chunkSize);
      updateState();
    };

    // CHUNKS: GROUPED,
    function layoutChunkSize() {
      var layoutConf = globalSettings.layout.navigator || {};
      return layoutConf.chunkSize;
    }
    function initChunkSize() {
      return layoutChunkSize() || self.conf.chunkSize || 1;
    }
    this.applyChunkMode = function() {
      // tbd - we only support sentences so far
    };
    this.changeChunkSize = function(size) {
      if (self.chunkSize === size) return;
      self.chunkSize = size;
      updateState();
    };
    this.currentChunk = function () {
      if (!currentChunk) {
        currentChunk = {};
        var currSentences = currentSentenceObjs();
        for (var i=0; i < currSentences.length; i++) {
          angular.extend(currentChunk, currSentences[i].tokens);
        }
        updateContext();
      }
      return currentChunk;
    };
    this.nextChunk = function () {
      if (hasNext()) movePosition(1);
    };
    this.prevChunk = function () {
      if (hasPrev()) movePosition(-1);
    };
    this.markChunkChanged = function() {
      var currSents = currentSentenceObjs();
      for (var i = currSents.length - 1; i >= 0; i--){
        currSents[i].changed = true;
      }
    };
    function movePosition(steps) {
      var newPos = self.currentPosition + (steps * self.chunkSize);
      if (newPos < 0) newPos = 0;

      self.currentPosition = newPos;
      updateState();
    }
    function updateNextAndPrev() {
      self.status.hasNext = hasNext();
      self.status.hasPrev = hasPrev();
    }
    function updateChunks() {
      self.currentSentences = undefined;
      currentChunk = undefined;
      self.currentChunk();
    }
    function hasNext() {
      return self.currentPosition + self.chunkSize < self.sentences.length;
    }
    function hasPrev() {
      return self.currentPosition > 0;
    }
    function updateContext() {

      function getPreContext(index) {
        if (index !== 0) return self.sentences[index - 1];
      }

      function getPostContext(index) {
        if (index !== self.sentences.length - 1) return self.sentences[index + 1];
      }

      var sentences = currentSentenceObjs();
      var firstSentence = sentences[0];
      var lastSentence  = sentences[sentences.length - 1];

      var firstIndex = self.sentences.indexOf(firstSentence);
      var lastIndex  = self.sentences.indexOf(lastSentence);

      // Probably make context size configurable
      context.pre = getPreContext(firstIndex);
      context.post = getPostContext(lastIndex);
    }
    this.addToken = function(token) {
      var sentenceId = token.sentenceId;
      var id  = token.id;
      self.sentencesById[sentenceId].tokens[id] = token;
    };
    this.removeToken = function(token) {
      var sentenceId = token.sentenceId;
      var id  = token.id;
      delete self.sentencesById[sentenceId].tokens[id];
    };


    // VIEW: GROUPED
    this.list = function() {
      return angular.element(document.getElementById('arethusa-sentence-list'));
    };
    this.switchView = function() {
      function editor () { return angular.element(document.getElementById('arethusa-editor')); }
      $rootScope.$broadcast('viewModeSwitched');
      var myEditor = editor();
      var list   = self.list();
      if (self.listMode) {
        myEditor.removeClass('hide');
        list.addClass('hide');
        self.listMode = false;
      } else {
        myEditor.addClass('hide');
        list.removeClass('hide');
        self.listMode = true;
      }
    };
    function resetList() {
      self.hasList = false;
    }

    // NAVIGATOR: GROUPED
    this.init = function() {
      self.conf = configurator.configurationFor('navigator');

      self.chunkModes = ['sentence'];
      self.chunkMode = self.conf.chunkMode || 'sentence';
      self.chunkSize = initChunkSize();

      self.sentences = [];
      self.sentencesById = {};
      //holds a pointer to the currently displayed chunk
      self.status = { context: context };
      updatePosition(0);

      citeMapper = configurator.provideResource('citeMapper');

      self.keys = keyCapture.initCaptures(function(kC) {
        return {
          navigation: [
            kC.create('nextChunk', function() { kC.doRepeated(self.nextChunk); }, 'u'),
            kC.create('prevChunk', function() { kC.doRepeated(self.prevChunk); }, 'i'),
            kC.create('list', function() { self.switchView(); }, 'L')
          ]
        };
      });

      navigator.chunkMode = 'sentence';

      $rootScope.$on('layoutChange', function(ev, layout) {
        self.changeChunkSize(initChunkSize());
      });
    };
    this.reset = function () {
      updatePosition(0);
      self.sentences = [];
      self.sentencesById = {};
      self.listMode = false;
      resetList();
      self.updateId();
    };
    function updateState() {

      var state = function () {
        if (!self.lazyState) {
          self.lazyState = $injector.get('state');
        }
        return self.lazyState;
      };

      self.updateId();
      triggerMoveEvent();
      state().replaceState(self.currentChunk());
    }


    this.updateId = function () {
      updateNextAndPrev();
      updateChunks();
      self.status.currentPos = self.currentPosition;
      self.status.currentIds = currentIds();
      updateCitation();
    };
    this.onMove = onMove;
    function onMove(cb) {
      return $rootScope.$on(MOVE_EVENT, cb);
    }
    function triggerMoveEvent() {
      $rootScope.$broadcast(MOVE_EVENT);
    }

    // Probably could deregister/reregister that watch, but it doesn't hurt...
    $rootScope.$on('tokenChange',  self.markChunkChanged);
    $rootScope.$on('tokenAdded',   self.markChunkChanged);
    $rootScope.$on('tokenRemoved', self.markChunkChanged);
    $rootScope.$on('layoutChange', resetList);
  }
]);

'use strict';
/**
 * @ngdoc service
 * @name arethusa.core.notifier
 *
 * @description
 * Service to launch notifications.
 *
 * Uses [AngularJS-Toaster](http://github.com/jirikavi/AngularJS-Toaster) to bring
 * notifications immediately to the screen.  Also stores past notifications (cf. {@link arethusa.core.notifier#properties_messages notifier.messages}).
 *
 *
 * *Example Configuration*
 * ```
 * "notifier" : {
 *   "disable" : false,
 *   "maxMessages" : 10
 * }
 * ```
 *
 * @requires arethusa.core.configurator
 * @requires toaster
 * @requires $timeout
 */
angular.module('arethusa.core').service('notifier', [
  'configurator',
  'toaster',
  '$timeout',
  function(configurator, toaster, $timeout) {
    var self = this;

    function configure() {
      self.conf = configurator.configurationFor('notifier');

      /**
       * @ngdoc property
       * @name disable
       * @propertyOf arethusa.core.notifier
       *
       * @description
       * ***Configurable property***
       *
       * Set to true to disable all notifications. Defaults to false.
       */
      self.disable = self.conf.disable;

      /**
       * @ngdoc property
       * @name maxMessages
       * @propertyOf arethusa.core.notifier
       *
       * @description
       * ***Configurable property***
       *
       * Maximum number of messages stored within the service. Defaults to 15.
       */
      self.maxMessages = self.conf.maxMessages || 15;
    }

    /**
     * @ngdoc property
     * @name messages
     * @propertyOf arethusa.core.notifier
     *
     * @description
     * Array of messages objects. Acts stack-like when {@link arethusa.core.notifier#properties_maxMessages maxMessages} are reached.
     *
     * The objects come with the following properties:
     *
     * - *type*
     * - *message*
     * - *title*
     * - *time*
     */
    this.messages = [];

    function Message(type, message, title) {
      this.type = type;
      this.message = message;
      this.title = title;
      this.time = new Date();
    }

    function generate(type) {
      self[type] = function(message, title, debounce) {
        if (!self.disable) {
          self.addMessage(type, message, title, debounce);
        }
      };
    }

    /**
     * @ngdoc function
     * @name arethusa.core.notifier#success
     * @methodOf arethusa.core.notifier
     *
     * @description
     * Generates a *success* notification.
     *
     * @param {String} message Message body of the notification
     * @param {String} [title] Optional title/heading of the notification
     * @param {Number} [blockDuration] Optional duration during which a subsequent
     *   attempts to issue the exact same notification will supressed.
     */

    /**
     * @ngdoc function
     * @name arethusa.core.notifier#info
     * @methodOf arethusa.core.notifier
     *
     * @description
     * Generates an *info* notification.
     *
     * @param {String} message Message body of the notification
     * @param {String} [title] Optional title/heading of the notification
     * @param {Number} [blockDuration] Optional duration during which a subsequent
     *   attempts to issue the exact same notification will supressed.
     */

    /**
     * @ngdoc function
     * @name arethusa.core.notifier#wait
     * @methodOf arethusa.core.notifier
     *
     * @description
     * Generates a *wait* notification.
     *
     * @param {String} message Message body of the notification
     * @param {String} [title] Optional title/heading of the notification
     * @param {Number} [blockDuration] Optional duration during which a subsequent
     *   attempts to issue the exact same notification will supressed.
     */

    /**
     * @ngdoc function
     * @name arethusa.core.notifier#warning
     * @methodOf arethusa.core.notifier
     *
     * @description
     * Generates a *warning* notification.
     *
     * @param {String} message Message body of the notification
     * @param {String} [title] Optional title/heading of the notification
     * @param {Number} [blockDuration] Optional duration during which a subsequent
     *   attempts to issue the exact same notification will supressed.
     */

    /**
     * @ngdoc function
     * @name arethusa.core.notifier#error
     * @methodOf arethusa.core.notifier
     *
     * @description
     * Generates an *error* notification.
     *
     * @param {String} message Message body of the notification
     * @param {String} [title] Optional title/heading of the notification
     * @param {Number} [blockDuration] Optional duration during which a subsequent
     *   attempts to issue the exact same notification will supressed.
     */
    var types = ['success', 'info', 'wait', 'warning', 'error'];
    angular.forEach(types, generate);

    var debouncer = {};

    function messageKey(type, message, title) {
      return [type, message, title].join('||');
    }

    function messageAlreadyAdded(msgKey) {
      return debouncer[msgKey];
    }

    function cancelTimer(msgKey) {
      return function() {
        $timeout.cancel(debouncer[msgKey]);
      };
    }

    function addDebouncing(msgKey, duration) {
      debouncer[msgKey] = $timeout(cancelTimer, duration, false);
    }

    this.addMessage = function(type, message, title, debounce) {
      if (self.messages.length === self.maxMessages) {
        self.messages.pop();
      }

      var msgKey = messageKey(type, message, title);
      if (messageAlreadyAdded(msgKey)) return;
      if (debounce) addDebouncing(msgKey, debounce);

      var msg = new Message(type, message, title);
      self.messages.unshift(msg);
      toaster.pop(type, title, message);
    };

    this.toggle = function() {
      self.panelActive = !self.panelActive;
    };

    this.init = function() {
      configure();
    };
  }
]);

"use strict";

angular.module('arethusa.core').service('plugins', [
  'configurator',
  '$injector',
  '$rootScope',
  '$q',
  '$timeout',
  'dependencyLoader',
  'notifier',
  'translator',
  function(configurator, $injector, $rootScope, $q, $timeout, dependencyLoader,
          notifier, translator) {
    var self = this;
    var readyPlugins;
    var initCallbacks;

    var translations = translator({
      'plugins.added': 'added',
      'plugins.failed': 'failed',
      'plugins.alreadyLoaded': 'alreadyLoaded'
    });

    function loadPlugin(name) {

      function LoadRequest(name, location) {

        function toSnakeCase(str) { return str.replace(/([A-Z])/g, '_$1').toLowerCase(); }

        var self = this;
        function getName(name, location) {
          return location ? name : 'arethusa.' + name;
        }

        function getLocation(location) {
          return (location || 'dist/' + toSnakeCase(self.name) + '.min.js');
        }

        this.name = getName(name, location);
        this.files = [getLocation(location)];
      }

      // The history plugin is special - as it's is always part of the
      // application, just not always as visible plugin.
      // We therefore don't need to retrieve it again - the Arethusa
      // module already knows about it.
      if (name === 'history') {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      } else {
        var pluginConf = configurator.configurationFor(name);
        var request = new LoadRequest(name, pluginConf.location);
        return dependencyLoader.load(request);
      }
    }

    function loadExtDep(extDep) {

      function wrapInPromise(callback) {
        var deferred = $q.defer();
        callback()['finally'](aU.resolveFn(deferred));
        return deferred.promise;
      }

      if (angular.isArray(extDep)) {
        return dependencyLoader.load(extDep);
      } else {
        var ordered = extDep.ordered;
        var unordered = extDep.unordered;
        var promises = [];
        if (ordered) {
          promises.push(wrapInPromise(function() {
            return dependencyLoader.loadInOrder(ordered);
          }));
        }
        if (unordered) {
          promises.push(wrapInPromise(function() {
            return dependencyLoader.load(unordered);
          }));
        }
        return $q.all(promises);
      }
    }

    function getFromInjector(name) {
      var woNamespace = name.replace(/.*?\./, '');
      return $injector.get(woNamespace);
    }

    function loadPlugins(pluginNames) {

      function resolveWhenReady(names, loader) {
        function loadComplete(pluginNames) { return Object.keys(self.loader).length === pluginNames.length; }
        if (loadComplete(names)) loader.resolve();
      }

      var loader = $q.defer();

      angular.forEach(pluginNames, function(name, i) {
        var externalDependencies;
        var load = loadPlugin(name);
        var plugin;
        load.then(
          function success() {
            plugin = getFromInjector(name);
            var extDep = plugin.externalDependencies;
            if (extDep) {
              externalDependencies = loadExtDep(extDep);
            } else {
              self.loader[name] = getFromInjector(name);
            }
           },
          function error() { self.loader[name] = false; }
        );

        load['finally'](function() {
          if (externalDependencies) {
            externalDependencies['finally'](function() {
              self.loader[name] = getFromInjector(name);
              resolveWhenReady(pluginNames, loader);
            });
          } else {
            resolveWhenReady(pluginNames, loader);
          }
        });
      });

      return loader.promise;
    }

    function notify(plugin, name) {
      $timeout(function() {
        $rootScope.$broadcast('pluginAdded', name, plugin);
      });
    }


    // Working on the assumptions that plugins will generally be grouped
    // in something like a tabset - impossible to show them all at the same
    // time, we expose some variables and functions to get info about their
    // visibility.
    // Templates can use this to implement ngIf, which removes elements
    // temporarily from the DOM.
    // Very useful - example use case:
    //   We have the morph plugin included in our configuration, but have
    //   selected a different tab at the moment, i.e. we are displaying
    //   the view of another plugin. The morph view wouldn't have to be
    //   rendered in the background!
    //
    // As we will mostly likely listen to click events for this, we have
    // to declare a first visible plugin in the init() function of this
    // controller, otherwise a user wouldn't be able to see something when
    // he first loads the page.
    //
    // Some plugins might have to rely on working in the background too.
    // Generally this shouldn't be the case, because all business logic
    // should be out of the DOM anyway. If a plugin still needs this, it can
    // do so by setting its alwaysActiveproperty to true.

    this.setActive = function(plugin) {
      self.active = plugin;
    };

    this.isActive = function(plugin) {
      return self.isSelected(plugin) && !plugin.alwaysActive;
    };

    this.isSelected = function(plugin) {
      return plugin === self.active;
    };

    this.doAfter = function(pluginName, fn) {
      initCallbacks.add('after', pluginName, fn);
    };

    this.declareReady = function(pluginOrName) {
      var name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
      readyPlugins[name] = true;
      initCallbacks.resolve('after', name);
    };

    this.get = function(name) {
      return (self.all || {})[name] || {};
    };

    this.addPlugin = function(name, conf) {
      if (self.all[name]) {
        notifier.warning(translations.alreadyLoaded({ name: name }));
        return;
      }

      if (conf) configurator.addPluginConf(name, conf);
      var deferred = $q.defer();
      var promise  = deferred.promise;
      var loader = loadPlugin(name);
      var plugin, dependencies;

      var loadSuccess = function() {
        plugin = $injector.get(name);
        var extDep = plugin.externalDependencies;
        if (extDep) {
          loadExtDep(extDep).then(resolve, reject);
        } else {
          resolve();
        }
      };

      var resolve = function() {
        self.all[name] = plugin;
        self.registerPlugin(plugin);
        plugin.init();
        notify(plugin, name);
        notifier.success(translations.added({ name: name }));
        deferred.resolve(plugin);
      };

      var reject = function() {
        notifier.error(translations.failed({ name: name }) + "!");
        deferred.reject();
      };

      loader.then(loadSuccess, reject);
      return promise;
    };

    this.registerPlugin = function(plugin, name) {

      function hasView(plugin) { return !(!plugin.template || plugin.noView); }

      if (hasView(plugin)) {
        if (plugin.main) {
          self.main.push(plugin);
        } else {
          self.sub.push(plugin);
        }
      }
      if (plugin.contextMenu) {
        self.withMenu.push(plugin);
      }
    };

    this.init = function() {
      function InitCallbacks() {
        var self = this;
        var cl   = InitCallbacks;
        this.after  = {};
        this.before = {};

        cl.prototype.resolve = function(timing, pluginName) {
          var cbs = self[timing][pluginName] || [];
          angular.forEach(cbs, function(cb, i) { cb(); });
        };

        cl.prototype.add = function(timing, pluginName, fn) {
          var t = self[timing];
          var cbs = t[pluginName];
          if (!cbs) cbs = t[pluginName] = [];
          cbs.push(fn);
          if (readyPlugins[pluginName]) fn();
        };
      }
      function initPlugin(plugin) { if (angular.isFunction(plugin.init)) plugin.init(); }
      readyPlugins = {};
      initCallbacks = new InitCallbacks();
      angular.forEach(self.all, initPlugin);
    };

    this.start = function(pluginNames) {
      function sortPlugins(names) { angular.forEach(names, function(name, i) {
        var plugin = self.loader[name];
        if (plugin) self.all[name] = plugin;
      }); }
      function partitionPlugins() {
        self.main = [];
        self.sub  = [];
        self.withMenu = [];
        angular.forEach(self.all, self.registerPlugin);
      }
      function declareFirstActive() { self.setActive(self.sub[0]); }
      function notifyListeners() { angular.forEach(self.all, notify); }
      self.loaded = false;
      self.loader = {};
      self.all = {};
      var result = $q.defer();

      loadPlugins(pluginNames).then(function() {
        sortPlugins(pluginNames);
        self.init();
        partitionPlugins();
        declareFirstActive();
        notifyListeners();
        self.loader = {};
        self.loaded = true;
        $rootScope.$broadcast('pluginsLoaded');
        result.resolve();
      });

      return result.promise;
    };
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.relocateHandler
 *
 * @description
 * Allows relocating between base deployments of the application
 *
 * Needs to be defined in a configuration file and uses the following format
 *
 * ```
 *   "relocateHandler" : {
 *     "location1": {
 *       "baseUrl" : "http path to the base deployment location"
 *     },
 *      ...
 *     "locationN": {
 *       "baseUrl" : "http path to the base deployment location"
 *      }
 *   }
 * ```
 *
 * @requires $location
 * @requires $window
 * @requires arethusa.core.configurator
 *
 */

angular.module('arethusa.core').service('relocateHandler', [
  "$location",
  "$window",
  "configurator",
  "$analytics",
  function($location, $window, configurator, $analytics) {
    var self = this;


    var conf = configurator.configurationFor('relocateHandler') || {};

    // when it's not configured, we don't do anything
    this.defined = !angular.equals({}, conf);
    this.locations = this.defined ? Object.keys(conf) : [];

    function relocateUrl(key) {
      var base = conf[key].baseUrl;
      var currentUrl = $location.url();
      return base + currentUrl;
    }


    /**
     * @ngdoc function
     * @name arethusa.core:relocateHandler#relocate
     * @methodOf arethusa.core.relocateHandler
     *
     * @description
     * Relocates arethusa to the configured base url
     *
     * @param {string} loc The key to the location.
     * @param {string} [targetWin='_self'] The target window.
     */
    this.relocate = function(loc, targetWin) {
      $analytics.eventTrack('relocate', {
        category: 'actions', label: loc
      });

      targetWin = targetWin || '_self';
      $window.open(relocateUrl(loc), targetWin);
    };
  }
]);

"use strict";

angular.module('arethusa.core').service('routeChangeWatcher', [
  '$rootScope',
  '$window',
  function($rootScope, $window) {
    $rootScope.$on('$locationChangeSuccess', function() {
      $window.location.reload();
    });
  }
]);

"use strict";

angular.module('arethusa.core').service('saver', [
  'configurator',
  'notifier',
  'keyCapture',
  'state',
  '$rootScope',
  '$window',
  'translator',
  '$analytics',
  'exitHandler',
  function(
    configurator,
    notifier,
    keyCapture,
    state,
    $rootScope,
    $window,
    translator,
    $analytics,
    exitHandler
  ) {

    var SUCCESS_EVENT = 'saveSuccess';

    var self = this;
    var conf, persisters;

    var translations = translator({
      'saver.success': 'success',
      'saver.error': 'error',
      'saver.inProgress': 'inProgress',
      'saver.nothingToSave': 'nothingToSave',
      'saver.confirmNote': 'confirmNote',
      'saver.confirmQuestion': 'confirmQuestion'
    });

    function getPersisters() {
      conf = configurator.configurationFor('main');
      return configurator.getPersisters(conf.persisters);
    }

    function getOutputters() {
      var fromPersisters = aU.inject({}, persisters, function(memo, name, persister) {
        if (angular.isFunction(persister.output)) memo[name] = persister;
      });
      return angular.extend(fromPersisters, configurator.getPersisters(conf.outputters));
    }

    function getPersistersAndOutputters() {
      persisters = getPersisters();
      self.outputters = getOutputters();
    }

    function hasPersisters() {
      return !angular.equals({}, persisters);
    }

    function updateStatus() {
      if (hasPersisters() && canEdit()) {
        self.canSave = true;
      }
    }

    function canEdit() {
      return configurator.mode() === 'editor';
    }

    function reset() {
      self.canSave = false;
    }

    // We only have one persister right now, later we'll want
    // to handle the success notification better.
    function success(res) {
      self.needsSave = false;
      $rootScope.$broadcast(SUCCESS_EVENT);
      notifier.success(translations.success());
    }

    function error(res) {
      // Can't figure out why we return 406 from our development server
      // all the time when we do POSTs.
      // The save succeeds anyway - print the success message in such a
      // case as to not confuse the user...
      if (res.status == 406) {
        success();
      } else {
        notifier.error(translations.error());
      }
    }

    function callSave(persister, name) {
      persister.saveData(success, error);
    }

    this.save = function() {
      $analytics.eventTrack('save', {
        category: 'actions', label: 'save'
      });

      if (self.needsSave) {
        notifier.wait(translations.inProgress());
        angular.forEach(persisters, callSave);
      } else {
        notifier.info(translations.nothingToSave());
      }
    };

    function defineKeyCaptures() {
      self.activeKeys = {};
      var keys = keyCapture.initCaptures(function(kC) {
        return {
          saver: [
            kC.create('save', function() { self.save(); }, 'ctrl-S')
          ]
        };
      });
      angular.extend(self.activeKeys, keys.saver);
    }

    function setChangeWatch() {
      state.on('tokenChange',  watchChange);
      state.on('tokenAdded',   watchChange);
      state.on('tokenRemoved', watchChange);
    }

    function watchChange() {
      self.needsSave = true;
    }

    // Don't let the user leave without a prompt, when
    // he's leaving when a save is needed.

    if (!state.debug) {
      // We need this when the user wants to reload, or move to another url
      // altogether.
      // Due to crappy browser support we cannot trigger a leave event after the
      // user does a confirmation of closing the application, which is something
      // we are OK with for now: When the user does not want to save before he
      // leaves, we will also do not trigger our event which will do further
      // cleanups, caching etc.
      $window.onbeforeunload = function(event) {
        if (self.needsSave) {
          return translations.confirmNote();
        } else {
          exitHandler.triggerLeaveEvent();
        }
      };

      // We need this when a user is changing the url from within the application
      $rootScope.$on('$locationChangeStart', function(event) {
        if (self.needsSave) {
          if (!$window.confirm(translations.confirmNote() + "\n" + translations.confirmQuestion())) {
            event.preventDefault();
          }
        }
      });

      // When we really leave, clean up on onbeforeunload event
      $rootScope.$on('destroy', function() { $window.onbeforeunload = undefined; });
    }

    this.onSuccess = function(cb) {
      $rootScope.$on(SUCCESS_EVENT, cb);
    };

    this.init = function(newPersisters) {
      defineKeyCaptures();
      reset();
      getPersistersAndOutputters();
      updateStatus();
      setChangeWatch();
    };
  }
]);

"use strict";

angular.module('arethusa.core').service('sidepanel', [
  'globalSettings',
  '$rootScope',
  '$timeout',
  function(globalSettings, $rootScope, $timeout) {
    var self = this;
    var main, panel;

    function get(id) {
      return angular.element(document.getElementById(id));
    }

    function show() {
      main.width(main.width() - panel.width());
      panel.show();
    }

    function hide() {
      main.width(main.width() + panel.width());
      panel.hide();
    }

    function init() {
      var layout = globalSettings.layout;
      self.active = layout.sidepanel;
      if (self.active) {
        self.folded = layout.folded;

        // Need a timeout - when a layout change has just been
        // initialized we need to wait for the next digest -
        // otherwise we won't have a sidepanel element in our DOM
        $timeout(function() {
          main  = get('main-body');
          panel = get('sidepanel');
          if (self.folded) hide();
        });
      }
    }

    this.toggle = function() {

      // This very weird looking line countering a spacing bug
      // in Foundation.
      // When the sidepanel is placed in a columns row together
      // with a main-body no explicit width is assigned to it at
      // first. The main-body gets a width, the sidepanel just
      // takes the rest of the available space.
      // This works fine - problems arise when the sidepanel is
      // hidden. As no explicit width has been set, Foundation
      // tries to recalculate the size of the sidepanel when it
      // gets visible again - and it does this calculation wrong.
      //
      // This workaround sets the width explicitly. panel.width()
      // returns the initial width value Foundation calculated,
      // which is absolutely correct. By setting the width to
      // exactly this value, the element writes it explicitly into
      // its style attributes. Once this is done, Foundation seems
      // not to recalculate this value again when the element
      // gets visiable again after being hidden. Exactly what we need!
      //
      // We cannot call this method on init - Angular cannot guarantee
      // its DOM load order - and indeed, on init the behaviour is
      // unstable - it might work or might not.
      // We just do it on every toggle. Is redundant most of time,
      // but it seems to fix our problem at least...
      panel.width(panel.width());
      if (self.folded) show(); else hide();
      self.folded = !self.folded;
    };

    this.activeKeys = {};


    $rootScope.$on('layoutChange', init);

    init();
  }
]);

"use strict";

angular.module('arethusa.core').service('spinner', function() {
  var self = this;

  this.spinning = 0;

  this.spin = function() {
    self.spinning++;
  };

  this.stop = function() {
    self.spinning--;
  };
});

'use strict';

/**
 * @ngdoc service
 * @name arethusa.core.state
 *
 * @description
 * One of Arethusa's key components, typically injected by every plugin.
 *
 * 1. Retrieves documents
 * 2. Holds the current annotation targets - tokens - presented to the user
 * 3. Handles selections of tokens
 * 4. Provides an API to make changes to tokens, while notifying listeners
 *    (e.g. {@link arethusa.core.state#methods_change state.change} and
 *    {@link arethusa.core.state#methods_watch state.watch})
 *
 * Reads its configuration from the `main` section.
 *
 * @requires arethusa.core.configurator
 * @requires arethusa.core.navigator
 * @requires $rootScope
 * @requires arethusa.core.documentStore
 * @requires arethusa.core.keyCapture
 * @requires arethusa.core.locator
 * @requires arethusa.core.StateChange
 * @requires arethusa.core.idHandler
 * @requires arethusa.core.globalSettings
 * @requires arethusa.util.logger
 */

angular.module('arethusa.core').service('state', [
  'configurator',
  'navigator',
  '$rootScope',
  'documentStore',
  'keyCapture',
  'locator',
  'StateChange',
  'idHandler',
  'globalSettings',
  'confirmationDialog',
  'notifier',
  'logger',
  'DocumentResolver',
  function (configurator, navigator, $rootScope, documentStore, keyCapture,
            locator, StateChange, idHandler, globalSettings, confirmationDialog,
            notifier, logger, DocumentResolver) {
    var self = this;
    var tokenRetrievers, resolver;

    this.documents = function() {
      return documentStore.store;
    };


    // We hold tokens locally during retrieval phase.
    // Once we are done, they will be exposed through
    // this.replaceState, which also triggers
    // the stateLoaded event.
    var tokens = {};

    // Loading a state
    // Premature optimization - we need something like that only when we start
    // to act on several documents at once. For now we have only one retriever
    // anyway...
    //
    //var saveTokens = function (container, tokens) {
      //angular.forEach(tokens, function (token, id) {
        //var updatedToken;
        //var savedToken = container[id];
        //if (savedToken) {
          //updatedToken = angular.extend(savedToken, token);
        //} else {
          //updatedToken = token;
        //}
        //container[id] = token;
      //});
    //};

    this.retrieveDocuments = retrieveDocuments;
    this.retrieveTokens    = retrieveTokens;
    function retrieveDocuments(resolverConf) {
      if (resolverConf) {
        resolver = new DocumentResolver(resolverConf);
        resolver.resolve(tokenRetrievers, onSuccessfulRetrievalFn);
      } else {
        retrieveTokens();
      }
    }
    function onSuccessfulRetrievalFn(retriever) {
      return function onSuccessfulRetrieval(data) {
          navigator.addSentences(data);
          moveToSentence();
          // Check comment for saveTokens
          //saveTokens(container, navigator.currentChunk());
          tokens = navigator.currentChunk();

          declarePreselections(retriever.preselections);
          declareLoaded(retriever);
      };
    }
    var declareLoaded = function (retriever) {
      retriever.loaded = true;
      self.checkLoadStatus();
    };
    this.checkLoadStatus = function () {
      var loaded = true;
      angular.forEach(tokenRetrievers, function (el, name) {
        loaded = loaded && el.loaded;
      });
      if (loaded) {
        var launch = function() { self.launched = true; self.replaceState(tokens, true); };

        if (documentStore.hasAdditionalConfs()) {
          // launch when the promise is resolved OR rejected
          configurator.loadAdditionalConf(documentStore.confs)['finally'](launch);
        } else {
          launch();
        }
      }
    };
    function noRetrievers() {
      return Object.keys(tokenRetrievers).length === 0;
    }

    function declarePreselections(ids) {
      var chunkId = getChunkParam();
      if (chunkId) {
        var paddedIds = arethusaUtil.map(ids, function(id) {
          return idHandler.padIdWithSId(id, chunkId);
        });
        selectMultipleTokens(paddedIds);
      }
    }
    function moveToSentence() {
      var id = getChunkParam();
      if (id) {
        if (navigator.goTo(id)) {
          return;
        }
      }
      // If goTo failed, we just update the id with the starting value 0
      navigator.updateId();
    }
    function getChunkParam() {
      var param = self.conf.chunkParam;
      if (param) return locator.get(param);
    }

    /**
     * @ngdoc function
     * @name arethusa.core.state#retrieveTokens
     * @methodOf arethusa.core.state
     *
     * @description
     * Tries to iterate over all available retrievers and gets documents
     * from them.
     *
     */
    function retrieveTokens() {
      //var container = {};
      navigator.reset();
      self.deselectAll();

      if (noRetrievers()) {
        self.checkLoadStatus();
        return;
      }

      angular.forEach(tokenRetrievers, function (retriever, name) {
        retriever.get(onSuccessfulRetrievalFn(retriever));
      });
      //tokens = container;
    }
    /**
     * @ngdoc function
     * @name arethusa.core.state#asString
     * @methodOf arethusa.core.state
     *
     * @description
     * Controlled access to the string of a token.
     *
     * @param {String} id Id of a token
     * @returns {String} The token string
     */
    this.asString = function (id) {
      return (self.getToken(id) || {}).string;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#getToken
     * @methodOf arethusa.core.state
     *
     * @description
     * Retrieves a Token object by id. Use this instead of accessing
     * {@link arethusa.core.state#properties_tokens state.tokens} directly.
     *
     * @param {String} id Id of a token
     * @returns {Token} A Token object
     */
    this.getToken = function (id) {
      return self.tokens[id] || {};
    };

// selection stuff
    /**
     * @ngdoc property
     * @name selectedTokens
     * @propertyOf arethusa.core.state
     *
     * @description
     * Stores the currently selected tokens
     *
     * A dictionary of `ids` and their `selectionType`,
     * which is either `hover`, `click` or `ctrl-click` (which
     * indicates a multi-selection).
     */
    this.selectedTokens = {};
    /**
     * @ngdoc property
     * @name clickedTokens
     * @propertyOf arethusa.core.state
     *
     * @description
     * Store of the currently clicked tokens
     *
     * Differs from {@link arethusa.core.state#properties_selectedTokens}
     * as no `hover` selections are recorded.
     *
     * TODO Need to expose the tokens directly here as values. Document
     * this behavior then.
     */
    this.clickedTokens  = {};
    /**
     * @ngdoc function
     * @name arethusa.core.state#hasSelections
     * @methodOf arethusa.core.state
     *
     * @description
     *
     * @returns {Integer} Number of selected tokens - 0 is a falsy value.
     */
    this.hasSelections = function() {
      return Object.keys(self.selectedTokens).length !== 0;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#hasClickSelections
     * @methodOf arethusa.core.state
     *
     * @description
     * @returns {Integer} Number of clicked tokens - 0 is a falsy value.
     */
    this.hasClickSelections = function() {
      return Object.keys(self.clickedTokens).length;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#isSelected
     * @methodOf arethusa.core.state
     *
     * @param {String} id Id of a token
     * @returns {Boolean} Whether a token is selected or not
     */
    this.isSelected = function(id) {
      return id in this.selectedTokens;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#isClicked
     * @methodOf arethusa.core.state
     *
     * @param {String} id Id of a token
     * @returns {Boolean} Whether a token is clicked or not
     */
    this.isClicked = function(id) {
      return id in this.clickedTokens;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#multiSelect
     * @methodOf arethusa.core.state
     *
     * @description
     * Function to multi-select tokens efficiently
     *
     * @param {Array} ids Array token ids which should be multi-selected
     */
    this.multiSelect = function(ids) {
      self.deselectAll();
      selectMultipleTokens(ids);
    };
    function selectMultipleTokens(ids) {
      angular.forEach(ids, function (id, i) {
        self.selectToken(id, 'ctrl-click');
      });
    }
    function isSelectable(oldVal, newVal) {
      // if an element was hovered, we only select it when another
      // selection type is present (such as 'click'), if there was
      // no selection at all (oldVal === undefined), we select too
      return oldVal === 'hover' && newVal !== 'hover' || !oldVal;
    }
    // type should be either 'click', 'ctrl-click' or 'hover'
    var simpleToMultiSelect;
    /**
     * @ngdoc function
     * @name arethusa.core.state#selectToken
     * @methodOf arethusa.core.state
     *
     * @description
     * Function to select a token in a controlled way
     *
     * @param {String} id Id of a token
     * @param {String} type The selection type. Either `hover`, `click` or
     *   `ctrl-click`
     */
    this.selectToken = function (id, type) {
      if (type === 'click') {
        self.deselectAll();
      }

      if (isSelectable(self.selectionType(id), type)) {
        self.selectedTokens[id] = type;
        if (type !== 'hover') {
          self.clickedTokens[id] = type;
        }
        // If a token is selected by a simple click and the next one is
        // selected by a ctrl-click, we want to transform the first click
        // type also to ctrl-click, so that deselections through holding
        // down the ctrl-key work properly.
        if (type === 'click') {
          simpleToMultiSelect = function() {
            self.selectedTokens[id] = self.clickedTokens[id] = 'ctrl-click';
          };
        }
        if (type === 'ctrl-click' && simpleToMultiSelect) {
          simpleToMultiSelect();
          simpleToMultiSelect = undefined;
        }
      }
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#selectionType
     * @methodOf arethusa.core.state
     *
     * @param {String} id Id of a token
     * @returns {String} The current selection type. Either `hover`, `click`
     *   or `ctrl-click`. Returns `undefined` when the token is not selected
     *   at atll.
     */
    this.selectionType = function (id) {
      return self.selectedTokens[id];
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#deselectToken
     * @methodOf arethusa.core.state
     *
     * @description
     * Function to deselect a token in a controlled way
     *
     * @param {String} id Id of a token
     * @param {String} type The selection type. This is important to
     *   determine whether a token can really be deselected at this point,
     *   e.g. a deselect call for a `hover` selection shall not deselect a
     *   token that was `click`ed.
     */
    this.deselectToken = function (id, type) {
      // only deselect when the old selection type is the same as
      // the argument, i.e. a hover selection can only deselect a
      // hover selection, but not a click selection
      if (self.selectionType(id) === type) {
        delete self.selectedTokens[id];
        delete self.clickedTokens[id];
      }
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#toggleSelection
     * @methodOf arethusa.core.state
     *
     * @description
     * Toggle the selection state of a token
     *
     * Either calls {@link arethusa.core.state#methods_selectToken} or
     * {@link arethusa.core.state#methods_deselectToken}
     *
     * @param {String} id Id of a token
     * @param {String} type The selection type to toggle
     */
    this.toggleSelection = function (id, type) {
      // only deselect when the selectionType is the same.
      // a hovered selection can still be selected by click.
      if (this.isSelected(id) && this.selectionType(id) == type) {
        this.deselectToken(id, type);
      } else {
        this.selectToken(id, type);
      }
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#deselectAll
     * @methodOf arethusa.core.state
     *
     * @description
     * Function to deselct all tokens, no matter their selection type.
     */
    this.deselectAll = function () {
      simpleToMultiSelect = undefined;
      for (var el in self.selectedTokens) {
        delete self.selectedTokens[el];
        delete self.clickedTokens[el];
      }
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#firstSelected
     * @methodOf arethusa.core.state
     *
     * @returns {Token} The first selected token of the current chunk.
     *   Returns `undefined` when no selection is present.
     */
    this.firstSelected = function() {
      return Object.keys(self.selectedTokens)[0];
    };
    function selectSurroundingToken(direction) {
      // take the first current selection
      var firstId = self.firstSelected();
      var allIds = Object.keys(self.tokens);
      var index = allIds.indexOf(firstId);
      // select newId - make a roundtrip if we reached the bounds of the array
      var newId;
      switch (direction) {
      case 'next':
        newId = allIds[index + 1] || allIds[0];
        break;
      case 'prev':
        newId = allIds[index - 1] || allIds[allIds.length - 1];
        break;
      }
      // deselect all previously selected tokens
      self.deselectAll();
      // and select the new one
      self.selectToken(newId, 'click');
    }
    this.selectNextToken = function () {
      selectSurroundingToken('next');
    };
    this.selectPrevToken = function () {
      selectSurroundingToken('prev');
    };

// tokens stuff
    this.toTokenStrings = function(ids) {
      var nonSequentials = idHandler.nonSequentialIds(ids);
      var res = [];
      angular.forEach(ids, function(id, i) {
        res.push(self.asString(id));
        if (nonSequentials[i]) res.push('...');
      });
      return res.join(' ');
    };
    this.addToken = function(token, id) {
      self.tokens[id] = token;
      addStatus(token);
      navigator.addToken(token);
      self.countTotalTokens();
      self.broadcast('tokenAdded', token);
    };
    this.removeToken = function(id) {
      var token = self.getToken(id);
      // We translate this a little later - waiting for a pending
      // change in the translator which allows to give context.
      var msg = 'Do you really want to remove ' + token.string + '?';
      confirmationDialog.ask(msg).then((function() {
        // broadcast before we actually delete, in case a plugin needs access
        // during the cleanup process
        self.doBatched(function() {
          self.broadcast('tokenRemoved', token);
          delete self.tokens[id];
        });
        navigator.removeToken(token);
        idHandler.unassignSourceId(token);
        notifier.success(token.string + ' removed!');
        self.deselectAll();
        self.countTotalTokens();
      }));
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#countTotalTokens
     * @methodOf arethusa.core.state
     *
     * @description
     * Counts the total number of currently present tokens
     *
     * @returns {Integer} Number of tokens
     */
    this.countTotalTokens = function () {
      self.totalTokens = Object.keys(self.tokens).length;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#countTokens
     * @methodOf arethusa.core.state
     *
     * @description
     * Counts the number of currently present tokens, for which
     * a given function returns a truthy value.
     *
     * @param {Function} condition A function that takes a token. Has to
     *   return a truthy or falsy value
     * @returns {Integer} Number of tokens for which the condition is truthy
     */
    this.countTokens = function (conditionFn) {
      var count = 0;
      angular.forEach(self.tokens, function (token, id) {
        if (conditionFn(token)) {
          count++;
        }
      });
      return count;
    };

    // DEPRECATED
    this.setState = function (id, category, val) {
      logger.log('state.setState is DEPRECATED. Use state.change() instead.');
      var token = self.tokens[id];
      // We're covering up for diffs - review is the only plugin still using
      // this - of artificialTokens, where ids might not match.
      if (!token) return;
      var oldVal = token[category];
      token[category] = val;
    };
    this.unsetState = function (id, category) {
      var token = self.tokens[id];
      var oldVal = token[category];
      delete token[category];
    };
    this.replaceState = function (tokens, keepSelections) {
      // We have to wrap this as there might be watchers on allLoaded,
      // such as the MainCtrl which has to reinit all plugins when the
      // state tokens are replaced
      if (!keepSelections) self.deselectAll();
      self.tokens = tokens;
      if (self.launched) self.broadcast('stateLoaded');
    };

// style stuff
    /**
     * @ngdoc function
     * @name arethusa.core.state#setStyle
     * @methodOf arethusa.core.state
     *
     * @description
     * Sets the style of a token. When the token already has a styling,
     * this function will override all former information.
     *
     * @param {String} id Id of a token
     * @param {Object} style Dictionary of CSS styles, e.g.
     *   `{ color: 'red' }`
     */
    this.setStyle = function (id, style) {
      self.getToken(id).style = style;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#unsetStyle
     * @methodOf arethusa.core.state
     *
     * @description
     * Removes all styling information of a token
     *
     * @param {String} id Id of a token
     */
    this.unsetStyle = function (id) {
      self.getToken(id).style = {};
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#addStyle
     * @methodOf arethusa.core.state
     *
     * @description
     * Adds style information to a token. Already set stylings are not
     * overriden, but merging rules apply.
     *
     * Given a current token style of
     *
     * ```
     * {
     *   'color': 'blue',
     *   'font-style': 'italic'
     * }
     * ```
     *
     * calling
     *
     * ```
     * state.addStyle(id, {
     *   'color': 'red',
     *   'text-decoration': 'underline'
     * });
     * ```
     *
     * will result in a token style of
     *
     * ```
     * {
     *   'color': 'red',
     *   'font-style': 'italic'
     *   'text-decoration': 'underline'
     * }
     *
     * @param {String} id Id of a token
     * @param {Object} style Dictionary of CSS styles, e.g.
     *   `{ color: 'red' }`
     */
    this.addStyle = function(id, style) {
      var token = self.getToken(id);
      if (!token.style) {
        token.style = {};
      }
      angular.extend(token.style, style);
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#removeStyle
     * @methodOf arethusa.core.state
     *
     * @description
     * Removes one or several stylings of a token
     *
     * @param {String} id Id of a token
     * @param {String|Array} style Either a single CSS property or an
     *   Array of CSS properties to remove from the token's styling
     */
    this.removeStyle = function(id, style) {
      var tokenStyle = self.getToken(id).style;
      if (! tokenStyle) return;

      var styles = arethusaUtil.toAry(style);
      angular.forEach(styles, function(style, i) {
        delete tokenStyle[style];
      });
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#unapplyStylings
     * @methodOf arethusa.core.state
     *
     * @description
     * Remove stylings of all current
     * {@link arethusa.core.state#properties_tokens tokens}
     */
    this.unapplyStylings = function() {
      angular.forEach(self.tokens, function(token, id) {
        self.unsetStyle(id);
      });
    };

    this.addStatusObjects = function () {
      angular.forEach(self.tokens, addStatus);
    };
    function addStatus(token) {
      if (! token.status) {
        token.status = {};
      }
    }

    //
    this.lazyChange = function(tokenOrId, property, newVal, undoFn, preExecFn) {
      return new StateChange(self, tokenOrId, property, newVal, undoFn, preExecFn);
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#change
     * @methodOf arethusa.core.state
     *
     * @description
     * Sets the property of a token to a new value.
     *
     * **ALWAYS** use this function when you want to make changes to a `token`.
     * While it is possible to access all properties of a `token` - and therefore
     * also the assign them to a new value - you should **NEVER** do this manually.
     *
     * By using this function you guarantee a proper event flow. The change itself
     * is done through an {@link arethusa.core.StateChange StateChange} object,
     * which notifies all listeners registered through {@link arethusa.core.state#methods_watch state.watch}
     * and also broadcasts a `tokenChange` event.
     *
     * Communicates with {@link arethusa.core.globalSettings#method_shouldDeselect globalSettings.shouldDeselect}
     * to determine whether all selections should be negated or not.
     *
     * @param {Token|String} tokenOrId Token or the id of a token to execute a
     *   change on
     * @param {String} property Path to the property which needs to be changed,
     *   e.g. `'head.id'`
     * @param {*} newVal The new value set during this change
     * @param {Function} [undoFn] Optional custom function to undo the change.
     *   Defaults to a simple inversion - i.e. setting the `property` back to
     *   the old value.
     * @param {Function} [preExecFn] Optional function to be executed right
     *   before a change is happening, i.e. the `property` is set to the `newVal`
     *   during the execution of {@link arethusa.core.StateChange StateChange}.exec
     *
     * @returns {StateChange} Returns a {@link arethusa.core.StateChange StateChange}
     *   event object
     *
     */
    this.change = function(tokenOrId, property, newVal, undoFn, preExecFn) {
      var event = self.lazyChange(tokenOrId, property, newVal, undoFn, preExecFn);
      if (globalSettings.shouldDeselect(property)) self.deselectAll();
      return event.exec();
    };


// event stuff
    var changeWatchers = { '*' : [] };
    /**
     * @ngdoc function
     * @name arethusa.core.state#notifyWatchers
     * @methodOf arethusa.core.state
     *
     * @description
     * Triggers all callbacks of listeners registerd through
     * {@link arethusa.core.state#methods_watch state.watch}.
     *
     * Which listeners are triggered is determined by the given event.
     *
     * This function is usually not meant to be triggered manually - a
     * {@link arethusa.core.StateChange StateChange}'s `exec` function
     * will do this automatically.
     *
     * @param {StateChange} event A {@link arethusa.core.StateChange StateChange}
     *   event object
     */
    this.notifyWatchers = function(event) {
      function execWatch(watch) { watch.exec(event.newVal, event.oldVal, event); }

      var watchers = changeWatchers[event.property] || [];

      angular.forEach(watchers, execWatch);
      angular.forEach(changeWatchers['*'], execWatch);
    };
    function EventWatch(event, fn, destroyFn, watchers) {
      var self = this;
      this.event = event;
      this.exec = fn;
      this.destroy = function() {
        if (destroyFn) destroyFn();
        watchers.splice(watchers.indexOf(self), 1);
      };
    }
    /**
     * @ngdoc function
     * @name arethusa.core.state#watch
     * @methodOf arethusa.core.state
     *
     * @description
     * Registers a `listener` callback executed whenever a
     * {@link arethusa.core.state#methods_change state.change} with a matching
     * event is called.
     *
     * @param {String} event Name of the change event to listen to - meant to
     *   be the path of a property on a token object (e.g. `'head.id'`).
     *
     *   The special param `'*'` can be passed to listen to all change events.
     *
     * @param {Function} fn Callback to be executed when a change has happened.
     *
     *   Three arguments are passed to this function
     *
     *   1. the new value
     *   2. the old value
     *   3. a {@link arethusa.core.StateChange StateChange} event object
     *
     * @param {Function} [destroyFn] Optional callback executed when the
     *   listener is deregistered.
     *
     * @returns {Function} Deregisters the listener when executed.
     *
     */
    this.watch = function(event, fn, destroyFn) {
      var watchers = changeWatchers[event];
      if (!watchers) watchers = changeWatchers[event] = [];
      var watch = new EventWatch(event, fn, destroyFn, watchers);
      watchers.push(watch);
      return watch.destroy;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#on
     * @methodOf arethusa.core.state
     *
     * @description
     * Delegates to `$rootScope.$on`. This is convenient when a plugin
     * needs to send such an event, without a having to inject `$rootScope`
     * directly.
     *
     * @param {String} event The eventname
     * @param {Function} fn Callback function
     *
     */
    this.on = function(event, fn) {
      $rootScope.$on(event, fn);
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#broadcast
     * @methodOf arethusa.core.state
     *
     * @description
     * Delegates to `$rootScope.$broadcast`. This is convenient when a plugin
     * needs to send such an event, without a having to inject `$rootScope`
     * directly.
     *
     * @param {String} event The eventname
     * @param {*} [arg] Optional argument transmitted alongside the event
     */
    this.broadcast = function(event, arg) {
       // broadcast here iterates through all 
       // handlers which have registered a listener
       // on the broadcasted event and executes them
       // before returning
      $rootScope.$broadcast(event, arg);
    };

// do stuff
    /**
     * @ngdoc function
     * @name arethusa.core.state#doSilent
     * @methodOf arethusa.core.state
     *
     * @description
     * Calls a function in `silent` mode. No events are broadcasted and no
     * listeners notified upon changes (typically firing through a call of
     * {@link arethusa.core.state#methods_change state.change}) made during it.
     *
     * @param {Function} fn Function to call during `silent` mode
     *
     */
    this.doSilent = function(fn) {
      self.silent = true;
      fn();
      self.silent = false;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#doBatched
     * @methodOf arethusa.core.state
     *
     * @description
     * Calls a function in `batchChange` mode. All change events (typically
     * done through {@link arethusa.core.state#methods_change state.change}) firing
     * during this mode will be collected and broadcasted as a single event.
     *
     * This is especially helpful when we want to undo a multi-change action in
     * a single step.
     *
     * @param {Function} fn Function to call during `batchChange` mode
     *
     */
    this.doBatched = function(fn) {
      self.batchChangeStart();
      fn();
      self.batchChangeStop();
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#batchChangeStart
     * @methodOf arethusa.core.state
     *
     * @description
     * Activates `batchChange` mode.
     *
     * Typically called during the execution of {@link arethusa.core.state#methods_doBatched state.doBatched}.
     *
     */
    this.batchChangeStart = function() {
      self.batchChange = true;
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#batchChangeStop
     * @methodOf arethusa.core.state
     *
     * @description
     * Deactivates `batchChange` mode and broadcasts the `batchChangeStop` event.
     *
     * Typically called during the execution of {@link arethusa.core.state#methods_doBatched state.doBatched}.
     *
     */
    this.batchChangeStop = function() {
      self.batchChange = false;
      self.broadcast('batchChangeStop');
    };

// init stuff
    function configure() {
      self.conf = configurator.configurationFor('main');
      tokenRetrievers = configurator.getRetrievers(self.conf.retrievers);

      // We start silent - during init we don't want to track events
      self.silent = true;

      // Listeners to changes might be interested in recording several
      // little changes as one single step. Plugins can look at this var
      // so that they can adjust accordingly.
      self.batchChange = false;

      // Cheap way of defining a debug mode
      self.debug = self.conf.debug;

      self.initServices();

      self.activeKeys = {};
      var keys = keyCapture.initCaptures(function(kC) {
        return {
          selections: [
            kC.create('nextToken', function() { kC.doRepeated(self.selectNextToken); }, 'w'),
            kC.create('prevToken', function() { kC.doRepeated(self.selectPrevToken); }, 'e'),
            kC.create('deselect', self.deselectAll, 'esc'),
            kC.create('deselect-alternative', self.deselectAll, '↵')
          ]
        };
      });
      angular.extend(self.activeKeys, keys.selections);
    }
    // Exposed for easier testing
    this.initServices = function() {
      navigator.init();
      globalSettings.init();
    };
    /**
     * @ngdoc function
     * @name arethusa.core.state#init
     * @methodOf arethusa.core.state
     *
     * @description
     * Configures the service and starts the document retrieval process.
     *
     */
    this.init = function () {
      configure();
      retrieveDocuments(self.conf.resolver);
    };
    this.postInit = function () {
      self.addStatusObjects();
      self.countTotalTokens();
    };
  }
]);

"use strict";

/**
 * @ngdoc service
 * @name arethusa.core.userPreferences
 *
 * @description
 * Provides an API to get and set user preferences.
 *
 * @requires arethusa.core.globalSettings
 * @requires arethusa.core.arethusaLocalStorage
 */
angular.module('arethusa.core').service('userPreferences', [
  'globalSettings',
  'arethusaLocalStorage',
  function(globalSettings, arethusaLocalStorage) {
    var self = this;


    var localStorageKey = 'preferences';

    function key(k) {
      return localStorageKey + '.' + k;
    }

    function set(plugin, setting, value) {
      arethusaLocalStorage.set(key(plugin + '.' + setting), value);
    }

    function get(plugin, setting) {
      return arethusaLocalStorage.get(key(plugin + '.' + setting));
    }

    /**
     * @ngdoc function
     * @name arethusa.core.userPreferences#set
     * @methodOf arethusa.core.userPreferences
     *
     * @param {String} category Category under which the preference is stored,
     *   often the name of a plugin
     * @param {String} property Property name of the preference
     * @param {*} value The new preference
     */
    this.set = function(plugin, setting, value) {
      if (globalSettings.persistSettings) {
        set(plugin, setting, value);
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.core.userPreferences#get
     * @methodOf arethusa.core.userPreferences
     *
     * @param {String} category Category under which the preference is stored,
     *   often the name of a plugin
     * @param {String} property Property name of the preference
     *
     * @returns {*} A user preference
     */
    this.get = get;
  }
]);

"use strict";

angular.module('arethusa.core').service('versioner', [
  'VERSION',
  function(VERSION) {
    var self = this;

    function gitTree(path) {
      return self.repository + '/tree/' + path;
    }

    angular.extend(this, VERSION);
    this.commitUrl = gitTree(VERSION.revision);
    this.branchUrl = gitTree(VERSION.branch);
  }
]);

"use strict";

angular.module('arethusa.core').value('duScrollEasing', function(t) {
  // cubic in and out
  return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
});

"use strict";

/**
 * @ngdoc object
 * @name arethusa.core.LOCALES
 *
 * @description
 * This constant is used to grant access to different localizations
 * of the Arethusa interface.
 *
 * We plan to at least support the following in the future:
 *
 * - de
 * - en
 * - es
 * - fa
 * - fr
 * - hr
 * - it
 * - pt
 *
 * Steps to add a new locale are as follows:
 * 1. add the file named per the iso locale code to dist/i18n
 * 2. add the iso locale code to this constant
 * 3. add a flags css style to _images.scss to represent the flag
 *    on the navbar
 *
 * For the flags css, we use base64 encoded urls, which can be created
 * by using an online converter e.g. like
 * http://www.greywyvern.com/code/php/binary2base64
 *
 * Flag source for most countries is from
 * http://l10n.xwiki.org/xwiki/bin/view/L10N/Flags (but this is missing some)
**/
angular.module('arethusa.core').constant('LOCALES', [
  'en',
  'de',
  'fr',
  'hr',
  'pt_BR',
  'ka',
  'bg'
]);

angular.module('arethusa.core').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('js/arethusa.core/templates/arethusa_grid_handle.html',
    "<div class=\"drag-handle-trigger\">\n" +
    "  <div class=\"drag-handle fade\" ng-show=\"visible\">\n" +
    "    <div class=\"drag-handle\">\n" +
    "      <span>{{ item.plugin }}</span>\n" +
    "      <span ng-show=\"plugin.settings\" settings-trigger=\"right\"/>\n" +
    "      <div ng-if=\"settingsOn\"\n" +
    "        style=\"padding: .3rem 1rem; text-align: right\"\n" +
    "        class=\"fade\">\n" +
    "        <div\n" +
    "          ng-repeat=\"setting in plugin.settings\">\n" +
    "          <div ng-if=\"setting.directive\" dynamic-directive=\"{{ setting.directive }}\"/>\n" +
    "          <div ng-if=\"!setting.directive\" plugin-setting/>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/arethusa_grid.html',
    "<div gridster=\"grid.options\">\n" +
    "  <ul>\n" +
    "    <li\n" +
    "      gridster-item=\"item\"\n" +
    "      ng-style=\"item.style\"\n" +
    "      ng-repeat=\"item in grid.items track by item.plugin\">\n" +
    "      <arethusa-grid-handle>Handle</arethusa-grid-handle>\n" +
    "      <plugin name=\"{{ item.plugin }}\"></plugin>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/arethusa_tabs.html',
    "<tabset class=\"arethusa-tabs\">\n" +
    "  <tab\n" +
    "    ng-repeat=\"pl in visibleTabs\"\n" +
    "    select=\"plugins.setActive(pl)\"\n" +
    "    heading=\"{{ pl.displayName }}\"\n" +
    "    active=\"plugins.isSelected(pl)\">\n" +
    "    <plugin\n" +
    "      name=\"{{ pl.name }}\"\n" +
    "      with-settings=\"true\"\n" +
    "      ng-if=\"plugins.isActive(pl)\">\n" +
    "    </plugin>\n" +
    "  </tab>\n" +
    "  <tab ng-if=\"showSettingsTab\">\n" +
    "    <tab-heading>\n" +
    "      <i class=\"fi-widget rotate-on-hover\"></i>\n" +
    "    </tab-heading>\n" +
    "\n" +
    "    <div class=\"arethusa-tabs-settings-tab\">\n" +
    "      <p translate=\"tabs.helpText\"></p>\n" +
    "\n" +
    "      <ul dnd-list=\"list\">\n" +
    "        <li ng-repeat=\"item in list\"\n" +
    "          dnd-draggable=\"item\"\n" +
    "          dnd-moved=\"moveTab($index, event)\"\n" +
    "          dnd-effect-allowed=\"move\"\n" +
    "          dnd-selected=\"toggleTab(item)\"\n" +
    "          ng-class=\"{ deactivated: !isActive(item) }\">\n" +
    "          {{ item.label }}\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </tab>\n" +
    "</tabset>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/arethusa_user.html',
    "<span>\n" +
    "  <a ng-href=\"{{ user.page }}\" target=\"_blank\">{{ name }}</a>\n" +
    "</span>\n" +
    "<span ng-if=\"withMail && user.mail\" style=\"margin-left: .5rem\">\n" +
    "  <a ng-href=\"mailto:{{ user.mail }}\">\n" +
    "    <i class=\"fi-mail\"></i>\n" +
    "  </a>\n" +
    "</span>\n"
  );


  $templateCache.put('js/arethusa.core/templates/chunk_mode_switcher.html',
    "<div>\n" +
    "  <label>\n" +
    "    <span translate=\"globalSettings.chunkMode\"/>\n" +
    "    <select\n" +
    "      style=\"width: 8rem\"\n" +
    "      class=\"compact\"\n" +
    "      ng-model=\"navi.chunkMode\"\n" +
    "      ng-change=\"navi.applyChunkMode()\"\n" +
    "      ng-options=\"mode as mode for mode in navi.chunkModes\">\n" +
    "    </select>\n" +
    "\n" +
    "    <form ng-submit=\"tryToSetChunkSize()\" style=\"display: inline-block\">\n" +
    "      <input\n" +
    "        style=\"width: 2rem\"\n" +
    "        class=\"compact\"\n" +
    "        type=\"text\" ng-model=\"size\"/>\n" +
    "    </form>\n" +
    "  </label>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/collected_plugin_settings.html',
    "<table class=\"plugin-settings\">\n" +
    "  <tr ng-repeat=\"plugin in plugins.all\" ng-if=\"plugin.settings\">\n" +
    "    <td class=\"name\">{{ plugin.displayName }}</td>\n" +
    "    <td ng-repeat=\"setting in plugin.settings\">\n" +
    "      <span ng-if=\"setting.directive\" dynamic-directive=\"{{ setting.directive }}\"/>\n" +
    "      <span ng-if=\"!setting.directive\" plugin-setting/>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "</table>\n"
  );


  $templateCache.put('js/arethusa.core/templates/colorizer_setting.html',
    "<label>\n" +
    "  <span translate=\"{{ setting.label }}\"/>\n" +
    "  <select\n" +
    "    style=\"width: 8rem\"\n" +
    "    class=\"compact\"\n" +
    "    ng-model=\"gS[setting.property]\"\n" +
    "    ng-change=\"gS.applyColorizer()\"\n" +
    "    ng-options=\"k as k for (k, v) in gS.colorizers\">\n" +
    "  </select>\n" +
    "</label>\n"
  );


  $templateCache.put('js/arethusa.core/templates/confirmation_dialog.html',
    "<div class=\"center\">\n" +
    "  <p class=\"italic bold \">\n" +
    "    {{ message }}\n" +
    "  </p>\n" +
    "  <div>\n" +
    "    <span\n" +
    "      ng-click=\"$close()\"\n" +
    "      class=\"button success success\"\n" +
    "      close-on-enter\n" +
    "      translate=\"yes\">\n" +
    "    </span>\n" +
    "    <span\n" +
    "      ng-click=\"$dismiss()\"\n" +
    "      class=\"button success alert\"\n" +
    "      translate=\"no\">\n" +
    "    </span>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/editors.html',
    "<ul ng-if=\"editors.editorsPresent\" class=\"no-list\">\n" +
    "  <li ng-repeat=\"(doc, users) in editors.perDocument\">\n" +
    "     <strong>{{ doc }}</strong>\n" +
    "     <ul class=\"no-list\">\n" +
    "       <li ng-repeat=\"user in users\">\n" +
    "          <div arethusa-user=\"user\" with-mail=\"true\"/>\n" +
    "       </li>\n" +
    "     </ul>\n" +
    "  </li>\n" +
    "</ul>\n" +
    "\n" +
    "<div ng-if=\"!editors.editorsPresent\" translate=\"editors.noEditorsPresent\"/>\n"
  );


  $templateCache.put('js/arethusa.core/templates/error_dialog.html',
    "<div class=\"center\">\n" +
    "  <p class=\"italic bold \">\n" +
    "    {{ message }}\n" +
    "  </p>\n" +
    "  <p class=\"error-modal-sendhint\" translate=\"errorDialog.sendHint\"/>\n" +
    "  <pre class=\"overflow-wrap-word\">\n" +
    "    {{ trace }}\n" +
    "  </pre>\n" +
    "  <div uservoice-embed target=\"error-uv-embedded\" class=\"error-modal\">\n" +
    "    <div class=\"error-uv-embedded\"></div>\n" +
    "  </div>\n" +
    "  <div class=\"center\">\n" +
    "    <span\n" +
    "      ng-click=\"$dismiss()\"\n" +
    "      class=\"button success alert\"\n" +
    "      translate=\"errorDialog.close\">\n" +
    "    </span>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/foreign_keys_help.html',
    "<div ng-if=\"visible\">\n" +
    "  <ul id=\"keyboard\">\n" +
    "    <li ng-repeat=\"key in keys\"\n" +
    "      id=\"{{ key.lower }}\"\n" +
    "      ng-click=\"generate(key.lower)\"\n" +
    "      ng-class=\"key.style.class\"\n" +
    "      class=\"keyboard-key\">\n" +
    "      <span ng-repeat=\"char in key.show\"\n" +
    "        class=\"shifted-{{$index}}\"\n" +
    "        ng-class=\"key.style.class[{{$index}}]\">{{ char }}</span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <div delimiter/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/global_click_action.html',
    "<label>\n" +
    "  <span translate=\"{{ setting.label }}\"/>\n" +
    "  <select\n" +
    "    style=\"width: 8rem\"\n" +
    "    class=\"compact\"\n" +
    "    ng-model=\"gS[setting.property]\"\n" +
    "    ng-change=\"gS.setClickAction(gS[setting.property])\"\n" +
    "    ng-options=\"k as k for (k, v) in gS.clickActions\">\n" +
    "  </select>\n" +
    "</label>\n"
  );


  $templateCache.put('js/arethusa.core/templates/global_settings_panel.html',
    "<div ng-if=\"active\" class=\"fade\">\n" +
    "  <p class=\"text\" translate=\"globalSettings.title\"/>\n" +
    "  <div class=\"small-12 columns scrollable text\">\n" +
    "    <ul class=\"no-list in-columns\" style=\"height: 240px\">\n" +
    "      <li\n" +
    "        class=\"fade\"\n" +
    "        ng-repeat=\"name in gS.settings | keys\"\n" +
    "        ng-init=\"setting = gS.settings[name]\">\n" +
    "        <div ng-switch=\"setting.type\">\n" +
    "          <div\n" +
    "            ng-switch-when=\"custom\"\n" +
    "            dynamic-directive=\"{{ setting.directive }}\"/>\n" +
    "          <div ng-switch-default>\n" +
    "            <input\n" +
    "              type=\"{{ setting.type }}\"\n" +
    "              ng-change=\"gS.propagateSetting(setting.property)\"\n" +
    "              ng-model=\"gS[setting.property]\"/>\n" +
    "            <label>\n" +
    "              <span translate=\"{{ setting.label }}\"/>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div\n" +
    "      ng-click=\"togglePluginSettings()\"\n" +
    "      translate=\"globalSettings.pluginSettings\"\n" +
    "      class=\"underline clickable\">\n" +
    "    </div>\n" +
    "\n" +
    "    <div\n" +
    "      class=\"fade\"\n" +
    "      ng-if=\"pluginSettingsVisible\"\n" +
    "      collected-plugin-settings>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/grid_items.html',
    "<br/>\n" +
    "<div>\n" +
    "  <p class=\"text\">\n" +
    "    <span>Grid</span>\n" +
    "    <span translate=\"items\"></span>\n" +
    "  </p>\n" +
    "  <ul class=\"no-list in-columns\">\n" +
    "    <li ng-repeat=\"(name, status) in grid.itemList\">\n" +
    "      <input\n" +
    "        style=\"margin-bottom: 0.3rem\"\n" +
    "        type=\"checkbox\"\n" +
    "        ng-change=\"grid.toggleItem(name)\"\n" +
    "        ng-model=\"grid.itemList[name]\"/>\n" +
    "      <label>\n" +
    "        {{ name }}\n" +
    "      </label>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/grid_setting.html',
    "<div style=\"display: inline-block\">\n" +
    "  <p class=\"text\">\n" +
    "    <span>Grid</span>\n" +
    "    <span translate=\"settings\"></span>\n" +
    "  </p>\n" +
    "  <ul class=\"no-list\">\n" +
    "    <li ng-repeat=\"(key, value) in settings\">\n" +
    "      <input\n" +
    "        type=\"checkbox\"\n" +
    "        ng-model=\"settings[key]\"/>\n" +
    "      <label>\n" +
    "        <span translate=\"grid.{{ key }}\"/>\n" +
    "      </label>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/help_panel_item.html',
    "<div delimiter/>\n" +
    "<div class=\"text\">\n" +
    "  <div help-panel-heading toggler=\"{{ toggler }}\" heading=\"{{ heading }}\"/>\n" +
    "  <div\n" +
    "    class=\"small-12 columns scrollable slider\"\n" +
    "    style=\"height: {{ height }}\"\n" +
    "    ng-if=\"visible[toggler]\"\n" +
    "    ng-transclude>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/help_panel.html',
    "<div ng-if=\"active\" class=\"fade small-12-columns\">\n" +
    "  <div class=\"small-6 large-6 columns\">\n" +
    "    <div help-panel-item toggler=\"colors\" heading=\"helpPanel.colorLegends\" height=\"400px\">\n" +
    "      <ul class=\"no-list\" ng-repeat=\"(name, values) in gS.colorMaps()\">\n" +
    "        <li\n" +
    "          ng-class=\"{ 'active-colorizer': name === gS.colorizer }\">\n" +
    "          {{ name }}\n" +
    "        </li>\n" +
    "        <ul class=\"no-list\" ng-repeat=\"map in values.maps\">\n" +
    "          <li>\n" +
    "            {{ map.label }}\n" +
    "            <table class=\"small\">\n" +
    "              <tr>\n" +
    "                <th ng-repeat=\"header in values.header\">\n" +
    "                  <strong>{{ header }}</strong>\n" +
    "                </th>\n" +
    "              </tr>\n" +
    "              <tr ng-repeat=\"(k, col) in map.colors\">\n" +
    "                <td\n" +
    "                  ng-style=\"col\"\n" +
    "                  ng-repeat=\"val in k.split(' || ') track by $index\">\n" +
    "                  {{ val }}\n" +
    "                </td>\n" +
    "              </tr>\n" +
    "            </table>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div help-panel-item toggler=\"messages\" heading=\"messages\" height=\"200px\">\n" +
    "      <ul class=\"no-list\">\n" +
    "        <li ng-repeat=\"message in notifier.messages\">\n" +
    "          <div class=\"notification-list-item\">\n" +
    "            <span class=\"time\">{{ message.time | date: \"HH:mm:ss\" }}</span>\n" +
    "            <span class=\"message toast-{{ message.type }}\">{{ message.message }}</span>\n" +
    "          </div>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div help-panel-item toggler=\"editors\" heading=\"editors.title\" height=\"200px\">\n" +
    "      <div editors/>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"small-6 large-6 columns\">\n" +
    "    <div help-panel-item toggler=\"keys\" heading=\"helpPanel.keyboardShortcuts\" height=\"400px\">\n" +
    "      <ul class=\"no-list\" ng-repeat=\"(section, keys) in kC.activeKeys\">\n" +
    "        <li>{{ section }}</li>\n" +
    "        <table class=\"small\">\n" +
    "          <tr ng-repeat=\"(name, key) in keys\">\n" +
    "            <td><strong>{{ key }}</strong></td><td>{{ name}}</td>\n" +
    "          </tr>\n" +
    "        </table>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div help-panel-item toggler=\"tools\" heading=\"helpPanel.tools\" height=\"50px\">\n" +
    "      <ul class=\"no-list\">\n" +
    "        <li ng-repeat=\"tool in tools\">\n" +
    "          <a ng-href=\"{{ tool.href }}\">{{ tool.label }}</a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div help-panel-item toggler=\"about\" heading=\"helpPanel.about\" height=\"160px\">\n" +
    "      <ul class=\"no-list\">\n" +
    "        <li>\n" +
    "          <table class=\"small\">\n" +
    "            <tr>\n" +
    "              <td translate=\"helpPanel.revision\"/>\n" +
    "              <td>\n" +
    "                <a ng-href=\"{{ vers.commitUrl }}\" target=\"_blank\">\n" +
    "                  {{ vers.revision }}\n" +
    "                </a>\n" +
    "              </td>\n" +
    "            <tr>\n" +
    "            <tr>\n" +
    "              <!--This is untranslated on purpose!-->\n" +
    "              <td>Branch</td>\n" +
    "              <td>\n" +
    "                <a ng-href=\"{{ vers.branchUrl }}\" target=\"_blank\">\n" +
    "                  {{ vers.branch }}\n" +
    "                </a>\n" +
    "              </td>\n" +
    "            <tr>\n" +
    "            <tr>\n" +
    "              <td translate=\"date\"/>\n" +
    "              <td>{{ vers.date | date: 'medium' }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <td translate=\"relocateHandler.title\"/>\n" +
    "              <td relocate/>\n" +
    "            </tr>\n" +
    "          </table>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/keys_to_screen.html',
    "<div id=\"keys-to-screen\">\n" +
    "  <span\n" +
    "    ng-repeat=\"key in keys\"\n" +
    "    class=\"key-to-screen\"\n" +
    "    ng-class=\"{ joiner: key.joiner }\">{{ key.str }}</span>\n" +
    "  <span ng-repeat=\"action in actions\"\n" +
    "    class=\"text italic right action\">\n" +
    "      {{ action.str }}\n" +
    "  </span>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/layout_setting.html',
    "<label>\n" +
    "  <span translate=\"{{ setting.label }}\"/>\n" +
    "  <select\n" +
    "    style=\"width: 8rem\"\n" +
    "    class=\"compact\"\n" +
    "    ng-model=\"gS[setting.property]\"\n" +
    "    ng-change=\"gS.broadcastLayoutChange()\"\n" +
    "    ng-options=\"layout.name for layout in gS.layouts\">\n" +
    "  </select>\n" +
    "</label>\n"
  );


  $templateCache.put('js/arethusa.core/templates/navbar_buttons_collapsed.html',
    "<li><a class=\"button\" saver/></li>\n" +
    "<li><a class=\"button\" hist-undo/></li>\n" +
    "<li><a class=\"button\" hist-redo/></li>\n" +
    "<li>\n" +
    "  <a\n" +
    "    class=\"button\"\n" +
    "    title=\"{{ menuTitle }}\"\n" +
    "    dropdown-toggle=\"#navbar_collapsed_buttons_menu\">\n" +
    "    <i class=\"fi-align-justify\"></i>\n" +
    "  </a>\n" +
    "  <ul id=\"navbar_collapsed_buttons_menu\" class=\"navbar-dropdown\">\n" +
    "    <li><a outputter/></li>\n" +
    "    <li><a sidepanel-folder/></li>\n" +
    "    <li><a uservoice-trigger/></li>\n" +
    "    <li><a help-trigger/></li>\n" +
    "    <li><a global-settings-trigger/></li>\n" +
    "    <li><a translate-language/></li>\n" +
    "    <li><a exit/></li>\n" +
    "  </ul>\n" +
    "</li>\n"
  );


  $templateCache.put('js/arethusa.core/templates/navbar_buttons.html',
    "<li><a class=\"button\" saver/></li>\n" +
    "<li><a class=\"button\" outputter/></li>\n" +
    "<li><a class=\"button\" hist-undo/></li>\n" +
    "<li><a class=\"button\" hist-redo/></li>\n" +
    "<li><a class=\"button\" sidepanel-folder/></li>\n" +
    "<li><a class=\"button\" uservoice-trigger/></li>\n" +
    "<li><a class=\"button\" global-settings-trigger/></li>\n" +
    "<li><a class=\"button\" help-trigger/></li>\n" +
    "<li><a class=\"button\" translate-language/></li>\n" +
    "<li><a class=\"button\" exit/></li>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/navbar_navigation.html',
    "<ul ng-show=\"showNavigation()\" class=\"navbar-navigation\">\n" +
    "  <li>\n" +
    "    <a>{{ navStat.citation }}</a>\n" +
    "  </li>\n" +
    "  <!--The wrapping divs around the a elements are only there for styling - the-->\n" +
    "  <!--foundation topbar gives them a differnet look and feel when they are wrapped.-->\n" +
    "  <li>\n" +
    "    <div>\n" +
    "      <a\n" +
    "        class=\"nav-link\"\n" +
    "        title=\"{{ trsls.goToFirst() }}\"\n" +
    "        ng-click=\"goToFirst()\"\n" +
    "        ng-class=\"{ disabled: !navStat.hasPrev }\">\n" +
    "        <i class=\"fi-previous\"></i>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "  </li>\n" +
    "  <li>\n" +
    "  <div>\n" +
    "    <a\n" +
    "      class=\"nav-link\"\n" +
    "      title=\"{{ trsls.goToPrev(keys) }}\"\n" +
    "      ng-click=\"prev()\"\n" +
    "      ng-class=\"{ disabled: !navStat.hasPrev }\">\n" +
    "      <i class=\"fi-arrow-left\"></i>\n" +
    "    </a>\n" +
    "  </div>\n" +
    "  </li>\n" +
    "  <li>\n" +
    "    <div>\n" +
    "      <ul class=\"navigation\">\n" +
    "        <li>\n" +
    "          <a>\n" +
    "            {{ ids }}\n" +
    "          </a>\n" +
    "          <ul>\n" +
    "            <div class=\"navigation-menu small-12 large-12 columns\">\n" +
    "              <div>\n" +
    "                <form ng-submit=\"goTo(goToLocation)\">\n" +
    "                  <input class=\"inline\" type=\"text\" ng-model=\"goToLocation\"/>\n" +
    "                </form>\n" +
    "              </div>\n" +
    "              <div>\n" +
    "                <a sentence-list translate=\"list\"\n" +
    "                  title=\"{{ trsls.list(keys) }}\"/>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </ul>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </li>\n" +
    "  <li>\n" +
    "    <div>\n" +
    "      <a\n" +
    "        class=\"nav-link\"\n" +
    "        title=\"{{ trsls.goToNext(keys) }}\"\n" +
    "        ng-click=\"next()\"\n" +
    "        ng-class=\"{ disabled: !navStat.hasNext }\">\n" +
    "        <i class=\"fi-arrow-right\"></i>\n" +
    "    </a>\n" +
    "  </div>\n" +
    "  </li>\n" +
    "  <li>\n" +
    "    <div>\n" +
    "      <a\n" +
    "        class=\"nav-link\"\n" +
    "        title=\"{{ trsls.goToLast() }}\"\n" +
    "        ng-click=\"goToLast()\"\n" +
    "        ng-class=\"{ disabled: !navStat.hasNext }\">\n" +
    "        <i class=\"fi-next\"></i>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('js/arethusa.core/templates/navbar_notifier.html',
    "<ul ng-show=\"showNotifier()\">\n" +
    "  <span current-message/>\n" +
    "</ul>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/navbar_search.html',
    "<ul ng-show=\"showSearch()\">\n" +
    "  <li class=\"has-form\">\n" +
    "    <div class=\"row collapse\">\n" +
    "      <div class=\"large-10 small-10 columns\">\n" +
    "        <form ng-submit=\"search()\">\n" +
    "          <input\n" +
    "            type=\"text\"\n" +
    "            ng-model=\"query\"\n" +
    "            placeholder=\"{{ search_documents }}...\">\n" +
    "        </form>\n" +
    "      </div>\n" +
    "      <div class=\"large-2 small-2 columns\">\n" +
    "        <button class=\"alert button expand\" ng-click=\"search()\">\n" +
    "          <i class=\"fi-magnifying-glass\"></i>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('js/arethusa.core/templates/notifications.html',
    "<toaster-container\n" +
    "  toaster-options=\"{\n" +
    "    'close-button': true,\n" +
    "    'position-class': 'toast-bottom-right'\n" +
    "  }\">\n" +
    "</toaster-container>\n"
  );


  $templateCache.put('js/arethusa.core/templates/outputter_item.html',
    "<div>\n" +
    "  <span class=\"italic\">{{ obj.identifier }}</span>\n" +
    "  <span class=\"buttons\">\n" +
    "    <span\n" +
    "      class=\"button radius micro\"\n" +
    "      ng-class=\"{ on: preview }\"\n" +
    "      ng-click=\"togglePreview()\"\n" +
    "      translate=\"preview\">\n" +
    "    </span>\n" +
    "    <span\n" +
    "      class=\"button radius micro\"\n" +
    "      ng-click=\"download()\"\n" +
    "      translate=\"download\">\n" +
    "    </span>\n" +
    "  </span>\n" +
    "</div>\n" +
    "<div delimiter/>\n" +
    "<div ng-if=\"preview\" hljs class=\"preview fade\" source=\"data()\"/>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/outputter.html',
    "<div class=\"outputter\">\n" +
    "  <div outputter-item ng-repeat=\"(name, obj) in saver.outputters\"/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/plugin_setting.html',
    "<label ng-if=\"!setting.directive\" class=\"margined-hor-tiny\">\n" +
    "  {{ setting.label }}\n" +
    "  <input\n" +
    "    type=\"checkbox\"\n" +
    "    style=\"margin: 0\"\n" +
    "    ng-change=\"change()\"\n" +
    "    ng-model=\"plugin[setting.model]\"/>\n" +
    "</label>\n"
  );


  $templateCache.put('js/arethusa.core/templates/plugin_settings.html',
    "<div class=\"small-12 columns\">\n" +
    "  <span settings-trigger=\"right\"/>\n" +
    "  <span ng-show=\"settingsOn\">\n" +
    "    <span ng-repeat=\"setting in plugin.settings\" class=\"right\">\n" +
    "      <span ng-if=\"setting.directive\" dynamic-directive=\"{{ setting.directive }}\"/>\n" +
    "      <span ng-if=\"!setting.directive\" plugin-setting/>\n" +
    "    </span>\n" +
    "  </span>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/plugin.html',
    "<div\n" +
    "  id=\"{{ plugin.name }}\"\n" +
    "  class=\"fade very-slow\">\n" +
    "  <div ng-if=\"withSettings && plugin.settings\" plugin-settings/>\n" +
    "  <div ng-include=\"plugin.template\"/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.core/templates/relocate.html',
    "<ul ng-if=\"locations\" class=\"no-list\">\n" +
    "  <li class=\"relocate-item clickable\" ng-repeat=\"location in locations\" ng-click=\"relocate(location)\">\n" +
    "    {{ location }}\n" +
    "  </li>\n" +
    "</ul>\n" +
    "<div ng-if=\"!locations\" translate=\"relocateHandler.noLocations\"/>\n"
  );


  $templateCache.put('js/arethusa.core/templates/sentence.html',
    "<div\n" +
    "  ng-click=\"goTo(id)\">\n" +
    "  <table class=\"sentence-list\" ng-class=\"{ changed: sentence.changed }\">\n" +
    "    <tr class=\"sentence-list\">\n" +
    "      <td>{{ citation }} {{ id }}</td>\n" +
    "      <td>{{ sentenceString }}</td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/settings_trigger.html',
    "<span\n" +
    "  class=\"clickable\"\n" +
    "  ng-click=\"settingsOn = !settingsOn\">\n" +
    "  <i class=\"fi-widget\" style=\"font-size: 1.2rem\"></i>\n" +
    "</span>\n" +
    "\n"
  );


  $templateCache.put('js/arethusa.core/templates/token_selector.html',
    "<dl class=\"sub-nav\" style=\"display:inline-block\">\n" +
    "  <dt\n" +
    "    style=\"color: #4D4D4D\"\n" +
    "    tooltip-popup-delay=\"700\"\\\n" +
    "    tooltip-placement=\"bottom\"\\\n" +
    "    tooltip-html-unsafe=\"{{ selection.tooltip }}\">\n" +
    "    {{ selection.label }}\n" +
    "  </dt>\n" +
    "  <dd ng-repeat=\"selector in selectors\" \n" +
    "      ng-class=\"{active: selector.isActive}\">\n" +
    "      <a\n" +
    "        ng-click=\"selector.action()\"\n" +
    "        ng-class=\"selector.styleClasses\"\n" +
    "        tooltip-popup-delay=\"700\"\\\n" +
    "        tooltip-placement=\"bottom\"\\\n" +
    "        tooltip-html-unsafe=\"{{ selector.tooltip }}\">\n" +
    "        {{selector.label}}\n" +
    "      </a>\n" +
    "  </dd>\n" +
    "</dl>\n"
  );


  $templateCache.put('js/arethusa.core/templates/translate_language.html',
    "<div class=\"flags {{ lang }}\"/>\n"
  );

}]);

angular.module('arethusa.tools', []);

"use strict";

angular.module('arethusa.tools').controller('MorphToolsCtrl', [
  '$scope',
  'plugins',
  'latinAttrs',
  'greekAttrs',
  'configurator',
  'MORPH_IMPORTS',
  '$http',
  '$injector',
  '$q',
  'fileHandler',
  '_',
  function(
    $scope,
    plugins,
    latinAttrs,
    greekAttrs,
    configurator,
    MORPH_IMPORTS,
    $http,
    $injector,
    $q,
    fileHandler,
    _
  ) {
    var EXPORT_FORMS_NAME     = 'arethusa_morph_forms.json';
    var EXPORT_FREQUENCY_NAME = 'arethusa_morph_frequency.json';
    var EXPORT_FILE_ENDING = 'application/json';

    var ATTRS = {
      lat: latinAttrs.data,
      grc: greekAttrs.data
    };

    var USER_ROUTE_PARAMS = {
      headers: {
        'Accept': 'application/json'
      }
    };

    var morph, localStorage, userCache = {};

    var config = configurator.configuration;

    //$scope.files = MORPH_IMPORTS; // online import currently disabled
    $scope.loadCsvFile = loadCsvFile;

    $scope.importFile = importFile;
    $scope.exportFile = exportFile;

    $scope.importFrequencyFile = importFrequencyFile;
    $scope.exportFrequencyFile = exportFrequencyFile;

    init();

    function useLanguage(attr) {
      config.plugins.morph = ATTRS[attr];
      $scope.usedLanguage = attr;
    }

    function init() {
      // Use a starting value so the morph service can load properly
      useLanguage('lat');

      plugins.start(['morph']).then(function() {
        morph = plugins.get('morph');
        localStorage = $injector.get('morphLocalStorage');
        $scope.ready = true;
      });
    }


    function parseOrigin(form, userRoute) {
      var deferred = $q.defer();
      var userName = userCache[userRoute];
      if (userName) {
        deferred.resolve(userName);
      } else {
        $http.get(userRoute, USER_ROUTE_PARAMS).then(function(res) {
          var userName = res.data.name;
          userCache[userRoute] = userName;
          deferred.resolve(userName);
        });
      }
      return deferred.promise;
    }

    function loadFormsFromCsv(data, filter) {
      resetStatus();
      var lines = data.split('\n');
      angular.forEach(lines, function(line, key) {
        // Fields are organized like
        // Form       - Lemma   - Postag   - User
        // Caesaris   - Caesar  - .......  - ....
        var fields = line.split(',');
        var str = fields[0];
        var form = {
          lemma: fields[1],
          postag: fields[2]
        };

        parseOrigin(form, fields[3]).then(function(userName) {
          form.origin = userName;
          morph.postagToAttributes(form);
          if (formNotDuplicate(str, form)) {
            morph.addToLocalStorage(fields[0], form);
            $scope.status.count += 1;
          }
        });
      });
    }

    function formNotDuplicate(str, form) {
      var forms;
      localStorage.retriever.getData(str, function(f) { forms = f; });
      if (forms) {
        return !aU.find(forms, function(otherForm) {
          return localStorage.comparator(form, otherForm);
        });
      }
      return true;
    }

    function resetStatus() {
      var fields = [
        'importForms',
        'exportForms',
        'importFrequency',
        'exportFrequency'
      ];

      $scope.status = _.inject(fields, function(memo, field) {
        memo[field] = { count: null };
        return memo;
      }, {});
    }

    function loadCsvFile(fileObj) {
      $scope.importStarted = true;
      $http.get(fileObj.route).then(function(res) {
        useLanguage(fileObj.language);
        loadFormsFromCsv(res.data);
        $scope.importStarted = false;
      });
    }

    function doImport(setter, cb) {
      resetStatus();
      var imported = 0;
      fileHandler.upload(function(data) {
        _.forEach(data, function(datum, str) {
          imported += localStorage[setter](str, datum);
        });
        cb(data,imported);
        $scope.$digest(); // so that the count can update
      });

    }

    function doExport(fileName, getter, cb) {
      resetStatus();
      var forms = localStorage[getter]();
      fileHandler.download(
        fileName,
        JSON.stringify(forms, null, 2),
        EXPORT_FILE_ENDING
      );

      cb(forms);
    }

    function importFile() {
      doImport('addForms', setFormImportCount);
    }

    function exportFile() {
      doExport(EXPORT_FORMS_NAME, 'getForms', setFormExportCount);
    }

    function exportFrequencyFile() {
      doExport(EXPORT_FREQUENCY_NAME, 'getPreferences', setFrequencyExportCount);
    }

    function importFrequencyFile() {
      doImport('addPreferences', setFrequencyImportCount);

    }

    function setFormExportCount(forms) {
      setCount('exportForms', countForms(forms));
    }

    function setFormImportCount(forms,imported) {
      setCount('importForms', countForms(forms),imported);
    }

    function setFrequencyExportCount(data) {
      setCount('exportFrequency', countFrequencyForms(data));
    }

    function setFrequencyImportCount(data,imported) {
      setCount('importFrequency', countFrequencyForms(data),imported);
    }

    function setCount(type, expected, actual) {
      $scope.status[type].count = actual !== null ? actual : expected;
    }

    function countForms(forms) {
      return _.inject(forms, function(memo, f) {
        memo += f.length;
        return memo;
      }, 0);
    }

    function countFrequencyForms(data) {
      return _.inject(data, function(memo, v, _) {
        memo += v.split(localStorage.delimiters.preference).length;
        return memo;
      }, 0);
    }
  }
]);

"use strict";

angular.module('arethusa.tools').constant('MORPH_IMPORTS', [
  {
    name: 'Latin Morphology',
    language: 'lat',
    route: '...'
  },
  {
    name: 'Greek Morphology',
    language: 'grc',
    route: '...'
  },
  {
    name: 'Test Data from Vanessa',
    language: 'grc',
    route: 'http://www.perseids.org/morph/masterlocal.csv'
  }
]);

angular.module('arethusa.tools').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('js/arethusa.tools/templates/morph_tools.html',
    "<div class=\"row\">\n" +
    "  <h3>Arethusa Morph Tools</h3>\n" +
    "\n" +
    "  <div class=\"morph-tools-form-import\">\n" +
    "    <div class=\"fade\" ng-if=\"ready\">\n" +
    "      <ul>\n" +
    "        <li ng-repeat=\"file in files\">\n" +
    "          <a ng-click=\"loadCsvFile(file)\">{{ file.name }}</a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div>\n" +
    "      <button class=\"small rounded\" ng-click=\"importFile()\">\n" +
    "        Import forms from file\n" +
    "      </button>\n" +
    "      <button class=\"small rounded\" ng-click=\"exportFile()\">\n" +
    "        Export forms to file\n" +
    "      </button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"status.importForms.count != null\">\n" +
    "      {{ status.importForms.count}} forms successfully imported!\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"status.exportForms.count\">\n" +
    "      {{ status.exportForms.count}} forms successfully exported!\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"importStarted\" style=\"color: green\">\n" +
    "      Processing import...\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"morph-tools-frequency-import\">\n" +
    "    <div>\n" +
    "      <button class=\"small rounded\" ng-click=\"importFrequencyFile()\">\n" +
    "        Import frequency data from file\n" +
    "      </button>\n" +
    "      <button class=\"small rounded\" ng-click=\"exportFrequencyFile()\">\n" +
    "        Export frequency data to file\n" +
    "      </button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"status.importFrequency.count != null\">\n" +
    "      {{ status.importFrequency.count}} forms successfully imported!\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"status.exportFrequency.count\">\n" +
    "      {{ status.exportFrequency.count}} forms successfully exported!\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>\n"
  );

}]);

'use strict';
angular.module('arethusa.contextMenu', []);

'use strict';
angular.module('arethusa.contextMenu').directive('arethusaContextMenu', [
  function () {
    return {
      restrict: 'AE',
      scope: {
        token: '=tokenObj',
        plugins: '='
      },
      link: function (scope, element, attrs) {
      },
      templateUrl: 'js/arethusa.context_menu/templates/arethusa_context_menu.html'
    };
  }
]);

"use strict";

angular.module('arethusa.contextMenu').directive('arethusaContextMenus', [
  function() {
    return {
      restrict: 'A',
      scope: {
        tokens: '=',
        plugins: '='
      },
      link: function(scope, element, attrs) {
        scope.fullId = function(token) {
          return token.sentenceId + token.id;
        };
      },
      template: '\
        <arethusa-context-menu\
          ng-repeat="(id, token) in tokens track by id"\
          plugins="plugins"\
          token-obj="token">\
        </arethusa-context-menu>\
      '
    };
  }
]);

'use strict';
angular.module('arethusa.contextMenu').factory('menuElement', function () {
  return { element: null };
}).directive('contextMenu', [
  '$document',
  '$parse',
  'menuElement',
  'keyCapture',
  function ($document, $parse, menuElement, keyCapture) {
    return {
      restrict: 'A',
      scope: {
        menuObj: '=',
        menuTrigger: '@',
        menuPosition: '@',
      },
      link: function (scope, element, attrs) {
        var opened = false;
        var eventFn = $parse(attrs.contextMenu);

        function repositionContextMenu(menu, parent) {
          // reposition the context menu relative to the parent element
          var parPos = parent.offset();
          var left;
          var top;
          if (scope.menuPosition === 'bottom') {
            top = parPos.top + parent.outerHeight();
            left = parPos.left;
          }

          if (scope.menuPosition === 'right') {
            top = parPos.top;
            left = parPos.left + parent.outerWidth();
          }
          menu.css('left', left);
          menu.css('top', top);
        }

        function open(event, menu, parent) {
          menu.addClass('menu-open');
          menu.css('display', 'inline-block');

          repositionContextMenu(menu, parent);

          menuElement.lastTarget = event.target;

          // If a target object was specified, declare that we just opened
          // a contextMenu.
          if (scope.menuObj) {
            scope.menuObj.status.contextMenuOpen = true;
          }
          opened = true;
        }

        function close(menu) {
          menu.removeClass('menu-open');
          menu.css('display', 'none');

          menuElement.lastTarget = undefined;

          // If a target object was specified, declare that we just closed
          // a contextMenu.
          if (scope.menuObj) {
            scope.menuObj.status.contextMenuOpen = false;
          }
          opened = false;
        }

        function closeAndApply() {
          scope.$apply(function () {
            close(menuElement.element);
          });
        }

        function firefoxDoubleEvent(event) {
          return event.target === menuElement.lastTarget && event.button === numericClickType();
        }

        // need this to make sure we close the menu all the time
        function handleOtherClick(event) {
          // in expensive low level check first, as this gets called
          // quite a bit
          if (opened) {
            if (targetIsChildOfMenu(event.target)) return;
            if (firefoxDoubleEvent(event)) return;

            closeAndApply();
          }
        }

        function targetIsChildOfMenu(target) {
          var t = angular.element(target);
          var menu = menuElement.element;
          return t.parents('#' + menu.attr('id')).length;
        }

        function numericClickType() {
          var types = {
            rightclick: 2,
            click: 1
          };
          return types[scope.menuTrigger];
        }


        var clickType = function() {
          if (scope.menuTrigger == 'rightclick') {
            return 'contextmenu';
          }

          if (scope.menuTrigger == 'click') {
            return 'click';
          }
        }();

        element.bind(clickType, function (event) {
          // If another menu is open while we want to open a new one,
          // we have to close the old one beforehand
          if (menuElement.element) {
            close(menuElement.element);
          }

          // Find the context menu in the DOM
          menuElement.element = angular.element(document.getElementById(attrs.menuId));

          // Disable the browser's default context menu
          event.preventDefault();
          event.stopPropagation();
          scope.$apply(function () {
            eventFn(scope, { $event: event });
            open(event, menuElement.element, element);
          });
        });

        $document.on('click', handleOtherClick);

        var deregisterKeyBinding = keyCapture.onKeyPressed('esc', function() {
          if (opened) {
            closeAndApply();
            keyCapture.stopPropagation();
          }
        }, 1000);

        scope.$on('$destroy', function() {
          $document.off('click', handleOtherClick);
          deregisterKeyBinding();
        });
      }
    };
  }
]);

'use strict';
angular.module('arethusa.contextMenu').directive('pluginContextMenu', function () {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    template: '\
      <div id="{{ plugin.name }}-context-menu"\
        ng-include="plugin.contextMenuTemplate">\
      </div>\
    '
  };
});

angular.module('arethusa.contextMenu').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('js/arethusa.context_menu/templates/arethusa_context_menu.html',
    "<div id=\"tcm{{ token.id }}\" class=\"token-context-menu\">\n" +
    "  <div ng-if=\"token.status.contextMenuOpen\">\n" +
    "    <div ng-repeat=\"plugin in plugins\">\n" +
    "      <plugin-context-menu class=\"menu-element\"></plugin-context-menu>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );

}]);

'use strict';
angular.module('arethusa.history', []);

"use strict";

angular.module('arethusa.history').directive('histRedo', [
  'generator',
  'history',
  'translator',
  function(generator, history, translator) {
    return generator.historyTrigger(history, translator, 'redo', 'repeat');
  }
]);


"use strict";

angular.module('arethusa.history').directive('histUndo', [
  'generator',
  'history',
  'translator',
  function(generator, history, translator) {
    return generator.historyTrigger(history, translator, 'undo');
  }
]);

"use strict";

angular.module('arethusa.history').directive('historyBatch', function() {
  return {
    restrict: 'A',
    scope: {
      batch: '=historyBatch'
    },
    link: function(scope, element, attrs) {
      scope.events = scope.batch.events;
    },
    templateUrl: 'js/arethusa.history/templates/history_batch.html'
  };
});

"use strict";

angular.module('arethusa.history').directive('historyEvent', [
  'idHandler',
  '$compile',
  function(idHandler, $compile) {

    return {
      restrict: 'A',
      scope: {
        event: '=historyEvent'
      },
      link: function(scope, element, attrs) {
        var tokenTemplate = '\
          <span\
            class="text"\
            token="token"\
            colorize="true"\
            click="true"\
            hover="true">\
          </span>\
        ';

        function valToString(val) {
          if (val && typeof val === 'object') scope.blocked = true;
          return val || 'nothing';
        }

        scope.token = scope.event.token;
        scope.id    = scope.token.id;
        scope.type  = scope.event.type;
        scope.trslKey = {
          start: 'history.' + scope.type + '.start',
          end:   'history.' + scope.type + '.end'
        };

        if (scope.type === 'change') {
          scope.blocked = false;
          scope.property = scope.event.property;
          scope.oldVal = valToString(scope.event.oldVal);
          scope.newVal = valToString(scope.event.newVal);
        }

        scope.formatId = function(id) {
          return idHandler.formatId(id, '%w');
        };

        element.find('#token').append($compile(tokenTemplate)(scope));
      },
      templateUrl: 'js/arethusa.history/templates/history_event.html'
    };
  }
]);

"use strict";

angular.module('arethusa.history').directive('historyList', [
  'history',
  '$compile',
  function(history, $compile) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        scope.history = history;
        scope.events = history.events;

        scope.$watch('history.position', function(newVal, oldVal) {
          scope.position = newVal;
        });
      },
      templateUrl: 'js/arethusa.history/templates/history_list.html'
    };
  }
]);

'use strict';
/**
 * @ngdoc service
 * @name arethusa.history.history
 *
 * @description
 * Tracks and stores all changes happening through the
 * {@link arethusa.core.state state} API.
 *
 * Provides means to undo and redo such changes.
 *
 *
 * @requires arethusa.core.configurator
 * @requires arethusa.core.keyCapture
 * @requires arethusa.core.state
 */
angular.module('arethusa.history').service('history', [
  'configurator',
  'keyCapture',
  'state',
  'translator',
  'notifier',
  function (configurator, keyCapture, state, translator, notifier) {
    var self = this;
    this.name = "history";

    var trsls = translator({
      'history.undoSuccess': 'undoSuccess',
      'history.redoSuccess': 'redoSuccess'
    });

    function configure() {
      configurator.getConfAndDelegate(self);

      /**
       * @ngdoc property
       * @name maxSize
       * @propertyOf arethusa.history.history
       *
       * @description
       * ***Configurable property***
       *
       * Maximum number of saved events. Defaults to 50.
       */
      self.maxSize = self.maxSize || 50;
    }

    function doSilent(fn) {
      state.doSilent(fn);
      checkAvailability();
    }

    function current() {
      return self.events[self.position];
    }

    function checkAvailability() {
      var any = self.events.length > 0;
      self.canUndo = any && self.position < self.events.length;
      self.canRedo = any && self.position > 0;
    }

    function HistEvent(token, type) {
      var id = token.id;

      this.token = token;
      this.type = type;
      this.time = new Date();

      if (type === 'add') {
        this.exec = function() {
          state.addToken(token, id);
        };
        this.undo = function() {
          state.removeToken(id);
        };
      } else { // type === removed
        this.exec = function() {
          state.removeToken(id);
        };
        this.undo = function() {
          state.addToken(token, id);
        };
      }
    }


/***************************************************************************
 *                            Public Functions                             *
 ***************************************************************************/

    /**
     * @ngdoc function
     * @name arethusa.history.history#undo
     * @methodOf arethusa.history.history
     *
     * @description
     * Undoes the last event.
     *
     * Calls the current event's `undo` function and advances the
     * {@link arethusa.history.history#properties_position pointer } to the
     * {@link arethusa.history.history#properties_events history events}.
     *
     * Mind that no new event is added to the
     * {@link arethusa.history.history#properties_events events} stack.
     */
    this.undo = function() {
      if (self.canUndo) {
        doSilent(function() {
          current().undo();
          self.position++;
        });
        notifier.success(trsls.undoSuccess());
      }
    };

    /**
     * @ngdoc function
     * @name arethusa.history.history#redo
     * @methodOf arethusa.history.history
     *
     * @description
     * Redoes the last event.
     *
     * Decreases the
     * {@link arethusa.history.history#properties_position pointer} to the
     * {@link arethusa.history.history#properties_events history events}
     * and calls the `exec` function of the next event.
     *
     * Mind that no new event is added to the
     * {@link arethusa.history.history#properties_events events} stack.
     */
    this.redo = function() {
      if (self.canRedo) {
        doSilent(function() {
          self.position--;
          current().exec();
        });
        notifier.success(trsls.redoSuccess());
      }
    };

    function BatchEvent() {
      var self = this;
      this.events = [];
      this.type = 'batch';

      this.push = function(event) {
        self.events.push(event);
      };

      this.count = function() { return self.events.length; };

      this.pop = function() {
        return self.events.pop();
      };

      function multiExec() {
        angular.forEach(self.events, function(event, i) {
          event.exec();
        });
      }

      function multiUndo() {
        angular.forEach(self.events, function(event, i) {
          event.undo();
        });
      }

      this.exec = function() { state.doBatched(multiExec); };
      this.undo = function() { state.doBatched(multiUndo); };
    }

    /**
     * @ngdoc function
     * @name arethusa.history.history#saveEvent
     * @methodOf arethusa.history.history
     *
     * @description
     * Adds a new event to the history.
     *
     * Typically not called directly. The history service listen to
     * all changes happening through the
     * {@link arethusa.core.state#methods_change state.change} API
     * as well as to the {@link arethusa.core.state#events_tokenRemoved tokenRemoved }
     * and {@link arethusa.core.state#events_tokenAdded tokenAdded } events.
     *
     * Events pushed onto the {@link arethusa.history.history#properties_events events}
     * stack need to conform with the API of
     * {@link arethusa.core.StateChange StateChange} objects.
     *
     * When {@link arethusa.core.state state's} `batchMode` is active, all events will
     * be collected and pushed to the stack as a **single** event, that can be undone
     * and redone in a single step. This is achieved by wrapping all events in a custom
     * object (cf. the constructor of `BatchEvent` in the source code), which is
     * polymorphic to {@link arethusa.core.StateChange StateChange}, as it also
     * provides an `undo` and an `exec` function.
     *
     * @param {*} event A {@link arethusa.core.StateChange StateChange} event
     *   or a polymorphic equivalent.
     */
    var batchedEvent = new BatchEvent();
    this.saveEvent = function(event) {
      if (state.silent) return;
      if (state.batchChange) {
        batchedEvent.push(event);
        return;
      }

      var events = self.events;
      if (events.length === self.maxSize) events.pop();
      events.splice(0, self.position);
      self.position = 0;
      events.unshift(event);
      checkAvailability();
    };


/***************************************************************************
 *                          Watches and Listeners                          *
 ***************************************************************************/

    state.watch('*', function(n, o, event) {
      self.saveEvent(event);
    });

    state.on('tokenAdded', function(event, token) {
      var histEvent = new HistEvent(token, 'add');
      self.saveEvent(histEvent);
    });

    state.on('tokenRemoved', function(event, token) {
      var histEvent = new HistEvent(token, 'remove');
      self.saveEvent(histEvent);
    });

    state.on('batchChangeStop', function() {
      // We don't want to listen for batchUndo/batchRedo
      if (state.silent) return;

      // We are a little careless with setting the batch mode -
      // if the batch event has only a single event anyway,
      // we save this and not the whole BatchEvent.
      var e = batchedEvent.count() === 1 ? batchedEvent.pop() : batchedEvent;
      self.saveEvent(e);
      batchedEvent = new BatchEvent();
    });

    var keys = keyCapture.initCaptures(function(kC) {
      return {
        history: [
          kC.create('undo', self.undo, ':'),
          kC.create('redo', self.redo, "'")
        ]
      };
    });
    self.activeKeys = angular.extend({}, keys.history);


/***************************************************************************
 *                                  Init                                   *
 ***************************************************************************/

    this.init = function() {
      configure();

      /**
       * @ngdoc property
       * @name canRedo
       * @propertyOf arethusa.history.history
       *
       * @description
       * Determines if an {@link arethusa.history.history#methods_redo redo}
       * operation can be done.
       */
      self.canRedo = false;

      /**
       * @ngdoc property
       * @name canUndo
       * @propertyOf arethusa.history.history
       *
       * @description
       * Determines if an {@link arethusa.history.history#methods_undo undo}
       * operation can be done.
       */
      self.canUndo = false;

      /**
       * @ngdoc property
       * @name events
       * @propertyOf arethusa.history.history
       *
       * @description
       * Array of all stored history events.
       */
      self.events = [];

      /**
       * @ngdoc property
       * @name position
       * @propertyOf arethusa.history.history
       *
       * @description
       * Current position in the
       * {@link arethusa.history.history#properties_events events} container.
       */
      self.position = 0;
    };
  }
]);

angular.module('arethusa.history').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('js/arethusa.history/templates/history_batch.html',
    "<span ng-repeat=\"e in events\" history-event=\"e\"/>\n"
  );


  $templateCache.put('js/arethusa.history/templates/history_event.html',
    "<div>\n" +
    "  <span\n" +
    "    translate=\"{{ trslKey.start }}\"\n" +
    "    translate-value-property=\"{{ property }}\">\n" +
    "  </span>\n" +
    "  <span id=\"token\"/>\n" +
    "  <sup class=\"note\"> {{ formatId(id) }} </sup>\n" +
    "  <span\n" +
    "    translate=\"{{ trslKey.end }}\"\n" +
    "    translate-value-property=\"{{ property }}\">\n" +
    "  </span>\n" +
    "  <span ng-if=\"type === 'change' && !blocked\">\n" +
    "    <span\n" +
    "      translate=\"history.fromTo\"\n" +
    "      translate-value-from=\"{{ oldVal }}\"\n" +
    "      translate-value-to=\"{{ newVal }}\">\n" +
    "    </span>\n" +
    "  </span>\n" +
    "</div>\n"
  );


  $templateCache.put('js/arethusa.history/templates/history_list.html',
    "<div class=\"small-12 columns\">\n" +
    "  <ol reversed>\n" +
    "    <p ng-if=\"events.length === 0\" class=\"text\">\n" +
    "      <span translate=\"history.noRecords\"/>\n" +
    "    </p>\n" +
    "    <li\n" +
    "      ng-repeat=\"e in events\"\n" +
    "      ng-class=\"{ 'current-hist-event': $index === position }\"\n" +
    "      class=\"text hist-event\">\n" +
    "      <span ng-switch=\"e.type\" >\n" +
    "        <span ng-switch-when=\"batch\" history-batch=\"e\"/>\n" +
    "        <span ng-switch-default history-event=\"e\"/>\n" +
    "      </span>\n" +
    "    </li>\n" +
    "  </ol>\n" +
    "</div>\n"
  );

}]);

'use strict';

/**
 * @ngdoc overview
 * @name arethusa
 *
 * @description
 * Arethusa's main module. Handles routing.
 *
 */
angular.module('arethusa', [
  'angulartics',
  //'angulartics.google.analytics',
  'ngRoute',
  'arethusa.core',
  'arethusa.contextMenu',
  'arethusa.history',
  'arethusa.tools',
]);

angular.module('arethusa').constant('_', window._);

angular.module('arethusa').config([
  '$routeProvider',
  '$translateProvider',
  'localStorageServiceProvider',
  'LOCALES',
  'MAIN_ROUTE',
  'MORPH_TOOLS',
  'LANDING',
  function ($routeProvider, $translateProvider, localStorageServiceProvider,
            LOCALES, MAIN_ROUTE, MORPH_TOOLS, LANDING) {
    if (aU.isArethusaMainApplication()) {
      $routeProvider.when('/', LANDING);
      $routeProvider.when('/morph_tools', MORPH_TOOLS);
      //$routeProvider.when('/conf_editor', CONF_ROUTE);
      $routeProvider.when('/:conf', MAIN_ROUTE);
      //$routeProvider.when('/conf_editor/:conf', CONF_ROUTE);
    }

    var localesMap = {};
    for (var i = LOCALES.length - 1; i >= 0; i--){
      var locale = LOCALES[i];
      localesMap[locale + '_*'] = locale;
    }

    $translateProvider
      .useStaticFilesLoader({
        prefix: arethusa.basePath + '/dist/i18n/',
        suffix: '.json'
      })

      .registerAvailableLanguageKeys(LOCALES, localesMap)
      .determinePreferredLanguage()
      .fallbackLanguage('en')
      .addInterpolation('translatorNullInterpolator');

    localStorageServiceProvider.setPrefix('arethusa');
  },
]);

angular.module('arethusa').value('CONF_PATH', '../dist/configs');

function Arethusa() {
  var self = this;

  self.basePath = '..';

  function Api(injector) {
    var api = this;
    var $compile = injector.get('$compile');

    this.configurator = injector.get('configurator');

    this.configure = function(conf) {
      api.configurator.defineConfiguration(conf);
    };

    this.watchUrl = function(bool) {
      injector.get('locator').watchUrl(bool);
    };

    this.setBasePath = function(path) {
      injector.get('basePath').set(path);
    };

    this.setParams = function(a, b) {
      injector.get('locator').set(a, b);
    };

    this.compile = function(element) {
      var html = element[0].innerHTML;
      element.html($compile(html)(element.scope()));
    };

    this.state = injector.get('state');

    //this.setBasePath(self.basePath);
  }

  this.setConfPath = function(path) {
    angular.module('arethusa').value('CONF_PATH', path);
  };

  this.setBasePath = function(path) {
    self.basePath = path;
    angular.module('arethusa.core').value('BASE_PATH', path);
  };

  this.start = function(id, conf, params) {
    var res = {};
    id = id.match(/^#/) ? id : '#' + id;
    var target = angular.element(id);
    target.attr('ng-controller', 'ArethusaCtrl');
    target.ready(function() {
      var injector = angular.bootstrap(id, ['arethusa']);
      var api = new Api(injector);

      api.watchUrl(false);
      api.setParams(params);
      api.configure(conf);

      api.compile(target);

      angular.extend(res, api);
    });

    return res;
  };
}

var arethusa =  new Arethusa();

"use strict";

angular.module('arethusa').factory('ConstituentTreebankRetriever', [
  'configurator',
  'documentStore',
  'retrieverHelper',
  'idHandler',
  'globalStore',
  'commons',
  function(configurator, documentStore, retrieverHelper, idHandler,
           globalStore, commons) {
    // Parse functions

    function parseDocument(json, docId) {
      resetSentenceIdCounter();
      setUpConstituents();
      var constituents = new Container();
      var sentences = parseSentences(json.book.sentence, constituents, docId);
      angular.extend(globalStore.constituents, constituents.container);
      return sentences;
    }

    function parseSentences(sentences, constituents, docId) {
      return aU.toAry(sentences).map(function(sentence) {
        return parseSentence(sentence, constituents, docId);
      });
    }

    function parseSentence(sentence, constituents, docId) {
      var sourceId = sentence._ID;
      var internalId = getSentenceId();
      var tokens = new Container();

      // Hack to resolve the ambiguity between sentence and subject
      var wgNode = sentence.wg;
      wgNode._role = 'sent';

      parseWordGroup(wgNode, docId, internalId, constituents, tokens);

      var s = commons.sentence(tokens.container);
      var ids = Object.keys(s.tokens).sort();
      s.tokens[ids[ids.length - 1]].terminator = true;
      retrieverHelper.generateId(s, internalId, sourceId, docId);
      return s;
    }

    function parseWordGroup(wg, docId, sentenceId, constituents, tokens, parentId) {
      var id = wg._nodeId;
      var constituent = commons.constituent(
        wg._class,
        wg._role,
        id,
        sentenceId,
        parentId
      );

      constituents.add(constituent);

      angular.forEach(aU.toAry(wg.wg), function(childWg, i) {
        parseWordGroup(childWg, docId, sentenceId, constituents, tokens, id);
      });

      angular.forEach(aU.toAry(wg.w), function(w, i) {
        parseWord(w, docId, sentenceId, tokens, id);
      });

    }

    function parseWord(w, docId, sentenceId, tokens, parentId) {
      var token = commons.token(w.__text, sentenceId);

      var sourceId = w._morphId;
      var internalId = idHandler.getId(getWordId(sourceId), sentenceId);
      retrieverHelper.generateId(token, internalId, sourceId, docId);

      parseMorph(token, w);
      addConstituent(token, w, parentId);

      tokens.add(token);
    }

    function parseMorph(token, w) {
      var attrs = {}, key, expandedKey,  attrKey, val;
      for (key in morphKeys) {
        attrKey = morphKeys[key] || key;
        val = w['_' + key];
        if (val) attrs[attrKey] = val;
      }

      token.morphology = {
        lemma: w._lemma,
        attributes: attrs
      };
    }

    function addConstituent(token, w, parentId) {
      token.constituency = {
        parent: parentId,
        role: w._role
      };
    }

    // Helpers

    function Container() {
      var self = this;
      this.container = {};
      this.add = function(el) {
        self.container[el.id] = el;
      };
    }

    function setUpConstituents() {
      if (!globalStore.constituents) globalStore.constituents = {};
    }

    var morphKeys = {
      'class': 'pos',
      'person': 'pers',
      'number': 'num',
      'tense': null,
      'mood': null,
      'voice': null,
      'gender': 'gend',
      'case': null,
      'degree': null
    };

    var sIdCounter;
    function resetSentenceIdCounter() { sIdCounter = 0; }
    function getSentenceId() { sIdCounter += 1; return sIdCounter; }

    function getWordId(source) {
      return source.substr(source.length - 3);
    }


    return function(conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var docId = conf.docIdentifier;

      this.parse = function(xml, callback) {
        var json = arethusaUtil.xml2json(xml);
        documentStore.addDocument(docId, commons.doc(xml, json));

        callback(parseDocument(json, docId));
      };

      this.get = function(callback) {
        resource.get().then(function(res) {
          var data = res.data;
          self.parse(res.data, callback);
        });
      };
    };
  }
]);

"use strict";

angular.module('arethusa').factory('GlobalErrorHandler', [
  '$window',
  '$analytics',
  function($window, $analytics) {
    var oldErrorHandler = $window.onerror;
    $window.onerror = function errorHandler(errorMessage, url, lineNumber) {
      var trace = printStackTrace();
      $analytics.eventTrack(errorMessage + " @" + url + " : " + lineNumber, {
        category: 'error', label: trace.join(', ')
      });

      if (oldErrorHandler)
        return oldErrorHandler(errorMessage, url, lineNumber);

      return false;
    };
  }
]);

angular.module('arethusa').factory('$exceptionHandler', [
  '$analytics',
  '$log',
  function($analytics, $log) {
    return function errorHandler(exception, cause) {
      $log.error.apply($log, arguments);
      var trace = printStackTrace();
      $analytics.eventTrack(exception + ': ' + cause, {
        category: 'error', label: trace.join(', ')
      });
    };
  }
]);

"use strict";

angular.module('arethusa').factory('HebrewPersister', [
  'documentStore',
  'configurator',
  'navigator',
  'idHandler',
  function (documentStore, configurator, navigator, idHandler) {
    return function (conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var identifier = conf.docIdentifier;

      function updateDocument() {

      }

      function updateXml() {

      }

      function doc() {
        return documentStore.store[identifier];
      }


      this.saveData = function (callback, errCallback) {
        updateDocument();
        updateXml();
        resource.save(doc().xml,'text/xml').then(callback, errCallback);
      };
    };
  }
]);


"use strict";

angular.module('arethusa').factory('HebrewRetriever', [
  'documentStore',
  'configurator',
  'idHandler',
  'languageSettings',
  'hebrewMorph',
  function (documentStore, configurator, idHandler, languageSettings, hebrewMorph) {
    return function (conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var docIdentifier = conf.docIdentifier;

      function Token(id, string, map, terminator) {
        this.id = id;
        this.string = string;
        this.idMap = map;
        this.terminator = terminator;
      }

      function createIds(id,sentence) {
        var match = /^ref\.(\d+\.){3}(\d+)\.(\d+)$/.exec(id);
        var internalId = idHandler.getId(match[2]) + '-' + idHandler.getId(match[3]);
        var sourceId   = id;
        var idMap = new idHandler.Map();
        idMap.add(docIdentifier, internalId, sourceId, sentence);
        return { map: idMap, id: internalId };
      }

      function extractTokens(paragraph) {
        var result = {};

        angular.forEach(arethusaUtil.toAry(paragraph.sentence), function(sentence, i) {
          var tokens = arethusaUtil.toAry(sentence.token);
          var lastTokenI = tokens.length - 1;
          angular.forEach(tokens, function(token, otherI) {
            var ids = createIds(token._id,sentence._id);
            var string = token._surface;
            var term = otherI === lastTokenI;
            var id = ids.id;
            var t = new Token(id, string, ids.map, term);
            hebrewMorph.parse(token, t);
            result[id] = t;
          });
        });

        return result;
      }

      function parseDocument(doc, identifier) {
        var paragraphs = arethusaUtil.toAry(doc.corpus.article.paragraph);
        return arethusaUtil.map(paragraphs, function(p) {
          var id = p._id;
          var tokens = extractTokens(p);
          return {
            id: id,
            tokens: tokens,
          };
        });

      }

      this.getData = function (callback) {
        languageSettings.setFor(docIdentifier, 'heb');
        resource.get().then(function (res) {
          var xml = res.data;
          var json = arethusaUtil.xml2json(res.data);
          documentStore.addDocument(docIdentifier, {
            json: json,
            xml: xml
          });
          callback(parseDocument(json, docIdentifier));
        });
      };
    };
  }
]);


"use strict";

angular.module('arethusa').factory('PhaidraTreebankRetriever', [
  'configurator',
  'documentStore',
  'retrieverHelper',
  'idHandler',
  'languageSettings',
  'locator',
  'commons',
  function(configurator, documentStore, retrieverHelper,
           idHandler, languageSettings, locator, commons) {
    // Single sentence documents for now.
    function parseDocument(doc, docId) {
      var sentenceId = '1';
      var tokens = {};

      var words = doc.words;

      for (var i=0; i < words.length; i++) {
        var word = words[i];
        var token = commons.token(word.value, sentenceId);
        var intId = idHandler.getId(word.tbwid, sentenceId);
        retrieverHelper.generateId(token, intId, word.CTS, docId);

        var head = word.head;
        if (angular.isDefined(head)) {
          token.head = { id: idHandler.getId(head, sentenceId) };
        }

        var relation = word.relation;
        if (relation) {
          token.relation = { label: relation };
        }

        token.morphology = {
          lemma: word.lemma,
          attributes: parseMorph(word)
        };

        tokens[token.id] = token;
      }

      var s = commons.sentence(tokens, doc.CTS);
      retrieverHelper.generateId(s, sentenceId, sentenceId, docId);
      return [s];
    }

    // This is a little ugly (and slow), as the morphology is just thrown
    // into the object.
    var morphKeys = {
      'pos': null,
      'person': 'pers',
      'number': 'num',
      'tense': null,
      'mood': null,
      'voice': null,
      'gender': 'gend',
      'case': null,
      'degree': null
    };

    function parseMorph(word) {
      var attrs = {}, key, attrKey, val;
      for (key in morphKeys) {
        attrKey = morphKeys[key] || key;
        val = word[key];
        if (val) attrs[attrKey] = val;
      }

      return attrs;
    }

    function inferLanguage(doc) {
      // For now we assume that all tokens have the same language
      return doc.words[0].lang;
    }

    return function(conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var docId = conf.docIdentifier;

      this.preselections = retrieverHelper.getPreselections(conf);

      this.get = function(callback) {
        resource.get().then(function(res) {
          var data = res.data;
          documentStore.addDocument(docId, commons.doc(null, data, null));
          languageSettings.setFor(docId, inferLanguage(data));
          callback(parseDocument(data, docId));
        });
      };
    };
  }
]);

'use strict';

angular.module('arethusa').factory('TreebankPersister', [
  'documentStore',
  'configurator',
  'navigator',
  'idHandler',
  function (documentStore, configurator, navigator, idHandler) {
    return function(conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var identifier = conf.docIdentifier;

      function updateXml() {
        doc().xml = arethusaUtil.json2xml(doc().json);
      }

      function updateWord(word, stateWord, fullMap) {
        // This whole function is horrificly ugly and could be refactored
        // to use more function calls - but this is not done on purpose.
        //
        // We want saving to be as fast as possible and avoid more calls.
        //
        // The if/else dancing is used to determine whether we should write
        // to the document or not.
        //
        // We write
        // - when a value is set in the current state
        // - when no value is set in the current state, but present in the
        //   source document (i.e.: user has unannotated on purpose
        //
        // We don't write
        // - when no value is present in state or document

        var head = stateWord.head;
        if ((head && head.id)) {
          // If the token has a head and it's not inside the full map,
          // it's the root token.
          word._head = fullMap[head.id] || 0;
        } else {
          // react against 0 values in head
          if (angular.isDefined(word._head)) word._head = '';
        }

        var relation = stateWord.relation;
        if (relation) {
          word._relation = relation.label;
        } else {
          if (word._relation) word._relation = '';
        }

        var morph = stateWord.morphology;
        if (morph) {
          if (angular.isDefined(morph.lemma))  word._lemma = morph.lemma;
          if (angular.isDefined(morph.postag)) word._postag= morph.postag;
          if (angular.isDefined(morph.gloss))  word._gloss = morph.gloss;
          if (angular.isDefined(morph.alternateGloss))  word._alternateGloss = morph.alternateGloss;
          if (angular.isDefined(morph.semanticRole))  word._semanticRole = morph.semanticRole;
          if (angular.isDefined(morph.include))  word._include = morph.include;
          if (angular.isDefined(morph.multiword))  word._multiword = morph.multiword;
          if (angular.isDefined(morph.notes))  word._notes = morph.notes;
        } else {
          if (word._lemma || word._postag) {
            word._lemma = word._postag = '';
          }
        }

        var sg = stateWord.sg;
        if (sg) {
          word._sg = arethusaUtil.map(sg.ancestors, function(el) {
            return el.short;
          }).join(' ');
        } else {
          if (word._sg) word._sg = '';
        }

        var comment = stateWord.comment;
        if (comment) {
          word._comment = stateWord.comment;
        }

        word._form = stateWord.string;
      }

      function ArtificialNode(id, insertionId, type) {
        this._id = id;

        // We have to strip the sentence id for now, as the insertionId
        // won't make it through Perseids validation process.
        // It won't affect the import, as we're catching such cases there
        // for backwards compatibility anyway.
        //
        // Mind that this is a temporal solution and tightly couples this
        // process to the current id formatting.
        this._insertion_id = insertionId.split('-')[1];
        this._artificial = type || 'elliptic';
      }

      var lastId;
      function idCreator() {
        lastId++;
        return lastId;
      }

      function updateSentence(sentences, sentence) {
        var updated = sentences[sentence._id];

        // Check for changes - we might have nothing to do.
        if (!updated.changed) return;

        var wordsInXml = arethusaUtil.toAry(sentence.word);
        // We create a new object that holds all tokens of a sentence,
        // identified by their mappings in the original document.
        // Formerly unmapped tokens are exposed through an array to allow
        // postprocessing on them (such as adding artificialToken information)
        lastId = wordsInXml[wordsInXml.length - 1]._id;

        var tokens = idHandler.transformToSourceIds(updated.tokens, identifier, idCreator);
        var withMappings = tokens.mapped;
        var fullMap = tokens.fullMap;
        var toDelete = [];
        angular.forEach(wordsInXml, function(word, i) {
          var stateWord = withMappings[word._id];
          if (stateWord) {
            updateWord(word, stateWord, fullMap);
          } else {
            toDelete.unshift(i); // unshift, because we want reverse order
          }
        });

        angular.forEach(toDelete, function(index, i) {
          wordsInXml.splice(index, 1);
        });

        // tokens - the result of the id.Handler.transfomToSource call -
        // exposes all previously unmapped ids in an Array.
        // When artificialTokens were added during the last call of this function
        // and now, the unmapped Array will contain them - we have to add
        // the artificialToken information now to complete the insertion of such
        // new nodes in the XML document.
        // After they have been inserted once, they will already have their id
        // mapping, so an artificialToken can never end up in the unmapped Array
        // twice.
        angular.forEach(tokens.unmapped, function(token, i) {
          var internalId = token.id;
          var sourceId   = token.idMap.sourceId(identifier);
          var newWord = new ArtificialNode(sourceId, internalId);
          updateWord(newWord, token, fullMap);
          wordsInXml.push(newWord);
        });
        updated.changed = false;
      }

      function updateDocument() {
        var stored = arethusaUtil.toAry(doc().json.treebank.sentence);
        // navigator has to provide means to retrieve sentences by id
        // and not only through a flat array!
        var sentences = navigator.sentencesById;

        angular.forEach(stored, function(sentence, i) {
          updateSentence(sentences, sentence);
        });
      }

      function doc() {
        return documentStore.store[identifier];
      }

      this.output = function(noFormat) {
        updateDocument();
        updateXml();
        var xml = doc().xml;
        return noFormat ? xml : aU.formatXml(xml);
      };

      this.saveData = function(callback, errCallback) {
        resource.save(self.output(true), self.mimeType).then(callback, errCallback);
      };

      this.identifier = identifier;
      this.mimeType = 'text/xml';
      this.fileType = 'xml';
    };
  }
]);


'use strict';
/* A newable factory to handle xml files using the Perseus Treebank Schema
 *
 * The constructor functions takes a configuration object (that typically
 * contains a resource object for this service).
 *
 */
angular.module('arethusa').factory('TreebankRetriever', [
  'configurator',
  'documentStore',
  'retrieverHelper',
  'idHandler',
  'commons',
  'editors',
  function (configurator, documentStore, retrieverHelper,
            idHandler, commons, editors) {
    function parseDocument(json, docId) {
      var annotators = arethusaUtil.toAry(json.treebank.annotator || []);
      parseEditors(annotators, docId);
      var sentences = arethusaUtil.toAry(json.treebank.sentence);
      return parseSentences(sentences, docId);
    }

    function parseEditors(annotators, docId) {
      angular.forEach(annotators, function(annotator, i) {
        if (isHumanAnnotator(annotator)) {
          editors.addEditor(docId, {
            name: annotator.short,
            fullName: annotator.name,
            page: annotator.url,
            mail: annotator.address
          });
        }
      });
    }

    function parseSentences(sentences, docId) {
      return sentences.map(function(sentence) {
        var cite = extractCiteInfo(sentence);
        var words = arethusaUtil.toAry(sentence.word);
        return parseSentence(sentence, sentence._id, docId, cite);
      });
    }

    function parseSentence(sentence, id, docId, cite) {
      var words = aU.toAry(sentence.word);
      var tokens = {};

      var artificials = extractArtificials(words, id);

      var lastI = words.length - 1;
      angular.forEach(words, function (word, i) {
        var token = parseWord(word, id, docId, artificials);
        if (i === lastI) token.terminator = true;
        tokens[token.id] = token;
      });

      var sentenceObj = commons.sentence(tokens, cite);
      retrieverHelper.generateId(sentenceObj, id, id, docId);

      return sentenceObj;
    }

    function parseWord(word, sentenceId, docId, artificials) {
      // One could formalize this to real rules that are configurable...
      //
      // Remember that attributes of the converted xml are prefixed with underscore
      var token = commons.token(word._form, sentenceId);

      parseMorphology(token, word);
      parseRelation(token, word);
      parseSg(token, word);
      parseArtificial(token, word);
      parseHead(token, word, artificials);
      parseComment(token,word);

      var internalId = generateInternalId(word, sentenceId);
      var sourceId   = word._id;
      retrieverHelper.generateId(token, internalId, sourceId, docId);

      return token;
    }

    function parseHead(token, word, artificials) {
      var headId = word._head;
      if (angular.isDefined(headId) && headId !== "") {
        var newHead = {};
        var artHeadId = artificials[headId];
        var sentenceId = token.sentenceId;
        newHead.id = artHeadId ? artHeadId : idHandler.getId(headId, sentenceId);

        token.head = newHead;
      }
    }


    function parseMorphology(token, word) {
      token.morphology = {
        lemma: word._lemma,
        postag: word._postag
      };

      // if we have any morphology info from the document
      // mark the origin as such
      token.morphology.origin = 'document';

      var fields = ['gloss', 'alternateGloss', 'semanticRole', 'include', 'multiword', 'notes'];

      angular.forEach(fields, function (field) {
        var value = word['_' + field];

        if (value) {
          token.morphology[field] = value;
        }
      });
    }

    function parseRelation(token, word) {
      var relation = word._relation;
      var label = (relation && relation !== 'nil') ? relation : '';

      token.relation = {
        label: label
      };
    }

    function parseSg(token, word) {
      var sg = word._sg;
      if (sg && !sg.match(/^\s*$/)) {
        token.sg = { ancestors: sg.split(' ') };
      }
    }

    function parseArtificial(token, word) {
      if (word._artificial) {
        token.artificial = true;
        token.type = word._artificial;
      }
    }

    function parseComment(token, word) {
      var comment = word._comment;
      if (comment) {
        token.comment = comment;
      }
    }
    // Helpers


    function extractArtificials(words, sentenceId) {
      return arethusaUtil.inject({}, words, function(memo, word, i) {
        extractArtificial(memo, word, sentenceId);
      });
    }

    function extractArtificial(memo, word, sentenceId) {
      if (word._artificial) {
        memo[word._id] = padWithSentenceId(word._insertion_id, sentenceId);
      }
    }

    function generateInternalId(word, sentenceId) {
      if (word._artificial) {
        return padWithSentenceId(word._insertion_id, sentenceId);
      } else {
        return idHandler.getId(word._id, sentenceId);
      }
    }

    // This is for backwards compatibility - we still might encounter documents, which
    // stored the insertion id without the sentence id. This is a little hacky but a
    // must have.
    function padWithSentenceId(id, sentenceId) {
      return (id.match(/-/)) ? id : idHandler.padIdWithSId(id, sentenceId);
    }

    // Try to support the new as well as the old schema for now
    function extractCiteInfo(sentence) {
      var cite = sentence._cite;
      if (cite) {
        return cite;
      } else {
        var docId = sentence._document_id;
        var subdoc = sentence._subdoc;
        if (subdoc) {
          return docId + ':' + subdoc;
        } else {
          return docId;
        }
      }
    }

    function findAdditionalConfInfo(json) {
      var linkInfo = json.treebank.link;
      var links =  linkInfo ? arethusaUtil.toAry(linkInfo) : [];
      var confs = arethusaUtil.inject({}, links, function(memo, link) {
        memo[link._title] = link._href;
      });
      var format = json.treebank._format;
      if (format) {
        // For backwards compatibility to older days
        if (format == 'aldt') {
          format = 'aldt2' + json.treebank['_xml:lang'];
        }
        confs.fullFile = format;
      }
      return confs;
    }

    function isHumanAnnotator(annotator) {
      // Machine services don't come with a name attached to them
      return annotator.name && annotator.short;
    }



    return function (conf) {
      var self = this;
      var resource = configurator.provideResource(conf.resource);
      var docId = conf.docIdentifier;

      this.preselections = retrieverHelper.getPreselections(conf);

      this.parse = function(xml, callback) {
        var json = arethusaUtil.xml2json(xml);
        var moreConf = findAdditionalConfInfo(json);
        var doc = commons.doc(xml, json, moreConf);

        documentStore.addDocument(docId, doc);
        callback(parseDocument(json, docId));
      };

      // Called with either one, or two params
      this.get = function (params, callback) {
        if (!callback) {
          callback = params;
          params = {};
        }

        resource.get(params).then(function (res) {
          self.parse(res.data, callback);
        });
      };
    };
  }
]);

"use strict";

// This should rather be a factory, that returns a constructor -
// and the constructor takes customized idGenerator functions.
// TODO: Like the generateID function in the TreeBankRetriever?

/**
 * This service provides functionality to retrievers that covers mapping between external and internal IDs,
 * and announcing pre-selections to the state.
 */
angular.module('arethusa').service('retrieverHelper', [
  'idHandler',
  'locator',
  function(idHandler, locator) {

      /**
       * This adds a mapping to the idHandler and extends the stateToken with it
       * @param stateToken token located in the state
       * @param internalId local token ID (usually sentence index plus word index internal to a chunk)
       * @param sourceId token ID in the containing document
       * @param docId ID for the containing document
       */
    this.generateId = function(stateToken, internalId, sourceId, docId) {
      var idMap = new idHandler.Map();
      idMap.add(docId, internalId, sourceId, stateToken.sentenceId);
      stateToken.id = internalId;
      stateToken.idMap = idMap;
    };

    // Currently disfunct - needs sentence id to work again
    // Preselections = selection specified in config, to be declared to state
    /**
     * This gets and formats pre-selection IDs for declaration to the state during init
     * @param conf configuration for retriever
     * @returns {*} state ids for pre-selections
       */
    this.getPreselections = function(conf) {
      var preselections = aU.toAry(locator.get(conf.preselector));
      return arethusaUtil.map(preselections, function(id) {
        return idHandler.getId(id);
      });
    };
  }
]);

'use strict';

angular.module('arethusa').constant('VERSION', {
  revision: 'a392d3dbdcbbf07bcce2562b390809721a98495e',
  branch: 'main',
  version: '0.2.5',
  date: '2022-12-13T21:18:24.023Z',
  repository: 'http://github.com/latin-language-toolkit/arethusa'
});

angular.module('arethusa').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('js/templates/conf_editor.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <div class=\"colums small-12\">\n" +
    "    <h3>Conf editor</h3>\n" +
    "      <strong>{{ fileName() }}</strong>\n" +
    "    <div>\n" +
    "      <ul class=\"button-group right\">\n" +
    "        <li><button ng-click=\"save()\" class=\"small\">Save</button></li>\n" +
    "        <li><button ng-clikc=\"saveAs()\" class=\"small\">Save as...</button></li>\n" +
    "        <!--needs something like dropdown where we can enter a new filename-->\n" +
    "        <li><button ng-click=\"reset()\" class=\"small\">Reset</button></li>\n" +
    "        <li><button ng-click=\"toggleDebugMode()\" class=\"small\">Debug</button></li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div debug=\"conf\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <div class=\"columns large-12\">\n" +
    "    <div class=\"columns large-3\">\n" +
    "      <simple-form text=\"Main Template\" model=\"main().template\"></simple-form>\n" +
    "      <input type=\"checkbox\" ng-model=\"main().colorize\"/><label>Colorize tokens</label>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <h5>Data Sources</h5>\n" +
    "    <!--this is going to be a directive once the markup takes-->\n" +
    "    <!--more shape-->\n" +
    "    <ul class=\"button-group\">\n" +
    "      <li ng-repeat=\"(name, conf) in main().retrievers\"\n" +
    "          ng-click=\"toggleSelection('source', name)\">\n" +
    "        <span class=\"tiny button\">\n" +
    "          {{ name }}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "    <div ng-repeat=\"(name, conf) in main().retrievers\" ng-show=\"isSelected('source', name)\">\n" +
    "      <!--\n" +
    "        Note on the remover attribute: We pass a function here through a\n" +
    "        one-way binding here. This function takes an argument, in this case\n" +
    "        removePlugin() takes the name of the plugin to remove. The name of this\n" +
    "        param in the attribute declaration is meaningless. It's just here to tell\n" +
    "        the pluginConf directive (which is in an isolated scope) that the function\n" +
    "        in fact takes an argument. It wouldn't need to be name here, it could be\n" +
    "        'foo' too.\n" +
    "      -->\n" +
    "      <retriever-conf\n" +
    "        name=\"name\"\n" +
    "        retriever=\"main().retrievers[name]\"\n" +
    "        remover=\"removeDataSource(name)\">\n" +
    "      </retriever-conf>\n" +
    "    </div>\n" +
    "    <conf-adder\n" +
    "      text=\"Add a data source\"\n" +
    "      submitter=\"addDataSource(input)\">\n" +
    "    </conf-adder>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <h5>Plugins</h5>\n" +
    "  <div>\n" +
    "    <ul class=\"button-group\">\n" +
    "      <li ng-repeat=\"name in main().plugins\">\n" +
    "        <span\n" +
    "          class=\"tiny button\"\n" +
    "          ng-class=\"{alert: isMainPlugin(name)}\"\n" +
    "          ng-click=\"toggleSelection('plugin', name)\">\n" +
    "          {{ name }}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "  <div ng-repeat=\"name in main().plugins\" ng-show=\"isSelected('plugin', name)\">\n" +
    "    <plugin-conf name=\"name\"></plugin-conf>\n" +
    "  </div>\n" +
    "  <conf-adder\n" +
    "    text=\"Add a plugin\"\n" +
    "    submitter=\"addPlugin(input)\">\n" +
    "  </conf-adder>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <h5>Resources</h5>\n" +
    "  <div>\n" +
    "    <ul class=\"button-group\">\n" +
    "      <li ng-repeat=\"(name, resource) in resources()\">\n" +
    "        <span class=\"tiny button\" ng-click=\"toggleSelection('resource', name)\">\n" +
    "          {{ name }}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "  <div ng-repeat=\"(name, resource) in resources()\" ng-show=\"isSelected('resource', name)\">\n" +
    "    <resource-conf\n" +
    "      name=\"name\"\n" +
    "      resource=\"resource\"\n" +
    "      remover=\"removeResource(name)\">\n" +
    "    </resource-conf>\n" +
    "  </div>\n" +
    "  <conf-adder\n" +
    "    text=\"Create a resource\"\n" +
    "    submitter=\"addResource(input)\">\n" +
    "  </conf-adder>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <h5>Navbar</h5>\n" +
    "  <div class=\"columns large-3\">\n" +
    "    <simple-form text=\"Template\" model=\"navbar().template\"></simple-form>\n" +
    "    <span ng-repeat=\"key in navbarBooleans\">\n" +
    "      <input type=\"checkbox\" ng-model=\"navbar()[key]\"/><label>{{ key }}</label>\n" +
    "    </span>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/dep_tree.html',
    "<div class=\"tree-canvas\">\n" +
    "  <div class=\"tree-settings\">\n" +
    "    <span token-selector=\"state.tokens\"></span>\n" +
    "    <span\n" +
    "      class=\"note right settings-span-button\"\n" +
    "      ng-show=\"plugin.diffPresent\"\n" +
    "      ng-click=\"plugin.toggleDiff()\">\n" +
    "      Toggle Diff\n" +
    "    </span>\n" +
    "  </div>\n" +
    "\n" +
    "  <div\n" +
    "    lang-specific\n" +
    "    dependency-tree\n" +
    "    tokens=\"state.tokens\"\n" +
    "    styles=\"plugin.diffStyles()\"\n" +
    "    to-bottom>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/dep_tree2.html',
    "<div>\n" +
    "  <div class=\"tree-settings\">\n" +
    "    <span token-selector=\"state.tokens\"></span>\n" +
    "    <span\n" +
    "      class=\"note right settings-span-button\"\n" +
    "      ng-show=\"plugin.diffPresent\"\n" +
    "      ng-click=\"plugin.toggleDiff()\">\n" +
    "      Toggle Diff\n" +
    "    </span>\n" +
    "    <span\n" +
    "      class=\"note right settings-span-button\"\n" +
    "      style=\"margin-left: 10px\"\n" +
    "      unused-token-highlighter\n" +
    "      uth-check-property=\"head.id\">\n" +
    "    </span>\n" +
    "  </div>\n" +
    "\n" +
    "  <div\n" +
    "    lang-specific\n" +
    "    dependency-tree\n" +
    "    tokens=\"state.tokens\"\n" +
    "    styles=\"plugin.diffStyles()\"\n" +
    "    to-bottom>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/exercise_demo.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "<p/>\n" +
    "<div id=\"canvas\" class=\"row panel full-height not-scrollable\" full-height>\n" +
    "  <div id=\"main-body\" class=\"columns small-7\">\n" +
    "    <div ng-repeat=\"pl in mainPlugins\">\n" +
    "      <plugin name=\"pl\"/>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div id=\"sidepanel\" class=\"columns small-5\">\n" +
    "    <div id=\"sidepanel-resizer\" full-height resizable></div>\n" +
    "    <div id=\"sidepanel-body\">\n" +
    "      <tabset>\n" +
    "        <tab\n" +
    "          ng-click=\"declareActive(pl.name)\"\n" +
    "          ng-repeat=\"pl in subPlugins\"\n" +
    "          heading=\"{{ pl.name }}\">\n" +
    "          <plugin name=\"pl\" ng-if=\"isActive(pl)\"/>\n" +
    "        </tab>\n" +
    "      </tabset>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/external_history.html',
    "<p>(jQuery implementation)</p>\n" +
    "\n" +
    "<span id=\"undo\" class=\"label radius\">Undo</span>\n" +
    "<span id=\"redo\" class=\"label radius\">Redo</span>\n" +
    "<div id=\"ext-hist-elements\"></div>\n" +
    "\n" +
    "<script src=\"./js/other/external_history.js\"></script>\n"
  );


  $templateCache.put('js/templates/history.html',
    "<div>\n" +
    "  <span class=\"settings-span-button right\" hist-redo/>\n" +
    "  <span class=\"settings-span-button right\" hist-undo/>\n" +
    "  <div delimiter/>\n" +
    "  <div history-list/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/landing_page.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "\n" +
    "<div class=\"canvas-border\"></div>\n" +
    "\n" +
    "<div class=\"panel row large-12 columns\">\n" +
    "  <div class=\"section\">\n" +
    "    <a href=\"https://github.com/latin-language-toolkit/arethusa\"><img style=\"position: absolute; top: 0; right: 0; border: 0;\" src=\"https://camo.githubusercontent.com/e7bbb0521b397edbd5fe43e7f760759336b5e05f/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677265656e5f3030373230302e706e67\" alt=\"Fork me on GitHub\" data-canonical-src=\"https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png\"/></a>\n" +
    "    <p class=\"italic\"><span translate=\"landing.description\"/></p>\n" +
    "    <p><span translate=\"landing.goalsDescription\"/></p>\n" +
    "\n" +
    "    <div style=\"margin: auto\">\n" +
    "      <img src=\"../dist/examples/images/grid.png\" style=\"display: block; padding: 0 2rem; margin: auto\"/>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div class=section>\n" +
    "    <h3><span translate=\"useCases\"/></h3>\n" +
    "    <p><span translate=\"landing.modularNature\"/></p>\n" +
    "\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <div ng-repeat=\"useCase in useCases\">\n" +
    "        <h3 class=\"italic\"><span translate=\"{{ useCase.name }}\"/></h4>\n" +
    "        <div ng-repeat=\"example in useCase.examples\">\n" +
    "          <div\n" +
    "            class=\"large-4 columns panel clickable\"\n" +
    "            ng-click=\"goTo(example.url)\">\n" +
    "            <h4 translate=\"{{ example.name }}\"></h4>\n" +
    "            <img ng-src=\"{{ example.img }}\"/>\n" +
    "            <p>{{ example.caption }}</p>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div class=\"section\">\n" +
    "    <h3><span translate=\"gettingStarted\"/></h3>\n" +
    "    <iframe width=\"640\" height=\"360\" src=\"//www.youtube.com/embed/FbRRoVnVuDs\" frameborder=\"0\" allowfullscreen></iframe>\n" +
    "    <iframe width=\"640\" height=\"360\" src=\"//www.youtube.com/embed/hp-bhasd96g\" frameborder=\"0\" allowfullscreen></iframe>\n" +
    "    <p>\n" +
    "    <a href=\"http://sites.tufts.edu/perseids/instructions/screencasts/\"><span translate=\"landing.moreScreencasts\"/></a>\n" +
    "    </p>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div class=\"section\">\n" +
    "    <h3><span translate=\"development\"/></h3>\n" +
    "    <p><span translate=\"landing.devDescription\"/></p>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div style=\"section\">\n" +
    "    <h3><span translate=\"landing.partners\"/></h3>\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <div class=\"img-container\" style=\"display: inline-block\">\n" +
    "        <a href=\"{{ partners[0].href }}\">\n" +
    "          <img class=\"center\" style=\"height: 200px\" ng-src=\"{{ partners[0].img }}\"/>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "      <div class=\"img-container\" style=\"display: inline-block\">\n" +
    "        <a href=\"{{ partners[1].href }}\">\n" +
    "          <img class=\"center\" style=\"height: 150px\" ng-src=\"{{ partners[1].img }}\"/>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "      <div class=\"img-container\" style=\"display: inline-block\">\n" +
    "        <a href=\"{{ partners[2].href }}\" target=\"_blank\">\n" +
    "          <img class=\"center\" style=\"height: 70px; margin: 2rem\" ng-src=\"{{ partners[2].img }}\"/>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "      <div class=\"img-container\" style=\"display: inline-block\">\n" +
    "        <a href=\"{{ partners[3].href }}\" target=\"_blank\">\n" +
    "          <img class=\"center\" style=\"height: 200px\" ng-src=\"{{ partners[3].img }}\"/>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <p>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div style=\"section\">\n" +
    "    <h3><span translate=\"landing.awards\"/></h3>\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <div class=\"img-container\" style=\"display: inline-block\">\n" +
    "        <a href=\"{{ awards[0].href }}\">\n" +
    "          <img class=\"center\" style=\"height: 120px\" ng-src=\"{{ awards[0].img }}\"/>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"large-12 columns\" style=\"padding: 1rem 0\"/>\n" +
    "\n" +
    "  <div>\n" +
    "    <h3><span translate=\"landing.funders\"/></h3>\n" +
    "    <p><span translate=\"landing.fundersDescription\"/></p>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/templates/main_grid.html',
    "<div>\n" +
    "  <div id=\"arethusa-editor\">\n" +
    "    <div class=\"canvas-border\"/>\n" +
    "\n" +
    "    <div arethusa-grid/>\n" +
    "\n" +
    "    <div arethusa-context-menus tokens=\"state.tokens\" plugins=\"plugins.withMenu\"/>\n" +
    "  </div>\n" +
    "  <div notifications/>\n" +
    "  <div id=\"arethusa-sentence-list\" class=\"hide\"/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/main_with_sidepanel.html',
    "<div>\n" +
    "  <div id=\"arethusa-editor\">\n" +
    "    <div class=\"canvas-border\"/>\n" +
    "\n" +
    "    <div id=\"canvas\" class=\"row panel full-height not-scrollable\" full-height>\n" +
    "      <div id=\"main-body\" to-bottom>\n" +
    "        <div ng-repeat=\"pl in plugins.main\" plugin name=\"{{ pl.name }}\"/>\n" +
    "        <div keys-to-screen/>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"sidepanel\" sidepanel to-bottom class=\"scrollable\">\n" +
    "        <div id=\"sidepanel-resizer\" resizable to-bottom></div>\n" +
    "        <div id=\"sidepanel-body\" arethusa-tabs=\"plugins.sub\"/>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div arethusa-context-menus tokens=\"state.tokens\" plugins=\"plugins.withMenu\"/>\n" +
    "  </div>\n" +
    "  <div notifications/>\n" +
    "  <div id=\"arethusa-sentence-list\" class=\"hide\"/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/main.html',
    "<div class=\"row panel\">\n" +
    "  <div class=\"columns small-12\">\n" +
    "    <h3>Main Controller</h3>\n" +
    "    Selected tokens: {{ state.currentTokensAsStringList() }}\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-repeat=\"pl in plugins\" class=\"row panel\">\n" +
    "  <div class=\"columns small-12\">\n" +
    "    <plugin name=\"{{ pl }}\"/>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/main2.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <div class=\"columns small-12\">\n" +
    "    <div>\n" +
    "      <h3>Main State</h3>\n" +
    "      <p>\n" +
    "        {{ state.selectedTokens }}\n" +
    "        <button deselector class=\"right small\">Deselect all</button>\n" +
    "        <button ng-click=\"toggleDebugMode()\" class=\"right small\">Debug</button>\n" +
    "      </p>\n" +
    "    </div>\n" +
    "    <div debug=\"state.tokens\"></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"row panel full-height\">\n" +
    "  <div class=\"columns small-6\">\n" +
    "    <div ng-repeat=\"pl in mainPlugins\">\n" +
    "      <plugin name=\"pl\"/>\n" +
    "      <hr>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"columns small-6\">\n" +
    "    <tabset>\n" +
    "      <tab ng-repeat=\"pl in subPlugins\" heading=\"{{ pl.name }}\">\n" +
    "        <plugin name=\"pl\"/>\n" +
    "      </tab>\n" +
    "    </tabset>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/main3.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "\n" +
    "<div class=\"canvas-border\"></div>\n" +
    "\n" +
    "<div class=\"panel\">\n" +
    "<a href=\"https://github.com/latin-language-toolkit/arethusa\"><img style=\"position: absolute; top: 0; right: 0; border: 0;\" src=\"https://camo.githubusercontent.com/e7bbb0521b397edbd5fe43e7f760759336b5e05f/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677265656e5f3030373230302e706e67\" alt=\"Fork me on GitHub\" data-canonical-src=\"https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png\"></a>\n" +
    "<h3>Arethusa</h3>\n" +
    "<p>TODO description</p>\n" +
    "\n" +
    "<h3>Use cases or configurations</h3>\n" +
    "<p>Through its modular nature Arethusa can be configured for different use cases:<p>\n" +
    "TODO\n" +
    "<div class=\"row\" data-equalizer>\n" +
    "  <div class=\"large-4 columns panel\" data-equalizer-watch>\n" +
    "    <h4>Treebanking</h4>\n" +
    "    TODO description\n" +
    "    <a href=\"/app/#/staging2?doc=1&s=2\">Example</a>\n" +
    "    TODO image\n" +
    "  </div>\n" +
    "  <div class=\"large-4 columns panel\" data-equalizer-watch>\n" +
    "    <h4>Review mode</h4>\n" +
    "    <a href=\"/app/#/review_test?doc=1&gold=11\">Example</a>\n" +
    "  </div>\n" +
    "  <div class=\"large-4 columns panel\" data-equalizer-watch>\n" +
    "    <h4>Review mode</h4>\n" +
    "    <a href=\"/app/#/review_test?doc=1&gold=11\">Example</a>\n" +
    "  </div>\n" +
    "</div>\n" +
    "The new Grid layout\n" +
    "http://localhost:8081/app/#/staging3?doc=1\n" +
    "\n" +
    "\n" +
    "\n" +
    "A Greek document, including the SG plugin\n" +
    "http://localhost:8081/app/#/sg?doc=athenaeus12&s=1\n" +
    "\n" +
    "An empty document to play around (saving disabled)\n" +
    "http://localhost:8081/app/#/clean?doc=clean1\n" +
    "\n" +
    "<h3>Getting started</h3>\n" +
    "<iframe width=\"640\" height=\"360\" src=\"//www.youtube.com/embed/FbRRoVnVuDs\" frameborder=\"0\" allowfullscreen></iframe>\n" +
    "<iframe width=\"640\" height=\"360\" src=\"//www.youtube.com/embed/hp-bhasd96g\" frameborder=\"0\" allowfullscreen></iframe>\n" +
    "<p>\n" +
    "<a href=\"http://sites.tufts.edu/perseids/instructions/screencasts/\">More screencasts</a>\n" +
    "</p>\n" +
    "\n" +
    "<h3>Development</h3>\n" +
    "<p>\n" +
    "Arethusa is built on the <a href=\"https://angularjs.org/angular.js\">AngularJS</a> javascript web application framework \n" +
    "and provides a back-end independent plugin infrastructure for accessing texts, annotations and linguistic services from a variety of sources. \n" +
    "Extensibility is a guiding design goal - Arethusa includes tools for automatic generation of new plugin skeletons \n" +
    "(<a href=\"https://github.com/latin-language-toolkit/arethusa-cli\">Arethusa::CLI</a>) and detailed development guides are currently in progress (TODO link?), \n" +
    "with the hopes that others will be able to reuse and build upon the platform to add support for other annotation types, \n" +
    "languages and back-end repositories and workflow engines.\n" +
    "</p>\n" +
    "\n" +
    "\n" +
    "<h3>Funders</h3>\n" +
    "<p>This project has received support from the <a href=\"http://www.mellon.org/\">Andrew W. Mellon Foundation</a> and the <a href=\"http://imls.gov/\">Institute of Museum and Library Services</a>.</p>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/templates/morph_form_create.html',
    "<div class=\"small-6 columns\">\n" +
    "  <ul class=\"button-group right\">\n" +
    "    <li>\n" +
    "      <span\n" +
    "        class=\"button micro radius\"\n" +
    "        ng-click=\"reset()\"\n" +
    "        translate=\"reset\">\n" +
    "      </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "      <span\n" +
    "        class=\"button micro radius\"\n" +
    "        ng-click=\"save(mFCForm.$valid)\"\n" +
    "        translate=\"save\">\n" +
    "      </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n" +
    "\n" +
    "<div delimiter></div>\n" +
    "\n" +
    "<form name=\"mFCForm\">\n" +
    "  <div class=\"small-12 columns\">\n" +
    "    <alert\n" +
    "      ng-if=\"alert\"\n" +
    "      class=\"radius center fade-in error\"\n" +
    "      close=\"resetAlert()\">\n" +
    "      {{ translations.createError() }}\n" +
    "    </alert>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"small-12 columns\">\n" +
    "    <div class=\"small-3 columns\">\n" +
    "      <label class=\"right\">Lemma</label>\n" +
    "    </div>\n" +
    "    <div class=\"small-9 columns\">\n" +
    "      <ng-form\n" +
    "        id=\"lemma-form\"\n" +
    "        tooltip-placement=\"top\"\n" +
    "        tooltip=\"{{ lemmaHint }}\">\n" +
    "        <input\n" +
    "          foreign-keys\n" +
    "          class=\"compact error\"\n" +
    "          type=\"text\"\n" +
    "          required\n" +
    "          ng-change=\"declareOk()\"\n" +
    "          ng-model=\"form.lemma\">\n" +
    "        </input>\n" +
    "      </ng-form>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div\n" +
    "    ng-repeat=\"attr in visibleAttributes\"\n" +
    "    ng-init=\"options= m.attributeValues(attr)\">\n" +
    "    <div class=\"small-12 columns\">\n" +
    "      <div class=\"small-3 columns\">\n" +
    "        <label class=\"right\">{{ m.longAttributeName(attr) }}</label>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"small-9 columns\">\n" +
    "        <select\n" +
    "          class=\"compact\"\n" +
    "          required\n" +
    "          ng-model=\"form.attributes[attr]\"\n" +
    "          ng-options=\"options[key].long for key in options | keys\"\n" +
    "          ng-change=\"m.updatePostag(form, attr, form.attributes[attr])\">\n" +
    "        </select>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</form>\n"
  );


  $templateCache.put('js/templates/morph_form_edit.html',
    "<div class=\"row\" ng-repeat=\"(attr, val) in form.attributes\">\n" +
    "  <div class=\"small-3 columns\">\n" +
    "    <label class=\"right\">{{ plugin.longAttributeName(attr) }}</label>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"small-9 columns\">\n" +
    "    <select\n" +
    "      ng-model=\"form.attributes[attr]\"\n" +
    "      ng-init=\"opt.short\"\n" +
    "      ng-options=\"name as opt.long for (name, opt) in plugin.attributeValues(attr)\"\n" +
    "      fire-event=\"{target: 'form', property: 'attr', value: 'val'}\"\n" +
    "      synchronize-postag=\"{form: 'form', attr: 'attr', val: 'val'}\">\n" +
    "    </select>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<small ng-show=\"form.lexInvUri\">Lexical Inventory: {{ form.lexInvUri }}</small>\n"
  );


  $templateCache.put('js/templates/morph_form.html',
    "<ul>\n" +
    "  <li ng-repeat=\"(attr, val) in form.attributes\">\n" +
    "    {{ plugin.longAttributeName(attr) }}: {{ plugin.abbrevAttributeValue(attr, val) }}\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('js/templates/morph.html',
    "<h3>Morph plugin</h3>\n" +
    "<ul>\n" +
    "  <li ng-repeat=\"analysis in plugin.currentAnalyses()\">\n" +
    "    Forms of {{ analysis.string}}\n" +
    "    <ol>\n" +
    "      <li ng-repeat=\"form in analysis.forms\">\n" +
    "        <morph-form></morph-form>\n" +
    "      </li>\n" +
    "    </ol>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('js/templates/morph2.html',
    "<div class=\"right\">\n" +
    "  <prev-token><span class=\"label radius\">prev</span></prev-token>\n" +
    "  <next-token><span class=\"label radius\">next</span></next-token>\n" +
    "</div>\n" +
    "\n" +
    "<!--{{ plugin.analyses }}-->\n" +
    "\n" +
    "<div ng-repeat=\"(id, analysis) in plugin.currentAnalyses()\">\n" +
    "  <p token-with-id value=\"analysis.string\" token-id=\"id\"/>\n" +
    "  <accordion close-others=\"oneAtATime\">\n" +
    "    <accordion-group ng-repeat=\"form in analysis.forms\" >\n" +
    "      <accordion-heading>\n" +
    "         <div class=\"row\">\n" +
    "           <div class=\"columns small-5\">\n" +
    "             • <span ng-style=\"plugin.styleOf(form)\">{{ form.lemma }}\n" +
    "             <br>\n" +
    "             </span> {{ plugin.concatenatedAttributes(form) }}\n" +
    "           </div>\n" +
    "           <div class=\"columns small-2\">{{ form.postag }}</div>\n" +
    "           <div class=\"columns small-2 note\">{{ form.origin }}</div>\n" +
    "           <div form-selector class=\"columns small-2 right end\"></div>\n" +
    "         </div>\n" +
    "      </accordion-heading>\n" +
    "      <morph-form-edit></morph-form-edit>\n" +
    "    </accordion-group>\n" +
    "    <accordion-group heading=\"Create new form\">\n" +
    "      <morph-form-create></morph-form-create>\n" +
    "    </accordion-group>\n" +
    "  </accordion>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/morph3.html',
    "<div\n" +
    "  class=\"note right span-settings-button\"\n" +
    "  style=\"margin-top: 10px\"\n" +
    "  unused-token-highlighter\n" +
    "  uth-check-property=\"morphology\"\n" +
    "  uth-auxiliary-property=\"postag\">\n" +
    "</div>\n" +
    "\n" +
    "<div ng-repeat=\"(id, analysis) in plugin.currentAnalyses()\">\n" +
    "  <div class=\"small-12 columns\" lang-specific>\n" +
    "    <p token-with-id value=\"analysis.string\" token-id=\"id\"/>\n" +
    "    <p ng-if=\"plugin.gloss\">\n" +
    "      <label>\n" +
    "        <span translate=\"morph.lemmaTranslation\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateGloss(id)\"\n" +
    "          ng-model=\"analysis.gloss\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "    </p>\n" +
    "    <p ng-if=\"plugin.additionalFields\">\n" +
    "      <label>\n" +
    "        <span translate=\"morph.alternateGloss\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateAlternateGloss(id)\"\n" +
    "          ng-model=\"analysis.alternateGloss\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "      <label>\n" +
    "        <span translate=\"morph.semanticRole\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateSemanticRole(id)\"\n" +
    "          ng-model=\"analysis.semanticRole\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "      <label>\n" +
    "        <span translate=\"morph.include\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateInclude(id)\"\n" +
    "          ng-model=\"analysis.include\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "      <label>\n" +
    "        <span translate=\"morph.multiword\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateMultiword(id)\"\n" +
    "          ng-model=\"analysis.multiword\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "      <label>\n" +
    "        <span translate=\"morph.notes\"/>\n" +
    "        <input class=\"compact\"\n" +
    "          type=\"text\"\n" +
    "          ng-change=\"plugin.updateNotes(id)\"\n" +
    "          ng-model=\"analysis.notes\">\n" +
    "        </input>\n" +
    "      </label>\n" +
    "    </p>\n" +
    "    <accordion close-others=\"oneAtATime\">\n" +
    "      <accordion-group\n" +
    "        ng-repeat=\"form in analysis.forms\"\n" +
    "        is-open=\"plugin.expandSelection && form.selected\">\n" +
    "        <accordion-heading>\n" +
    "          <div class=\"row\" accordion-highlighter>\n" +
    "            <div form-selector class=\"columns large-1 small-1\"></div>\n" +
    "            <div class=\"columns large-3 small-5 text\">\n" +
    "              <span ng-style=\"plugin.styleOf(form)\" lang-specific>{{ form.lemma }}\n" +
    "              <br>\n" +
    "              </span> {{ plugin.concatenatedAttributes(form) }}\n" +
    "            </div>\n" +
    "            <div\n" +
    "              class=\"columns large-4 small-5 postag\">\n" +
    "              {{ form.postag }}\n" +
    "            </div>\n" +
    "            <div class=\"columns large-1 hide-for-small hide-for-medium note end\">{{ form.origin }}</div>\n" +
    "          </div>\n" +
    "          <hr class=\"small\">\n" +
    "        </accordion-heading>\n" +
    "        <div class=\"small-12 columns\" morph-form-attributes=\"form\" token-id=\"id\"></div>\n" +
    "        <p class=\"small-12 columns\"/>\n" +
    "        <hr>\n" +
    "      </accordion-group>\n" +
    "    </accordion>\n" +
    "  </div>\n" +
    "  <div ng-if=\"plugin.canEdit()\">\n" +
    "    <div class=\"small-6 columns\">\n" +
    "      <button\n" +
    "        reveal-toggle=\"mfc{{ id }}\"\n" +
    "        class=\"micro radius\">\n" +
    "        <span translate=\"morph.createNewForm\"/>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <morph-form-create\n" +
    "      id=\"mfc{{ id }}\"\n" +
    "      morph-id=\"id\"\n" +
    "      morph-token=\"analysis\"\n" +
    "      class=\"hide\">\n" +
    "    </morph-form-create>\n" +
    "  </div>\n" +
    "  <div delimiter/>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/navbar_landing.html',
    "<div class=\"fixed\">\n" +
    "  <nav class=\"top-bar\" data-topbar>\n" +
    "    <ul class=\"title-area\">\n" +
    "      <li class=\"name\">\n" +
    "      <h1><a href=\"#\"><img ng-src=\"{{ logo }}\"/></a></h1>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "    <section class=\"top-bar-section\">\n" +
    "      <ul class=\" has-form right\">\n" +
    "        <li><a class=\"button\" translate-language/></li>\n" +
    "      </ul>\n" +
    "    </section>\n" +
    "  </nav>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/navbar1.html',
    "<div class=\"fixed\">\n" +
    "  <nav class=\"top-bar\" data-topbar>\n" +
    "    <ul class=\"title-area\">\n" +
    "      <li class=\"name\">\n" +
    "      <h1><a href=\"#\"><img ng-src=\"{{ logo }}\"/></a></h1>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "    <section class=\"top-bar-section\">\n" +
    "      <ul navbar-search/>\n" +
    "      <ul navbar-navigation/>\n" +
    "      <ul navbar-buttons class=\"right\"/>\n" +
    "    </section>\n" +
    "  </nav>\n" +
    "</div>\n" +
    "<div help-panel class=\"hide row panel\"/>\n" +
    "<div global-settings-panel class=\"hide row panel\"/>\n"
  );


  $templateCache.put('js/templates/relation.html',
    "<div\n" +
    "  class=\"note right span-settings-button\"\n" +
    "  style=\"margin-top: 10px\"\n" +
    "  unused-token-highlighter\n" +
    "  uth-check-property=\"relation.label\">\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"plugin.advancedMode\">\n" +
    "  <div relation-multi-changer class=\"small-12 columns\"/>\n" +
    "  <div delimiter/>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-repeat=\"(id, obj) in plugin.currentLabels()\">\n" +
    "    <div class=\"small-12 columns\" style=\"padding-bottom: 1rem\">\n" +
    "      <div token-with-id value=\"obj.string\" token-id=\"id\" style=\"padding-bottom: .4rem\"/>\n" +
    "      <div label-selector obj=\"obj.relation\"/>\n" +
    "        <syntactical-description\n" +
    "          ng-if=\"plugin.syntaxDescriptions\"\n" +
    "          token-id=\"id\">\n" +
    "        </syntactical-description>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('js/templates/search.html',
    "<div class=\"small-12 columns\">\n" +
    "  <div search-by-string/>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"small-12 columns\" ng-repeat=\"pl in plugin.searchPlugins\">\n" +
    "  <div plugin-search=\"pl\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"small-12 columns\">\n" +
    "  <label class=\"inline\">\n" +
    "    <span translate=\"search.foundTokens\"/>\n" +
    "  </label>\n" +
    "  <ul lang-specific>\n" +
    "    <li\n" +
    "      ng-repeat=\"(id, type) in state.selectedTokens\"\n" +
    "      class=\"fade fast clickable\"\n" +
    "      ng-mouseenter=\"hovered = true\"\n" +
    "      ng-mouseleave=\"hovered = false\"\n" +
    "      ng-class=\"{ 'search-result-hovered': hovered }\"\n" +
    "      ng-click=\"state.deselectToken(id, type)\"\n" +
    "      token-with-id\n" +
    "      value=\"state.asString(id)\"\n" +
    "      token-id=\"id\">\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/sg.html',
    "<div class=\"small-12 columns\">\n" +
    "  <div ng-repeat=\"(id, grammar) in plugin.currentGrammar()\">\n" +
    "    <p token-with-id value=\"grammar.string\" token-id=\"id\"/>\n" +
    "    <p class=\"text\" style=\"margin-left: 0.75rem\">{{ grammar.hint }}</p>\n" +
    "    <div ng-hide=\"grammar.hint\">\n" +
    "      <div sg-ancestors=\"grammar\"/>\n" +
    "      <br/>\n" +
    "      <ul ng-if=\"plugin.canEdit()\" class=\"nested-dropdown\">\n" +
    "        <li class=\"first-item\">Select Smyth Categories\n" +
    "          <ul\n" +
    "            class=\"top-menu\"\n" +
    "            nested-menu-collection\n" +
    "            property=\"\"\n" +
    "            current=\"grammar\"\n" +
    "            ancestors=\"plugin.defineAncestors\"\n" +
    "            all=\"grammar.menu\"\n" +
    "            label-as=\"plugin.labelAs\"\n" +
    "            empty-val=\"true\">\n" +
    "          </ul>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div sg-grammar-reader>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('js/templates/text_with_context.html',
    "<p lang-specific>\n" +
    "  <span\n" +
    "    ng-if=\"plugin.showContext\"\n" +
    "    text-context=\"plugin.context.pre\">\n" +
    "  </span>\n" +
    "  <span ng-repeat=\"token in plugin.tokens\">\n" +
    "    <span\n" +
    "      token=\"token\"\n" +
    "      colorize=\"true\"\n" +
    "      click=\"true\"\n" +
    "      hover=\"true\"\n" +
    "      highlight=\"true\">\n" +
    "    </span>\n" +
    "  </span>\n" +
    "  <span\n" +
    "    ng-if=\"plugin.showContext\"\n" +
    "    text-context=\"plugin.context.post\">\n" +
    "  </span>\n" +
    "</p>\n" +
    "\n"
  );


  $templateCache.put('js/templates/text.html',
    "<h3>Text plugin</h3>\n" +
    "<table>\n" +
    "  <tr>\n" +
    "    <td ng-repeat=\"token in state.tokens\">\n" +
    "      {{ token.id }}\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "  <tr>\n" +
    "      <!--this mouse behavior should get moved\n" +
    "          inside the token directive eventually-->\n" +
    "    <td\n" +
    "      ng-repeat=\"token in state.tokens\"\n" +
    "      ng-click=\"state.toggleSelection(token.id, 'click')\"\n" +
    "      ng-mouseenter=\"state.selectToken(token.id, 'hover')\"\n" +
    "      ng-mouseleave=\"state.deselectToken(token.id, 'hover')\">\n" +
    "      <token ng-class=\"{selected: state.isSelected(token.id)}\"></token>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "</table>\n"
  );


  $templateCache.put('js/templates/text2.html',
    "<p lang-specific>\n" +
    "  <span ng-repeat=\"token in plugin.tokens\">\n" +
    "    <span\n" +
    "      token=\"token\"\n" +
    "      colorize=\"true\"\n" +
    "      click=\"true\"\n" +
    "      hover=\"true\"\n" +
    "      highlight=\"true\">\n" +
    "    </span>\n" +
    "    <!--Deactivated for now - not safe to use with ellipsis-->\n" +
    "    <!--<br ng-if=\"token.terminator && !$last\"/>-->\n" +
    "  </span>\n" +
    "</p>\n"
  );


  $templateCache.put('js/templates/token.html',
    "<!--tcm is for tokenContextMenu-->\n" +
    "<span\n" +
    "  ng-class=\"selectionClass()\"\n" +
    "  context-menu\n" +
    "  menu-trigger=\"rightclick\"\n" +
    "  menu-id=\"tcm{{ token.id }}\"\n" +
    "  menu-position=\"bottom\"\n" +
    "  menu-obj=\"token\">{{ token.string }}</span>\n"
  );


  $templateCache.put('js/templates/tree.html',
    "<arethusa-navbar></arethusa-navbar>\n" +
    "\n" +
    "<div class=\"row panel\">\n" +
    "  <div class=\"columns small-12\">\n" +
    "    <div>\n" +
    "      <h3>Main State</h3>\n" +
    "      <p>\n" +
    "        {{ state.selectedTokens }}\n" +
    "        <button deselector class=\"right small\">Deselect all</button>\n" +
    "        <button ng-click=\"toggleDebugMode()\" class=\"right small\">Debug</button>\n" +
    "      </p>\n" +
    "    </div>\n" +
    "    <div debug=\"state.tokens\"></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"row panel full-height\">\n" +
    "  <div class=\"columns small-12\">\n" +
    "    <div ng-repeat=\"pl in mainPlugins\">\n" +
    "      <plugin name=\"pl\"/>\n" +
    "      <hr>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );

}]);
