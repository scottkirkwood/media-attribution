#!/usr/bin/env python
#
# Copyright 2010 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Monitors |paths| for modifications .txt files.

If a .txt file is created or modified in on of the monitor paths (non
recursive). Then we run a script to scan the txt file to see if it has
colon split lines with "fname" and "mediaUrl" as keys.

If these both exist, then it make sure that the .txt matches fname (with .txt)
added and renames the media filename (if found) to match as well.

For example:
  A file called "download.txt" is found and has:
  ...
  mediaUrl: http://image.com/img_1234.jpg
  fname: blue_flower.jpg

  It detects that img_1234.jpg exist in the same directory as download.txt and
  renames it to "blue_flower.jpg".

  It also renames "download.txt" to "blue_flower.jpg.txt".

 Dependencies:
   Linux, Python 2.6, Pyinotify
"""

import os
import pyinotify
import subprocess
import re
import sys


def _rename_file(from_name, to_name):
  if from_name == to_name:
    return
  print 'Renaming %r to %r' % (
      os.path.split(from_name)[1], os.path.split(to_name)[1])
  if os.path.exists(to_name):
    print 'Removing existing %r' % to_name
    os.unlink(to_name)
  os.rename(from_name, to_name)


def _handler_txt(pathname):
  print 'Handling %r' % pathname
  info = {}
  user_fname = None
  mediaUrl = None
  for line in open(pathname):
    if line.startswith('#'):
      continue
    keyval = line.split(':', 1)
    if len(keyval) != 2:
      break
    key = keyval[0].strip()
    val = keyval[1].strip()
    if key == 'mediaUrl':
      mediaUrl = val
    if key == 'fname':
      user_fname = val
      break
  if not mediaUrl or not user_fname:
    return

  re_fname = re.compile(r'/([^/]+)$')
  grps = re_fname.search(mediaUrl)
  if grps:
    media_fname = grps.group(1)
  user_fname_txt = user_fname + '.txt'
  cur_dir, meta_name = os.path.split(pathname)
  print 'Parsed %r' % meta_name
  full_pathname_no_txt = pathname[:-4]
  full_user_fname = os.path.join(cur_dir, user_fname)
  full_user_fname_txt = os.path.join(cur_dir, user_fname_txt)
  full_media_fname = os.path.join(cur_dir, media_fname)
  if pathname != full_user_fname_txt:
    _rename_file(pathname, full_user_fname_txt)
  if meta_name != user_fname:
    if os.path.exists(full_media_fname):
      _rename_file(full_media_fname, full_user_fname)
    elif os.path.exists(full_pathname_no_txt):
      _rename_file(full_pathname_no_txt, full_user_fname)
    else:
      print 'Unable to figure out what to do with %r' % user_fname


def make(pathname):
  if pathname.endswith('.txt'):
    try:
      _handler_txt(pathname)
    except IOError, e:
      print e


class OnWriteHandler(pyinotify.ProcessEvent):
  def my_init(self, func, extensions):
    self.func = func
    self.extensions = extensions

  def process_IN_CREATE(self, event):
    if all(not event.pathname.endswith(ext) for ext in self.extensions):
      return
    self.func(event.pathname)

  def process_IN_MODIFY(self, event):
    if all(not event.pathname.endswith(ext) for ext in self.extensions):
      return
    self.func(event.pathname)


def monitor(paths, extensions, exclusions):
  paths = [os.path.abspath(p) for p in paths]
  wm = pyinotify.WatchManager()
  handler = OnWriteHandler(func=make, extensions=extensions)
  notifier = pyinotify.Notifier(wm, default_proc_fun=handler)
  excl = pyinotify.ExcludeFilter(exclusions)
  wm.add_watch(paths, pyinotify.ALL_EVENTS,
      rec=False,  # recursive
      auto_add=False,  # start monitoring newly created subdirectories
      exclude_filter=excl)
  print '==> Started monitoring dir(s): %s' % ', '.join(paths)
  print '==> For extensions: %s' % ', '.join(extensions)
  print '==> (type ^c to exit)'
  notifier.loop()


if __name__ == '__main__':
  paths = ['.'] + sys.argv[1:]
  extensions = ['.txt']
  exclusions = []

  monitor(paths, extensions, exclusions)
