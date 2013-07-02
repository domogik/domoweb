# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'PackageProduct'
        db.create_table('domoweb_packageproduct', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('documentation', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, blank=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Package'])),
            ('device_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.PackageDeviceType'])),
        ))
        db.send_create_signal('domoweb', ['PackageProduct'])

        # Adding model 'WidgetInstanceCommand'
        db.create_table('domoweb_widgetinstancecommand', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('instance', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.WidgetInstance'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('command', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Command'], on_delete=models.DO_NOTHING)),
        ))
        db.send_create_signal('domoweb', ['WidgetInstanceCommand'])

        # Adding model 'Package'
        db.create_table('domoweb_package', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, blank=True)),
            ('author_email', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, blank=True)),
            ('category', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('changelog', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('documentation', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, blank=True)),
        ))
        db.send_create_signal('domoweb', ['Package'])

        # Adding model 'Sensor'
        db.create_table('domoweb_sensor', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('device', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Device'])),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('datatype', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.DataType'], on_delete=models.DO_NOTHING)),
            ('last_value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('last_received', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['Sensor'])

        # Adding model 'Client'
        db.create_table('domoweb_client', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=255, primary_key=True)),
            ('host', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('pid', self.gf('django.db.models.fields.IntegerField')()),
            ('status', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('configured', self.gf('django.db.models.fields.NullBooleanField')(null=True, blank=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Package'], null=True, on_delete=models.DO_NOTHING, blank=True)),
        ))
        db.send_create_signal('domoweb', ['Client'])

        # Adding model 'WidgetInstanceSensor'
        db.create_table('domoweb_widgetinstancesensor', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('instance', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.WidgetInstance'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('sensor', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Sensor'], on_delete=models.DO_NOTHING)),
        ))
        db.send_create_signal('domoweb', ['WidgetInstanceSensor'])

        # Adding model 'DataType'
        db.create_table('domoweb_datatype', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('parameters', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('domoweb', ['DataType'])

        # Adding model 'XPLCmd'
        db.create_table('domoweb_xplcmd', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('device_id', self.gf('django.db.models.fields.IntegerField')()),
            ('json_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['XPLCmd'])

        # Adding model 'XPLStat'
        db.create_table('domoweb_xplstat', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('device_id', self.gf('django.db.models.fields.IntegerField')()),
            ('json_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['XPLStat'])

        # Adding model 'PackageDeviceType'
        db.create_table('domoweb_packagedevicetype', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Package'])),
        ))
        db.send_create_signal('domoweb', ['PackageDeviceType'])

        # Adding model 'CommandParam'
        db.create_table('domoweb_commandparam', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('command', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Command'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('datatype', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.DataType'], on_delete=models.DO_NOTHING)),
        ))
        db.send_create_signal('domoweb', ['CommandParam'])

        # Adding model 'Command'
        db.create_table('domoweb_command', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('device', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Device'])),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('return_confirmation', self.gf('django.db.models.fields.BooleanField')(default=True)),
        ))
        db.send_create_signal('domoweb', ['Command'])

        # Adding model 'PackageUdevRule'
        db.create_table('domoweb_packageudevrule', (
            ('filename', self.gf('django.db.models.fields.CharField')(max_length=255, primary_key=True)),
            ('rule', self.gf('django.db.models.fields.TextField')()),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('model', self.gf('django.db.models.fields.CharField')(max_length=255, null=True, blank=True)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Package'])),
        ))
        db.send_create_signal('domoweb', ['PackageUdevRule'])

        # Adding model 'Device'
        db.create_table('domoweb_device', (
            ('id', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('reference', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.DeviceType'], null=True, on_delete=models.DO_NOTHING, blank=True)),
        ))
        db.send_create_signal('domoweb', ['Device'])

        # Adding model 'ClientConfiguration'
        db.create_table('domoweb_clientconfiguration', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=255, primary_key=True)),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('default', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('required', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('options', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('client', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Client'])),
        ))
        db.send_create_signal('domoweb', ['ClientConfiguration'])

        # Adding model 'DeviceType'
        db.create_table('domoweb_devicetype', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('plugin_id', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['DeviceType'])

        # Adding model 'WidgetInstanceParam'
        db.create_table('domoweb_widgetinstanceparam', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('instance', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.WidgetInstance'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('domoweb', ['WidgetInstanceParam'])

        # Adding model 'PackageDependency'
        db.create_table('domoweb_packagedependency', (
            ('id', self.gf('django.db.models.fields.CharField')(max_length=50, primary_key=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('package', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['domoweb.Package'])),
        ))
        db.send_create_signal('domoweb', ['PackageDependency'])

        # Deleting field 'WidgetInstance.feature_id'
        db.delete_column('domoweb_widgetinstance', 'feature_id')


    def backwards(self, orm):
        # Deleting model 'PackageProduct'
        db.delete_table('domoweb_packageproduct')

        # Deleting model 'WidgetInstanceCommand'
        db.delete_table('domoweb_widgetinstancecommand')

        # Deleting model 'Package'
        db.delete_table('domoweb_package')

        # Deleting model 'Sensor'
        db.delete_table('domoweb_sensor')

        # Deleting model 'Client'
        db.delete_table('domoweb_client')

        # Deleting model 'WidgetInstanceSensor'
        db.delete_table('domoweb_widgetinstancesensor')

        # Deleting model 'DataType'
        db.delete_table('domoweb_datatype')

        # Deleting model 'XPLCmd'
        db.delete_table('domoweb_xplcmd')

        # Deleting model 'XPLStat'
        db.delete_table('domoweb_xplstat')

        # Deleting model 'PackageDeviceType'
        db.delete_table('domoweb_packagedevicetype')

        # Deleting model 'CommandParam'
        db.delete_table('domoweb_commandparam')

        # Deleting model 'Command'
        db.delete_table('domoweb_command')

        # Deleting model 'PackageUdevRule'
        db.delete_table('domoweb_packageudevrule')

        # Deleting model 'Device'
        db.delete_table('domoweb_device')

        # Deleting model 'ClientConfiguration'
        db.delete_table('domoweb_clientconfiguration')

        # Deleting model 'DeviceType'
        db.delete_table('domoweb_devicetype')

        # Deleting model 'WidgetInstanceParam'
        db.delete_table('domoweb_widgetinstanceparam')

        # Deleting model 'PackageDependency'
        db.delete_table('domoweb_packagedependency')

        # Adding field 'WidgetInstance.feature_id'
        db.add_column('domoweb_widgetinstance', 'feature_id',
                      self.gf('django.db.models.fields.IntegerField')(default=0),
                      keep_default=False)


    models = {
        'domoweb.client': {
            'Meta': {'object_name': 'Client'},
            'configured': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'host': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Package']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'}),
            'pid': ('django.db.models.fields.IntegerField', [], {}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.clientconfiguration': {
            'Meta': {'object_name': 'ClientConfiguration'},
            'client': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Client']"}),
            'default': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'options': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'required': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.command': {
            'Meta': {'object_name': 'Command'},
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Device']"}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'return_confirmation': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'domoweb.commandparam': {
            'Meta': {'object_name': 'CommandParam'},
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Command']"}),
            'datatype': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.DataType']", 'on_delete': 'models.DO_NOTHING'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.datatype': {
            'Meta': {'object_name': 'DataType'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'parameters': ('django.db.models.fields.TextField', [], {})
        },
        'domoweb.device': {
            'Meta': {'object_name': 'Device'},
            'description': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.DeviceType']", 'null': 'True', 'on_delete': 'models.DO_NOTHING', 'blank': 'True'})
        },
        'domoweb.devicetype': {
            'Meta': {'object_name': 'DeviceType'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'plugin_id': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.package': {
            'Meta': {'object_name': 'Package'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'author_email': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'category': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'changelog': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'documentation': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.packagedependency': {
            'Meta': {'object_name': 'PackageDependency'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Package']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.packagedevicetype': {
            'Meta': {'object_name': 'PackageDeviceType'},
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Package']"})
        },
        'domoweb.packageproduct': {
            'Meta': {'object_name': 'PackageProduct'},
            'device_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.PackageDeviceType']"}),
            'documentation': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Package']"})
        },
        'domoweb.packageudevrule': {
            'Meta': {'object_name': 'PackageUdevRule'},
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'blank': 'True'}),
            'package': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Package']"}),
            'rule': ('django.db.models.fields.TextField', [], {})
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
            'datatype': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.DataType']", 'on_delete': 'models.DO_NOTHING'}),
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Device']"}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'last_received': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'last_value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'reference': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.widget': {
            'Meta': {'object_name': 'Widget'},
            'id': ('django.db.models.fields.CharField', [], {'max_length': '50', 'primary_key': 'True'})
        },
        'domoweb.widgetinstance': {
            'Meta': {'object_name': 'WidgetInstance'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.IntegerField', [], {}),
            'page': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Page']"}),
            'widget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Widget']", 'on_delete': 'models.DO_NOTHING'})
        },
        'domoweb.widgetinstancecommand': {
            'Meta': {'object_name': 'WidgetInstanceCommand'},
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Command']", 'on_delete': 'models.DO_NOTHING'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'instance': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.WidgetInstance']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.widgetinstanceparam': {
            'Meta': {'object_name': 'WidgetInstanceParam'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'instance': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.WidgetInstance']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.widgetinstancesensor': {
            'Meta': {'object_name': 'WidgetInstanceSensor'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'instance': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.WidgetInstance']"}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'sensor': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['domoweb.Sensor']", 'on_delete': 'models.DO_NOTHING'})
        },
        'domoweb.xplcmd': {
            'Meta': {'object_name': 'XPLCmd'},
            'device_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'json_id': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'domoweb.xplstat': {
            'Meta': {'object_name': 'XPLStat'},
            'device_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'json_id': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['domoweb']