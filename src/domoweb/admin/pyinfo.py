#!/usr/bin/env python

import os, platform, re, sys
from cgi import escape

import sys
 
# a simple class with a write method
class WritableObject:
    def __init__(self):
        self.content = []
    def write(self, string):
        self.content.append(string)
    def fullText(self): 
        return ''.join(self.content)
 
# example with redirection of sys.stdout
foo = WritableObject()                   # a writable object
sys.stdout = foo                         # redirection

# Import optional modules (generally as ordered in the Python Library Reference, if it exists)
optional_modules_list = [
'Cookie', # needed for full function of this program
'zlib', 'gzip', 'bz2', 'zipfile', 'tarfile', # compression
'ldap',
'socket',
'audioop', 'curses', 'imageop', 'aifc', 'sunau', 'wave', 'chunk', 'colorsys', 'rgbimg', 'imghdr', 'sndhdr', 'ossaudiodev', 'sunaudiodev', # multimedia (internal)
'kdecore', 'OpenGL', 'pygame', 'pyglet', 'pygtk', 'qt', 'PyQt4', 'Tkinter', 'visual', 'wx', # gui toolkits (external)
'adodbapi', 'cx_Oracle', 'ibm_db', 'mxODBC', 'MySQLdb', 'pgdb', 'PyDO', 'sapdbapi', 'sqlite3','sqlite', 'pysqlite', # databases
'cherrypy', 'Crypto', 'django', 'IPython', 'java', 'mod_python', 'mx.DateTime', 'numpy', 'pylons', 'twisted', 'turbogears', 'zope'] # misc external modules

for i in optional_modules_list:
	try:
		module = __import__(i)
		sys.modules[i] = module
		globals()[i] = module
	except (ImportError, DeprecationWarning):
		globals()[i] = False
	except:
		pass

# Naming convention for various options
supported = { 0: "disabled", 1: "enabled" }

# Name -> URL Mapping
urls = {
'Apache' : 'http://httpd.apache.org/',
'Firefox' : 'http://www.mozilla.org/firefox/',
'mod_perl' : 'http://perl.apache.org/',
'mod_python' : 'http://www.modpython.org/',
'mod_ssl' : 'http://www.modssl.org/',
'Mozilla' : 'http://www.mozilla.org/',
'OpenSSL' : 'http://www.openssl.org/',
'Perl' : 'http://www.perl.com/',
'PHP' : 'http://www.php.net/',
'Python-LDAP' : 'http://python-ldap.sourceforge.net'
}

# This function dumps a simple two column table out
def print_tc_table(heading, table_list):
	print "<table class='info'><th colspan=\"2\" class=\"h\">%s</th>" % heading;
	while table_list:
		print "<tr><td class=\"e\">%s</td><td class=\"v\">%s</td></tr>" % (table_list.pop(0), table_list.pop(0))
	print "</table><br />";

# This function returns supported[1] (enabled) if a module is imported, supported[0] (disabled) if it isn't
def imported(module, version_key = False):
	if sys.modules.has_key(module):
		if version_key:
			try: return supported[1] + ', version %s' % getattr(sys.modules[module], version_key)
			except: return supported[1]
		else: return supported[1]
	else: return supported[0]

# Create a list for the core python information
table = []

# Print Python version
print """
<table class='info'>
  <tr class="h"><td class="version">Python Version %s</td></tr>
</table><br />
""" % sys.version.split(" ")[0];


#
# Gather main Python information
#
if hasattr(sys, "subversion"): table += "Python Subversion", ", ".join(sys.subversion)

# OS version is complicated
if platform.dist()[0] != '' and platform.dist()[1] != '':
	table += "OS Version", "%s %s (%s %s)" % (platform.system(), platform.release(), platform.dist()[0].capitalize(), platform.dist()[1])
else:
	table += "OS Version", "%s %s" % (platform.system(), platform.release())

if hasattr(sys, "executable"): table += "Executable", sys.executable
table += "Build Date", platform.python_build()[1]
table += "Compiler", platform.python_compiler()
if hasattr(sys, "api_version"): table += "Python API", sys.api_version

