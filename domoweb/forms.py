#!/usr/bin/env python
import pkg_resources
pkg_resources.require("WTForms>=2.0")
import json
import itertools
import wtforms
import re
from collections import OrderedDict
from wtforms import StringField, TextAreaField, BooleanField, DateField, DateTimeField, DecimalField, IntegerField, SelectField, SelectMultipleField, widgets, FieldList
from wtforms.validators import InputRequired, Length, Email, URL, IPAddress, NumberRange, Optional
from domoweb.models import WidgetOption, WidgetSensor, WidgetCommand, WidgetDevice, WidgetInstance, WidgetInstanceOption, WidgetInstanceSensor, WidgetInstanceCommand, WidgetInstanceDevice, Device, Sensor, Command, DataType
from wtforms_components import SelectField

"""
.. _WTForms: http://wtforms.simplecodes.com/

A simple wrapper for WTForms_.

Basically we only need to map the request handler's `arguments` to the 
`wtforms.form.Form` input. Quick example::

    from wtforms import TextField, validators
    from tornadotools.forms import Form

    class SampleForm(Form):
        username = TextField('Username', [
            validators.Length(min=4, message="Too short")
            ])

        email = TextField('Email', [
            validators.Length(min=4, message="Not a valid mail address"),
            validators.Email()
            ])

Then, in the `RequestHandler`::

    def get(self):
        form = SampleForm(self)
        if form.validate():
            # do something with form.username or form.email
            pass
        self.render('template.html', form=form)
"""
class Form(wtforms.Form):
    """
    `WTForms` wrapper for Tornado.
    """

    def __init__(self, handler=None, data=None, prefix='', **kwargs):
        """
        Wrap the `formdata` with the `TornadoInputWrapper` and call the base
        constuctor.
        """
        self._handler = handler
        if handler:
            super(Form, self).__init__(TornadoInputWrapper(handler), prefix=prefix, **kwargs)
        else:
            super(Form, self).__init__(data=data, prefix=prefix, **kwargs)

class TornadoInputWrapper(object):
    def __init__(self, handler):
        self._handler = handler

    def __iter__(self):
        return iter(self._handler.request.arguments)

    def __len__(self):
        return len(self._handler.request.arguments)

    def __contains__(self, name):
        return (name in self._handler.request.arguments)

    def getlist(self, name):
        return self._handler.get_arguments(name)

class BooleanField(BooleanField):
    def process_data(self, value):
        if isinstance(value, str) or isinstance(value, unicode):
            value = int(value)
        self.data = bool(value)

