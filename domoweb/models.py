from django.db import models
from django.db.models import F
from django.core.exceptions import PermissionDenied

class Parameter(models.Model):
    key = models.CharField(max_length=30, primary_key=True)
    value = models.CharField(max_length=255)
    
class Widget(models.Model):
    id = models.CharField(max_length=50, primary_key=True)

class PageTheme(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    label = models.CharField(max_length=50)

class PageIcon(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    iconset_id = models.CharField(max_length=50)
    iconset_name = models.CharField(max_length=50)
    icon_id = models.CharField(max_length=50)
    label = models.CharField(max_length=50)
    
class PageManager(models.Manager):
    def get_tree(self):
#        if id==0:
#        data = self.__session.query(Page).order_by(sqlalchemy.asc(Page.left)).all()       
#        else:
#            p = self.__session.query(Page).filter_by(id=id).first()
#            data = self.__session.query(Page).filter(Page.left >= p.left).filter(Page.left <= p.right).order_by(sqlalchemy.asc(Page.left)).all()
    
        data = super(PageManager, self).order_by('left').all()
        _current_path = []
        top_node = None
        
        if data:
            for obj in data:
                obj._childrens = []
                obj._leafs = 0
                if top_node == None:
                    top_node = obj
                    obj._level = 0
                    obj._max_level = 0
                    _current_path.append(obj)
                else:
                    while (obj.left > _current_path[-1].right): # Level down
                        top = _current_path.pop()
                        _current_path[-1]._leafs = _current_path[-1]._leafs + top._leafs
                    obj._level = len(_current_path)
                    if obj._level > top_node._max_level:
                        # Save the number of levels in the root node
                        top_node._max_level = obj._level
                    _current_path[-1]._childrens.append(obj)
                    if not obj._is_leaf():
                        _current_path.append(obj) # Level up
                    else:
                        _current_path[-1]._leafs = _current_path[-1]._leafs + 1

            while (len(_current_path) > 1): # Level down
                top = _current_path.pop()
                _current_path[-1]._leafs = _current_path[-1]._leafs + top._leafs

        return top_node
    
    def get_path(self, id):
        p = super(PageManager, self).get(id=id)
        ret = super(PageManager, self).filter(left__lte= p.left).filter(right__gte= p.right).order_by('left')
        return ret

class Page(models.Model):
    objects = PageManager()
    id = models.AutoField(primary_key=True)
    left = models.IntegerField(default=0)
    right = models.IntegerField(default=0)
    name = models.CharField(max_length=50, blank=True)
    description = models.TextField(null=True, blank=True)
    icon = models.ForeignKey(PageIcon, blank=True, null=True, on_delete=models.DO_NOTHING)
    theme = models.ForeignKey(PageTheme, blank=True, null=True, on_delete=models.DO_NOTHING)

    _leafs = None
    _childrens = None
    _level = None
    _max_level = None
    
    @classmethod
    def add(cls, name, parent_id, description=None, icon=None, theme=None):
        p = cls(name=name, description=description, icon=icon)
        if parent_id != None:
            parent = cls.objects.get(id=parent_id)
            p.left = int(parent.left) + 1
            p.right = int(parent.left) + 2
            cls.objects.filter(right__gt= parent.left).update(right=F('right') + 2)
            cls.objects.filter(left__gt= parent.left).update(left=F('left') + 2)
        else:
            p.left = 1
            p.right = 2
        p.save()
        return p

    def delete(self, *args, **kwargs):
        if self.id == 1:
            raise PermissionDenied("Can not delete the root page")
        # check if there are no children
        if self.left + 1 != self.right:
            raise PermissionDenied("Can not delete page %s, it still has children" % self.name)
        else:
            dl = self.right - self.left + 1
            Page.objects.filter(right__gt= self.right).update(right=F('right') - dl)
            Page.objects.filter(left__gt= self.right).update(left=F('left') - dl)
            super(Page, self).delete(*args, **kwargs)
        return self

    def _is_leaf(self):
        # If right = left + 1 then it is a leaf
        return ((self.left + 1) == self.right)
    is_leaf = property(_is_leaf)

    def _get_leafs(self):
        return self._leafs
    leafs = property(_get_leafs)

    def _get_childrens(self):
        return self._childrens
    childrens = property(_get_childrens)
    
    def _get_level(self):
        return self._level
    level = property(_get_level)
    
    def _get_max_level(self):
        return self._max_level
    max_level = property(_get_max_level)
    
class WidgetInstance(models.Model):
    id = models.AutoField(primary_key=True)
    page = models.ForeignKey(Page)
    order = models.IntegerField()
    widget = models.ForeignKey(Widget, on_delete=models.DO_NOTHING)
    feature_id = models.IntegerField()
