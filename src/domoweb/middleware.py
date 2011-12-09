from domoweb import exceptions
from django.http import HttpResponseServerError
from django.template import Context, loader
from httplib import BadStatusLine
from domoweb.models import Parameters

class ExceptionMiddleware(object):

    def process_exception(self, request, exception):
        if isinstance(exception, exceptions.RinorError):
            t = loader.get_template('error/RinorError.html')
            c = Context({'code':exception.code, 'reason':exception.reason})
            return HttpResponseServerError(t.render(c))
        elif isinstance(exception, BadStatusLine):
            t = loader.get_template('error/BadStatusLine.html')
            c = Context()
            return HttpResponseServerError(t.render(c))
        elif isinstance(exception, RinorNotAvailable):
            _ip = Parameters.objects.get(key='rinor_ip')
            _port = Parameters.objects.get(key='rinor_port')
            t = loader.get_template('error/BadStatusLine.html')
            c = Context({'rinor_url':"http://%s:%s" % (_ip.value, _port.value)})
            return HttpResponseServerError(t.render(c))
        return