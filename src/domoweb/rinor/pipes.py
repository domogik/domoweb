from django.conf import settings
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
    
    def get_event(self):
        # Get all the devices ids
        _devices_list = DevicePipe().get_dict().keys()
        _devices = '/'.join(str(id) for id in _devices_list)
        _data = self._get_data("%s/%s/" % (self.new_path, _devices))               
        _event = _data.event[0]
        _ticket = _event.ticket_id    
        print "New " + str(_event.timestamp)
        yield 'event: message\ndata: ' + simplejson.dumps(_event) + '\n\n'
        while(True):
            _data = self._get_data("%s/%s/" % (self.get_path, _ticket))               
            _event = _data.event[0]
            print "Get " + str(_event.timestamp)
            yield 'event: message\ndata: ' + simplejson.dumps(_event) + '\n\n'        

class InfoPipe(RinorPipe):
    cache_expiry = 0
    list_path = "/"
    index = 'rest'

    def get_info(self):
        _data = self._get_data("%s" % (self.list_path))               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def get_mode(self):
        _data = self._get_data("/package/get-mode/")               
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data['mode']) > 0:
            return _data['mode'][0]
        else:
            return None
    
    def get_info_extended(self):
        _data = self.get_info()
        if (_data):
            try:
                if ("REST_API_release" in _data.info):
                    _data.info['rinor_version'] = NormalizedVersion(_data.info.REST_API_release)
                else:    
                    _data.info['rinor_version'] = NormalizedVersion('0.1')
                _data.info['min_version'] = NormalizedVersion(settings.RINOR_MIN_API)
                _data.info['rinor_version_superior'] = (_data.info['rinor_version'] > _data.info['min_version'])
                _data.info['rinor_version_inferior'] = (_data.info['rinor_version'] < _data.info['min_version'])
            except IrrationalVersionError:
                _data.info['rinor_version'] = '?'
                _data.info['min_version'] = '?'
                _data.info['rinor_version_superior'] = False
                _data.info['rinor_version_inferior'] = False
            if ("Domogik_release" in _data.info):
                _data.info['dmg_version'] = _data.info.Domogik_release
            else:
                _data.info['dmg_version'] = '0.1'                
            _data.info['dmg_min_version'] = settings.DMG_MIN_VERSION
            return _data
        else:
            return None

class HelperPipe(RinorPipe):
    cache_expiry = 0
    list_path = "/helper"
    index = 'helper'

    def get_info(self, command):
        _data = self._get_data("%s/%s/" % (self.list_path, command))               
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

    def post_list(self, name, description):
        _data = self._post_data("%s/name/%s/description/%s/" % (self.add_path, name, description))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, description, area_id):
        if (area_id):
            _data = self._put_data("%s/id/%s/area_id/%s/" % (self.update_path, id, area_id))
        else:
            _data = self._put_data("%s/id/%s/name/%s/description/%s/" % (self.update_path, id, name, description))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data("%s/%s/" % (self.delete_path, id))
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

    def post_list(self, name, description):
        _data = self._post_data("%s/name/%s/description/%s/" % (self.add_path, name, description))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, description):
        _data = self._put_data("%s/id/%s/name/%s/description/%s/" % (self.update_path, id, name, description))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data("%s/%s/" % (self.delete_path, id))
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

class DeviceUsagePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/device_usage/list"
    index = 'device_usage'
    
class UiConfigPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/ui_config/list"
    set_path = "/base/ui_config/set"
    delete_path = "/base/ui_config/del"
    index = 'ui_config'    
    def get_filtered(self, **kwargs):
        _list = self.get_list()
        return select_sublist(_list, **kwargs)

    def post_list(self, name, reference, key, value):
        _data = self._post_data("%s/name/%s/reference/%s/key/%s/value/%s/" % (self.set_path, name, reference, key, value))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_reference(self, name, reference):
        _data = self._delete_data("%s/by-reference/%s/%s/" % (self.delete_path, name, reference))
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

    def post_list(self, name, address, type_id, usage_id, description, reference):
        _data = self._post_data("%s/name/%s/address/%s/type_id/%s/usage_id/%s/description/%s/reference/%s/" % (self.add_path, name, address, type_id, usage_id, description, reference))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, name, address, usage_id, description, reference):
        _data = self._put_data("%s/id/%s/name/%s/address/%s/usage_id/%s/description/%s/reference/%s/" % (self.update_path, id, name, address, usage_id, description, reference))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]
        
    def delete_detail(self, id):
        _data = self._delete_data("%s/%s/" % (self.delete_path, id))
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

class AssociationPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/base/feature_association/list"
    listdeep_path = "/base/feature_association/listdeep"
    add_path = "/base/feature_association/add"
    delete_path = "/base/feature_association/del"
    index = 'feature_association'

    def get_list(self, type, id=None, deep=False):
        if deep:
            if (type=='house'):
                data = self._get_data("%s/by-house/" % self.listdeep_path)
            else:
                data = self._get_data("%s/by-%s/%s/" % (self.listdeep_path, type, id))               
        else:
            if (type=='house'):
                data = self._get_data("%s/by-house/" % self.list_path)
            else:
                data = self._get_data("%s/by-%s/%s/" % (self.list_path, type, id))               
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[self.index]

    def post_list(self, feature_id, page_type, page_id):
        data = self._post_data("%s/feature_id/%s/association_type/%s/association_id/%s/" % (self.add_path, feature_id, page_type, page_id))
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data("%s/id/%s/" % (self.delete_path, id))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def delete_type(self, type, id=None):
        _data = self._delete_data("%s/association_type/%s/association_id/%s/" % (self.delete_path, type, id))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def delete_feature(self, id):
        _data = self._delete_data("%s/feature_id/%s/" % (self.delete_path, id))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None
        
