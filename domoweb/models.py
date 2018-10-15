import json
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Unicode, UnicodeText, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import backref, relationship, sessionmaker, joinedload
import logging
import inspect
from threading import Lock
import traceback

logger = logging.getLogger('domoweb')

# alembic revision --autogenerate -m "xxxx"

url = 'sqlite:////var/lib/domoweb/db.sqlite'
#engine = create_engine(url, echo=True) # For debug sql
engine = create_engine(url)

from sqlalchemy.ext.declarative import declarative_base

SessionLock = Lock()
Base = declarative_base()
metadata = Base.metadata
# create a configured "Session" class
Session = sessionmaker(bind=engine)
session = Session()

class Parameter(Base):
    __tablename__ = 'parameter'
    key = Column(String(30), primary_key=True)
    value = Column(Unicode(255))

class Widget(Base):
    __tablename__ = 'widget'
    id = Column(String(50), primary_key=True)
    version = Column(String(50))
    set_id = Column(String(50))
    set_name = Column(Unicode(50))
    set_ref = Column(String(50))
    name = Column(Unicode(50))
    height = Column(Integer(), default=1)
    width = Column(Integer(), default=1)
    min_height = Column(Integer(), default=1)
    min_width = Column(Integer(), default=1)
    max_height = Column(Integer(), default=1)
    max_width = Column(Integer(), default=1)
    default_style = Column(Boolean(), default=1)
    style = Column(UnicodeText())

    @classmethod
    def getAll(cls):
        s = session.query(cls).all()
        return s

    @classmethod
    def get(cls, id):
        s = session.query(cls).get(id)
        return s

    @classmethod
    def getSection(cls, section_id):
        s = session.query(cls).join(cls.instances).distinct().all()
        return s

    @classmethod
    def getSectionPacks(cls, section_id):
        s = session.query(cls.set_id).join(cls.instances).distinct().all()
        return s

class WidgetOption(Base):
    __tablename__ = 'widgetOption'
    id = Column(String(50), primary_key=True)
    key = Column(String(50))
    name = Column(Unicode(50))
    required = Column(Boolean())
    type = Column(String(50))
    default = Column(Unicode(50), nullable=True)
    description = Column(UnicodeText(), nullable=True)
    parameters = Column(UnicodeText(), nullable=True)
    widget_id = Column(String(50), ForeignKey('widget.id'), nullable=False)

    @classmethod
    def getWidget(cls, widget_id):
        s = session.query(cls).filter_by(widget_id=widget_id).all()
        return s

class WidgetSensor(Base):
    __tablename__ = 'widgetSensor'
    id = Column(String(50), primary_key=True)
    key = Column(String(50))
    name = Column(Unicode(50))
    required = Column(Boolean(), nullable=True)
    types = Column(String(255))
    filters = Column(String(255), nullable=True)
    description = Column(Unicode(255), nullable=True)
    group = Column(Boolean(), nullable=True)
    groupmin = Column(Integer(), nullable=True)
    groupmax = Column(Integer(), nullable=True)
    widget_id = Column(String(50), ForeignKey('widget.id'), nullable=False)

    @classmethod
    def getWidget(cls, widget_id):
        s = session.query(cls).filter_by(widget_id=widget_id).all()
        return s

class WidgetCommand(Base):
    __tablename__ = 'widgetCommand'
    id = Column(String(50), primary_key=True)
    key = Column(String(50))
    name = Column(Unicode(50))
    required = Column(Boolean())
    types = Column(String(255))
    filters = Column(String(255), nullable=True)
    description = Column(Unicode(255), nullable=True)
    widget_id = Column(String(50), ForeignKey('widget.id'), nullable=False)

    @classmethod
    def getWidget(cls, widget_id):
        s = session.query(cls).filter_by(widget_id=widget_id).all()
        return s

class WidgetDevice(Base):
    __tablename__ = 'widgetDevice'
    id = Column(String(50), primary_key=True)
    key = Column(String(50))
    name = Column(Unicode(50))
    required = Column(Boolean())
    types = Column(String(255))
    description = Column(Unicode(255), nullable=True)
    widget_id = Column(String(50), ForeignKey('widget.id'), nullable=False)

    @classmethod
    def getWidget(cls, widget_id):
        s = session.query(cls).filter_by(widget_id=widget_id).all()
        return s

class Theme(Base):
    __tablename__ = 'theme'
    id = Column(String(50), primary_key=True)
    version = Column(String(50))
    name = Column(Unicode(50))
    description = Column(Unicode(255), nullable=True)
    style = Column(UnicodeText())

    @classmethod
    def getParamsDict(cls, id, parts):
        t = session.query(cls).get(id)
        style = json.loads(t.style)
        params = {}
        for part in parts:
            p = part[0].upper() + part[1:]
            for key in style[part]:
                k = key[0].upper() + key[1:]
                params[p + k] = style[part][key]
        session.flush()
        return params

