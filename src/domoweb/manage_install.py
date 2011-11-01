#!/usr/bin/env python
# 
# A clone of manage.py, with multi-threadedness monkeypatched in.
# http://nedbatchelder.com/blog/201103/quick_and_dirty_multithreaded_django_dev_server.html
import os, sys
from django.core.management import execute_manager

try:
    import settings_install # Assumed to be in the same directory.
    settings = settings_install
except ImportError:
    import sys
    sys.stderr.write("Error: Can't find the file 'settings_install.py' in the directory containing %r.\n" % __file__)
    sys.exit(1)

def monkey_patch_for_multi_threaded():
    # This monkey-patches BaseHTTPServer to create a base HTTPServer class that 
    # supports multithreading 
    import BaseHTTPServer, SocketServer 
    OriginalHTTPServer = BaseHTTPServer.HTTPServer

    class ThreadedHTTPServer(SocketServer.ThreadingMixIn, OriginalHTTPServer): 
        def __init__(self, server_address, RequestHandlerClass=None): 
            OriginalHTTPServer.__init__(self, server_address, RequestHandlerClass) 

    BaseHTTPServer.HTTPServer = ThreadedHTTPServer

if __name__ == "__main__":
    monkey_patch_for_multi_threaded()
    execute_manager(settings)
    
def run_manager():
    """ This method is called by setuptools generated wrapper.
    """
    monkey_patch_for_multi_threaded()
    execute_manager(settings)