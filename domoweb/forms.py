#!/usr/bin/env python
import json
import itertools
from django.utils.translation import ugettext as _
from itertools import groupby
from django import forms
from django.core.exceptions import ObjectDoesNotExist
from django.core.validators import *
from collections import OrderedDict
from domoweb import fields
from domoweb.models import PageIcon, PageTheme, Client, ClientConfiguration
   
# Page configuration form
class PageForm(forms.Form):
    name = forms.CharField(max_length=50, label=_("Page name"), widget=forms.TextInput(attrs={'class':'icon32-form-tag'}), required=True)
    description = forms.CharField(label=_("Page description"), widget=forms.Textarea(attrs={'class':'icon32-form-edit'}), required=False)
    icon = fields.IconChoiceField(label=_("Choose the icon"), required=False, empty_label="No icon", queryset=PageIcon.objects.all())
    theme = forms.ModelChoiceField(label=_("Choose a theme"), required=False, empty_label="No theme", queryset=PageTheme.objects.all())

class GroupedModelChoiceField(forms.ModelChoiceField):
    def __init__(self, queryset, group_by_field, group_label=None, *args, **kwargs):
        """
        group_by_field is the name of a field on the model
        group_label is a function to return a label for each choice group
        """
        super(GroupedModelChoiceField, self).__init__(queryset, *args, **kwargs)
        self.group_by_field = group_by_field
        if group_label is None:
            self.group_label = lambda group: group.name
        else:
            self.group_label = group_label
    
    def _get_choices(self):
        """
        Exactly as per ModelChoiceField except returns new iterator class
        """
        if hasattr(self, '_choices'):
            return self._choices
        return GroupedModelChoiceIterator(self)
    choices = property(_get_choices, forms.ModelChoiceField._set_choices)

class GroupedModelChoiceIterator(forms.models.ModelChoiceIterator):
    def __iter__(self):
        if self.field.empty_label is not None:
            yield (u"", self.field.empty_label)
        if self.field.cache_choices:
            if self.field.choice_cache is None:
                self.field.choice_cache = [
                    (self.field.group_label(group), [self.choice(ch) for ch in choices])
                        for group,choices in groupby(self.queryset.all(),
                            key=lambda row: getattr(row, self.field.group_by_field))
                ]
            for choice in self.field.choice_cache:
                yield choice
        else:
            for group, choices in groupby(self.queryset.all(),
                    key=lambda row: getattr(row, self.field.group_by_field)):
                yield (self.field.group_label(group), [self.choice(ch) for ch in choices])

class MaskInput(forms.TextInput):
    def __init__(self, mask, *args, **kwargs):
#        mask = kwargs.pop('mask', {})
        super(MaskInput, self).__init__(*args, **kwargs)
        self.mask = mask

    def render(self, name, value, attrs=None):
        attrs['class'] = 'mask '
        attrs['mask'] = self.mask
        return super(MaskInput, self).render(name, value, attrs=attrs)
    
class ParametersForm(forms.Form):
    def __init__(self, *args, **kwargs):
        # This should be done before any references to self.fields
        super(ParametersForm, self).__init__(*args, **kwargs)

    """def clean(self):
        cleaned_data = super(ParametersForm, self).clean()
        
        return cleaned_data
    """    
    def setData(self, kwds):
        """Set the data to include in the form"""
        for name,field in self.fields.items():
            self.data[name] = field.widget.value_from_datadict(
                kwds, self.files, self.add_prefix(name))
        self.is_bound = True
    
    def validate(self):
        self.full_clean()

#        for name,field in self.fields.items():
#            if 'errors' in field:
#                print name, field.errors