# Print out the main Python information
print_tc_table("Python System and Build Information", table)





#
# Gather the interpreter's nitty gritty information
#
table = []

if hasattr(sys, "builtin_module_names"): table += "Built-in Modules", ", ".join(sys.builtin_module_names)
table += "Byte Order", sys.byteorder + " endian"
if hasattr(sys, "getcheckinterval"): table += "Check Interval", sys.getcheckinterval()
if hasattr(sys, "getfilesystemencoding"): table += "File System Encoding", sys.getfilesystemencoding()
table += "Maximum Integer Size", str(sys.maxint) + " (%s)" % str(hex(sys.maxint)).upper().replace("X", "x")
if hasattr(sys, "getrecursionlimit"): table += "Maximum Recursion Depth", sys.getrecursionlimit()

if hasattr(sys, "tracebacklimit"): table += "Maximum Traceback Limit", sys.tracebacklimit
else: table += "Maximum Traceback Limit", "1000"

table += "Maximum Unicode Code Point", sys.maxunicode

# Print out the nitty gritty
print_tc_table("Python Internals", table)



#
# Gather OS internals
#
table = []
if hasattr(os, "getcwd"): table += "Current Working Directory", os.getcwd()
if hasattr(os, "getegid"): table += "Effective Group ID", os.getegid()
if hasattr(os, "geteuid"): table += "Effective User ID", os.geteuid()
if hasattr(os, "getgid"): table += "Group ID", os.getgid()
if hasattr(os, "getgroups"): table += "Group Membership", ", ".join(map(str, os.getgroups()))
if hasattr(os, "linesep"): table += "Line Seperator", repr(os.linesep)[1:-1]
if hasattr(os, "getloadavg"): table += "Load Average", ", ".join(map(str, map(lambda x: round(x, 2), os.getloadavg()))) # oof
if hasattr(os, "pathsep"): table += "Path Seperator", os.pathsep

try:
	if hasattr(os, "getpid") and hasattr(os, "getppid"):
		table += "Process ID", ("%s (parent: %s)" % (os.getpid(), os.getppid()))
except: pass

if hasattr(os, "getuid"): table += "User ID", os.getuid()

print_tc_table("OS Internals", table)



#
# Gather environmental variables
#
table = []

# Pull in the environmental variables and sort them
envvars = os.environ.keys()
envvars.sort()

for envvar in envvars:
	if envvar in ("HTTP_USER_AGENT", "SERVER_SOFTWARE", "REQUEST_URI", "QUERY_STRING"):
		os.environ[envvar] = escape(os.environ[envvar])
		for i in urls.keys():
			os.environ[envvar] = os.environ[envvar].replace(i, "<a href=\"%s\">%s</a>" % (urls[i], i))
		table += envvar, os.environ[envvar]
	elif envvar == "HTTP_REFERER":
		table += envvar, "<a href=\"%s\">%s</a>" % (escape(os.environ[envvar]), escape(os.environ[envvar]))
	else:
		table += envvar, escape(os.environ[envvar])

print_tc_table("Environmental Variables", table)




#
# Gather cookies
#
if imported('Cookie') == supported[1]:
	try:
		table = []

		if os.environ.has_key("HTTP_COOKIE"):
			cookies = Cookie.SimpleCookie(os.environ["HTTP_COOKIE"])
			cookies_keys = cookies.keys()
			cookies_keys.sort()
			for crumb in cookies_keys:
				table += crumb, escape(cookies[crumb].value)

			print_tc_table("Cookies", table)
	except:
		pass



#
# Gather database info
#
table = []

table += "DB2/Informix (ibm_db)", imported('ibm_db')
table += "MSSQL (adodbapi)", imported('adodbapi')
table += "MySQL (MySQL-Python)", imported('MySQLdb')
table += "ODBC (mxODBC)", imported('mxODBC')
table += "Oracle (cx_Oracle)", imported('cx_Oracle')
table += "PostgreSQL (PyGreSQL)", imported('pgdb')
table += "Python Data Objects (PyDO)", imported('PyDO')
table += "SAP DB (sapdbapi)", imported('sapdbapi')
table += "Sqlite3", imported('sqlite3')
table += "Sqlite", imported('sqlite')
table += "pySqlite", imported('pysqlite')

