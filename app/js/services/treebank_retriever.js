'use strict';
/* A newable factory to handle xml files using the Perseus Treebank Schema
 *
 * The constructor functions takes a configuration object (that typically
 * contains a resource object for this service).
 *
 */
angular.module('arethusa').factory('TreebankRetriever', [
  'documentStore',
  'configurator',
  '$location',
  function (documentStore, configurator, $location) {
    function formatId(id) {
      return arethusaUtil.formatNumber(id, 4);
    }
    function xmlTokenToState(token, sentenceId) {
      // One could formalize this to real rules that are configurable...
      //
      // Remember that attributes of the converted xml are prefixed with underscore
      return {
        id: formatId(token._id),
        sentenceId: sentenceId,
        string: token._form,
        morphology: {
          lemma: token._lemma,
          postag: token._postag
        },
        relation: { label: token._relation },
        head: { id: formatId(token._head) }
      };
    }
    function xmlSentenceToState(words, id) {
      var tokens = {};
      angular.forEach(words, function (xmlToken, i) {
        var token = xmlTokenToState(xmlToken, id);
        tokens[token.id] = token;
      });
      return {
        id: id,
        tokens: tokens
      };
    }
    function parseDocument(json) {
      var sentences = arethusaUtil.toAry(json.treebank.sentence);
      return arethusaUtil.inject([], sentences, function (memo, sentence, k) {
        memo.push(xmlSentenceToState(sentence.word, sentence._id));
      });
    }

    function findAdditionalConfInfo(json) {
      var linkInfo = json.treebank.link;
      var links =  linkInfo ? arethusaUtil.toAry(linkInfo) : [];
      return arethusaUtil.inject({}, links, function(memo, link) {
        memo[link._title] = link._href;
      });
    }

    function parsePreselections(selector) {
      var preselections = arethusaUtil.toAry($location.search()[selector]);
      return arethusaUtil.map(preselections, function(id) {
        return formatId(id);
      });
    }

    return function (conf) {
      var resource = configurator.provideResource(conf.resource);

      this.preselections = parsePreselections(conf.preselector);
      this.getData = function (callback) {
        resource.get().then(function (res) {
          var xml = res.data;
          var json = arethusaUtil.xml2json(res.data);
          var moreConf = findAdditionalConfInfo(json);
          documentStore.addDocument(conf.docIdentifier, {
            json: json,
            xml: xml,
            conf: moreConf
          });
          callback(parseDocument(json));
        });
      };
    };
  }
]);
