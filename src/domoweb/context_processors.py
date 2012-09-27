def domoweb(request):
    from django.conf import settings

    additions = {
        'version': settings.DOMOWEB_VERSION,
        'rinor_min_version': settings.RINOR_MIN_API,
        'rinor_max_version': settings.RINOR_MAX_API,
        'dmg_min_version': settings.DMG_MIN_VERSION,
        'rest_url': settings.REST_URL,
        'events_url': settings.EVENTS_URL,
        'config_url': settings.CONFIG_URL,
        'admin_url': settings.ADMIN_URL,
        'view_url': settings.VIEW_URL,
        'static_design_url': settings.STATIC_DESIGN_URL,
        'static_widgets_url': settings.STATIC_WIDGETS_URL,
        'static_themes_url': settings.STATIC_THEMES_URL,
        'static_iconsets_url': settings.STATIC_ICONSETS_URL,
    }
    return additions