print_tc_table("Database Support", table)



#
# Gather data compression info
#
table = []

table += "Bzip2 Support", imported('bz2')
table += "Gzip Support", imported('gzip')
table += "Tar Support", imported('tarfile')
table += "Zip Support", imported('zipfile')
table += "Zlib Support", imported('zlib')

print_tc_table("Data Compression and Archiving", table)



#
# Gather LDAP information
#
table = []

if imported('ldap') == supported[1]:
	table += "<a href=\"%s\">Python-LDAP</a> Version" % urls["Python-LDAP"], ldap.__version__
	table += "API Version", ldap.API_VERSION
	table += "Default Protocol Version", ldap.VERSION
	table += "Minimum Protocol Version", ldap.VERSION_MIN
	table += "Maximum Protocol Version", ldap.VERSION_MAX
	table += "SASL Support (Cyrus-SASL)", supported[ldap.SASL_AVAIL]
	table += "TLS Support (OpenSSL)", supported[ldap.TLS_AVAIL]
	table += "Vendor Version", ldap.VENDOR_VERSION


	print_tc_table("LDAP", table)





#
# Gather Socket information
#
table = []

if imported('socket') == supported[1]:
    table += "Hostname", socket.gethostname()
    try: table += "Hostname (fully qualified)", socket.gethostbyaddr(socket.gethostname())[0]
    except: pass
    try: table += "IP Address", socket.gethostbyname(socket.gethostname())
    except: pass
    table += "IPv6 Support", supported[getattr(socket, "has_ipv6", False)]
    table += "SSL Support", supported[hasattr(socket, "ssl")]

    print_tc_table("socket", table)

#
# Gather Multimedia Services info
#
table = []

table += "AIFF Support", imported('aifc')
table += "Color System Conversion Support", imported('colorsys')
table += "curses Support", imported('curses', 'version')
table += "IFF Chunk Support", imported('chunk')
table += "Image Header Support", imported('imghdr')
table += "OSS Audio Device Support", imported('ossaudiodev')
table += "Raw Audio Support", imported('audioop')
table += "Raw Image Support", imported('imageop')
table += "SGI RGB Support", imported('rgbimg')
table += "Sound Header Support", imported('sndhdr')
table += "Sun Audio Device Support", imported('sunaudiodev')
table += "Sun AU Support", imported('sunau')
table += "Wave Support", imported('wave')

print_tc_table("Multimedia and User Interfaces (internal modules)", table)



#
# Gather User Interfaces
#
table = []

table += "Pygame Support", imported('pygame')
table += "pyglet Support", imported('pyglet')
table += "PyGTK Support", imported('pygtk')
table += "PyKDE Support", imported('kdecore')
table += "PyOpenGL Support", imported('OpenGL')
table += "PyQt3 Support", imported('qt')
table += "PyQt4 Support", imported('PyQt4')
table += "Tcl/Tk (Tkinter) Support", imported('Tkinter')
table += "VPython Support", imported('visual')
table += "wxWidgets Support", imported('wx')

print_tc_table("Multimedia and User Interfaces (external modules)", table)



#
# Gather optional external modules
#
table = []

table += "CherryPy Support", imported('cherrypy', '__version__')
table += "Crypto Support", imported('Crypto', '__version__')
table += "Django Support", imported('django')
table += "IPython Support", imported('IPython', '__version__')
table += "Jython Support", imported('java')
table += "mod_python Support", imported('mod_python', 'version')
table += "mxDateTime Support", imported('mx.DateTime')
table += "NumPy Support", imported('numpy', 'version')
table += "Pylons Support", imported('pylons', '__version__')
table += "TurboGears Support", imported('turbogears')
table += "Twisted Support", imported('twisted', '__version__')
table += "Zope Support", imported('zope')

print_tc_table("Miscellaneous External Modules (Site Packages)", table)

sys.stdout = sys.__stdout__
