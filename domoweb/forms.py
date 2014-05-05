#!/usr/bin/env python
import json
from collections import OrderedDict
from wtforms import Form, StringField, BooleanField, DateField, DateTimeField, DecimalField, IntegerField, SelectField, SelectMultipleField, Flags
from domoweb.models import WidgetOption, WidgetInstance, WidgetInstanceOption, WidgetInstanceSensor, WidgetInstanceCommand, Device, Sensor, Command

class ParametersForm(Form):
    def __init__(self, *args, **kwargs):
        super(ParametersForm, self).__init__(*args, **kwargs)

#    def setData(self, kwds):
#        """Set the data to include in the form"""
#        for name,field in self.fields.items():
#            self.data[name] = field.widget.value_from_datadict(
#                kwds, self.files, self.add_prefix(name))
#        self.is_bound = True
    
#    def validate(self):
#        self.full_clean()

#        for name,field in self.fields.items():
#            if 'errors' in field:
#                print name, field.errors


    @classmethod
    def addStringField(cls, key, label, default=None, required=False, max_length=60, help_text=None, parameters=None):
        setattr(cls, key, StringField(label, default=default, description=help_text))
#        validators=[]
#        widget=forms.TextInput
#        if parameters:
#            if "min_length" in parameters:
#                validators.append(MinLengthValidator(parameters["min_length"]))
#            if "max_length" in parameters:
#                validators.append(MaxLengthValidator(parameters["max_length"]))
#            if "multilignes" in parameters:
#                widget=forms.Textarea
#            elif "mask" in parameters: #https://github.com/shaungrady/jquery-mask-input
#                widget=MaskInput(parameters['mask'])
#        self.fields[key] = forms.CharField(widget=widget, label=label, required=required, max_length=max_length, initial=default, help_text=help_text, validators=validators)

    @classmethod
    def addBooleanField(cls, key, label, default=None, help_text=None):
        setattr(cls, key, BooleanField(label, default=default, description=help_text))
