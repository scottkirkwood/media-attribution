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
 * @fileoverview download image and image info.
 * @author scottkirkwood@google.com (Scott Kirkwood)
 */
var ma_info = {}

var createPage = function(msg) {
  console.log('Create page');
  saveLastInfo(msg);
  chrome.tabs.create({
      'url': chrome.extension.getURL('metadata.html')}
  );
};

var saveLastInfo = function(msg) {
  var keys = [
    'alt',
    'author',
    'date',
    'fname',
    'desc',
    'license',
    'mediaType',
    'pageUrl',
    'srcUrl',
    'shortSrcUrl',
    'mediaUrl',
    'shortMediaUrl',
  ];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (msg[key]) {
      ma_info[key] = msg[key];
      console.log('Save> ' + key + ': ' + msg[key]);
    }
  }
}

var getLastInfo = function(port) {
  console.log('getLastInfo');
  port.postMessage({
    cmd: 'lastInfo',
    'alt': ma_info['alt'],
    'author': ma_info['author'],
    'date': ma_info['date'],
    'license': ma_info['license'],
    'linkUrl': ma_info['linkUrl'],
    'mediaType': ma_info['mediaType'],
    'pageUrl': ma_info['pageUrl'],
    'srcUrl': ma_info['srcUrl'],
  });
};

chrome.extension.onConnect.addListener(
  function(port) {
    if (port.name != 'attrib') {
      console.log('Not listening to port named: ' + port.name);
      return;
    }
    port.onMessage.addListener(
      function(msg) {
        if (msg.cmd == 'getSetting') {
          var obj = getSetting(msg.name, '');
          console.log('Get setting for: ' + msg.name + ' = ' + obj);
          port.postMessage({
              cmd: 'getSetting',
              name: msg.name,
              value: obj });
        } else if (msg.cmd == 'createPage') {
          createPage(msg);
        } else if (msg.cmd == 'saveLastInfo') {
          saveLastInfo(msg);
        } else if (msg.cmd == 'getLastInfo') {
          getLastInfo(port);
        } else {
          console.log('Got unknown message: ' + msg.cmd);
          port.postMessage({error: 'unknown message'});
        }
      }
    );
  }
);

/**
 * Inject these two files in the page.
 * The second will also execute a function.
 */
function onDownloadAttrib(onClickData, tab) {
  ma_info['mediaType'] = onClickData.mediaType;
  ma_info['srcUrl'] = onClickData.srcUrl;
  ma_info['pageUrl'] = onClickData.pageUrl;
  ma_info['linkUrl'] = onClickData.linkUrl;

  chrome.tabs.executeScript(null, {file: 'jquery-1.4.2.min.js'});
  chrome.tabs.executeScript(null, {file: 'media_attrib.js'});
}

chrome.contextMenus.create({
  "title": "Media+Attribution...",
  "contexts": ["link", "image", "video", "audio"],
  "onclick": onDownloadAttrib
});
