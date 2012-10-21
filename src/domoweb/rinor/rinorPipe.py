import urllib
import urllib2
from django.core.cache import cache
from django.utils import simplejson
from domoweb.models import Parameter
from domoweb.exceptions import RinorNotConfigured, RinorNotAvailable, RinorError
from httplib import BadStatusLine
from domoweb.signals import index_updated, rinor_changed

class RinorPipe():
    cache_expiry = 3600
    list_path = None
    index = None
    paths = None    
    dependencies = None
    
    def __init__(self):
        index_updated.connect(self.index_signal, dispatch_uid=self.index)
        rinor_changed.connect(self.rinor_signal, dispatch_uid=self.index)

    def index_signal(self, sender, **kwargs):
        if (self.dependencies and kwargs['index'] in self.dependencies):
            print "%s Received Cache signal from %s" % (self.__class__.__name__, kwargs['index'])
            # Invalidate cache
            self.clear_cache()

    def rinor_signal(self, sender, **kwargs):
        print "%s Received Rinor Changed signal" % (self.__class__.__name__)
        # Invalidate cache
        self.clear_cache()
            
    def _clean_url(self, path, data=None):
        if (data):
            _tmp = []
            for d in data:
                if type(d) == str or type(d) == unicode:
                    d=urllib.quote(d.encode('utf8'), '')
                else:
                    d=str(d)
                _tmp.append(d)
            _data = '/'.join(_tmp)
            _path = "%s/%s/" % (path, _data)
        else:
            _path = "%s/" % path
        return _path
        
    def _get_data(self, path, data=None):
        _path = self._clean_url(path, data)
        # Try the cache first
        _data = cache.get(_path)
        if _data:
            print "RINOR GET %s [Found in cache]" % _path
        else:
            print "RINOR GET %s [Not Found in cache] Downloading..." % _path
            _data = _get_json(_path)
            if (self.cache_expiry and self.cache_expiry > 0):
                try:
                    self.paths.index(_path)
                except ValueError:
                    self.paths.append(_path)
                    cache.set(_path, _data, self.cache_expiry)
        return _data
 
    def _post_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "RINOR POST %s" % _path
        # Invalidate cache
        self.clear_cache()
        return _get_json(_path)

    def _put_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "RINOR PUT %s" % _path
        # Invalidate cache
        self.clear_cache()
        return _get_json(_path)

    def _delete_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "RINOR DELETE %s" % _path
        # Invalidate cache
        self.clear_cache()
        return _get_json(_path)
        
    def get_list(self):
        data = self._get_data(self.list_path)
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[self.index]

    def get_dict(self):
        _list = self.get_list()
        _dict = {}
        for item in _list:
            _dict[item.id] = item
        return _dict
    
    def get_pk(self, pk):
        # get one object from data source
        data = self.get_list()
        for obj in data:
            if (obj.id == int(pk)):
                return obj
        return None
#        raise RinorError(404, "PK Not found")
    
    @classmethod
    def clear_cache(self):
        while len(self.paths) > 0:
            _path = self.paths.pop()
            cache.delete(_path)
            print "RINOR CACHE Cleared %s" % _path
        index_updated.send(sender=self, index=self.index)

def _get_json(path):
    try:
        ip = Parameter.objects.get(key='rinor_ip')
        port = Parameter.objects.get(key='rinor_port')
    except Parameter.DoesNotExist:
        raise RinorNotConfigured
    else:
        try:
            prefix = Parameter.objects.get(key='rinor_prefix')
        except Parameter.DoesNotExist:
            uri = "http://%s:%s%s" % (ip.value, port.value, path)
        else:
            uri = "http://%s:%s/%s%s" % (ip.value, port.value, prefix.value, path)
    
        retries = 0
        attempts = 0
        while True:
            try:
                attempts += 1
                respObj = urllib2.urlopen(uri)
                break
            except urllib2.HTTPError, e:
                raise RinorNotAvailable(code=e.code, resp=e.read())
            except urllib2.URLError, e:
                if attempts <= retries:
                    continue
                else:
                    raise RinorNotAvailable(reason=e.reason)
            except BadStatusLine:
                raise RinorError(reason="No response for '%s'" % uri)
        resp = respObj.read()
        resp_obj = simplejson.loads(resp)
    return _objectify_json(resp_obj)
    
def _objectify_json(i):
    if isinstance(i, dict):
        transformed_dict = JSONDict()
        for key, val in i.iteritems():
            transformed_dict[key] = _objectify_json(val)
        return transformed_dict
    elif isinstance(i, list):
        for idx in range(len(i)):
            i[idx] = _objectify_json(i[idx])
    return i
    
class JSONDict(dict):
    def __getattr__(self, attrname):
        if self.has_key(attrname):
            return self[attrname]
        else:
            raise AttributeError