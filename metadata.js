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

/**
 * @fileoverview Related methods for metadata.html
 * Requires jquery.
 * @author scottkirkwood@google.com (Scott Kirkwood)
 */

var port = chrome.extension.connect({name: 'attrib'});

console.log('metadata.js');

port.onMessage.addListener(function(msg) {
  console.log('metadata port listen');
  if (msg.cmd == 'lastInfo') {
    getLastInfo(msg);
  } else {
    console.log('Got unknown message: ' + msg.cmd);
    port.postMessage({error: 'unknown message'});
  }
});

var anchorHtml = function(url) {
  return '<a href="' + url + '">' + url + '</a>';
};

/**
 * After clicking a button it runs goo.gl to create a link.
 *
 * @param {string} id_from The id name to get the url from.
 * @param {string} id_hide The id name to hide if successful.
 * @param {string} id_to The id name to show the new shortened url if successful.
 */
var googlShorten = function(id_from, id_hide, id_to) {
  $('#' + id_hide).hide();
  $('#' + id_to).html('<b>Hang on...</b>');
  var url = $('#' + id_from).val();
  if (!url) {
    url = $('#' + id_from).find('a').attr('href');
  }
  if (!url) {
    return;
  }
  $.ajax({
    type: "POST",
    url: "http://goo.gl/api/shorten",
    data: ({"url": url}),
    dataType: "json",
    beforeSend: function(req) {
      req.setRequestHeader('X-Auth-Google-Url-Shortener', 'true');
      return true;
    },
    success: function(data) {
      var shortUrl = data['short_url'];
      console.log('Short url is: ' + shortUrl);
      $('#' + id_hide).hide();
      $('#' + id_to).html(anchorHtml(shortUrl));
      onChange();
    },
    error: function(req, textStatus, errorThrown) {
      $('#' + id_hide).show();
      $('#' + id_to).html('<pre class="error">Failed: ' + textStatus + '</pre>');
    }
  });
};

/**
 * Grab the filename from the url.
 */
var getFileName = function(url) {
  if (!url) {
    return url;
  }
  // Remove the anchor at the end, if there is one
  url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
  // Removes the query after the file name, if there is one
  url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
  // Get everything after last slash, if any
  url = url.substring(url.lastIndexOf("/") + 1, url.length);
  return url;
};

var getVal = function(id) {
  var elem = $(id);
  if (!elem.length) {
    console.log('Error could not find tag: ' + id);
    return;
  }
  if (elem.get(0).tagName == "INPUT") {
    return elem.val();
  }
  var atag = elem.find('a');
  if (atag.length) {
    return atag.attr('href');
  }
  if (elem && elem.text()) {
    return elem.text();
  }
  return;
};


var maybeSet = function(obj, key, val) {
  if (val && val.length > 0) {
    obj[key] = val;
  }
};

var onChange = function() {
  $('#save_meta_as').attr('href', saveAsUrl());
  cmd = {'cmd': 'saveLastInfo'}
  maybeSet(cmd, 'author', getVal('#author'));
  maybeSet(cmd, 'desc', getVal('#desc'));
  maybeSet(cmd, 'fname', getVal('#fname'));
  maybeSet(cmd, 'license', getVal('#license'));
  maybeSet(cmd, 'mediaType', getVal('#media_type'));
  maybeSet(cmd, 'date', getVal('#date'));
  maybeSet(cmd, 'mediaUrl', getVal('#media_url'));
  maybeSet(cmd, 'pageUrl', getVal('#page_url'));
  maybeSet(cmd, 'mediaShortUrl', getVal('#media_short_url'));
  maybeSet(cmd, 'pageShortUrl', getVal('#page_short_url'));
  addLicenseIcons(cmd['license']);
  port.postMessage(cmd);
};

var pleaseRightClick = function() {
    window.alert('Please right click, then click "Save Link As...".');
    return false;
};

