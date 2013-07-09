import json
from django.db import models
from django.db.models import F
from django.core.exceptions import PermissionDenied
from exceptions import RinorNotConfigured, RinorError
from restModel import RestModel
from mqModel import MQModel, MQEvent

class Parameter(RestModel):
    key = models.CharField(max_length=30, primary_key=True)
    value = models.CharField(max_length=255)
    list_path = ""
    index = 'rest'

    @staticmethod
    def refresh():
        _data = Parameter.get_list();
        sections={
            "info": [
                "REST_API_version",
                "SSL",
                "Host",
                "Domogik_release",
                "Domogik_version",
                "REST_API_release",
                "Sources_release",
                "Sources_version"                
            ],
            "mq": [
                "sub_port",
                "ip",
                "req_rep_port",
                "pub_port"
            ]
        }
        for section, items in sections.items():
            for item in items:
                key = "%s-%s" % (section, item)
                try:
                    p = Parameter.objects.get(key=key)
                    p.value = _data[section][item]
                except Parameter.DoesNotExist:
                    p = Parameter(key=key, value=_data[section][item])
                p.save()

class Widget(models.Model):
    id = models.CharField(max_length=50, primary_key=True)

class PageTheme(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    label = models.CharField(max_length=50)

class PageIcon(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    iconset_id = models.CharField(max_length=50)
    iconset_name = models.CharField(max_length=50)
    icon_id = models.CharField(max_length=50)
    label = models.CharField(max_length=50)
    
class PageManager(models.Manager):
    def get_tree(self):
#        if id==0:
#        data = self.__session.query(Page).order_by(sqlalchemy.asc(Page.left)).all()       
#        else:
#            p = self.__session.query(Page).filter_by(id=id).first()
#            data = self.__session.query(Page).filter(Page.left >= p.left).filter(Page.left <= p.right).order_by(sqlalchemy.asc(Page.left)).all()
    
        data = super(PageManager, self).order_by('left').all()
        _current_path = []
        top_node = None
        
        if data:
            for obj in data:
                obj._childrens = []
                obj._leafs = 0
                if top_node == None:
                    top_node = obj
                    obj._level = 0
                    obj._max_level = 0
                    _current_path.append(obj)
                else:
                    while (obj.left > _current_path[-1].right): # Level down
                        top = _current_path.pop()
                        _current_path[-1]._leafs = _current_path[-1]._leafs + top._leafs
                    obj._level = len(_current_path)
                    if obj._level > top_node._max_level:
                        # Save the number of levels in the root node
                        top_node._max_level = obj._level
                    _current_path[-1]._childrens.append(obj)
                    if not obj._is_leaf():
                        _current_path.append(obj) # Level up
                    else:
                        _current_path[-1]._leafs = _current_path[-1]._leafs + 1

            while (len(_current_path) > 1): # Level down
                top = _current_path.pop()
                _current_path[-1]._leafs = _current_path[-1]._leafs + top._leafs

        return top_node
    
    def get_path(self, id):
        p = super(PageManager, self).get(id=id)
        ret = super(PageManager, self).filter(left__lte= p.left).filter(right__gte= p.right).order_by('left')
        return ret

class Page(models.Model):
    objects = PageManager()
    id = models.AutoField(primary_key=True)
    left = models.IntegerField(default=0)
    right = models.IntegerField(default=0)
    name = models.CharField(max_length=50, blank=True)
    description = models.TextField(null=True, blank=True)
    icon = models.ForeignKey(PageIcon, blank=True, null=True, on_delete=models.DO_NOTHING)
    theme = models.ForeignKey(PageTheme, blank=True, null=True, on_delete=models.DO_NOTHING)

    _leafs = None
    _childrens = None
    _level = None
    _max_level = None
    
    @classmethod
    def add(cls, name, parent_id, description=None, icon=None, theme=None):
        p = cls(name=name, description=description, icon=icon)
        if parent_id != None:
            parent = cls.objects.get(id=parent_id)
            p.left = int(parent.left) + 1
            p.right = int(parent.left) + 2
            cls.objects.filter(right__gt= parent.left).update(right=F('right') + 2)
            cls.objects.filter(left__gt= parent.left).update(left=F('left') + 2)
        else:
            p.left = 1
            p.right = 2
        p.save()
        return p

    def delete(self, *args, **kwargs):
        if self.id == 1:
            raise PermissionDenied("Can not delete the root page")
        # check if there are no children
        if self.left + 1 != self.right:
            raise PermissionDenied("Can not delete page %s, it still has children" % self.name)
        else:
            dl = self.right - self.left + 1
            Page.objects.filter(right__gt= self.right).update(right=F('right') - dl)
            Page.objects.filter(left__gt= self.right).update(left=F('left') - dl)
            super(Page, self).delete(*args, **kwargs)
        return self

    def _is_leaf(self):
        # If right = left + 1 then it is a leaf
        return ((self.left + 1) == self.right)
    is_leaf = property(_is_leaf)

    def _get_leafs(self):
        return self._leafs
    leafs = property(_get_leafs)

    def _get_childrens(self):
        return self._childrens
    childrens = property(_get_childrens)
    
    def _get_level(self):
        return self._level
    level = property(_get_level)
    
    def _get_max_level(self):
        return self._max_level
    max_level = property(_get_max_level)

class DataType(RestModel):
    id = models.CharField(max_length=50, primary_key=True)
    parameters = models.TextField()
    
    list_path = "/datatype"

    @staticmethod
    def refresh():
        import json
        _data = DataType.get_list();
        DataType.objects.all().delete()
        for type, params in _data.iteritems():
            r = DataType(id=type, parameters=json.dumps(params))
            r.save()

class Package(MQModel):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    version = models.CharField(max_length=50)
    author = models.CharField(max_length=255, null=True, blank=True)
    author_email = models.CharField(max_length=255, null=True, blank=True)
    tags = models.CharField(max_length=255, null=True, blank=True)
    changelog = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    documentation = models.CharField(max_length=255, null=True, blank=True)

    detail_id = 'packages.detail.get'
    event = None

    def __unicode__(self):
        return self.id
    
    @classmethod
    def init_event(cls, zmqcontext):
        pass
    
    @classmethod
    def refresh(cls):
        _data = Package.get_req(cls.detail_id);
        Package.objects.all().delete()
        for id, attributes in _data.iteritems():
            identity = attributes['identity']
            p = Package(id=id, name=identity['name'], type=identity['type'], version=identity['version']
                        , author = identity['author'], author_email = identity['author_email']
                        , changelog = identity['changelog'], description = identity['description'], documentation = identity['documentation'])
            if 'tags' in attributes:
                p.tags = ', '.join(identity['tags'])
            p.save()
            if 'device_types' in attributes:
                for id, device_type in attributes['device_types'].iteritems():
                    d = PackageDeviceType(package=p, id=id, name=device_type['name'], description=device_type['description'])
                    d.save()
            if 'dependencies' in identity:
                for dependency in identity['dependencies']:
                    d = PackageDependency(package=p, id=dependency['id'], type=dependency['type'])
                    d.save()
            if 'udev_rules' in attributes:
                for udev_rule in attributes['udev_rules']:
                    u = PackageUdevRule(package=p, filename=udev_rule['filename'], rule=udev_rule['rule'], description=udev_rule['description'], model=udev_rule['model'])
                    u.save()
            if 'products' in attributes:
                for product in attributes['products']:
                    p = PackageProduct(package=p, id=product['id'], name=product['name'], documentation=product['documentation'], device_type_id=product['type'])
                    p.save()
   
class PackageUdevRule(models.Model):
    filename = models.CharField(max_length=255, primary_key=True)
    rule = models.TextField()
    description = models.TextField(null=True, blank=True)
    model = models.CharField(max_length=255, null=True, blank=True)
    package = models.ForeignKey(Package)

class PackageDependency(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    type = models.CharField(max_length=50)
    package = models.ForeignKey(Package)

class PackageDeviceType(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    package = models.ForeignKey(Package)

class PackageProduct(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=50)
    documentation = models.CharField(max_length=255, null=True, blank=True)
    package = models.ForeignKey(Package)
    device_type = models.ForeignKey(PackageDeviceType)

class Client(MQModel):
    id = models.CharField(max_length=255, primary_key=True)
    host = models.CharField(max_length=50)
    pid = models.IntegerField()
    status = models.CharField(max_length=50)
    configured = models.NullBooleanField()
    package = models.ForeignKey(Package, on_delete=models.DO_NOTHING, null=True, blank=True)
    
    event = None
    
    def __unicode__(self):
        return self.id
    
    @classmethod
    def init_event(cls, zmqcontext):
        cls.event = MQEvent(zmqcontext, 'client', cls.refresh_event, ['clients.list'])
        
    @classmethod
    def refresh(cls):
        _data = Client.get_req('clients.detail.get');
        Client.objects.all().delete()
        for id, attributes in _data.iteritems():
            c = Client(id=id, host=attributes['host'], pid=attributes['pid'], status=attributes['status'], configured=attributes['configured'], package_id=attributes['package_id'])
            c.save()
            data = attributes['data']
            if 'configuration' in data:
                for parameter in data['configuration']:
                    pid = "%s-%s" % (id.replace('.', '_'), parameter['key'])
                    p = ClientConfiguration(id=pid, name=parameter['name'], key=parameter['key'], type=parameter['type'], sort=parameter['sort'], client=c)
                    if 'default' in parameter:
                        p.default=parameter['default']
                    if 'description' in parameter:
                        p.description=parameter['description']
                    if 'required' in parameter:
                        p.required=parameter['required']
                    else:
                        p.required=True
                    options={}
                    if 'min_length' in parameter:
                        options['min_length'] = parameter['min_length']
                    if 'max_length' in parameter:
                        options['max_length'] = parameter['max_length']
                    if 'min_value' in parameter:
                        options['min_value'] = parameter['min_value']
                    if 'multilignes' in parameter:
                        options['multilignes'] = parameter['multilignes']
                    if 'max_value' in parameter:
                        options['max_value'] = parameter['max_value']
                    if 'mask' in parameter:
                        options['mask'] = parameter['mask']
                    if 'choices' in parameter:
                        options['choices'] = parameter['choices']
                    p.options=json.dumps(options)
                    p.save()

    @classmethod
    def refresh_event(cls, data):
        for id, attributes in data.iteritems():
            try:
                c = Client.objects.get(id=id)
            except Client.DoesNotExist:
                c = Client(id=id, host=attributes['host'], pid=attributes['pid'], status=attributes['status'], configured=attributes['configured'], package_id=attributes['package_id'])
            else:
                c.pid=attributes['pid']
                c.status=attributes['status']
                c.configured=attributes['configured']
            c.save()
    
    def save_configuration(self, data):
        msg = {
            'type': self.package.type,
            'id': self.package.id,
            'host': self.host,
            'data': data 
        }
        print msg
        _result = Client.get_req('config.set', msg)
        print _result

class ClientConfiguration(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=50)
    key = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    default = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    required = models.BooleanField()
    options = models.TextField(null=True, blank=True)
    sort = models.IntegerField()
    value = models.TextField(null=True, blank=True)
    client = models.ForeignKey(Client)

class Device(RestModel):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=255)
    type = models.ForeignKey(PackageDeviceType, blank=True, null=True, on_delete=models.DO_NOTHING)

    list_path = "/device/"
    delete_path = "/device/"
    create_path = "/device/"
    addglobal_path = "/device/addglobal"
    addxplcmd_path = "/device/xplcmdparams"
    addxplstat_path = "/device/xplstatparams"
    listupgrade_path = "/base/device/list-upgrade"
    doupgrade_path = "/base/device/upgrade"

    @staticmethod
    def refresh():
        _data = Device.get_list();
        Device.objects.all().delete()
        Command.objects.all().delete()
        CommandParam.objects.all().delete()
        Sensor.objects.all().delete()
        XPLCmd.objects.all().delete()
        XPLStat.objects.all().delete()
        for record in _data:
            Device.create_from_json(record)

    def delete(self, *args, **kwargs):
        Device.delete_details(self.id)
        super(Device, self).delete(*args, **kwargs)

    @classmethod
    def create(cls, plugin_id, name, type_id, reference):
        data = ['plugin_id', plugin_id, 'name', name, 'type_id', type_id, 'description', '', 'reference', reference]
        rinor_device = cls.post_list(data)
        device = cls.create_from_json(rinor_device)
        return device
    
    @classmethod
    def create_from_json(cls, data):
        device = cls(id=data.id, name=data.name, type_id=data.device_type_id, reference=data.reference)
        device.save()
        if "command" in data:
            for command in data.command:
                c = Command(id=command.id, name=command.name, device=device, reference=command.reference, return_confirmation=command.return_confirmation)
                c.save()
                for param in command.command_param:
                    p = CommandParam(command=c, key=param.key, datatype_id=param.data_type)
                    p.save()
        if "sensor" in data:
            for sensor in data.sensor:
                s = Sensor(id=sensor.id, name=sensor.name, device=device, reference=sensor.reference, datatype_id=sensor.data_type, last_value=sensor.last_value, last_received=sensor.last_received)
                s.save()
        if "xpl_command" in data:
            for xpl_command in data.xpl_command:
                c = XPLCmd(id=xpl_command.id, device_id= device.id, json_id=xpl_command.json_id)
                c.save()
        if "xpl_stat" in data:
            for xpl_stat in data.xpl_stat:
                c = XPLStat(id=xpl_stat.id, device_id= device.id, json_id=xpl_stat.json_id)
                c.save()
        return device

    def add_global_params(self, parameters):
        params = ['id', self.id]
        params.extend(list(reduce(lambda x, y: x + y, parameters.items())))
        _data = Device._put_data(Device.addglobal_path, params)
        if _data.status == "ERROR":
            raise RinorError(_data.code, _data.description)

    def add_xplcmd_params(self, id, parameters):
        try:
            # Find the db id, based on the json id
            xplcmd = XPLCmd.objects.get(device_id=self.id, json_id=id)
        except XPLCmd.DoesNotExist:
            pass
        else:
            params = ['id', xplcmd.id]
            if parameters:
                params.extend(list(reduce(lambda x, y: x + y, parameters.items())))
            _data = Device._put_data(Device.addxplcmd_path, params)
            if _data.status == "ERROR":
                raise RinorError(_data.code, _data.description)

    def add_xplstat_params(self, id, parameters):
        try:
            # Find the db id, based on the json id
            xplstat = XPLStat.objects.get(device_id=self.id, json_id=id)
        except XPLStat.DoesNotExist:
            pass
        else:
            params = ['id', xplstat.id]
            if parameters:
                params.extend(list(reduce(lambda x, y: x + y, parameters.items())))
            _data = Device._put_data(Device.addxplstat_path, params)
            if _data.status == "ERROR":
                raise RinorError(_data.code, _data.description)
    
    @classmethod
    def list_upgrade(cls):
        data = cls._get_data(cls.listupgrade_path)
        if data.status == "ERROR":
            raise RinorError(data.code, data.description)
        return data[cls.index]

    @classmethod
    def do_upgrade(cls, odid, oskey, ndid, nsid):
        data = ['oldid', odid, 'oldskey', oskey, 'newdid', ndid, 'newsensorid', nsid]
        ret = cls._post_data(cls.doupgrade_path, data)
        if ret.status == "ERROR":
            raise RinorError(ret.code, ret.description)

class XPLCmd(RestModel):
    id = models.IntegerField(primary_key=True)
    device_id = models.IntegerField()
    json_id = models.CharField(max_length=50)

class XPLStat(RestModel):
    id = models.IntegerField(primary_key=True)
    device_id = models.IntegerField()
    json_id = models.CharField(max_length=50)
    
class Command(RestModel):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    device = models.ForeignKey(Device)
    reference = models.CharField(max_length=50)
    return_confirmation = models.BooleanField(default=True)
    
class CommandParam(RestModel):
    id = models.AutoField(primary_key=True)
    command = models.ForeignKey(Command)
    key = models.CharField(max_length=50)
    datatype = models.ForeignKey(DataType, on_delete=models.DO_NOTHING)
    
class Sensor(RestModel):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    device = models.ForeignKey(Device)
    reference = models.CharField(max_length=50)
    datatype = models.ForeignKey(DataType, on_delete=models.DO_NOTHING)
    last_value = models.CharField(max_length=50)
    last_received = models.CharField(max_length=50)

class WidgetInstance(models.Model):
    id = models.AutoField(primary_key=True)
    page = models.ForeignKey(Page)
    order = models.IntegerField()
    widget = models.ForeignKey(Widget, on_delete=models.DO_NOTHING)

    @classmethod
    def get_page_list(cls, id):
        return cls.objects.filter(page__id=id).order_by('order')

class WidgetInstanceParam(models.Model):
    id = models.AutoField(primary_key=True)
    instance = models.ForeignKey(WidgetInstance)
    key = models.CharField(max_length=50)
    value = models.CharField(max_length=50)

class WidgetInstanceSensor(models.Model):
    id = models.AutoField(primary_key=True)
    instance = models.ForeignKey(WidgetInstance)
    key = models.CharField(max_length=50)
    sensor = models.ForeignKey(Sensor, on_delete=models.DO_NOTHING)

class WidgetInstanceCommand(models.Model):
    id = models.AutoField(primary_key=True)
    instance = models.ForeignKey(WidgetInstance)
    key = models.CharField(max_length=50)
    command = models.ForeignKey(Command, on_delete=models.DO_NOTHING)    