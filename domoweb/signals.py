import django.dispatch

index_updated = django.dispatch.Signal(providing_args=["index"])
rinor_changed = django.dispatch.Signal()