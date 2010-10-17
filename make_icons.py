#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.

"""Make the icons for each size."""

__author__ = 'scottkirkwood@google.com (Scott Kirkwood)'

import os
import subprocess
import sys

def make_one(source, dest, w, h):
  """Create on image from svg source.
  Args:
    source: the svg filename
    dest: the png filename.
    w: width in pixels
    h: height in pixels
  """
  args = [
      'inkscape',
      '--export-area-page',
      '--export-png', dest,
      '--export-width', str(w),
      '--export-height', str(h),
      source
  ]
  ret = subprocess.call(args)
  if ret:
    print 'Failed to make image with %s' % ' '.join(args)
    sys.exit(-1)

def make_em(source, dest_format, whs):
  """Create the images:
  Args:
    source: is the svg filename to use
    dest_format: is the name%dx%d.png file to output.
    xys: list of (x,y) sizes to export to.
  """
  for w, h in whs:
    dest_fname = dest_format % (w, h)
    make_one(source, dest_fname, w, h)

def main():
  sizes = [(128, 128), (19, 19), (48, 48),
           (32, 32), (16, 16)]
  make_em('docs/icon.svg', 'icon%dx%d.png', sizes)

if __name__ == '__main__':
  main()
