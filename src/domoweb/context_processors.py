def rinor(request):
    from django.conf import settings
    additions = {
        'version': settings.DOMOWEB_VERSION,
        'rinor_min_version': settings.RINOR_MIN_API,
        'rinor_max_version': settings.RINOR_MAX_API,
        'dmg_min_version': settings.DMG_MIN_VERSION,
    }
    return additions
