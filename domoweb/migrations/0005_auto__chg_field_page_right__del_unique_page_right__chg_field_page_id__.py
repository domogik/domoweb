# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):        
        # Removing unique constraint on 'Page', fields ['left']
        db.delete_unique('domoweb_page', ['left'])

        # Removing unique constraint on 'Page', fields ['right']
        db.delete_unique('domoweb_page', ['right'])


        # Changing field 'Page.right'
        db.alter_column('domoweb_page', 'right', self.gf('django.db.models.fields.IntegerField')())

        # Changing field 'Page.id'
        db.alter_column('domoweb_page', 'id', self.gf('django.db.models.fields.AutoField')(primary_key=True))

        # Changing field 'Page.left'
        db.alter_column('domoweb_page', 'left', self.gf('django.db.models.fields.IntegerField')())
        # Deleting field 'WidgetInstance.page_id'
        db.delete_column('domoweb_widgetinstance', 'page_id')

        # Deleting field 'WidgetInstance.widget_id'
        db.delete_column('domoweb_widgetinstance', 'widget_id')

        # Adding field 'WidgetInstance.page'
        db.add_column('domoweb_widgetinstance', 'page',
                      self.gf('django.db.models.fields.related.ForeignKey')(default=0, to=orm['domoweb.Page']),
                      keep_default=False)

        # Adding field 'WidgetInstance.widget'
        db.add_column('domoweb_widgetinstance', 'widget',
                      self.gf('django.db.models.fields.related.ForeignKey')(default=0, to=orm['domoweb.Widget'], on_delete=models.DO_NOTHING),
                      keep_default=False)


    def backwards(self, orm):

        # Changing field 'Page.right'
        db.alter_column('domoweb_page', 'right', self.gf('django.db.models.fields.IntegerField')(primary_key=True))
        # Adding unique constraint on 'Page', fields ['right']
        db.create_unique('domoweb_page', ['right'])


        # Changing field 'Page.id'
        db.alter_column('domoweb_page', 'id', self.gf('django.db.models.fields.IntegerField')(primary_key=True))

        # Changing field 'Page.left'
        db.alter_column('domoweb_page', 'left', self.gf('django.db.models.fields.IntegerField')(primary_key=True))
        # Adding unique constraint on 'Page', fields ['left']
        db.create_unique('domoweb_page', ['left'])

        # Adding field 'WidgetInstance.page_id'
        db.add_column('domoweb_widgetinstance', 'page_id',
                      self.gf('django.db.models.fields.IntegerField')(default=0),
                      keep_default=False)

        # Adding field 'WidgetInstance.widget_id'
        db.add_column('domoweb_widgetinstance', 'widget_id',
                      self.gf('django.db.models.fields.CharField')(default=0, max_length=50),
                      keep_default=False)

        # Deleting field 'WidgetInstance.page'
        db.delete_column('domoweb_widgetinstance', 'page_id')

        # Deleting field 'WidgetInstance.widget'
        db.delete_column('domoweb_widgetinstance', 'widget_id')


    models = {
        'domoweb.page': {
            'Meta': {'object_name': 'Page'},
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'icon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.PageIcon']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'left': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'right': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'theme': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.PageTheme']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'})
        },
        'domoweb.pageicon': {
            'Meta': {'object_name': 'PageIcon'},
            'icon_id': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'iconset_id': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'iconset_name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.pagetheme': {
            'Meta': {'object_name': 'PageTheme'},
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
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Page']"}),
            'widget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Widget']", 'on_delete': 'models.DO_NOTHING'})
        }
    }

    complete_apps = ['domoweb']