#!/usr/bin/python
# -*- coding: utf-8 -*-

from django.forms import widgets, RadioSelect, ModelChoiceField
from django.forms.util import flatatt
from django.utils.encoding import StrAndUnicode, force_unicode
from django.utils.html import escape, conditional_escape
from django.utils.safestring import mark_safe
from django.conf import settings

class IconRadioInput(widgets.SubWidget):
    """
    An object used by RadioFieldRenderer that represents a single
    <input type='radio'>.
    """

    def __init__(self, name, value, attrs, choice, index):
        self.name, self.value = name, value
        self.attrs = attrs
        self.choice_value = force_unicode(choice[0])
        self.choice_label = force_unicode(choice[1])
        self.index = index

    def __unicode__(self):
        return self.render()

    def render(self, name=None, value=None, attrs=None, choices=()):
        
        choice_label = conditional_escape(force_unicode(self.choice_label))
        if 'id' in self.attrs:
            self.attrs['id'] = '%s_%s' % (self.attrs['id'], self.index)
        input_attrs = dict(self.attrs, type='radio', name=self.name, value=self.choice_value)
        li_attrs = dict()
        if self.choice_value:
            icon = 'icon64-%s' % self.choice_value
        else:
            icon = 'icon64-default'
            
        if self.is_checked():
            li_attrs['tabindex'] = '0'
            li_attrs['aria-checked'] = 'true'
            input_attrs['checked'] = 'checked'
        else:
            li_attrs['tabindex'] = '-1'
            li_attrs['aria-checked'] = 'false'

        return mark_safe(u'<li class="iconbox" role="radio"%s ><input%s /><div class="icon %s">%s</div><div class="checkbox-select">Select</div></li>' % (flatatt(li_attrs), flatatt(input_attrs), icon, choice_label))

    def is_checked(self):
        return self.value == self.choice_value

class IconRadioFieldRenderer(StrAndUnicode):
    """
    An object used by RadioSelect to enable customization of radio widgets.
    """

    def __init__(self, name, value, attrs, choices):
        self.name, self.value, self.attrs = name, value, attrs
        self.choices = choices
    
    def __iter__(self):
        for i, choice in enumerate(self.choices):
            yield IconRadioInput(self.name, self.value, self.attrs.copy(), choice, i)

    def __getitem__(self, idx):
        choice = self.choices[idx] # Let the IndexError propogate
        return IconRadioInput(self.name, self.value, self.attrs.copy(), choice, idx)
    
    def __unicode__(self):
        return self.render()

    def render(self):
        return mark_safe(u'<ul id="iconslist" class="iconslist" role="radiogroup" aria-labelledby="iconslist_label" tabindex="-1">\n%s\n</ul>' % u'\n'.join([force_unicode(w) for w in self]))

class IconRadioSelect(RadioSelect):
    renderer = IconRadioFieldRenderer
    class Media:
        css = {
            'all': ['%s/input/iconslist/input-iconslist.css' % settings.STATIC_DESIGN_URL]
        }
        js = ['%s/input/iconslist/input-iconslist.js' % settings.STATIC_DESIGN_URL]

class IconChoiceField(ModelChoiceField):
    widget=IconRadioSelect
    def label_from_instance(self, obj):
        return "%s" % obj.label