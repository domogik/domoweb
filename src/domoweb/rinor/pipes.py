from django.conf import settings
from django.core.cache import cache
from domoweb.rinor.rinorPipe import RinorPipe
from domoweb.exceptions import RinorError
from distutils2.version import *
from distutils2.version import IrrationalVersionError
import simplejson

def select_sublist(list_of_dicts, **kwargs):
    return [d for d in list_of_dicts 
            if all(d.get(k)==kwargs[k] for k in kwargs)]

class EventPipe(RinorPipe):
    cache_expiry = 0
    new_path = '/events/request/new'
    get_path = '/events/request/get'
    index = 'event'
    paths = []

    def get_event(self):
        # Get all the devices ids
        _devices_list = DevicePipe().get_dict().keys()
        _devices = [str(id) for id in _devices_list]
        _data = self._get_data(self.new_path, _devices)               
        _event = _data.event[0]
        _ticket = _event.ticket_id    
        print "NEW EVENT " + str(_event.timestamp)
        yield 'event: message\ndata: ' + simplejson.dumps(_event) + '\n\n'
        while(True):
            _data = self._get_data(self.get_path, [_ticket])               
            _event = _data.event[0]
            print "RECEIVED EVENT " + str(_event.timestamp)
            yield 'event: message\ndata: ' + simplejson.dumps(_event) + '\n\n'        

class InfoPipe(RinorPipe):
    cache_expiry = 0
    list_path = ""
    index = 'rest'
    paths = []

    def get_info(self):
        _data = self._get_data(self.list_path)               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def get_mode(self):
        _data = self._get_data("/package/get-mode")               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data['mode']) > 0:
            return _data['mode'][0]
        else:
            return None
    
    def get_info_extended(self):
        _data = self.get_info()
        if (_data):
            if ("REST_API_release" in _data.info):
                _data.info['rinor_version'] = _data.info.REST_API_release
            else:    
                _data.info['rinor_version'] = '0.1'

            if ("Domogik_release" in _data.info):
                _data.info['dmg_version'] = _data.info.Domogik_release
            else:
                _data.info['dmg_version'] = '0.1'             

            try:
                _data.info['rinor_version_superior'] = (NormalizedVersion(_data.info['rinor_version']) > NormalizedVersion(settings.RINOR_MAX_API))
            except IrrationalVersionError:
                _data.info['rinor_version_superior'] = False

            try:
                _data.info['rinor_version_inferior'] = (NormalizedVersion(_data.info['rinor_version']) < NormalizedVersion(settings.RINOR_MIN_API))
            except IrrationalVersionError:
                _data.info['rinor_version_inferior'] = False
            return _data
        else:
            return None

class HelperPipe(RinorPipe):
    cache_expiry = 0
    list_path = "/helper"
    index = 'helper'
    paths = []

    def get_info(self, command):
        print command
        _data = self._get_data(self.list_path, command)               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index]
        
class RoomPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/room/list"
    add_path = "/base/room/add"
    update_path = "/base/room/update"
    delete_path = "/base/room/del"
    index = 'room'
    paths = []

    def post_list(self, name, description):
        _data = self._post_data(self.add_path, ['name', name, 'description', description])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, description, area_id):
        if (area_id):
            _data = self._put_data(self.update_path, ['id', id, 'area_id', area_id])
        else:
            _data = self._put_data(self.update_path, ['id', id, 'name', name, 'description', description])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, [id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class AreaPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/area/list"
    add_path = "/base/area/add"
    update_path = "/base/area/update"
    delete_path = "/base/area/del"
    index = 'area'
    paths = []

    def post_list(self, name, description):
        _data = self._post_data(self.add_path, ['name', name, 'description', description])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, description):
        _data = self._put_data(self.update_path, ['id', id, 'name', name, 'description', description])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, [id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class DeviceTypePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/device_type/list"
    index = 'device_type'
    paths = []

class DeviceUsagePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/device_usage/list"
    index = 'device_usage'
    paths = []

class UiConfigPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/ui_config/list"
    set_path = "/base/ui_config/set"
    delete_path = "/base/ui_config/del"
    index = 'ui_config'
    paths = []

    def get_filtered(self, **kwargs):
        _list = self.get_list()
        return select_sublist(_list, **kwargs)

    def post_list(self, name, reference, key, value):
        _data = self._post_data(self.set_path, ['name', name, 'reference', reference, 'key', key, 'value', value])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_reference(self, name, reference):
        _data = self._delete_data(self.delete_path, ['by-reference', name, reference])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None
    
    def get_house(self):
        house = UiConfigPipe().get_filtered(name='house')
        if (len(house) > 0):
            return house[0].value
        else:
            return None

    
class DevicePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/device/list"
    add_path = "/base/device/add"
    update_path = "/base/device/update"
    delete_path = "/base/device/del"
    index = 'device'
    paths = []

    def post_list(self, name, address, type_id, usage_id, description, reference):
        _data = self._post_data(self.add_path, ['name', name, 'address', address, 'type_id', type_id, 'usage_id', usage_id, 'description', description, 'reference', reference])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, address, usage_id, description, reference):
        _data = self._put_data(self.update_path, ['id', id, 'name', name, 'address', address, 'usage_id', usage_id, 'description', description, 'reference', reference])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, [id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class FeaturePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/feature/list"
    index = 'feature'
    paths = []
    dependencies = ['device']

class AssociationPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/feature_association/list"
    listdeep_path = "/base/feature_association/listdeep"
    add_path = "/base/feature_association/add"
    delete_path = "/base/feature_association/del"
    index = 'feature_association'
    paths = []

    def get_list(self, type, id=None, deep=False):
        if deep:
            if (type=='house'):
                _data = self._get_data(self.listdeep_path, ['by-house'])
            else:
                _data = self._get_data(self.listdeep_path, [('by-%s' % type), id])               
        else:
            if (type=='house'):
                _data = self._get_data(self.list_path, ['by-house'])
            else:
                _data = self._get_data(self.list_path, [('by-%s' % type), id])               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index]

    def post_list(self, feature_id, page_type, page_id):
        _data = self._post_data(self.add_path, ['feature_id', feature_id, 'association_type', page_type, 'association_id', page_id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, data.description)
        return _data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, ['id', id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def delete_type(self, type, id=None):
        _data = self._delete_data(self.delete_path, ['association_type', type, 'association_id', id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def delete_feature(self, id):
        _data = self._delete_data(self.delete_path, ['feature_id', id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class AssociationExtendedPipe(RinorPipe):
    cache_expiry = 3600
    paths = []

    def get_list(self, type, id=None, deep=False):
        _associations = AssociationPipe().get_list(type, id=id, deep=deep)
        _uiconfigs = UiConfigPipe().get_filtered(name='association')
        _features = FeaturePipe().get_list()
        for association in _associations:
            for uiconfig in _uiconfigs:
                if int(uiconfig.reference) == association.id:
                    association[uiconfig.key] = uiconfig.value
            for feature in _features:
                if feature.id == association.device_feature_id:
                    association['feature'] = feature
        return _associations

    def post_list(self, page_type, feature_id, page_id, widget_id, place_id):
        _association = AssociationPipe().post_list(feature_id, page_type, page_id)
        UiConfigPipe().post_list('association', _association.id, 'widget', widget_id)
        UiConfigPipe().post_list('association', _association.id, 'place', place_id)        
        return _association

    def delete_detail(self, id):
        _association = AssociationPipe().delete_detail(id)
        UiConfigPipe().delete_reference('association', id)        
        return _association
    
class AreaExtendedPipe(RinorPipe):
    cache_expiry = 3600
    paths = []

    def get_list(self):
        _areas = AreaPipe().get_list()
        _uiconfigs = UiConfigPipe().get_filtered(name='area')
        _rooms = RoomExtendedPipe().get_list()
        for area in _areas:
            for uiconfig in _uiconfigs:
                if int(uiconfig.reference) == area.id:
                    area[uiconfig.key] = uiconfig.value
            area['rooms'] = select_sublist(_rooms, area_id = area.id)
        return _areas

    def post_list(self, name, description):
        return AreaPipe().post_list(name, description)

    def put_detail(self, id, name, description):
        return AreaPipe().put_detail(id, name, description)

    def delete_detail(self, id):
        UiConfigPipe().delete_reference('area', id)
        _associations = AssociationPipe().get_list('area', id)
        for association in _associations:
            UiConfigPipe().delete_reference('association', association.id)        
        AssociationPipe().delete_type('area', id)
        _area = AreaPipe().delete_detail(id)
        return _area
    
class RoomExtendedPipe(RinorPipe):
    cache_expiry = 3600
    paths = []

    def get_list(self):
        _rooms = RoomPipe().get_list()
        _uiconfigs = UiConfigPipe().get_filtered(name='room')
        for room in _rooms:
            for uiconfig in _uiconfigs:
                if int(uiconfig.reference) == room.id:
                    room[uiconfig.key] = uiconfig.value
        return _rooms
    
    def get_list_noarea(self):
        _rooms = self.get_list()
        return select_sublist(_rooms, area_id = '')

    def post_list(self, name, description):
        return RoomPipe().post_list(name, description)

    def put_detail(self, id, name, description, area_id):
        return RoomPipe().put_detail(id, name, description, area_id)

    def delete_detail(self, id):
        UiConfigPipe().delete_reference('room', id)
        _associations = AssociationPipe().get_list('room', id)
        for association in _associations:
            UiConfigPipe().delete_reference('association', association.id)        
        AssociationPipe().delete_type('room', id)
        _room = RoomPipe().delete_detail(id)
        return _room
    
class DeviceExtendedPipe(RinorPipe):
    cache_expiry = 3600
    paths = []

    def get_list(self):
        _devices = DevicePipe().get_list()
        _features = FeaturePipe().get_list()
        for device in _devices:
            device['features'] = []
            for feature in _features:
                if feature.device_id == device.id:
                    device['features'].append(feature)

        return _devices

    def post_list(self, name, address, type_id, usage_id, description, reference):
        return DevicePipe().post_list(name, address, type_id, usage_id, description, reference)

    def put_detail(self, id, name, address, usage_id, description, reference):
        return DevicePipe().put_detail(id, name, address, usage_id, description, reference)

    def delete_detail(self, id):
        _features = FeaturePipe().get_list()
        for feature in _features:
            if feature.device_id == id:
                _associations = AssociationPipe().get_list('feature', feature.id)
                for association in _associations:
                    UiConfigPipe().delete_reference('association', association.id)        
                AssociationPipe().delete_feature(feature.id)
        _device = DevicePipe().delete_detail(id)
        return _device

class StatePipe(RinorPipe):
    cache_expiry = 0
    list_path = "/stats"
    index = 'stats'
    paths = []

    def get_last(self, last, device, key):
        _data = self._get_data(self.list_path, [device, key, 'last', last])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def get_fromto(self, fromTime, toTime, interval, selector, device, key):
        _data = self._get_data(self.list_path, [device, key, 'from', fromTime, 'to', toTime, 'interval', interval, 'selector', selector])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class UserPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/account/user/list"
    add_path = "/account/user/add"
    update_path = "/account/user/update"
    delete_path = "/account/user/del"
    password_path = "/account/user/password"
    index = 'account'
    paths = []

    def get_auth(self, login, password):
        _data = self._get_data("/account/auth", [login, password])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def post_list(self, login, password, is_admin, firstname, lastname):
        _data = self._post_data(self.add_path, ['login', login, 'password', password, 'is_admin', is_admin, 'skin_used', '', 'first_name', firstname, 'last_name', lastname])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, login, is_admin, firstname, lastname):
        _data = self._put_data(self.update_path, ['id', id, 'login', login, 'is_admin', is_admin, 'skin_used', '', 'first_name', firstname, 'last_name', lastname])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail_password(self, id, old, new):
        _data = self._put_data(self.password_path, ['id', id, 'old', old, 'new', new])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, [id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class PersonPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/account/person/list"
    add_path = "/account/person/add"
    update_path = "/account/person/update"
    delete_path = "/account/person/del"
    index = 'person'
    paths = []

    def post_list(self, firstname, lastname):
        _data = self._post_data(self.add_path, ['first_name', firstname, 'last_name', lastname])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, firstname, lastname):
        _data = self._put_data(self.update_path, ['id', id, 'first_name', firstname, 'last_name', lastname])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data(self.delete_path, [id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class PluginPipe(RinorPipe):
    cache_expiry = 0
    list_path = "/plugin/list"
    detail_path = "/plugin/detail"
    index = 'plugin'
    paths = []

    def get_detail(self, hostname, id):
        _data = self._get_data(self.detail_path, [hostname, id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def command_detail(self, hostname, id, command):
        _data = self._put_data("/plugin", [command, hostname, id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

class PluginConfigPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/plugin/config/list"
    delete_path = "/plugin/config/del"
    set_path = "/plugin/config/set"
    index = 'config'
    paths = []

    def get_list(self, hostname, id):
        _data = self._get_data(self.list_path, ['by-name', hostname, id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return []
    
    def get_detail(self, hostname, id, key):
        _data = None
        _configs = self.get_list(hostname, id)
        if _configs:
            for _config in _configs:
                if _config.key == key:
                    _data = _config
        return _data

    def delete_list(self, hostname, id):
        _data = self._delete_data(self.delete_path, [hostname, id])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return None

    def delete_detail(self, hostname, id, key):
        _data = self._delete_data(self.delete_path, [hostname, id, 'by-key', key])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def set_detail(self, hostname, id, key, value):
        _data = self._put_data(self.set_path, ['hostname', hostname, 'id', id, 'key', key, 'value', value])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

class RepositoryPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/package/list-repo"
    index = 'repository'
    paths = []

class PackagePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/package/list"
    refresh_path = "/package/update-cache"
    installed_path = "/package/list-installed"
    install_path = "/package/install"
    index = 'package'
    paths = []

    def refresh_list(self):
        _data = self._put_data(self.refresh_path)
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

    def get_installed(self):
        _data = self._get_data(self.installed_path)
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return None

    def get_list(self):
        _data = self._get_data(self.list_path)
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def put_install(self, host, package, release):
        _data = self._put_data(self.install_path, [host, package, release])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

class PackageExtendedPipe(RinorPipe):
    cache_expiry = 3600
    paths = []

    def get_list_installed(self, hostname, type):
        _packages = {}
        _enabled = {}
        _installed = PackagePipe().get_installed()
        _running = PluginPipe().get_list()

        # Generate enabled plugin list
        for host in _running:
            if (host.host == hostname):
                for item in host.list:
                    _enabled[item.id] = item

        # Generate installed plugin list
        for host in _installed:
            if (host.host == hostname):        
                for type, packages in host.installed.iteritems():
                    for package in packages:
                        # Check if the plugin is enabled
                        if (package.id in _enabled):
                            package.enabled = True
                        try:
                            package.normalizedVersion = NormalizedVersion(package.release)
                        except IrrationalVersionError:
                            package.installed_version_error = True
                            package.normalizedVersion = None
                        _packages[package.id] = package
        return _packages
    
    def get_list_available(self, type, installed):
        _packages = {}
        _available = PackagePipe().get_list()
        _rinor = InfoPipe().get_info()
        if hasattr(_rinor.info, 'Domogik_release'):
            _dmg_version = NormalizedVersion(suggest_normalized_version(_rinor.info.Domogik_release))
        else:
            # Domogik version number not available
            _dmg_version = None

        for package in _available[type]:
            _package_min_version = NormalizedVersion(suggest_normalized_version(package.domogik_min_release))
            try:
                package_version = NormalizedVersion(package.release)
                package.version_error = False
            except IrrationalVersionError:
                package.version_error = True
            if (_dmg_version) :
                package.upgrade_require = (_package_min_version > _dmg_version)

            # Check if already installed
            if package.id not in installed:
                package.install = True
                _packages[package.id] = package
            # Check if update can be done
            elif installed[package.id].normalizedVersion and not package.version_error:
                if (installed[package.id].normalizedVersion < package_version):
                    installed[package.id]['update_available'] = package_version
                    package.update = True
                    _packages[package.id] = package
            elif not installed[package.id].normalizedVersion and not package.version_error:
                    installed[package.id]['update_available'] = package_version
                    package.update = True
                    _packages[package.id] = package
        return _packages

    def get_list_plugin(self):
        _packages = {}
        _hosts = PackagePipe().get_installed()

        for host in _hosts:
            _packages[host.host] = {}
            _packages[host.host]['installed'] = self.get_list_installed(host.host, 'plugin')
            _packages[host.host]['available'] = self.get_list_available('plugin', _packages[host.host]['installed'])
            
        return _packages

    def get_list_external(self):
        _packages = {}
        _rinor = InfoPipe().get_info()

        _packages = {}
        _packages['installed'] = self.get_list_installed(_rinor.info.Host, 'external')
        _packages['available'] = self.get_list_available('external', _packages['installed'])
            
        return _packages

class CommandPipe(RinorPipe):
    cache_expiry = 0
    update_path = "/command"
    index = 'response'
    paths = []

    def put_detail(self, member, address, command, value=None):
        if (value): 
            _data = self._put_data(self.update_path, [member, address, command, value])
        else:
            _data = self._put_data(self.update_path, [member, address, command])
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]