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

// Store in memory information about each media.
// Keyed off of mediaUrl
var maInfo = {}
// Each new meta tab (metadata.html) refers to a mediaUrl
// map this relationship
var maTabIdToMetaMap = {}
// These are all the known keys for maInfo.
var maKeys = [
  'alt',
  'author',
  'date',
  'desc',
  'fname',
  'license',
  'mediaShortUrl',
  'mediaType',
  'mediaUrl',
  'pageShortUrl',
  'pageUrl',
];

var createMetaPage = function(msg) {
  var mediaUrl = msg['mediaUrl'];
  saveLastInfo(msg);
  chrome.tabs.create({
      'url': chrome.extension.getURL('metadata.html')},
      function (tab) {
        console.log('Adding tab id:' + tab.id);
        console.log('MediaUrl3: ' + mediaUrl);
        maTabIdToMetaMap[tab.id] = mediaUrl;
      }
  );
};

var saveLastInfo = function(msg) {
  var mediaUrl = msg['mediaUrl'];
  if (!mediaUrl) {
    console.log('Cant find mediaUrl');
    return;
  }
  for (var i = 0; i < maKeys.length; i++) {
    var key = maKeys[i];
    if (key in msg) {
      console.log('Save: ' + key + ' = ' + msg[key]);
      maInfo[mediaUrl][key] = msg[key];
    }
  }
}

var maybeSet = function(obj, key, val) {
  if (val) {
    obj[key] = val;
  }
};

var getLastInfo = function(mediaUrl, port) {
  cmd = {'cmd': 'lastInfo' };
  for (var i = 0; i < maKeys.length; i++) {
    var key = maKeys[i];
    if (key in maInfo[mediaUrl]) {
      maybeSet(cmd, key, maInfo[mediaUrl][key]);
    }
  }
  port.postMessage(cmd);
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
          createMetaPage(msg);
        } else if (msg.cmd == 'saveLastInfo') {
          saveLastInfo(msg);
        } else if (msg.cmd == 'getLastInfo') {
          var tabId = port.sender.tab.id;
          var mediaUrl = ('mediaUrl' in msg) ? msg['mediaUrl'] : maTabIdToMetaMap[tabId];
          if (mediaUrl) {
            console.log('Mediaurl: ' + mediaUrl);
          } else {
            console.log('Cannot find info for tabId: ' + tabId);
          }
          getLastInfo(mediaUrl, port);
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
  var mediaUrl = onClickData.srcUrl ? onClickData.srcUrl : onClickData.linkUrl;
  console.log('mediaUrl: ' + mediaUrl);
  maInfo[mediaUrl] = { };
  maInfo[mediaUrl]['mediaType'] = onClickData.mediaType;
  maInfo[mediaUrl]['mediaUrl'] = mediaUrl;
  maInfo[mediaUrl]['pageUrl'] = onClickData.pageUrl ? onClickData.pageUrl : onClickData.frameUrl;

  chrome.tabs.executeScript(null, {code: [
    'var mediaUrl = "' + mediaUrl + '";'
  ].join('\n')});
  chrome.tabs.executeScript(null, {file: 'jquery-1.4.2.min.js'});
  chrome.tabs.executeScript(null, {file: 'media_attrib.js'});
}

chrome.contextMenus.create({
  "title": "Media+Attribution...",
  "contexts": ["link", "image", "video", "audio"],
  "onclick": onDownloadAttrib
});
