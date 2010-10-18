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

var setupPage = function(msg) {
  console.log('Setup page');
  $('#page_url').val(msg['pageUrl']);
  $('#media_url').val(msg['mediaUrl']);
  $('#fname').val('fname todo');
  $('#desc').val('desc todo');
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
//   downloadImage: 'images/download.png',
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