class SectionParam(Base):
    __tablename__ = 'sectionParam'
    section_id = Column(Integer(), ForeignKey('section.id'), primary_key=True)
    key = Column(String(50), primary_key=True)
    value = Column(String(255), nullable=True)

    @classmethod
    def getSection(cls, section_id):
        s = session.query(cls).filter_by(section_id = section_id).all()
        return s

    @classmethod
    def saveKey(cls, section_id, key, value):
        s = session.query(cls).filter_by(section_id = section_id, key = key).first()
        if not s:
            s = cls(section_id=section_id, key=key)
        s.value = value
        session.add(s)
        session.commit()
        session.flush()
        return s

    @classmethod
    def delete(cls, section_id, key):
        s = session.query(cls).filter_by(section_id = section_id, key = key).first()
        if s:
            session.delete(s)
            session.commit()
        return s

    @classmethod
    def deleteAll(cls, section_id):
        s = session.query(cls).filter_by(section_id = section_id).delete()
        if s:
            session.commit()
        return s

class Section(Base):
    # http://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/
    # http://www.sitepoint.com/hierarchical-data-database-2/
    __tablename__ = 'section'
    id = Column(Integer(), primary_key=True, autoincrement=True)
    left = Column(Integer(), default=0)
    right = Column(Integer(), default=0)
    name = Column(Unicode(50))
    description = Column(UnicodeText(), nullable=True)
    theme_id = Column(String(50), ForeignKey('theme.id'), nullable=False, server_default='default')
    theme = relationship("Theme")
    params = relationship("SectionParam", cascade="all, delete-orphan")
    instances = relationship("WidgetInstance", cascade="all, delete-orphan")

    _leafs = None
    _childrens = None
    _level = None
    _max_level = None

    @classmethod
    def add(cls, parent_id, name, description=None):
        s = cls(name=name, description=description)
        parent = session.query(cls).get(parent_id)
        if parent:
            s.left = int(parent.right)
            s.right = int(parent.right) + 1
            session.query(cls).filter('left > :sright').\
                params({'sright':parent.right}).update({cls.left: cls.left + 2}, synchronize_session='fetch')
            session.query(cls).filter('right >= :sright').\
                params({'sright':parent.right}).update({cls.right: cls.right + 2}, synchronize_session='fetch')
            session.add(s)
            session.commit()
            session.flush()
        else:
            logger.info(u"Section Add: Parent not found")
        return s

    @classmethod
    def delete(cls, id):
        s = session.query(cls).get(id)
        if s:
            # Move all childs to parent
            q = session.query(cls).filter('left > :sleft AND right < :sright').\
                params({'sleft':s.left, 'sright':s.right}).update({cls.left: cls.left - 1, cls.right: cls.right - 1 }, synchronize_session='fetch')
            session.query(cls).filter('left > :sright').\
                params({'sright':s.right}).update({cls.left: cls.left - 2}, synchronize_session='fetch')
            session.query(cls).filter('right > :sright').\
                params({'sright':s.right}).update({cls.right: cls.right - 2}, synchronize_session='fetch')
            session.delete(s)
            session.commit()
            session.flush()
        else:
            logger.info(u"Section Remove: Section not found")
        return s

    @classmethod
    def getAll(cls):
        s = session.query(cls).order_by('left').all()
        return s

    @classmethod
    def get(cls, id):
        is_id = True
        try:
            id=int(id)
        except ValueError:
            is_id = False
        except TypeError:
            is_id = False
        if not is_id:
            logger.info(u"Section get : NOT AN ID : {0}".format(id))
            s_list = session.query(cls).\
            options(joinedload('theme')).\
            all()
            for a_s in s_list:
                 s = a_s
                 if id.strip() == a_s.name.strip():
                     return s
            # if not found, return one page...
            return s
        else:
            s = session.query(cls).\
            options(joinedload('theme')).\
            get(id)
        return s

    @classmethod
    def getInstances(cls, id):
        s = session.query(cls).\
            options(joinedload('instances')).\
            get(id)
        return s.instances

    @classmethod
    def update(cls, id, name, description=None):
        s = session.query(cls).get(id)
        s.name = name
        s.description = description
        session.add(s)
        session.commit()
        session.flush()
        return s

    @classmethod
    def getParamsDict(cls, id):
        s = session.query(cls).get(id)
        # Combine Params for section theme
        params = Theme.getParamsDict(s.theme.id, ["section", "widget"])
        # Override with user params
        for p in s.params:
            params[p.key] = p.value
        session.flush()
        return params

    @classmethod
    def getTree(cls):
        data = cls.getAll()
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

