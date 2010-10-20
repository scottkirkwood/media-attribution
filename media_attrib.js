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
  var license;
  var author;
  if (isDefined('_user', ['nickname'])) {
    // Name from picasaweb
    return [license, _user['nickname']];
  }
  if ($('#lhid_user_nickname').length) {
    // Name from picasaweb
    return [license, $('#lhid_user_nickname').find('b').text()];
  }
  var re_reservedBy = /((?:Some|All) rights reserved) by((?:\s\w+)+)/i;
  for (var i = 0; i < document.all.length; i++) {
    var txt = $(document.all[i]).text();
    if (txt && re_reservedBy.test(txt)) {
      var result = re_reservedBy.exec(txt);
      license = result[1];
      author = result[2].replace(/^\s+/, '');
      console.log('found: ' + author);
      break; // TODO(scottkirkwood): find the closest to the image
    }
  }
  console.log('license: ' + license);
  console.log('author: ' + author);
  return [license, author];
};

function endsWith(str, suffix) {
  if (!str || !suffix) {
    return false;
  }
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var getAlt = function(srcUrl) {
  var alt;
  if ($('#lhid_caption').length) {
    // Picasa web
    return $('#lhid_caption').find('.gphoto-photocaption-caption').text();
  }
  $('img[src]').each(function(index, elem) {
    var curSrc = $(elem).attr('src');
    if (endsWith(srcUrl, curSrc)) {
      var curAlt = $(elem).attr('alt');
      if (curAlt) {
        console.log('Found alt: ' + curAlt);
        alt = curAlt;
      } else {
        curAlt = $(elem).attr('title');
        if (curAlt) {
          console.log('Found title: ' + curAlt);
          alt = curAlt;
        } else {
          var anchor = $(elem).closest("a");
          alt = $(anchor).attr('title');
          console.log('Found <a title=: ' + alt);
        }
      }
    }
  });
  return alt;
};

var createPage = function(msg) {
  var alt = getAlt(msg['mediaUrl']);
  if (alt) {
    console.log('Found alt for image: ' + alt);
  }

  var lastModified = document.lastModified;
  if (!lastModified) {
    lastModified = "" + new Date();
  }

  var license = getLicense();

  var lic_author = getAuthor();
  if (!license && lic_author[0]) {
    license = lic_author[0];
  }
  var author = lic_author[1];

  // Create the new page.
  port.postMessage({
    "cmd": "createPage",
    "mediaUrl": mediaUrl,
    "license": license,
    "author": author,
    "alt": alt,
    "date": lastModified
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
  'cmd': 'getLastInfo',
  'mediaUrl' : mediaUrl
});

