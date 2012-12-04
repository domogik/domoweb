# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Page.theme_id'
        db.delete_column('domoweb_page', 'theme_id')

        # Adding field 'Page.left'
        db.add_column('domoweb_page', 'left',
                      self.gf('django.db.models.fields.IntegerField')(default=0, primary_key=True),
                      keep_default=False)

        # Adding field 'Page.right'
        db.add_column('domoweb_page', 'right',
                      self.gf('django.db.models.fields.IntegerField')(default=0, primary_key=True),
                      keep_default=False)

        # Adding field 'Page.name'
        db.add_column('domoweb_page', 'name',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=50, blank=True),
                      keep_default=False)

        # Adding field 'Page.description'
        db.add_column('domoweb_page', 'description',
                      self.gf('django.db.models.fields.TextField')(null=True, blank=True),
                      keep_default=False)

        # Adding field 'Page.icon'
        db.add_column('domoweb_page', 'icon',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.PageIcon'], null=True, on_delete=models.DO_NOTHING, blank=True),
                      keep_default=False)

        # Adding field 'Page.theme'
        db.add_column('domoweb_page', 'theme',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.PageTheme'], null=True, on_delete=models.DO_NOTHING, blank=True),
                      keep_default=False)


        # Changing field 'Page.id'
        db.alter_column('domoweb_page', 'id', self.gf('django.db.models.fields.AutoField')(primary_key=True))

    def backwards(self, orm):
        # Adding field 'Page.theme_id'
        db.add_column('domoweb_page', 'theme_id',
                      self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True),
                      keep_default=False)

        # Deleting field 'Page.left'
        db.delete_column('domoweb_page', 'left')

        # Deleting field 'Page.right'
        db.delete_column('domoweb_page', 'right')

        # Deleting field 'Page.name'
        db.delete_column('domoweb_page', 'name')

        # Deleting field 'Page.description'
        db.delete_column('domoweb_page', 'description')

        # Deleting field 'Page.icon'
        db.delete_column('domoweb_page', 'icon_id')

        # Deleting field 'Page.theme'
        db.delete_column('domoweb_page', 'theme_id')


        # Changing field 'Page.id'
        db.alter_column('domoweb_page', 'id', self.gf('django.db.models.fields.IntegerField')(primary_key=True))

    models = {
        'domoweb.page': {
            'Meta': {'object_name': 'Page'},
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'icon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.PageIcon']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'left': ('django.db.models.fields.IntegerField', [], {'default': '0', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'right': ('django.db.models.fields.IntegerField', [], {'default': '0', 'primary_key': 'True'}),
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
            'page_id': ('django.db.models.fields.IntegerField', [], {}),
            'widget_id': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['domoweb']