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
Make an attribution list.

 Dependencies:
   Python 2.6, simplejson
"""

import optparse
import os
import re
import simplejson
import sys



def _parse_json(pathname):
  info = {}
  try:
    info = simplejson.load(open(pathname));
  except TypeError, e:
    print e
    return info
  print 'Read %r' % pathname
  return info

def handle_file(fname, extensions):
  if os.path.isdir(fname):
    return None
  for ext in extensions:
    if fname.endswith(ext):
      return _parse_json(fname)
  return None

def parse_dirs(paths, extensions):
  ret = []
  for path in paths:
    for fname in os.listdir(path):
      info = handle_file(os.path.join(path, fname), extensions)
      if info:
        ret.append(info)
  return ret

def create_entry(attrib):
  lines = []
  lines.append('<li>')
  lines.append('<a href="%(mediaUrl)s" class="attrib-ref">%(fname)s</a>'
      % attrib)
  if 'desc' in attrib and attrib['desc']:
    lines.append(' (%(desc)s)' % attrib)
  if 'author' in attrib and attrib['author']:
    lines.append(' by %(author)s' % author)
  lines.append('</li>')
  return lines

def create_list(attribs):
  lines = []
  for attrib in attribs:
    lines += create_entry(attrib)
  return lines
def output(outfname, paths):
  attribs = parse_dirs(paths, ['.txt', '.json'])
  lines = []
  lines.append('<html>')
  lines.append('<head>')
  lines.append('<title>Attribution list</title>')
  lines.append('</head>')
  lines.append('<body>')
  lines.append('<h1>Attribution List</h1>')
  lines += create_list(attribs)
  lines.append('</body>')
  lines.append('</html>')
  fname = open(outfname, 'w')
  fname.write('\n'.join(lines))
  fname.close()

if __name__ == '__main__':
  parser = optparse.OptionParser()
  parser.add_option('-o', '--output', dest='output',
      help='Output filename', default='out.html')
  options, args = parser.parse_args()
  paths = ['.'] + args
  output(options.output, paths)
