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
    console.log('Href');
    return atag.attr('href');
  }
  if (elem && elem.text()) {
    return elem.text();
  }
  return;
};


var maybeSet = function(obj, key, val) {
  if (val) {
    obj[key] = val;
  }
};

var onChange = function() {
  $('#savelinkas').attr('href', saveAsUrl());
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
  port.postMessage(cmd);
};

var getLastInfo = function(msg) {
  console.log('Setup page');
  $('#page_url').html(anchorHtml(msg['pageUrl']));
  var mediaUrl = msg['srcUrl'];
  if (!mediaUrl) {
    mediaUrl = msg['linkUrl'];
  }
  $('#media_url').html(anchorHtml(mediaUrl));
  $('#media_type').text(msg['mediaType']);
  if (msg['fname']) {
    console.log('Set from fname');
    $('#fname').val(msg['fname']);
  } else {
    console.log('Set from mediaUrl');
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
  $('#savemediaas').attr('href', mediaUrl);
  if (msg['srcUrl']) {
    $('#theimage').attr('src', msg['srcUrl']);
  }
  onChange();
};

var getAsString = function() {
  console.log('getAsString');
  var lst = [];
  lst.push('pageUrl: ' + getVal('#page_url'));
  var pageUrlShort = getVal('#page_short_url');
  if (pageUrlShort) {
    lst.push('pageShortUrl: ' + pageUrlShort);
  }
  lst.push('mediaUrl: ' + getVal('#media_url'));
  var mediaUrlShort = getVal('#media_short_url');
  if (mediaUrlShort) {
    lst.push('mediaShortUrl: ' + mediaUrlShort);
  }
  lst.push('mediaType: ' + getVal('#media_type'));
  lst.push('fname: ' + getVal('#fname'));
  lst.push('desc: ' + getVal('#desc'));
  lst.push('license: ' + getVal('#license'));
  lst.push('author: ' + getVal('#author'));
  lst.push('date: ' + getVal('#date'));
  return lst.join('\n');
};

var saveAsUrl = function() {
  var toStr = getAsString();
  console.log('ToSTr:' + toStr);
  return "data:text/plain;charset=utf-8;base64," + btoa(getAsString());
};

$(document).ready(function() {
  port.postMessage({
    'cmd': 'getLastInfo'
  });
});
