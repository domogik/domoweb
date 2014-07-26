import json
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Unicode, UnicodeText, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import backref, relationship, sessionmaker, joinedload

# alembic revision --autogenerate -m "xxxx"

url = 'sqlite:////var/lib/domoweb/db.sqlite'
#engine = create_engine(url, echo=True) # For debug sql
engine = create_engine(url)

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata
# create a configured "Session" class
Session = sessionmaker(bind=engine)

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
	default_style = Column(Boolean(), default=1)
	
	@classmethod
	def getAll(cls):
		# create a Session
		session = Session()
		s = session.query(cls).all()
		session.close()
		return s

	@classmethod
	def get(cls, id):
		# create a Session
		session = Session()
		s = session.query(cls).get(id)
		session.close()
		return s
		
	@classmethod
	def getSection(cls, section_id):
		# create a Session
		session = Session()
		s = session.query(cls).join(cls.instances).distinct().all()
		session.close()
		return s

	@classmethod
	def getSectionPacks(cls, section_id):
		# create a Session
		session = Session()
		s = session.query(cls.set_id).join(cls.instances).distinct().all()
		session.close()
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
	widget_id = Column(String(50), ForeignKey('widget.id', ondelete="cascade"), nullable=False)

	@classmethod
	def getWidget(cls, widget_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(widget_id=widget_id).all()
		session.close()
		return s

class WidgetSensor(Base):
	__tablename__ = 'widgetSensor'
	id = Column(String(50), primary_key=True)
	key = Column(String(50))
	name = Column(Unicode(50))
	required = Column(Boolean())
	types = Column(String(255))
	filters = Column(String(255), nullable=True)
	description = Column(Unicode(255), nullable=True)
	widget_id = Column(String(50), ForeignKey('widget.id', ondelete="cascade"), nullable=False)

	@classmethod
	def getWidget(cls, widget_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(widget_id=widget_id).all()
		session.close()
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
	widget_id = Column(String(50), ForeignKey('widget.id', ondelete="cascade"), nullable=False)

	@classmethod
	def getWidget(cls, widget_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(widget_id=widget_id).all()
		session.close()
		return s

class WidgetDevice(Base):
	__tablename__ = 'widgetDevice'
	id = Column(String(50), primary_key=True)
	key = Column(String(50))
	name = Column(Unicode(50))
	required = Column(Boolean())
	types = Column(String(255))
	description = Column(Unicode(255), nullable=True)
	widget_id = Column(String(50), ForeignKey('widget.id', ondelete="cascade"), nullable=False)

	@classmethod
	def getWidget(cls, widget_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(widget_id=widget_id).all()
		session.close()
		return s

class Theme(Base):
	__tablename__ = 'theme'
	id = Column(String(50), primary_key=True)
	version = Column(String(50))
	name = Column(Unicode(50))
	description = Column(Unicode(255), nullable=True)
	style = Column(UnicodeText())

class SectionParam(Base):
	__tablename__ = 'sectionParam'
	section_id = Column(Integer(), ForeignKey('section.id', ondelete="cascade"), primary_key=True)
	key = Column(String(50), primary_key=True)
	value = Column(String(255), nullable=True)

	@classmethod
	def getSection(cls, section_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(section_id = section_id).all()
		session.close()
		return s

	@classmethod
	def saveKey(cls, section_id, key, value):
		session = Session()
		s = session.query(cls).filter_by(section_id = section_id, key = key).first()
		if not s:
			s = cls(section_id=section_id, key=key)
		s.value = value
		session.add(s)
		session.commit()
		session.flush()
		session.close()
		return s

	@classmethod
	def delete(cls, section_id, key):
		session = Session()
		s = session.query(cls).filter_by(section_id = section_id, key = key).first()
		if s:
			session.delete(s)
		session.commit()
		return s

class Section(Base):
	__tablename__ = 'section'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	left = Column(Integer(), default=0)
	right = Column(Integer(), default=0)
	name = Column(Unicode(50))
	description = Column(UnicodeText(), nullable=True)
	theme_id = Column(String(50), ForeignKey('theme.id'), nullable=False, server_default='default')
	theme = relationship("Theme")
	params = relationship("SectionParam")

	@classmethod
	def add(cls, name, parent_id, description=None, icon=None):
		# create a Session
		session = Session()
		s = cls(name=name, description=description, icon=icon)
		parent = session.query(cls).get(parent_id)
		s.left = int(parent.left) + 1
		s.right = int(parent.left) + 2
		session.query(cls).filter('right >:sleft').\
			params(sleft=parent.left).update({'right':cls.right + 2}, synchronize_session='fetch')
		session.query(cls).filter('left >:sleft').\
			params(sleft=parent.left).update({'left':cls.left + 2}, synchronize_session='fetch')
		session.add(s)
		session.commit()
		return s

	@classmethod
	def get(cls, id):
		# create a Session
		session = Session()
		s = session.query(cls).\
			options(joinedload('theme')).\
			get(id)
		session.close()
		return s

	@classmethod
	def update(cls, id, name, description=None):
		# create a Session
		session = Session()
		s = session.query(cls).get(id)
		s.name = name
		s.description = description
		session.add(s)
		session.commit()
		session.flush()
		return s

	@classmethod
	def getParamsDict(cls, id):
		# create a Session
		session = Session()
		s = session.query(cls).get(id)
		# Combine Params for section
		style = json.loads(s.theme.style)
		params = {}
		for part in ["section", "grid", "widget"]:
			p = part[0].upper() + part[1:]
			for key in style[part]:
				k = key[0].upper() + key[1:]
				params[p + k] = style[part][key]
		# Override with user params
		for p in s.params:
			params[p.key] = p.value
		print params
		session.flush()
		return params

class DataType(Base):
	__tablename__ = 'dataType'
	id = Column(String(50), primary_key=True)
	parameters = Column(Text())

	@classmethod
	def getAll(cls):
		# create a Session
		session = Session()
		s = session.query(cls).all()
		session.close()
		return s

	@classmethod
	def getChilds(cls, id):
		session = Session()
		s = session.query(cls).get(id)
		if s:
			c = json.loads(s.parameters)		
			session.close()
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
		session = Session()
		session.query(cls).delete()
		session.query(Command).delete()
		session.query(CommandParam).delete()
		session.query(Sensor).delete()
		session.commit()
		session.flush()

	@classmethod
	def getTypesFilter(cls, types):
		session = Session()
		s = session.query(cls.type, cls.type, cls.id, cls.name).\
			filter(cls.type.in_(types)).\
			order_by(cls.id).all()
		session.close()
		return s

class Command(Base):
	__tablename__ = 'command'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all", backref="commands")
	reference = Column(String(50))
	return_confirmation = Column(Boolean(), default=True)
	datatypes = Column(String(255), nullable=False)

	@classmethod
	def getTypesFilter(cls, types):
		session = Session()
		s = session.query(cls.device_id, Device.name, cls.id, cls.name).\
			join(Device).\
			filter(cls.datatypes.in_(types)).\
			order_by(cls.device_id).all()
		session.close()
		return s

class CommandParam(Base):
	__tablename__ = 'commandParam'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	command_id = Column(Integer(), ForeignKey('command.id', ondelete="cascade"), nullable=False)
	command = relationship("Command", cascade="all", backref="parameters")
	key = Column(String(50))
	datatype_id = Column(String(50), ForeignKey('dataType.id'))
	datatype = relationship("DataType")
	
	@classmethod
	def getCommand(cls, command_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(command_id = command_id).all()
		session.close()
		return s

class Sensor(Base):
	__tablename__ = 'sensor'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all", backref="sensors")
	reference = Column(String(50))
	datatype_id = Column(String(50), ForeignKey('dataType.id'))
	datatype = relationship("DataType")
	last_value = Column(Unicode(50), nullable=True)
	last_received = Column(String(50), nullable=True)

	@classmethod
	def getTypesFilter(cls, types):
		session = Session()
		s = session.query(cls.device_id, Device.name, cls.id, cls.name).\
			join(Device).\
			filter(cls.datatype_id.in_(types)).\
			order_by(cls.device_id).all()
		session.close()
		return s

	@classmethod
	def update(cls, id, timestamp, value):
		session = Session()
		s = session.query(cls).get(id)
		if s:
			s.last_received = timestamp
			s.last_value = value
		session.add(s)
		session.commit()
		return s

class WidgetInstance(Base):
	__tablename__ = 'widgetInstance'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	section_id = Column(String(50), ForeignKey('section.id'))
	section = relationship("Section")
	order = Column(Integer())
	widget_id = Column(String(50), ForeignKey('widget.id'))
	widget = relationship("Widget", foreign_keys='WidgetInstance.widget_id', lazy='joined', backref='instances')
	options = relationship("WidgetInstanceOption", cascade="all")
	sensors = relationship("WidgetInstanceSensor", cascade="all")
	commands = relationship("WidgetInstanceCommand", cascade="all")

	@classmethod
	def get(cls, id):
		# create a Session
		session = Session()
		s = session.query(cls).get(id)
		session.close()
		return s

	@classmethod
	def add(cls, section_id, widget_id):
		# create a Session
		session = Session()
		s = cls(section_id=section_id, widget_id=widget_id)
		session.add(s)
		session.commit()
		return s

	@classmethod
	def getSection(cls, section_id):
		# create a Session
		session = Session()
		s = session.query(cls).filter_by(section_id = section_id).order_by(cls.order).all()
		session.close()
		return s

	@classmethod
	def delete(cls, id):
		session = Session()
		s = session.query(cls).get(id)
		session.delete(s)
		session.commit()
		return s

	@classmethod
	def updateOrder(cls, id, order):
		session = Session()
		s = session.query(cls).get(id)
		s.order = order
		session.add(s)
		session.commit()
		return s

class WidgetInstanceOption(Base):
	__tablename__ = 'widgetInstanceOption'
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), primary_key=True, nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50), primary_key=True)
	value = Column(Unicode(50))
	
	@classmethod
	def getKey(cls, instance_id, key):
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		session.close()
		return s

	@classmethod
	def getInstance(cls, instance_id):
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id).all()
		session.close()
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
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		if not s:
			s = cls(instance_id=instance_id, key=key)
		s.value = value
		session.add(s)
		session.commit()
		session.flush()
		session.close()
		return s

class WidgetInstanceSensor(Base):
	__tablename__ = 'widgetInstanceSensor'
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), primary_key=True, nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50), primary_key=True)
	sensor_id = Column(Integer(), ForeignKey('sensor.id'))
	sensor = relationship("Sensor")
	
	@classmethod
	def getKey(cls, instance_id, key):
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		session.close()
		return s

	@classmethod
	def getInstance(cls, instance_id):
		session = Session()
		s = session.query(cls).options(joinedload('sensor').joinedload('device')).filter_by(instance_id = instance_id).all()
		session.expunge_all()
		session.close()
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
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		if not s:
			s = cls(instance_id=instance_id, key=key)
		s.sensor_id = sensor_id
		session.add(s)
		session.commit()
		session.flush()
		session.close()
		return s