#http://stackoverflow.com/questions/4466499/in-django-how-do-i-change-this-field-is-required-to-name-is-required
#https://gist.github.com/stholmes/3889441

    def addCharField(self, key, label, required, max_length=60, default=None, help_text=None, options=None):
        validators=[]
        widget=forms.TextInput
        if options:
            if "min_length" in options:
                validators.append(MinLengthValidator(options["min_length"]))
            if "max_length" in options:
                validators.append(MaxLengthValidator(options["max_length"]))
            if "multilignes" in options:
                widget=forms.Textarea
            elif "mask" in options: #https://github.com/shaungrady/jquery-mask-input
                widget=MaskInput(options['mask'])
        self.fields[key] = forms.CharField(widget=widget, label=label, required=required, max_length=max_length, initial=default, help_text=help_text, validators=validators)

    def addBooleanField(self, key, label, default=None, help_text=None):
        self.fields[key] = forms.BooleanField(label=label, required=False, initial=default, help_text=help_text)

    def addGroupedModelChoiceField(self, key, label, queryset, group_by_field, empty_label, required, default=None, help_text=None):
        self.fields[key] = GroupedModelChoiceField(label=label, required=required, queryset=queryset, group_by_field=group_by_field, empty_label=empty_label, initial=default, help_text=help_text)

    def addChoiceField(self, key, label, required, default=None, help_text=None, options=None, empty_label=None):
        choices = [('', '--Select Parameter--')]
        if options:
            if "choices" in options:
                ordered = OrderedDict(sorted(options["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        self.fields[key] = forms.ChoiceField(label=label, required=required, choices=choices, initial=default, help_text=help_text)

    def addMultipleChoiceField(self, key, label, required, default=None, help_text=None, options=None, empty_label=None):
        import collections
        choices = []
        if options:
            if "choices" in options:
                ordered = OrderedDict(sorted(options["choices"].items()))
                for v, l in ordered.iteritems():
                    choices.append((v, l))
        self.fields[key] = forms.MultipleChoiceField(label=label, required=required, choices=choices, initial=default, help_text=help_text)

    def addDateField(self, key, label, required, default=None, help_text=None):
        self.fields[key] = forms.DateField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%d/%m/%Y'])

    def addTimeField(self, key, label, required, default=None, help_text=None):
        self.fields[key] = forms.TimeField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%H:%M:%S'])

    def addDateTimeField(self, key, label, required, default=None, help_text=None):
        self.fields[key] = forms.DateTimeField(label=label, required=required, initial=default, help_text=help_text, input_formats=['%Y-%m-%d %H:%M:%S'])

    def addFloatField(self, key, label, required, default=None, help_text=None, options=None):
        validators=[]
        if options:
            if "min_value" in options:
                validators.append(MinValueValidator(options["min_value"]))
            if "max_value" in options:
                validators.append(MaxValueValidator(options["max_value"]))

        self.fields[key] = forms.FloatField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    def addIntegerField(self, key, label, required, default=None, help_text=None, options=None):
        validators=[]
        if options:
            if "min_value" in options:
                validators.append(MinValueValidator(options["min_value"]))
            if "max_value" in options:
                validators.append(MaxValueValidator(options["max_value"]))

        self.fields[key] = forms.IntegerField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    def addEmailField(self, key, label, required, default=None, help_text=None, options=None):
        validators=[]
        if options:
            if "min_length" in options:
                validators.append(MinLengthValidator(options["min_length"]))
            if "max_length" in options:
                validators.append(MaxLengthValidator(options["max_length"]))
        self.fields[key] = forms.EmailField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    def addURLField(self, key, label, required, default=None, help_text=None, options=None):
        validators=[]
        if options:
            if "min_length" in options:
                validators.append(MinLengthValidator(options["min_length"]))
            if "max_length" in options:
                validators.append(MaxLengthValidator(options["max_length"]))
        self.fields[key] = forms.URLField(label=label, required=required, initial=default, help_text=help_text, validators=validators)

    def addIPv4Field(self, key, label, required, default=None, help_text=None):
        self.fields[key] = forms.IPAddressField(label=label, required=required, initial=default, help_text=help_text)


class ClientConfigurationForm(ParametersForm):
    def __init__(self, client, *args, **kwargs):
        # This should be done before any references to self.fields
        super(ClientConfigurationForm, self).__init__(*args, **kwargs)
        self.client = client
        parameters = ClientConfiguration.objects.filter(client=client)
        for parameter in parameters:
            self.addField(parameter)

    def addField(self, parameter):
        default = None
        options = None

        if parameter.type == 'boolean':
            if parameter.value:
                default = (parameter.value == 'true' or parameter.value == 'True')
            self.addBooleanField(key=parameter.key, label=parameter.name, default=default, help_text=parameter.description)
        elif parameter.type == 'string':
            if parameter.value:
                default = parameter.value
            self.addCharField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'choice':
            if parameter.value:
                default = parameter.value
            self.addChoiceField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'multiplechoice':
            if parameter.value:
                default = parameter.value
            self.addMultipleChoiceField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'date':
            if parameter.value:
                default = parameter.value
            self.addDateField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description)
        elif parameter.type == 'time':
            if parameter.value:
                default = parameter.value
            self.addTimeField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description)
        elif parameter.type == 'datetime':
            if parameter.value:
                default = parameter.value
            self.addDateTimeField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description)
        elif parameter.type == 'float':
            if parameter.value:
                default = parameter.value
            self.addFloatField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'integer':
            if parameter.value:
                default = parameter.value
            self.addIntegerField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'email':
            if parameter.value:
                default = parameter.value
            self.addEmailField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        elif parameter.type == 'ipv4':
            if parameter.value:
                default = parameter.value
            self.addIPv4Field(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description)
        elif parameter.type == 'url':
            if parameter.value:
                default = parameter.value
            self.addURLField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)
        else:
            if parameter.value:
                default = parameter.value
            self.addCharField(key=parameter.key, label=parameter.name, required=parameter.required, default=default, help_text=parameter.description, options=options)

    def save(self):
        self.client.save_configuration(self.cleaned_data)