class AssociationExtendedPipe(RinorPipe):
    cache_expiry = 3600
    
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
    
    def get_last(self, last, device, key):
        _path = "%s/%s/%s/last/%s/" % (self.list_path, device, key, last)
        _data = self._get_data(_path)
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def get_fromto(self, fromTime, toTime, interval, selector, device, key):
        _path = "%s/%s/%s/from/%s/to/%s/interval/%s/selector/%s/" % (self.list_path, device, key, fromTime, toTime, interval, selector)
        _data = self._get_data(_path)
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
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

    def get_auth(self, login, password):
        _path = "/account/auth/%s/%s/" % (login, password)
        _data = self._get_data(_path)
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def post_list(self, login, password, is_admin, firstname, lastname):
        _data = self._post_data("%s/login/%s/password/%s/is_admin/%s/skin_used//first_name/%s/last_name/%s/" % (self.add_path, login, password, is_admin, firstname, lastname))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, login, is_admin, firstname, lastname):
        _data = self._put_data("%s/id/%s/login/%s/is_admin/%s/skin_used//first_name/%s/last_name/%s/" % (self.update_path, id, login, is_admin, firstname, lastname))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail_password(self, id, old, new):
        _data = self._put_data("%s/id/%s/old/%s/new/%s/" % (self.password_path, id, old, new))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data("%s/%s/" % (self.delete_path, id))
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

    def post_list(self, firstname, lastname):
        _data = self._post_data("%s/first_name/%s/last_name/%s/" % (self.add_path, firstname, lastname))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def put_detail(self, id, firstname, lastname):
        _data = self._put_data("%s/id/%s/first_name/%s/last_name/%s/" % (self.update_path, id, firstname, lastname))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return _data[self.index][0]

    def delete_detail(self, id):
        _data = self._delete_data("%s/%s/" % (self.delete_path, id))
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

    def get_detail(self, hostname, name):
        _data = self._get_data("%s/%s/%s/" % (self.detail_path, hostname, name))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def command_detail(self, hostname, name, command):
        _data = self._put_data("/plugin/%s/%s/%s/" % (command, hostname, name))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

class PluginConfigPipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/plugin/config/list"
    delete_path = "/plugin/config/del"
    set_path = "/plugin/config/set"
    index = 'config'

    def get_list(self, hostname, name):
        _data = self._get_data("%s/by-name/%s/%s/" % (self.list_path, hostname, name))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return None
    
    def get_detail(self, hostname, name, key):
        _data = None
        _configs = self.get_list(hostname, name)
        for _config in _configs:
            if _config.key == key:
                _data = _config
        return _data

    def delete_list(self, hostname, name):
        _data = self._delete_data("%s/by-name/%s/%s/" % (self.delete_path, hostname, name))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return None

    def delete_detail(self, hostname, name, key):
        _data = self._delete_data("%s/by-name/%s/%s/by-key/%s/" % (self.delete_path, hostname, name, key))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def set_detail(self, hostname, name, key, value):
        _data = self._put_data("%s/hostname/%s/name/%s/key/%s/value/%s/" % (self.set_path, hostname, name, key, value))
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

class PackagePipe(RinorPipe):
    cache_expiry = 3600
    list_path = "/package/list"
    refresh_path = "/package/update-cache"
    installed_path = "/package/list-installed"
    install_path = "/package/install"
    index = 'package'
    
    def refresh_list(self):
        _data = self._put_data("%s/" % (self.refresh_path))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

    def get_installed(self):
        _data = self._get_data("%s/" % (self.installed_path))
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index]
        else:
            return None

    def get_list(self):
        _data = self._get_data("%s/" % (self.list_path))
        if _data.status == "ERROR":
            raise RinorError(data.code, data.description)        
        if len(_data[self.index]) > 0:
            return _data[self.index][0]
        else:
            return None

    def put_install(self, host, package, release):
        _data = self._put_data("%s/%s/%s/%s/" % (self.install_path, host, package, release))
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)
        return None

class PackageExtendedPipe(RinorPipe):
    cache_expiry = 3600
    
    def get_list_installed(self, hostname, type):
        _packages = {}
        _enabled = {}
        _installed = PackagePipe().get_installed()
        _running = PluginPipe().get_list()

        # Generate enabled plugin list
        for host in _running:
            if (host.host == hostname):
                for item in host.list:
                    _enabled[item.name] = item

        # Generate installed plugin list
        for host in _installed:
            if (host.host == hostname):        
                for type, packages in host.installed.iteritems():
                    for package in packages:
                        # Check if the plugin is enabled
                        if (package.name in _enabled):
                            package.enabled = True
                        try:
                            package.normalizedVersion = NormalizedVersion(package.release)
                        except IrrationalVersionError:
                            package.installed_version_error = True
                            package.normalizedVersion = None
                        _packages[package.name] = package
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
            if package.name not in installed:
                package.install = True
                _packages[package.name] = package
            # Check if update can be done
            elif installed[package.name].normalizedVersion and not package.version_error:
                if (installed[package.name].normalizedVersion < package_version):
                    installed[package.name]['update_available'] = package_version
                    package.update = True
                    _packages[package.name] = package
            elif not installed[package.name].normalizedVersion and not package.version_error:
                    installed[package.name]['update_available'] = package_version
                    package.update = True
                    _packages[package.name] = package
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
        _packages['installed'] = self.get_list_installed(_rinor.info.Host, 'hardware')
        _packages['available'] = self.get_list_available('hardware', _packages['installed'])
            
        return _packages