import json
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Unicode, UnicodeText, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import backref, relationship, sessionmaker, joinedload

# alembic revision --autogenerate -m "xxxx"

url = 'sqlite:////var/lib/domoweb/db.sqlite'
# engine = create_engine(url, echo=True) # For debug sql
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

class SectionTheme(Base):
	__tablename__ = 'sectionTheme'
	id = Column(String(50), primary_key=True)
	label = Column(Unicode(50))

class SectionIcon(Base):
	__tablename__ = 'sectionIcon'
	id = Column(String(50), primary_key=True)
	iconset_id = Column(String(50))
	iconset_name = Column(Unicode(50))
	icon_id = Column(String(50))
	label = Column(Unicode(50))

class Section(Base):
	__tablename__ = 'section'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	left = Column(Integer(), default=0)
	right = Column(Integer(), default=0)
	name = Column(Unicode(50))
	description = Column(UnicodeText(), nullable=True)
	icon_id = Column(String(50), ForeignKey('sectionIcon.id'), nullable=True)
	icon = relationship("SectionIcon")
	theme_id = Column(String(50), ForeignKey('sectionTheme.id'), nullable=True)
	theme = relationship("SectionTheme")

	@classmethod
	def add(cls, name, parent_id, description=None, icon=None, theme=None):
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
		s = session.query(cls).get(id)
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

class DataType(Base):
	__tablename__ = 'dataType'
	id = Column(String(50), primary_key=True)
	parameters = Column(Text())

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

class Command(Base):
	__tablename__ = 'command'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
	reference = Column(String(50))
	return_confirmation = Column(Boolean(), default=True)
	
class CommandParam(Base):
	__tablename__ = 'commandParam'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	command_id = Column(Integer(), ForeignKey('command.id', ondelete="cascade"), nullable=False)
	command = relationship("Command", cascade="all")
	key = Column(String(50))
	datatype_id = Column(String(50), ForeignKey('dataType.id'))
	datatype = relationship("DataType")
	
class Sensor(Base):
	__tablename__ = 'sensor'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
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
			filter(cls.datatype_id.in_(json.loads(types))).\
			order_by(cls.device_id).all()
		session.close()
		return s

class WidgetInstance(Base):
	__tablename__ = 'widgetInstance'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	section_id = Column(String(50), ForeignKey('section.id'))
	section = relationship("Section")
	order = Column(Integer())
	widget_id = Column(String(50), ForeignKey('widget.id'))
	widget = relationship("Widget", foreign_keys='WidgetInstance.widget_id', lazy='joined')
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
		s = session.query(cls).filter_by(section_id = section_id).all()
		session.close()
		return s

	@classmethod
	def delete(cls, id):
		session = Session()
		s = session.query(cls).get(id)
		session.delete(s)
		session.commit()
		return s

class WidgetInstanceOption(Base):
	__tablename__ = 'widgetInstanceOption'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50))
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
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50))
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
		s = session.query(cls).options(joinedload('sensor')).filter_by(instance_id = instance_id).all()
		session.expunge_all()
		session.close()
		return s

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
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(String(50))
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
		s = session.query(cls).filter_by(instance_id = instance_id).all()
		session.close()
		return s

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