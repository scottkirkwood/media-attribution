// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

console.log('media_attrib.js');

var port = chrome.extension.connect({name: 'attrib'});

var getLicense = function() {
  var license;
  $('a[href]').each(function(index, elem) {
    var href = $(elem).attr('href');
    if (href.search(/creativecommons.org.licenses/i) != -1) {
      console.log('Found CC: ' + href);
      if (!license || href.length > license.length) {
        license = href;
      }
    }
  });
  return license;
};


/**
 * Is this variable defined, and are the array of subvariables also defined.
 * @param {string} variable The name of the variable we are looking for.
 * @param {Array.string} opt_subvariables List of strings to also look for.
 */
var isDefined = function(variable, opt_subvariables) {
  if (typeof(window[variable]) == "undefined") {
    return false;
  }
  console.log('Was defined: ' + variable);
  if (opt_subvariables) {
    var sub = window[variable];
    for (var i in opt_subvariables) {
      if (sub[opt_subvariables[i]]) {
        sub = sub[opt_subvariables[i]];
        console.log('found: ' + opt_subvariables[i]);
      } else {
        console.log('Not found: ' + opt_subvariables[i]);
        return false;
      }
    }
  }
  return true;
};

var getAuthor = function() {
  var author;
  if (isDefined('_user', ['nickname'])) {
    // Name from picasaweb
    return _user['nickname'];
  }
  var re_reservedBy = /((?:Some|All) rights reserved by(?:\s\w+)+)/i;
  for (var i = 0; i < document.all.length; i++) {
    var txt = $(document.all[i]).text();
    if (txt && re_reservedBy.test(txt)) {
      var result = re_reservedBy.exec(txt);
      author = result[0];
      console.log('found: ' + author);
      break; // TODO(scottkirkwood): find the closest to the image
    }
  }
  return author;
};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var getAlt = function(srcUrl) {
  $('img[src]').each(function(index, elem) {
    var curSrc = $(elem).attr('src');
    if (endsWith(srcUrl, curSrc)) {
      var alt = $(elem).attr('alt');
      if (alt) { return alt; }
      alt = $(elem).attr('title');
      if (alt) { return alt; }
      var anchor = $(elem).closest("a");
      alt = $(anchor).attr('title');
      return alt;
    }
  });
};

var createPage = function(msg) {
  var alt = getAlt(msg['srcUrl']);
  if (alt) {
    console.log('Found alt for image: ' + alt);
  }

  var lastModified = document.lastModified;
  if (!lastModified) {
    lastModified = "" + new Date();
  }

  var license = getLicense();

  var author = getAuthor();

  // Create the new page.
  port.postMessage({
    'cmd': 'createPage',
    'license': license,
    'author': author,
    'alt': alt,
    'date': lastModified
  });
};

port.onMessage.addListener(function(msg) {
  if (msg.cmd == 'lastInfo') {
    createPage(msg);
  } else {
    console.log('Got unknown message: ' + msg.cmd);
    port.postMessage({error: 'unknown message'});
  }
});

port.postMessage({
  'cmd': 'getLastInfo'
});

