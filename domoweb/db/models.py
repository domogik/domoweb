from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Unicode, UnicodeText, Boolean, ForeignKey, String
from sqlalchemy.orm import backref, relationship

# alembic revision --autogenerate -m "xxxx"

url = 'sqlite:////var/lib/domoweb/db.sqlite'
engine = create_engine(url)

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

metadata = Base.metadata

class Parameter(Base):
	__tablename__ = 'parameter'
	key = Column(String(30), primary_key=True)
	value = Column(Unicode(255))

class PageTheme(Base):
	__tablename__ = 'pageTheme'
	id = Column(String(50), primary_key=True)
	label = Column(Unicode(50))

class PageIcon(Base):
	__tablename__ = 'pageIcon'
	id = Column(String(50), primary_key=True)
	iconset_id = Column(String(50))
	iconset_name = Column(Unicode(50))
	icon_id = Column(String(50))
	label = Column(Unicode(50))

class Page(Base):
	__tablename__ = 'page'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	left = Column(Integer(), default=0)
	right = Column(Integer(), default=0)
	name = Column(Unicode(50))
	description = Column(UnicodeText(), nullable=True)
	icon_id = Column(String(50), ForeignKey('pageIcon.id'), nullable=True)
	icon = relationship("PageIcon")
	theme_id = Column(String(50), ForeignKey('pageTheme.id'), nullable=True)
	theme = relationship("PageTheme")

class DataType(Base):
	__tablename__ = 'dataType'
	id = Column(String(50), primary_key=True)
	parameters = Column(UnicodeText())

class Package(Base):
	__tablename__ = 'package'
	id = Column(String(50), primary_key=True)
	name = Column(Unicode(50))
	type = Column(Unicode(50))
	version = Column(Unicode(50))
	author = Column(Unicode(255), nullable=True)
	author_email = Column(Unicode(255), nullable=True)
	tags = Column(Unicode(255), nullable=True)
	description = Column(UnicodeText(), nullable=True)
	udevRules = relationship("PackageUdevRule", backref=__tablename__, cascade="all")
	dependencies = relationship("PackageDependency", backref=__tablename__, cascade="all")
	deviceTypes = relationship("PackageDeviceType", backref=__tablename__, cascade="all")
	products = relationship("PackageProduct", backref=__tablename__, cascade="all")

class PackageUdevRule(Base):
	__tablename__ = 'packageUdevRule'
	filename = Column(Unicode(50), primary_key=True)
	rule = Column(UnicodeText())
	description = Column(UnicodeText(), nullable=True)
	model = Column(Unicode(255), nullable=True)
	package_id = Column(String(50), ForeignKey('package.id', ondelete="cascade"), nullable=False)

class PackageDependency(Base):
	__tablename__ = 'packageDependency'
	id = Column(String(50), primary_key=True)
	type = Column(Unicode(50))
	package_id = Column(String(50), ForeignKey('package.id', ondelete="cascade"), nullable=False)

class PackageDeviceType(Base):
	__tablename__ = 'packageDeviceType'
	id = Column(String(50), primary_key=True)
	name = Column(Unicode(50))
	description = Column(UnicodeText(), nullable=True)
	package_id = Column(String(50), ForeignKey('package.id', ondelete="cascade"), nullable=False)

class PackageProduct(Base):
	__tablename__ = 'packageProduct'
	id = Column(String(50), primary_key=True)
	name = Column(Unicode(50))
	documentation = Column(Unicode(255), nullable=True)
	package_id = Column(String(50), ForeignKey('package.id', ondelete="cascade"), nullable=False)
	device_type = Column(Unicode(50), ForeignKey('packageDeviceType.id', ondelete="cascade"), nullable=False)

class Client(Base):
	__tablename__ = 'client'
	id = Column(String(50), primary_key=True)
	host = Column(Unicode(50))
	pid = Column(Integer())
	status = Column(Unicode(50))
	configured = Column(Boolean())
	package_id = Column(String(50), ForeignKey('package.id'), nullable=True)
	package = relationship("Package")

class ClientConfiguration(Base):
	__tablename__ = 'clientConfiguration'
	id = Column(Unicode(255), primary_key=True)
	name = Column(Unicode(50))
	key = Column(Unicode(50))
	type = Column(Unicode(50))
	default = Column(UnicodeText(), nullable=True)
	description = Column(UnicodeText(), nullable=True)
	required = Column(Boolean())
	options = Column(UnicodeText(), nullable=True)
	sort = Column(Integer())
	value = Column(UnicodeText(), nullable=True)
	client_id = Column(String(50), ForeignKey('client.id', ondelete="cascade"), nullable=False)
	client = relationship("Client", cascade="all")

class Device(Base):
	__tablename__ = 'device'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	description = Column(Unicode(255), nullable=True)
	reference = Column(Unicode(255), nullable=True)
	type = Column(Unicode(50), ForeignKey('packageDeviceType.id'), nullable=True)

class XPLCmd(Base):
	__tablename__ = 'xplCmd'
	id = Column(Integer(), primary_key=True)
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
	json_id = Column(String(50))

class XPLStat(Base):
	__tablename__ = 'xplStat'
	id = Column(Integer(), primary_key=True)
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
	json_id = Column(String(50))
	
class Command(Base):
	__tablename__ = 'command'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
	reference = Column(Unicode(50))
	return_confirmation = Column(Boolean(), default=True)
	
class CommandParam(Base):
	__tablename__ = 'commandParam'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	command_id = Column(Integer(), ForeignKey('command.id', ondelete="cascade"), nullable=False)
	command = relationship("Command", cascade="all")
	key = Column(Unicode(50))
	datatype = Column(Unicode(50), ForeignKey('dataType.id'))
	
class Sensor(Base):
	__tablename__ = 'sensor'
	id = Column(Integer(), primary_key=True)
	name = Column(Unicode(50))
	device_id = Column(Integer(), ForeignKey('device.id', ondelete="cascade"), nullable=False)
	device = relationship("Device", cascade="all")
	reference = Column(Unicode(50))
	datatype = Column(Unicode(50), ForeignKey('dataType.id'))
	last_value = Column(Unicode(50), nullable=True)
	last_received = Column(Unicode(50), nullable=True)

class Widget(Base):
	__tablename__ = 'widget'
	id = Column(String(50), primary_key=True)

class WidgetInstance(Base):
	__tablename__ = 'widgetInstance'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	page_id = Column(String(50), ForeignKey('page.id'))
	page = relationship("Page")
	order = Column(Integer())
	widget_id = Column(String(50), ForeignKey('widget.id'))
	widget = relationship("Widget")
	params = relationship("WidgetInstanceParam", cascade="all")
	sensors = relationship("WidgetInstanceSensor", cascade="all")
	commands = relationship("WidgetInstanceCommand", cascade="all")

class WidgetInstanceParam(Base):
	__tablename__ = 'widgetInstanceParam'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(Unicode(50))
	value = Column(Unicode(50))

class WidgetInstanceSensor(Base):
	__tablename__ = 'widgetInstanceSensor'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(Unicode(50))
	sensor_id = Column(Integer(), ForeignKey('sensor.id'))
	sensor = relationship("Sensor")

class WidgetInstanceCommand(Base):
	__tablename__ = 'widgetInstanceCommand'
	id = Column(Integer(), primary_key=True, autoincrement=True)
	instance_id = Column(Integer(), ForeignKey('widgetInstance.id', ondelete="cascade"), nullable=False)
	instance = relationship("WidgetInstance")
	key = Column(Unicode(50))
	command_id = Column(Integer(), ForeignKey('command.id'))
	command = relationship("Command")
