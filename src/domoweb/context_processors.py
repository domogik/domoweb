def rinor(request):
    from django.conf import settings
    import datetime
    now = datetime.datetime.now()

    additions = {
        'version': settings.DOMOWEB_VERSION,
        'rinor_min_version': settings.RINOR_MIN_API,
        'rinor_max_version': settings.RINOR_MAX_API,
        'dmg_min_version': settings.DMG_MIN_VERSION,
        'we': (now.month==12 and now.day>=20 and now.day<=25),
    }
    return additions