class DataType(Base):
    __tablename__ = 'dataType'
    id = Column(String(50), primary_key=True)
    parameters = Column(Text())

    @classmethod
    def getAll(cls):
        s = session.query(cls).all()
        return s

    @classmethod
    def getChilds(cls, id):
        s = session.query(cls).get(id)
        if s:
            c = json.loads(s.parameters)
            return c['childs']
        else:
            return None

class Device(Base):
    __tablename__ = 'device'
    id = Column(Integer(), primary_key=True)
    name = Column(Unicode(50))
    description = Column(Unicode(255), nullable=True)
    reference = Column(Unicode(255), nullable=True)
    type = Column(String(50), nullable=True)

    @classmethod
    def clean(cls):
        session.query(cls).delete()
        session.query(Command).delete()
        session.query(CommandParam).delete()
        session.query(Sensor).delete()
        session.commit()
        session.flush()

    @classmethod
    def getTypesFilter(cls, types):
        s = session.query(cls.type, cls.type, cls.id, cls.name).\
            filter(cls.type.in_(types)).\
            order_by(cls.id).all()
        return s

class Command(Base):
    __tablename__ = 'command'
    id = Column(Integer(), primary_key=True)
    name = Column(Unicode(50))
    device_id = Column(Integer(), ForeignKey('device.id'), nullable=False)
    device = relationship("Device", cascade="all", backref="commands")
    reference = Column(String(50))
    return_confirmation = Column(Boolean(), default=True)
    datatypes = Column(String(255), nullable=False)

    @classmethod
    def getTypesFilter(cls, types):
        s = session.query(cls.device_id, Device.name, cls.id, cls.name).\
            join(Device).\
            filter(cls.datatypes.in_(types)).\
            order_by(cls.device_id).all()
        return s

class CommandParam(Base):
    __tablename__ = 'commandParam'
    id = Column(Integer(), primary_key=True, autoincrement=True)
    command_id = Column(Integer(), ForeignKey('command.id'), nullable=False)
    command = relationship("Command", cascade="all", backref="parameters")
    key = Column(String(50))
    datatype_id = Column(String(50), ForeignKey('dataType.id'))
    datatype = relationship("DataType")

    @classmethod
    def getCommand(cls, command_id):
        s = session.query(cls).filter_by(command_id = command_id).all()
        return s

class Sensor(Base):
    __tablename__ = 'sensor'
    id = Column(Integer(), primary_key=True)
    name = Column(Unicode(50))
    device_id = Column(Integer(), ForeignKey('device.id'), nullable=False)
    device = relationship("Device", cascade="all", backref="sensors")
    reference = Column(String(50))
    datatype_id = Column(String(50), ForeignKey('dataType.id'))
    datatype = relationship("DataType")
    last_value = Column(Unicode(50), nullable=True)
    last_received = Column(String(50), nullable=True)
    timeout = Column(Integer(), nullable=False, default=0)

    @classmethod
    def getTypesFilter(cls, types):
        s = session.query(cls.device_id, Device.name, cls.id, cls.name).\
            join(Device).\
            filter(cls.datatype_id.in_(types)).\
            order_by(cls.device_id).all()
        return s

    @classmethod
    def update(cls, id, timestamp, value):
#        logger.info(u"Sensor.update Session locked : {0}".format(SessionLock.locked()))
        with SessionLock :
            try :
                s = session.query(cls).get(id)
                if s :
                    s.last_received = timestamp
                    s.last_value = value
                    session.add(s)
                    session.commit()
                else :
                    logger.warning(u"Class Sensor.update: session.query return {0}".format(s))
            except :
               logger.warning(u"Class Sensor.update session.query FAIL : {0}".format(traceback.format_exc()))
        return s

