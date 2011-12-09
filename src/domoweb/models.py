from django.db import models

class Parameters(models.Model):
    key = models.CharField(max_length=30, primary_key=True)
    value = models.CharField(max_length=255)
    
class Widget(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