#        self.fields[key] = forms.BooleanField(label=label, required=False, initial=default, help_text=help_text)

    """
    @classmethod
    def addGroupedModelChoiceField(cls, key, label, default=None, queryset, group_by_field, empty_label, required, help_text=None):
        pass
#        self.fields[key] = GroupedModelChoiceField(label=label, required=required, queryset=queryset, group_by_field=group_by_field, empty_label=empty_label, initial=default, help_text=help_text)
    """

    @classmethod
    def addChoiceField(cls, key, label, default=None, required=False, help_text=None, parameters=None, empty_label=None):
        choices = [('', '--Select Parameter--')]
        if parameters:
            if "choices" in parameters:
                ordered = OrderedDict(sorted(parameters["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        setattr(cls, key, SelectField(label, default=default, choices=choices, description=help_text))
#        self.fields[key] = forms.ChoiceField(label=label, required=required, choices=choices, initial=default, help_text=help_text)

    @classmethod
    def addMultipleChoiceField(cls, key, label, default=None, required=False, help_text=None, parameters=None, empty_label=None):
        choices = []
        if parameters:
            if "choices" in parameters:
                ordered = OrderedDict(sorted(parameters["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        setattr(cls, key, SelectMultipleField(label, default=default, choices=choices, description=help_text))
#        self.fields[key] = forms.MultipleChoiceField(label=label, required=required, choices=choices, initial=default, help_text=help_text)

    @classmethod
    def addDateField(cls, key, label, default=None, required=False, help_text=None):
        setattr(cls, key, DateField(label, default=default, description=help_text))
#        self.fields[key] = forms.DateField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%d/%m/%Y'])

    @classmethod
    def addTimeField(cls, key, label, default=None, required=False, help_text=None):
        pass
#        self.fields[key] = forms.TimeField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%H:%M:%S'])

    @classmethod
    def addDateTimeField(cls, key, label, default=None, required=False, help_text=None):
        setattr(cls, key, DateTimeField(label, default=default, description=help_text))
#        self.fields[key] = forms.DateTimeField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%Y-%m-%d %H:%M:%S'])

    @classmethod
    def addDecimalField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        setattr(cls, key, DecimalField(label, default=default, description=help_text))
#        validators=[]
#        if options:
#            if "min_value" in options:
#                validators.append(MinValueValidator(options["min_value"]))
#            if "max_value" in options:
#                validators.append(MaxValueValidator(options["max_value"]))

#        self.fields[key] = forms.FloatField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    @classmethod
    def addIntegerField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        setattr(cls, key, IntegerField(label, default=default, description=help_text))
#        validators=[]
#        if options:
#            if "min_value" in options:
#                validators.append(MinValueValidator(options["min_value"]))
#            if "max_value" in options:
#                validators.append(MaxValueValidator(options["max_value"]))
#        self.fields[key] = forms.IntegerField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    @classmethod
    def addEmailField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        pass
 #       validators=[]
 #       if options:
 #           if "min_length" in options:
 #               validators.append(MinLengthValidator(options["min_length"]))
 #           if "max_length" in options:
 #               validators.append(MaxLengthValidator(options["max_length"]))
 #       self.fields[key] = forms.EmailField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    @classmethod
    def addURLField(cls, key, label, default=None, required=False, help_text=None, parameters=None):
        pass
 #       validators=[]
 #       if options:
 #           if "min_length" in options:
 #               validators.append(MinLengthValidator(options["min_length"]))
 #           if "max_length" in options:
 #               validators.append(MaxLengthValidator(options["max_length"]))
 #       self.fields[key] = forms.URLField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    @classmethod
    def addIPv4Field(cls, key, label, default=None, required=False, help_text=None):
        pass
#        self.fields[key] = forms.IPAddressField(label=label, required=required, initial=default, help_text=help_text)

class WidgetOptionsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(WidgetOptionsForm, self).__init__(*args, **kwargs)

    @classmethod
    def addField(cls, option, instance_id):
        parameters = json.loads(option.parameters)
        key = ('optionparam_%s' % (option.key))

        if option.type == 'boolean':
            if not option.default == '':
                default = (option.default == 'true' or option.default == 'True')
        else:
            default = option.default

        if option.type == 'boolean':
            cls.addBooleanField(key=key, label=option.name, default=default, help_text=option.description)
        elif option.type == 'string':
            cls.addStringField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'choice':
            cls.addChoiceField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'multiplechoice':
            cls.addMultipleChoiceField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'date':
            cls.addDateField(key=key, label=option.name, default=default, required=option.required, help_text=option.description)
        elif option.type == 'time':
            cls.addTimeField(key=key, label=option.name, default=default, required=option.required, help_text=option.description)
        elif option.type == 'datetime':
            cls.addDateTimeField(key=key, label=option.name, default=default, required=option.required, help_text=option.description)
        elif option.type == 'float':
            cls.addDecimalField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'integer':
            cls.addIntegerField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'email':
            cls.addEmailField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        elif option.type == 'ipv4':
            cls.addIPv4Field(key=key, label=option.name, default=default, required=option.required, help_text=option.description)
        elif option.type == 'url':
            cls.addURLField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        else:
            cls.addStringField(key=key, label=option.name, default=default, required=option.required, help_text=option.description, parameters=parameters)
        print key, option.type
    """
    def save(self, instance):
        try:
            for field, option in self.to_create.iteritems():
                wio = WidgetInstanceOption(instance=instance, option=option, value=self.cleaned_data[field])
                wio.save()
            for field, wio in self.to_update.iteritems():
                wio.value=self.cleaned_data[field]
                wio.save()
        except KeyError: #Did not pass validation
            pass
    """
class WidgetSensorsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(WidgetSensorsForm, self).__init__(*args, **kwargs)
        self.to_update = {}
        self.to_create = {}

    def addField(self, parameter, wis=None, tmpid=None):
        if wis is None :
            key = ('sensorparam_%s_%s' % (tmpid, parameter.id))
            default = None
            self.to_create[key] = parameter
        else:
            key = ('sensorparam_%s' % (wis.id))
            default = wis.sensor
            self.to_update[key] = wis

        sensors = Sensor.objects.filter(datatype_id__in = parameter.types_as_list)
        self.addGroupedModelChoiceField(key=key, label=parameter.name, required=parameter.required, default=default, queryset=sensors, group_by_field='device', empty_label=_("--Select Sensor--"), help_text=parameter.description)

    def save(self, instance):
        try:
            for field, parameter in self.to_create.iteritems():
                wis = WidgetInstanceSensor(instance=instance, parameter=parameter, sensor=self.cleaned_data[field])
                wis.save()
            for field, wis in self.to_update.iteritems():
                wis.sensor=self.cleaned_data[field]
                wis.save()
        except KeyError: #Did not pass validation
            pass

class WidgetCommandsForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(WidgetCommandsForm, self).__init__(*args, **kwargs)
        self.to_update = {}
        self.to_create = {}

    def addField(self, parameter, wic=None, tmpid=None):
        if wic is None :
            key = ('commandparam_%s_%s' % (tmpid, parameter.id))
            default = None
            self.to_create[key] = parameter
        else:
            key = ('commandparam_%s' % (wic.id))
            default = wic.command
            self.to_update[key] = wic

        datatypes = []
        types = json.loads(parameter.types)
        for type in types:
            for p in itertools.permutations(type):            
                datatypes.append(''.join(p))
        commands = Command.objects.filter(datatypes__in = datatypes)
        self.addGroupedModelChoiceField(key=key, label=parameter.name, required=parameter.required, default=default, queryset=commands, group_by_field='device', empty_label=_("--Select Command--"), help_text=parameter.description)

    def save(self, instance):
        try:
            for field, parameter in self.to_create.iteritems():
                wic = WidgetInstanceCommand(instance=instance, parameter=parameter, command=self.cleaned_data[field])
                wic.save()
            for field, wic in self.to_update.iteritems():
                wic.command=self.cleaned_data[field]
                wic.save()
        except KeyError: #Did not pass validation
            pass

class WidgetDevicesForm(ParametersForm):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(WidgetDevicesForm, self).__init__(*args, **kwargs)
        self.to_update = {}
        self.to_create = {}

    def addField(self, parameter, wid=None, tmpid=None):
        if wid is None :
            key = ('deviceparam_%s_%s' % (tmpid, parameter.id))
            default = None
            self.to_create[key] = parameter
        else:
            key = ('deviceparam_%s' % (wid.id))
            default = wid.device
            self.to_update[key] = wid

        devices = Device.objects.filter(type__in = parameter.types_as_list)
        self.addGroupedModelChoiceField(key=key, label=parameter.name, required=parameter.required, default=default, queryset=devices, group_by_field='type', empty_label=_("--Select Device--"), help_text=parameter.description)

    def save(self, instance):
        try:
            for field, parameter in self.to_create.iteritems():
                wid = WidgetInstanceDevice(instance=instance, parameter=parameter, device=self.cleaned_data[field])
                wid.save()
            for field, wid in self.to_update.iteritems():
                wid.device=self.cleaned_data[field]
                wid.save()
        except KeyError: #Did not pass validation
            pass
        
class WidgetInstanceForms(object):
    def __init__(self, instance):
        class OptionsForm(WidgetOptionsForm):
            pass
        widgetoptions = WidgetOption.getWidget(instance.widget_id)
#        widgetsensors = WidgetSensor.objects.filter(widget=widget)    
#        widgetcommands = WidgetCommand.objects.filter(widget=widget)    
#        widgetdevices = WidgetDevice.objects.filter(widget=widget)
        for option in widgetoptions:
            OptionsForm.addField(option=option, instance_id=instance.id)

#            try:
#                wio = WidgetInstanceOption.getKey(instance_id=instance.id, key=option.key)
#            except ObjectDoesNotExist:
#                pass

        """
            for parameter in widgetsensors:
                try:
                    wis = WidgetInstanceSensor.objects.get(instance=instance, parameter=parameter)
                except ObjectDoesNotExist:
                    self.sensorsform.addField(parameter=parameter, tmpid=instance.id)
                else:
                    self.sensorsform.addField(parameter=parameter, wis=wis)
            for parameter in widgetcommands:
                try:
                    wic = WidgetInstanceCommand.objects.get(instance=instance, parameter=parameter)
                except ObjectDoesNotExist:
                    self.commandsform.addField(parameter=parameter, tmpid=instance.id)
                else:
                    self.commandsform.addField(parameter=parameter, wic=wic)
            for parameter in widgetdevices:
                try:
                    wid = WidgetInstanceDevice.objects.get(instance=instance, parameter=parameter)
                except ObjectDoesNotExist:
                    self.devicesform.addField(parameter=parameter, tmpid=instance.id)
                else:
                    self.devicesform.addField(parameter=parameter, wid=wid)
        """
        self.optionsform = OptionsForm()
#        self.optionsform = WidgetOptionsForm()
#        self.sensorsform = WidgetSensorsForm()
#        self.commandsform = WidgetCommandsForm()
#        self.devicesform = WidgetDevicesForm()

    """
    def setData(self, kwds):
        self.optionsform.setData(kwds)
        self.sensorsform.setData(kwds)
        self.commandsform.setData(kwds)
        self.devicesform.setData(kwds)

    def validate(self):
        self.optionsform.validate()
        self.sensorsform.validate()
        self.commandsform.validate()
        self.devicesform.validate()
        print "options", self.optionsform.is_valid()
        for field, errors in self.optionsform.errors.items():
            print field
            for error in errors:
                print error
        print "sensors", self.sensorsform.is_valid()
        for field, errors in self.sensorsform.errors.items():
            print field
            for error in errors:
                print error
    def is_valid(self):
        return self.optionsform.is_valid() and self.sensorsform.is_valid() and self.commandsform.is_valid() and self.devicesform.is_valid()
    
    def save(self, instance):    
        self.validate()
        self.optionsform.save(instance)
        self.sensorsform.save(instance)
        self.commandsform.save(instance)
        self.devicesform.save(instance)

        return self.is_valid()
    """