class WidgetInstance(Base):
    __tablename__ = 'widgetInstance'
    id = Column(Integer(), primary_key=True, autoincrement=True)
    section_id = Column(String(50), ForeignKey('section.id'))
    section = relationship("Section")
    x = Column(Integer())
    y = Column(Integer())
    height = Column(Integer())
    width = Column(Integer())
    widget_id = Column(String(50), ForeignKey('widget.id'))
    widget = relationship("Widget", foreign_keys='WidgetInstance.widget_id', lazy='joined', backref='instances')
    options = relationship("WidgetInstanceOption", cascade="all, delete-orphan")
    sensors = relationship("WidgetInstanceSensor", cascade="all, delete-orphan")
    commands = relationship("WidgetInstanceCommand", cascade="all, delete-orphan")
    widgetStyleOptions = ['WidgetBackgroundColor', 'WidgetTextColor',  'WidgetBorderColor',  'WidgetBorderRadius', 'WidgetBoxShadow']

    @classmethod
    def get(cls, id):
        s = session.query(cls).options(joinedload('widget')).get(id)
        session.expunge_all()
        return s

    @classmethod
    def add(cls, section_id, widget_id, x, y, width, height):
        s = cls(section_id=section_id, widget_id=widget_id, x=x, y=y, height=height, width=width)
        session.add(s)
        session.commit()
        return s

    @classmethod
    def getSection(cls, section_id):
        s = session.query(cls).options(joinedload('widget')).filter_by(section_id = section_id).all()
        session.expunge_all()
        return s

    @classmethod
    def getFullOptionsDict(cls, id):
        s = session.query(cls).get(id)
        # Load theme style
        sstyle = json.loads(s.section.theme.style)
        if s.widget.style:
            wstyle = json.loads(s.widget.style)
        options = {}
        for part in ["widget"]:
            p = part[0].upper() + part[1:]
            for key in sstyle[part]:
                k = key[0].upper() + key[1:] # Uppercase first char
                # We keep those for the section params
                if (p + k) not in cls.widgetStyleOptions:
                    options[p + k] = sstyle[part][key]
        # Override with section user options
        for p in s.section.params:
            # We keep those for the section params
            if p.key.startswith('Widget') and p.key not in cls.widgetStyleOptions:
                options[p.key] = p.value
        # Override with widget options
        if s.widget.style:
            for key in wstyle:
                k = key[0].upper() + key[1:] # Uppercase first char
                options['Widget' + k] = wstyle[key]
        # Override with user options
        defaultStyle = True
        for p in s.options:
            if p.key in cls.widgetStyleOptions:
                defaultStyle = False
            options[p.key] = p.value
        session.flush()
        options['WidgetDefaultStyle'] = defaultStyle
        return options

    @classmethod
    def getOptionsDict(cls, id):
        s = session.query(cls).get(id)
        options = {}
        # Load widget options
        if s.widget.style:
            wstyle = json.loads(s.widget.style)
            for key in wstyle:
                k = key[0].upper() + key[1:] # Uppercase first char
                options['Widget' + k] = wstyle[key]
        # Override with user options
        defaultStyle = True
        for p in s.options:
            options[p.key] = p.value
            if p.key in cls.widgetStyleOptions:
                defaultStyle = False
        session.flush()
        options['WidgetDefaultStyle'] = defaultStyle
        return options

    @classmethod
    def delete(cls, id):
        s = session.query(cls).get(id)
        session.delete(s)
        session.commit()
        return s

    @classmethod
    def updateLocation(cls, id, x, y, width, height):
        s = session.query(cls).get(id)
        s.x = x
        s.y = y
        s.width = width
        s.height = height
        session.add(s)
        session.commit()
        return s

class WidgetInstanceOption(Base):
    __tablename__ = 'widgetInstanceOption'
    instance_id = Column(Integer(), ForeignKey('widgetInstance.id'), primary_key=True, nullable=False)
    instance = relationship("WidgetInstance")
    key = Column(String(50), primary_key=True)
    value = Column(Unicode(50))

    @classmethod
    def getKey(cls, instance_id, key):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        return s

    @classmethod
    def getInstance(cls, instance_id):
        s = session.query(cls).filter_by(instance_id = instance_id).all()
        return s

    @classmethod
    def getInstanceDict(cls, instance_id):
        r = cls.getInstance(instance_id)
        d = {}
        for i, o in enumerate(r):
            d[o.key] = o.value
        return d

    @classmethod
    def saveKey(cls, instance_id, key, value):
        logger.info(u"Widget Save WidgetInstanceOption: {0} / {1} / {2}".format(instance_id, key, value))
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        if not s:
            s = cls(instance_id=instance_id, key=key)
        s.value = value
        session.add(s)
        session.commit()
        session.flush()
        return s

    @classmethod
    def delete(cls, instance_id, key):
        logger.info(u"Widget Delete WidgetInstanceOption: {0} / {1}".format(instance_id, key))
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        if s:
            session.delete(s)
        session.commit()
        return s

