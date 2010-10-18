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
    setupPage(msg);
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
  // Remove the anchor at the end, if there is one
  url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
  // Removes the query after the file name, if there is one
  url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
  // Get everything after last slash, if any
  url = url.substring(url.lastIndexOf("/") + 1, url.length);
  return url;
};

var setupPage = function(msg) {
  console.log('Setup page');
  $('#page_url').html(anchorHtml(msg['pageUrl']));
  var mediaUrl = msg['srcUrl'];
  if (!mediaUrl) {
    mediaUrl = msg['linkUrl'];
  }
  $('#media_url').html(anchorHtml(mediaUrl));
  $('#media_type').text(msg['mediaType']);
  $('#fname').val(getFileName(mediaUrl));
  $('#desc').val(msg['alt']);
  $('#license').val(msg['license']);
  $('#date').text(msg['date']);
};

// Downloadify.create('downloadify',{
//   filename: function(){
//     return mediaUrl + '.rdf';
//   },
//   data: function() {
//     return ;
//   },
//   onComplete: function() {},
//   onCancel: function() {},
//   onError: function() {},
//   swf: 'downloadify.swf',
//   downloadImage: 'download.png',
//   width: 100,
//   height: 30,
//   transparent: true,
//   append: false
// });
// window.open(mediaUrl);

$(document).ready(function() {
  port.postMessage({
    'cmd': 'getLastInfo'
  });
});
