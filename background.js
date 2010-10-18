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
var ma_mediaType = undefined;
var ma_srcUrl = undefined;
var ma_pageUrl = undefined;
var ma_linkUrl = undefined;
var ma_license = undefined;

function createPage(msg) {
  console.log('Create page');
  ma_license = msg['license'];
  chrome.tabs.create({
      'url': chrome.extension.getURL('metadata.html')}
  );
}

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
        } else if (msg.cmd == 'getLastInfo') {
          console.log('getLastInfo');
          port.postMessage({
            cmd: 'lastInfo',
            mediaType: ma_mediaType,
            srcUrl: ma_srcUrl,
            linkUrl: ma_linkUrl,
            license: ma_license});
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
  ma_mediaType = onClickData.mediaType;
  ma_srcUrl = onClickData.srcUrl;
  ma_pageUrl = onClickData.pageUrl;
  ma_linkUrl = onClickData.linkUrl;
  ma_linkUrl = undefined;
  chrome.tabs.executeScript(null, {file: 'jquery-1.4.2.min.js'});
  chrome.tabs.executeScript(null, {file: 'media_attrib.js'});
}

chrome.contextMenus.create({
  "title": "Media+Attribution...",
  "contexts": ["link", "image", "video", "audio"],
  "onclick": onDownloadAttrib
});