class WidgetInstanceSensor(Base):
    __tablename__ = 'widgetInstanceSensor'
    instance_id = Column(Integer(), ForeignKey('widgetInstance.id'), primary_key=True, nullable=False)
    instance = relationship("WidgetInstance")
    key = Column(String(50), primary_key=True)
    sensor_id = Column(Integer(), ForeignKey('sensor.id'))
    sensor = relationship("Sensor")

    @classmethod
    def getKey(cls, instance_id, key):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        return s

    @classmethod
    def getInstance(cls, instance_id):
        s = session.query(cls).options(joinedload('sensor').joinedload('device')).filter_by(instance_id = instance_id).all()
        session.expunge_all()
        return s

    @classmethod
    def getInstanceDict(cls, instance_id):
        r = cls.getInstance(instance_id)
        d = {}

        for i, o in enumerate(r):
            if (o.sensor):
                d[o.key] = to_json(o.sensor)
                d[o.key]['device'] = to_json(o.sensor.device)
        return d

    @classmethod
    def saveKey(cls, instance_id, key, sensor_id):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        if not s:
            s = cls(instance_id=instance_id, key=key)
        s.sensor_id = sensor_id
        session.add(s)
        session.commit()
        session.flush()
        return s

    @classmethod
    def saveArrayKey(cls, instance_id, key, sensors):
        s = session.query(cls).filter_by(instance_id = instance_id).filter(cls.key.like(key+"-%")).all()
        [session.delete(x) for x in s]
        i = 0
        for v in sensors:
            if v:
                k = "%s-%d" % (key, i)
                s = cls(instance_id=instance_id, key=k, sensor_id = v)
                session.add(s)
                i = i + 1
        session.commit()
        session.flush()

class WidgetInstanceCommand(Base):
    __tablename__ = 'widgetInstanceCommand'
    instance_id = Column(Integer(), ForeignKey('widgetInstance.id'), primary_key=True, nullable=False)
    instance = relationship("WidgetInstance")
    key = Column(String(50), primary_key=True)
    command_id = Column(Integer(), ForeignKey('command.id'))
    command = relationship("Command")

    @classmethod
    def getKey(cls, instance_id, key):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        return s

    @classmethod
    def getInstance(cls, instance_id):
        s = session.query(cls).options(joinedload('command').joinedload('device')).filter_by(instance_id = instance_id).all()
        session.expunge_all()
        return s

    @classmethod
    def getInstanceDict(cls, instance_id):
        r = cls.getInstance(instance_id)
        d = {}
        for i, o in enumerate(r):
            if (o.command):
                d[o.key] = to_json(o.command)
                parameters = CommandParam.getCommand(command_id=o.command_id)
                d[o.key]['parameters'] = to_json(parameters)
                d[o.key]['device'] = to_json(o.command.device)
        return d

    @classmethod
    def saveKey(cls, instance_id, key, command_id):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        if not s:
            s = cls(instance_id=instance_id, key=key)
        s.command_id = command_id
        session.add(s)
        session.commit()
        session.flush()
        return s

class WidgetInstanceDevice(Base):
    __tablename__ = 'widgetInstanceDevice'
    instance_id = Column(Integer(), ForeignKey('widgetInstance.id'), primary_key=True, nullable=False)
    instance = relationship("WidgetInstance")
    key = Column(String(50), primary_key=True)
    device_id = Column(Integer(), ForeignKey('device.id'))
    device = relationship("Device")

    @classmethod
    def getKey(cls, instance_id, key):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        return s

    @classmethod
    def getInstance(cls, instance_id):
        s = session.query(cls).options(joinedload('device').joinedload('sensors')).options(joinedload('device').joinedload('commands')).filter_by(instance_id = instance_id).all()
        session.expunge_all()
        return s

    @classmethod
    def getInstanceDict(cls, instance_id):
        r = cls.getInstance(instance_id)
        d = {}
        for i, o in enumerate(r):
            if (o.device):
                d[o.key] = to_json(o.device)
                d[o.key]["sensors"] = {}
                for j, s in enumerate(o.device.sensors):
                    d[o.key]["sensors"][s.reference] = to_json(s)
                d[o.key]["commands"] = {}
                for j, c in enumerate(o.device.commands):
                    d[o.key]["commands"][c.reference] = to_json(c)
        return d

    @classmethod
    def saveKey(cls, instance_id, key, device_id):
        s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
        if not s:
            s = cls(instance_id=instance_id, key=key)
        s.device_id = device_id
        session.add(s)
        session.commit()
        session.flush()
        return s

def to_json(model):
    """ Returns a JSON representation of an SQLAlchemy-backed object.
    """
    if isinstance(model, list):
        jsonm = []
        for m in model:
            jsonm.append(to_json(m))
    else:
        jsonm = {}
        for col in model._sa_class_manager.mapper.mapped_table.columns:
            jsonm[col.name] = getattr(model, col.name)

    return jsonm
