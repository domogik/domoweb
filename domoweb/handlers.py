#!/usr/bin/env python
import tornado.web
from tornado.web import RequestHandler
from domoweb.db.models import Section, Widget

import logging
logger = logging.getLogger('domoweb')

class MainHandler(RequestHandler):
    def get(self, id):
        if not id:
            id = 1
        section = Section.get(id)
        self.render('index.html',
            section = section)

    def post(self, id):
        if not id:
            id = 1
        logger.info(self.get_argument('sectionName'))
        Section.update(id, self.get_argument('sectionName'), self.get_argument('sectionDescription', None))
        self.redirect ('/%d' % id)

class PageHandler(RequestHandler):
    def post(self):
        # create a Session
        name = self.get_argument('name')
        description = self.get_argument('description', None)
        Section.add(name=name, parent_id=1, description=description)

class WidgetHandler(RequestHandler):
    def get(self):
        action = self.get_argument('action', None)
        if action=='select':
            widgets = Widget.getAll()
            self.render('widgetSelect.html',
                widgets=widgets)

