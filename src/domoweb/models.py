from django.db import models
#from domoweb.rinor.rinorModel import RinorModel

class Parameters(models.Model):
    key = models.CharField(max_length=30, primary_key=True)
    value = models.CharField(max_length=255)

#from domoweb.rinor.rinorPipe import RoomPipe
    
class Person(models.Model):
    id = models.IntegerField(primary_key=True)
    firstname = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)

'''
class RoomExtended(RinorModel):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    area_id = models.IntegerField()
    description = models.CharField(max_length=255)
    icon = models.CharField(max_length=50)
''' 
#    @staticmethod
#    def refresh():
#        RinorPipe.get()

#RoomExtended.refresh()