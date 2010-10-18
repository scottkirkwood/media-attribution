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

var license = undefined;

$('a[href]').each(function(index, elem) {
  var href = $(elem).attr('href');
  if (href.search(/creativecommons.org.licenses/i) != -1) {
    console.log('Found CC: ' + href);
    license = href;
  }
});

// Create the new page.
port.postMessage({
  'cmd': 'createPage',
  'license': license
});
