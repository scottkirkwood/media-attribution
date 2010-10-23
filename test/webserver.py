#!/usr/bin/env python

import BaseHTTPServer
import cgi
import os
import string
import time

class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def do_GET(self):
    fname = os.path.join(os.path.dirname(__file__), self.path[1:])
    if not os.path.exists(fname):
      self.send_error(404,'File Not Found: %s' % self.path)
      return
    f = open(fname)
    self.send_response(200)
    self.send_header('Content-type', 'text/html')
    self.end_headers()
    self.wfile.write(f.read())
    f.close()
    return

def main():
  try:
    server = BaseHTTPServer.HTTPServer(('', 8080), MyHandler)
    dirname = os.path.join(os.path.dirname(__file__))
    print 'started httpserver rooted at %r...' % dirname
    server.serve_forever()
  except KeyboardInterrupt:
    print '^C received, shutting down server'
    server.socket.close()

if __name__ == '__main__':
  main()
