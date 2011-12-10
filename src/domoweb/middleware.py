from domoweb.exceptions import RinorError, RinorNotAvailable, BadDomogikVersion
from django.core.exceptions import MiddlewareNotUsed
from django.http import HttpResponseServerError
from django.template import Context, loader
from django.contrib import messages
from httplib import BadStatusLine
from domoweb.models import Parameter, Widget
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
                _ip = Parameter.objects.get(key='rinor_ip')
                _port = Parameter.objects.get(key='rinor_port')
                if not 'rinor_api_version'  in request.session:
                    _info = InfoPipe().get_info_extended()
                    
                    if (not _info.info.rinor_version_superior and not _info.info.rinor_version_inferior):
                        request.session['rinor_api_version'] = _info.info.rinor_version                    
                    else:
                        raise BadDomogikVersion
                if not 'normal_mode' in request.session:
                    mode = InfoPipe().get_mode()
                    request.session['normal_mode'] = (mode == "normal")
            except Parameter.DoesNotExist:
                return redirect("config_welcome_view")
        
        """
        Check if has message
        """
        _tag = request.GET.get('status')
        _message = request.GET.get('msg')
        if (_tag):
            if (_tag == 'success'):
                messages.success(request, _message)
            elif (_tag == 'error'):
                messages.error(request, _message)
            elif (_tag == 'warning'):
                messages.warning(request, _message)
            elif (_tag == 'info'):
                messages.info(request, _message)
            elif (_tag == 'debug'):
                messages.debug(request, _message)
        return

    def process_view(self, request, view_func, view_args, view_kwargs):
#        view_kwargs = {'version': settings.DOMOWEB_VERSION}
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
            _ip = Parameter.objects.get(key='rinor_ip')
            _port = Parameter.objects.get(key='rinor_port')
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