# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Parameter'
        db.create_table('domoweb_parameter', (
            ('key', self.gf('django.db.models.fields.CharField')(max_length=30, primary_key=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('domoweb', ['Parameter'])

        # Adding model 'Widget'
        db.create_table('domoweb_widget', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
        ))
        db.send_create_signal('domoweb', ['Widget'])

        # Adding model 'PageIcon'
        db.create_table('domoweb_pageicon', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('iconset_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('iconset_name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('icon_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('label', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['PageIcon'])

        # Adding model 'WidgetInstance'
        db.create_table('domoweb_widgetinstance', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('page_id', self.gf('django.db.models.fields.IntegerField')()),
            ('order', self.gf('django.db.models.fields.IntegerField')()),
            ('widget_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('feature_id', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('domoweb', ['WidgetInstance'])


    def backwards(self, orm):
        # Deleting model 'Parameter'
        db.delete_table('domoweb_parameter')

        # Deleting model 'Widget'
        db.delete_table('domoweb_widget')

        # Deleting model 'PageIcon'
        db.delete_table('domoweb_pageicon')

        # Deleting model 'WidgetInstance'
        db.delete_table('domoweb_widgetinstance')


    models = {
        'domoweb.pageicon': {
            'Meta': {'object_name': 'PageIcon'},
            'icon_id': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'iconset_id': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'iconset_name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.parameter': {
            'Meta': {'object_name': 'Parameter'},
            'key': ('django.db.models.fields.CharField', [], {'max_length': '30', 'primary_key': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        'domoweb.widget': {
            'Meta': {'object_name': 'Widget'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'})
        },
        'domoweb.widgetinstance': {
            'Meta': {'object_name': 'WidgetInstance'},
            'feature_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.IntegerField', [], {}),
            'page_id': ('django.db.models.fields.IntegerField', [], {}),
            'widget_id': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['domoweb']