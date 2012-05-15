import commands
import pickle
import os

PROJECT_PATH=os.path.dirname(os.path.abspath(__file__))
data = {
    'branch':commands.getoutput("cd %s ; hg id -b 2>/dev/null" % PROJECT_PATH),
    'rev':commands.getoutput("cd %s ; hg id -n 2>/dev/null" % PROJECT_PATH),
    'tag':commands.getoutput("cd %s ; hg id -t 2>/dev/null" % PROJECT_PATH),
}
fh_out = open("/var/lib/domoweb/domoweb.dat", "wb")
# default protocol is zero
# -1 gives highest prototcol and smallest data file size
pickle.dump(data, fh_out, protocol=0)
fh_out.close()