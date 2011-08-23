class DomoWebBaseException(Exception):
    def __init__(self, code=None, reason=None, resp=None):
        self.code = code
        self.reason = reason
        self.resp = resp
    
    def __str__(self):
        if self.reason:
            return repr(self.reason)
        else:
            return repr(self.resp)

class RinorNotConfigured(DomoWebBaseException):
    pass