class ParametersForm(wtforms.Form):
    def __init__(self, instance, handler=None, data=None, prefix='', **kwargs):
        """
        Wrap the `formdata` with the `TornadoInputWrapper` and call the base
        constuctor.
        """
        self._handler = handler
        if handler:
            super(ParametersForm, self).__init__(TornadoInputWrapper(handler), prefix=prefix, **kwargs)
        else:
            super(ParametersForm, self).__init__(data=data, prefix=prefix, **kwargs)

        self.instance = instance

    @classmethod
    def addStringField(cls, key, label, default=None, required=False, max_length=60, help_text=None, parameters=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        min = -1
        max = -1
        if parameters:
            if "min_value" in parameters:
                min = parameters["min_value"]
            if "max_value" in parameters:
                max = parameters["max_value"]
        if min!=-1 or max!=-1:
            validators.append(Length(min=min, max=max))
#            elif "mask" in parameters: #https://github.com/shaungrady/jquery-mask-input
#                widget=MaskInput(parameters['mask'])
        if parameters and "multilignes" in parameters:
            setattr(cls, key, TextAreaField(label, default=default, validators=validators, description=help_text))
        else:
            setattr(cls, key, StringField(label, default=default, validators=validators, description=help_text))

    @classmethod
    def addBooleanField(cls, key, label, default=None, help_text=None):
        validators=[]
#        if required:
#            validators.append(InputRequired())
#        else
#            validators.append(Optional())
        setattr(cls, key, BooleanField(label, default=default, validators=validators, description=help_text, ))

    @classmethod
    def addModelChoiceField(cls, key, label, queryset, group_by_field, empty_label, required, help_text=None):
        from itertools import groupby
        from operator import itemgetter
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        choices = [('', empty_label)]
        if group_by_field:
            choices += [(k, map(lambda g: (unicode(g[2]), g[3]), group)) for k, group in groupby(queryset, key=itemgetter(1))]
        else:
            choices += [(unicode(g[2]), g[3]) for g in queryset]
        setattr(cls, key, SelectField(label, validators=validators, choices=choices, description=help_text))
    
    @classmethod
    def addGroupModelChoiceField(cls, key, label, queryset, group_by_field, empty_label, min, max, help_text=None):
        from itertools import groupby
        from operator import itemgetter
        validators=[]
        validators.append(Optional())
        choices = [('', empty_label)]
        if group_by_field:
            choices += [(k, map(lambda g: (unicode(g[2]), g[3]), group)) for k, group in groupby(queryset, key=itemgetter(1))]
        else:
            choices += [(unicode(g[2]), g[3]) for g in queryset]
        setattr(cls, key, FieldList(SelectField(validators=validators, choices=choices), label, description=help_text, min_entries=min, max_entries=max ))

    @classmethod
    def addChoiceField(cls, key, label, default=None, required=False, help_text=None, parameters=None, empty_label=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        choices = [('', '--Select Parameter--')]
        if parameters:
            if "choices" in parameters:
                ordered = OrderedDict(sorted(parameters["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        setattr(cls, key, SelectField(label, default=default, validators=validators, choices=choices, description=help_text))

    @classmethod
    def addMultipleChoiceField(cls, key, label, default=None, required=False, help_text=None, parameters=None, empty_label=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        choices = []
        if parameters:
            if "choices" in parameters:
                ordered = OrderedDict(sorted(parameters["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        setattr(cls, key, SelectMultipleField(label, default=default, validators=validators, choices=choices, description=help_text))

    @classmethod
    def addDateField(cls, key, label, default=None, required=False, help_text=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        setattr(cls, key, DateField(label, default=default, validators=validators, description=help_text, format='%d/%m/%Y'))

    @classmethod
    def addTimeField(cls, key, label, default=None, required=False, help_text=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
#        self.fields[key] = forms.TimeField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%H:%M:%S'])

    @classmethod
    def addDateTimeField(cls, key, label, default=None, required=False, help_text=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        setattr(cls, key, DateTimeField(label, default=default, validators=validators, description=help_text, format='%Y-%m-%d %H:%M:%S'))

    @classmethod
    def addDecimalField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        min = -1
        max = -1
        if parameters:
            if "min_value" in parameters:
                min = parameters["min_value"]
            if "max_value" in parameters:
                max = parameters["max_value"]
        if min!=-1 or max!=-1:
            validators.append(NumberRange(min=min, max=max))
        setattr(cls, key, DecimalField(label, default=default, validators=validators, description=help_text))

    @classmethod
    def addIntegerField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        min = -1
        max = -1
        if parameters:
            if "min_value" in parameters:
                min = parameters["min_value"]
            if "max_value" in parameters:
                max = parameters["max_value"]
        if min!=-1 or max!=-1:
            validators.append(NumberRange(min=min, max=max))
        setattr(cls, key, IntegerField(label, default=default, validators=validators, description=help_text))

    @classmethod
    def addEmailField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        validators.append(Email())
        min = -1
        max = -1
        if parameters:
            if "min_value" in parameters:
                min = parameters["min_value"]
            if "max_value" in parameters:
                max = parameters["max_value"]
        if min!=-1 or max!=-1:
            validators.append(Length(min=min, max=max))
        setattr(cls, key, StringField(label, default=default, validators=validators, description=help_text))

    @classmethod
    def addURLField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        validators.append(URL(require_tld=False))
        min = -1
        max = -1
        if parameters:
            if "min_value" in parameters:
                min = parameters["min_value"]
            if "max_value" in parameters:
                max = parameters["max_value"]
        if min!=-1 or max!=-1:
            validators.append(Length(min=min, max=max))
        setattr(cls, key, StringField(label, default=default, validators=validators, description=help_text))

    @classmethod
    def addIPv4Field(cls, key, label, default=None, required=False, help_text=None):
        validators=[]
        if required:
            validators.append(InputRequired())
        else:
            validators.append(Optional())
        validators.append(IPAddress())
        setattr(cls, key, StringField(label, default=default, validators=validators, description=help_text))

class WidgetOptionsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(WidgetOptionsForm, self).__init__(*args, **kwargs)

    @classmethod
    def addField(cls, option, value=None):
        parameters = json.loads(option.parameters)

        if not value:
            if option.type == 'boolean':
                if not option.default == '':
                    value = (option.default == 'true' or option.default == 'True')
            else:
                value = option.default

        if option.type == 'boolean':
            cls.addBooleanField(key=option.key, label=option.name, default=value, help_text=option.description)
        elif option.type == 'string':
            cls.addStringField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'choice':
            cls.addChoiceField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'multiplechoice':
            cls.addMultipleChoiceField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'date':
            cls.addDateField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description)
        elif option.type == 'time':
            cls.addTimeField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description)
        elif option.type == 'datetime':
            cls.addDateTimeField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description)
        elif option.type == 'float':
            cls.addDecimalField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'integer':
            cls.addIntegerField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'email':
            cls.addEmailField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'ipv4':
            cls.addIPv4Field(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description)
        elif option.type == 'url':
            cls.addURLField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)
        else:
            cls.addStringField(key=option.key, label=option.name, default=value, required=option.required, help_text=option.description, parameters=parameters)

    def save(self):
        for key, value in self.data.iteritems():
            if isinstance(value, list):
                value = ', '.join(value)
            WidgetInstanceOption.saveKey(instance_id=self.instance.id, key=key, value=value)

class WidgetSensorsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        super(WidgetSensorsForm, self).__init__(*args, **kwargs)

    @classmethod
    def addField(cls, option):
        types = json.loads(option.types)
        for t in types:
            types += DataType.getChilds(id=t)
        sensors = Sensor.getTypesFilter(types=types)
        if (option.group):
            cls.addGroupModelChoiceField(key=option.key, label=option.name, min=option.groupmin, max=option.groupmax, queryset=sensors, group_by_field='device_id', empty_label="--Select Sensor--", help_text=option.description)
        else:
            cls.addModelChoiceField(key=option.key, label=option.name, required=option.required, queryset=sensors, group_by_field='device_id', empty_label="--Select Sensor--", help_text=option.description)

    def save(self):
        for key, value in self.data.iteritems():
            if isinstance(value, list):
                WidgetInstanceSensor.saveArrayKey(instance_id=self.instance.id, key=key, sensors=value)
            else:
                WidgetInstanceSensor.saveKey(instance_id=self.instance.id, key=key, sensor_id=value)

class WidgetCommandsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        super(WidgetCommandsForm, self).__init__(*args, **kwargs)

    @classmethod
    def addField(cls, option):
        types = json.loads(option.types)
        datatypes = []
        for t in types:
            args = ()
            for d in t:
                l = [d]
                l += DataType.getChilds(id=d)
                args += (l,)
                for p in itertools.product(*args):
                    datatypes.append(''.join(p))
        commands = Command.getTypesFilter(types=datatypes)
        cls.addModelChoiceField(key=option.key, label=option.name, required=option.required, queryset=commands, group_by_field='device_id', empty_label="--Select Command--", help_text=option.description)

    def save(self):
        for key, value in self.data.iteritems():
            WidgetInstanceCommand.saveKey(instance_id=self.instance.id, key=key, command_id=value)

class WidgetDevicesForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        super(WidgetDevicesForm, self).__init__(*args, **kwargs)

    @classmethod
    def addField(cls, option):
        types = json.loads(option.types)
        devices = Device.getTypesFilter(types=types)
        cls.addModelChoiceField(key=option.key, label=option.name, required=option.required, queryset=devices, group_by_field='type', empty_label="--Select Device--", help_text=option.description)

    def save(self):
        for key, value in self.data.iteritems():
            if isinstance(value, list):
                value = ', '.join(value)
            WidgetInstanceDevice.saveKey(instance_id=self.instance.id, key=key, device_id=value)

class WidgetGeneralForm(Form):
    debug = BooleanField(u'Debug', default=False, description=u'Enable widget debug mode')

class WidgetStyleForm(Form):
    WidgetBackgroundColor = StringField(u'Background Color', description=u'Override default background color')
    WidgetTextColor = StringField(u'Text Color', description=u'Override default text color')
    WidgetBorderColor = StringField(u'Border Color', description=u'Override default border color')
    WidgetBorderRadius = StringField(u'Border Radius', description=u'Override default border radius')
    WidgetBoxShadow = StringField(u'Box Shadow', description=u'Override default shadow parameters')

class WidgetInstanceForms(object):
    has_options = False
    has_sensors = False
    has_commands = False
    has_devices = False

    def __init__(self, instance, handler=None):
        self.instance = instance
        class OptionsForm(WidgetOptionsForm):
            pass
        class SensorsForm(WidgetSensorsForm):
            pass
        class CommandsForm(WidgetCommandsForm):
            pass
        class DevicesForm(WidgetDevicesForm):
            pass

        widgetoptions = WidgetOption.getWidget(instance.widget_id)
        if widgetoptions:
            self.has_options = True
        widgetsensors = WidgetSensor.getWidget(instance.widget_id) 
        if widgetsensors:
            self.has_sensors = True
        widgetcommands = WidgetCommand.getWidget(instance.widget_id)
        if widgetcommands:
            self.has_commands = True
        widgetdevices = WidgetDevice.getWidget(instance.widget_id)
        if widgetdevices:
            self.has_devices = True

        if not handler:
            options = WidgetInstanceOption.getInstance(instance.id)
            dataOptions = dict([(r.key, r.value) for r in options])
            sensors = WidgetInstanceSensor.getInstance(instance.id)
            dataSensors = dict([(r.key, r.sensor_id) for r in sensors])
            # Rebuild array values
            reg = re.compile(r"(.*)-(\d+)")
            tmpdict = {}
            for k, v in dataSensors.iteritems():
                res = reg.match(k)
                if res:
                    if (res.group(1) not in tmpdict):
                        tmpdict[res.group(1)] = []
                    tmpdict[res.group(1)].append(v)
            dataSensors = dict(dataSensors.items() + tmpdict.items())

            commands = WidgetInstanceCommand.getInstance(instance.id)
            dataCommands = dict([(r.key, r.command_id) for r in commands])
            devices = WidgetInstanceDevice.getInstance(instance.id)
            dataDevices = dict([(r.key, r.device_id) for r in devices])
        else:
            dataOptions = None
            dataSensors = None
            dataCommands = None
            dataDevices = None

        for option in widgetoptions:
            OptionsForm.addField(option=option)
        for option in widgetsensors:
            SensorsForm.addField(option=option)
        for option in widgetcommands:
            CommandsForm.addField(option=option)
        for option in widgetdevices:
            DevicesForm.addField(option=option)

        self.optionsform = OptionsForm(instance=instance, handler=handler, data=dataOptions, prefix='optionparam_')
        self.sensorsform = SensorsForm(instance=instance, handler=handler, data=dataSensors, prefix='sensorparam_')
        self.commandsform = CommandsForm(instance=instance, handler=handler, data=dataCommands, prefix='commandparam_')
        self.devicesform = DevicesForm(instance=instance, handler=handler, data=dataDevices, prefix='deviceparam_')
        self.generalform = WidgetGeneralForm(handler=handler, data=dataOptions, prefix='generalparam_')
        self.styleform = WidgetStyleForm(handler=handler, data=dataOptions, prefix='styleparam_')

    def validate(self):
        valid = self.optionsform.validate()
        valid = self.sensorsform.validate() and valid
        valid = self.commandsform.validate() and valid
        valid = self.devicesform.validate() and valid
        valid = self.generalform.validate() and valid
        valid = self.styleform.validate() and valid
        return valid

    def save(self):    
        self.optionsform.save()
        self.sensorsform.save()
        self.commandsform.save()
        self.devicesform.save()
        # General
        for key, value in self.generalform.data.iteritems():
            if isinstance(value, list):
                value = ', '.join(value)
            if value:
                WidgetInstanceOption.saveKey(instance_id=self.instance.id, key=key, value=value)
            else:
                WidgetInstanceOption.delete(instance_id=self.instance.id, key=key)

        # General
        for key, value in self.styleform.data.iteritems():
            if isinstance(value, list):
                value = ', '.join(value)
            if value:
                WidgetInstanceOption.saveKey(instance_id=self.instance.id, key=key, value=value)
            else:
                WidgetInstanceOption.delete(instance_id=self.instance.id, key=key)
