from manifesto import Manifest
from django.conf import settings

class StaticManifest(Manifest):
  def cache(self):
    print "Manifest"
    return [
      settings.STATIC_DESIGN_URL,
      settings.STATIC_WIDGETS_URL,
      settings.STATIC_THEMES_URL,
      settings.STATIC_ICONSETS_URL,
    ]

  def network(self):
    return ['*']

  def fallback(self):
    return []