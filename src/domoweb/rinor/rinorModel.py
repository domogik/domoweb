from django.db import models

class RinorModel(models.Model):
    class Meta:
        abstract = True # Prevent the table to be created with syncdb

#    def save(self):
#        if not self.id:
#            # Create
#        else:
#            # Update
#        super(RinorModel, self).save()
    @staticmethod
    def refresh():
        pass
