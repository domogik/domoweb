# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Device'
        db.create_table('domoweb_device', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('usage', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.DeviceUsage'], null=True, on_delete=models.DO_NOTHING, blank=True)),
            ('type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.DeviceType'], null=True, on_delete=models.DO_NOTHING, blank=True)),
        ))
        db.send_create_signal('domoweb', ['Device'])

        # Adding model 'DeviceType'
        db.create_table('domoweb_devicetype', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('plugin_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['DeviceType'])

        # Adding model 'DeviceUsage'
        db.create_table('domoweb_deviceusage', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('default_options', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('domoweb', ['DeviceUsage'])

        # Adding model 'Sensor'
        db.create_table('domoweb_sensor', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('device', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Device'])),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value_type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('unit', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('values', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('last_value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('last_received', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['Sensor'])

        # Adding model 'CommandParam'
        db.create_table('domoweb_commandparam', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('command', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Command'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value_type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('values', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['CommandParam'])

        # Adding model 'Command'
        db.create_table('domoweb_command', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('device', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Device'])),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['Command'])


    def backwards(self, orm):
        # Deleting model 'Device'
        db.delete_table('domoweb_device')

        # Deleting model 'DeviceType'
        db.delete_table('domoweb_devicetype')

        # Deleting model 'DeviceUsage'
        db.delete_table('domoweb_deviceusage')

        # Deleting model 'Sensor'
        db.delete_table('domoweb_sensor')

        # Deleting model 'CommandParam'
        db.delete_table('domoweb_commandparam')

        # Deleting model 'Command'
        db.delete_table('domoweb_command')


    models = {
        'domoweb.command': {
            'Meta': {'object_name': 'Command'},
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Device']"}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.commandparam': {
            'Meta': {'object_name': 'CommandParam'},
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Command']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value_type': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'values': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.device': {
            'Meta': {'object_name': 'Device'},
            'description': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.DeviceType']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'}),
            'usage': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.DeviceUsage']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'})
        },
        'domoweb.devicetype': {
            'Meta': {'object_name': 'DeviceType'},
            'plugin_id': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.deviceusage': {
            'Meta': {'object_name': 'DeviceUsage'},
            'default_options': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
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
        'domoweb.sensor': {
            'Meta': {'object_name': 'Sensor'},
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Device']"}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'last_received': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'last_value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'unit': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value_type': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'values': ('django.db.models.fields.CharField', [], {'max_length': '50'})
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
