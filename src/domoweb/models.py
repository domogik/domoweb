from django.db import models

class Parameter(models.Model):
    key = models.CharField(max_length=30, primary_key=True)
    value = models.CharField(max_length=255)
    
class Widget(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    
class PageIcon(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    iconset_id = models.CharField(max_length=50)
    iconset_name = models.CharField(max_length=50)
    icon_id = models.CharField(max_length=50)
    label = models.CharField(max_length=50)

class WidgetInstance(models.Model):
    id = models.AutoField(primary_key=True)
    page_id = models.IntegerField()
    order = models.IntegerField()
    widget_id = models.CharField(max_length=50)
    feature_id = models.IntegerField()