var getLastInfo = function(msg) {
  console.log('Setup page');
  $('#save_media_as').bind('click', pleaseRightClick);
  $('#save_meta_as').bind('click', pleaseRightClick);
  var mediaUrl = msg['mediaUrl'];
  $('#page_url').html(anchorHtml(msg['pageUrl']));
  $('#media_url').html(anchorHtml(mediaUrl));
  $('#media_type').text(msg['mediaType']);
  if (msg['fname']) {
    $('#fname').val(msg['fname']);
  } else {
    $('#fname').val(getFileName(mediaUrl));
  }
  if (msg['desc']) {
    $('#desc').val(msg['desc']);
  } else {
    $('#desc').val(msg['alt']);
  }
  $('#license').val(msg['license']);
  $('#author').val(msg['author']);
  $('#date').text(msg['date']);
  $('#save_media_as').attr('href', mediaUrl);
  $('#theimage').attr('src', mediaUrl);
  onChange();
};

var getAsJsonString = function() {
  console.log('getAsJsonString');
  var obj = {
    'author': getVal('#author'),
    'date': getVal('#date'),
    'desc': getVal('#desc'),
    'fname': getVal('#fname'),
    'license': getVal('#license'),
    'mediaType': getVal('#media_type'),
    'mediaUrl': getVal('#media_url')
  };
  var pageUrlShort = getVal('#page_short_url');
  var mediaUrlShort = getVal('#media_short_url');
  if (mediaUrlShort) {
    obj['mediaShortUrl'] = mediaUrlShort;
  }
  if (pageUrlShort) {
    obj['pageShortUrl'] = pageUrlShort;
  }
  obj['pageUrl'] = getVal('#page_url');
  return JSON.stringify(obj, null, 2);
};

var addCreativeCommonLicenses = function(license) {
  var lic_text = {
    'by': 'Attribution - You must attribute the work in the manner specified ' +
          'by the author or licensor (but not in any way that suggests that ' +
          'they endorse you or your use of the work).',
    'sa': 'Share Alike - You can distribute derivative works only under a ' +
          'license identical to the license that governs your work',
    'nc': 'Non-commercial - You can copy, distribute, display, and perform ' +
          'this work - and derivative works based upon it - ' +
          'but for non-commercial purposes only.',
    'nd': 'No derivative works - You can copy, distribute, display, and ' +
          'perform only verbatim copies of your work, but no derivative ' +
          'works based upon it.'
  };
  var re_cc = /creativecommons.org\/[^\/]+\/([^\/]+)/i;
  var result = re_cc.exec(license);
  if (!result) {
    console.log('Unable to parse "' + license + '" as a creative commons license');
    return;
  }

  var html = [];
  html.push('<a href="' + license + '" class="icon-link"><img src="img/cc.svg" ' +
            'alt="CC License" class="license-icon license-1" title="Creative Commons License">');
  var licenses = result[1].split('-');
  for (var i = 0; i < licenses.length; i++) {
    var lic = licenses[i];
    if (lic in lic_text) {
      html.push('<img src="img/' + lic + '.svg" title="' + lic_text[lic] +
                '" class="license-icon license-' + (i + 2) + '">');
    }
  }
  html.push('</a>');
  $('#license-icons').html(html.join('\n'));
};

var addAllRightsReserved = function(license) {
  var html = [];
  html.push('<img src="img/copyright.svg" title="' + license +
            '" class="license-icon license-1">');
  $('#license-icons').html(html.join('\n'));
};

var addDunnoRights = function(license) {
  var html = [];
  html.push('<img src="img/copyright-uncertain.svg" title="' + license +
            '" class="license-icon license-1">');
  $('#license-icons').html(html.join('\n'));
};

var addLicenseIcons = function(license) {
  var re_cc = /creativecommons.org/i;
  var re_allRights = /all\s+rights/i;
  if (re_cc.test(license)) {
    addCreativeCommonLicenses(license);
  } else if (re_allRights.test(license)) {
    addAllRightsReserved(license);
  } else {
    addDunnoRights(license);
  }
};

var saveAsUrl = function() {
  var toStr = getAsJsonString();
  console.log('ToSTr:' + toStr);
  return "data:text/plain;charset=utf-8;base64," + btoa(toStr);
};

$(document).ready(function() {
  port.postMessage({
    'cmd': 'getLastInfo'
  });
});