class WidgetInstanceCommand(Base):
	__tablename__ = 'widgetInstanceCommand'
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), primary_key=True, nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50), primary_key=True)
	command_id = Column(Integer(), ForeignKey('command.id'))
	command = relationship("Command")
	
	@classmethod
	def getKey(cls, instance_id, key):
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		session.close()
		return s

	@classmethod
	def getInstance(cls, instance_id):
		session = Session()
		s = session.query(cls).options(joinedload('command').joinedload('device')).filter_by(instance_id = instance_id).all()
		session.expunge_all()
		session.close()
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
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		if not s:
			s = cls(instance_id=instance_id, key=key)
		s.command_id = command_id
		session.add(s)
		session.commit()
		session.flush()
		session.close()
		return s

class WidgetInstanceDevice(Base):
	__tablename__ = 'widgetInstanceDevice'
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), primary_key=True, nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50), primary_key=True)
	device_id = Column(Integer(), ForeignKey('device.id'))
	device = relationship("Device")
	
	@classmethod
	def getKey(cls, instance_id, key):
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		session.close()
		return s

	@classmethod
	def getInstance(cls, instance_id):
		session = Session()
		s = session.query(cls).options(joinedload('device').joinedload('sensors')).options(joinedload('device').joinedload('commands')).filter_by(instance_id = instance_id).all()
		session.expunge_all()
		session.close()
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
		session = Session()
		s = session.query(cls).filter_by(instance_id = instance_id, key = key).first()
		if not s:
			s = cls(instance_id=instance_id, key=key)
		s.device_id = device_id
		session.add(s)
		session.commit()
		session.flush()
		session.close()
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