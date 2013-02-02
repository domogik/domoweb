import urllib
import urllib2
from httplib import BadStatusLine
from django.db import models
from django.utils import simplejson
from exceptions import RinorNotAvailable, RinorError
from django.forms.models import model_to_dict

class RestManager(models.Manager):
    def all_dict(self):
        result = {}
        records = super(RestManager, self).all()
        for record in records:
            result[record.id] = model_to_dict(record)
        return result
    
class RestModel(models.Model):
    objects = RestManager()
    list_path = None
    index = None
    rest_uri = None
    
    class Meta:
        abstract = True # Prevent the table to be created with syncdb

#    def save(self):
#        if not self.id:
#            # Create
#        else:
#            # Update
#        super(RinorModel, self).save()

    @staticmethod
    def setRestUri(uri):
        print "SET REST SERVER: [%s]" % uri
        RestModel.rest_uri = uri

    @classmethod
    def get_list(cls):
        data = cls._get_data(cls.list_path)
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[cls.index]

    @classmethod
    def delete_details(cls, id):
        data = cls._delete_data(cls.delete_path, [id])
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        if len(data[cls.index]) > 0:
            return data[cls.index][0]
        else:
            return None

    @classmethod
    def post_list(cls, data):
        data = cls._post_data(cls.create_path, data)
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[cls.index][0]
    
    @staticmethod
    def _clean_url(path, data=None):
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

    @classmethod
    def _get_data(cls, path, data=None):
        if not cls.rest_uri:
            raise RinorError
        _path = RestModel._clean_url(path, data)
        _path = "%s%s" % (RestModel.rest_uri, _path)
        print "GET REST : [%s]" % _path
        return _get_json(_path)

    @classmethod
    def _delete_data(cls, path, data=None):
        if not cls.rest_uri:
            raise RinorError
        _path = RestModel._clean_url(path, data)
        _path = "%s%s" % (RestModel.rest_uri, _path)
        print "DELETE REST : [%s]" % _path
        return _get_json(_path)

    @classmethod
    def _post_data(cls, path, data=None):
        if not cls.rest_uri:
            raise RinorError
        _path = RestModel._clean_url(path, data)
        _path = "%s%s" % (RestModel.rest_uri, _path)
        print "POST REST : [%s]" % _path
        return _get_json(_path)

    @classmethod
    def _put_data(cls, path, data=None):
        if not cls.rest_uri:
            raise RinorError
        _path = RestModel._clean_url(path, data)
        _path = "%s%s" % (RestModel.rest_uri, _path)
        print "PUT REST : [%s]" % _path
        return _get_json(_path)
    
def _get_json(uri):
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