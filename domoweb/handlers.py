#!/usr/bin/env python
import tornado.web
from tornado.web import RequestHandler
from domoweb.db.models import Session, Section

class MainHandler(RequestHandler):
    def get(self, id=1):
        # create a Session
        session = Session()
        section = session.query(Section).get(id)
        self.render('index.html',
            section = section)
        session.close()

class PageHandler(RequestHandler):
    def post(self):
        # create a Session
        session = Session()
        name = self.get_argument('name')
        description = self.get_argument('description', None)
        Section.add(name=name, parent_id=1, description=description)
        session.commit()
        session.close()