import urllib
import urllib2
from django.core.cache import cache
from django.utils import simplejson
from domoweb.models import Parameters
from domoweb.exceptions import RinorNotConfigured, RinorNotAvailable, RinorError
    
class RinorPipe():
    cache_expiry = 3600
    list_path = None
    index = None
    paths = None    
    
    def _clean_url(self, path, data=None):
        if (data):
            _data = '/'.join([urllib.quote(d, '') for d in data])
            _path = "%s/%s/" % (path, _data)
        else:
            _path = "%s/" % path
        return _path
        
    def _get_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "GET %s" % _path
        # Try the cache first
        _data = cache.get(_path)
        if _data:
            print "Rinor Resource Found in cache."
        else:
            print "Rinor Resource Not found in cache. Downloading..."
            _data = _get_json(_path)
            if (self.cache_expiry and self.cache_expiry > 0):
                try:
                    self.paths.index(_path)
                except ValueError:
                    self.paths.append(path)
                    cache.set(_path, _data, self.cache_expiry)
        return _data
 
    def _post_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "GET %s" % _path
        # Invalidate cache
        self.clear_cache()
        return _get_json(_path)

    def _put_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "GET %s" % _path
        # Invalidate cache
        self.clear_cache()
        return _get_json(_path)

    def _delete_data(self, path, data=None):
        _path = self._clean_url(path, data)
        print "GET %s" % _path
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
        raise RinorError(404, "PK Not found")
    
    @classmethod
    def clear_cache(self):
        for path in self.paths:
            print "Clear %s" % path
            cache.delete(path)

def _get_json(path):
    try:
        ip = Parameters.objects.get(key='rinor_ip')
        port = Parameters.objects.get(key='rinor_port')
        uri = "http://%s:%s%s" % (ip.value, port.value, path)
    except Parameters.DoesNotExist:
        raise RinorNotConfigured
    else:
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