from domoweb.exceptions import RinorError, RinorNotAvailable, BadDomogikVersion
from django.core.exceptions import MiddlewareNotUsed
from django.http import HttpResponseServerError
from django.template import Context, loader
from httplib import BadStatusLine
from domoweb.models import Parameters, Widget
from domoweb.rinor.pipes import InfoPipe
from django.conf import settings
import os

class RinorMiddleware(object):

    def process_request(self, request):
        """
        Check if rinor is configured
        """
        if not request.path.startswith('/config/'):
            try:
                _ip = Parameters.objects.get(key='rinor_ip')
                _port = Parameters.objects.get(key='rinor_port')
                if not 'rinor_api_version'  in request.session:
                    _info = InfoPipe().get_info_extended()
                    
                    if (not _info.info.rinor_version_superior and not _info.info.rinor_version_inferior):
                        request.session['rinor_api_version'] = _info.info.rinor_version                    
                    else:
                        raise BadDomogikVersion
                if not 'normal_mode' in request.session:
                    mode = InfoPipe().get_mode()
                    request.session['normal_mode'] = (mode == "normal")
            except Parameters.DoesNotExist:
                return redirect("config_welcome_view")
        return

    def process_view(self, request, view_func, view_args, view_kwargs):
#        kwargs = {'version': settings.DOMOWEB_VERSION}
        return view_func(request, *view_args, **view_kwargs)

    def process_exception(self, request, exception):
        if isinstance(exception, RinorError):
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
        elif isinstance(exception, BadDomogikVersion):
            _rinor_info = InfoPipe().get_info_extended()
            t = loader.get_template('error/BadDomogikVersion.html')
            c = Context({'rinor_info':_rinor_info})
            return HttpResponseServerError(t.render(c))
        return

class LaunchMiddleware:
    def __init__(self):
        # List the availables widgets
        Widget.objects.all().delete()
        STATIC_WIDGETS_ROOT = os.environ['DOMOWEB_STATIC_WIDGETS']
        if os.path.isdir(STATIC_WIDGETS_ROOT):
            for file in os.listdir(STATIC_WIDGETS_ROOT):
                main = os.path.join(STATIC_WIDGETS_ROOT, file, "main.js")
                if os.path.isfile(main):
                    w = Widget(id=file)
                    w.save();
        raise MiddlewareNotUsed