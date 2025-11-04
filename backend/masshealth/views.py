from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_status(request):
    """Check sync status for monitoring"""
    from .models import CustomUser, HealthRecord  # Import your models
    
    status = {}
    for model in [CustomUser, HealthRecord]:  # Add all your models
        counts = model.objects.values('sync_status').annotate(
            count=Count('sync_status')
        )
        status[model.__name__] = {
            item['sync_status']: item['count'] 
            for item in counts
        }
    
    return Response(status)

# masshealth/urls.py - Add this endpoint
urlpatterns = [
    # ... your existing URLs
    path('api/sync-status/', sync_status, name='sync-status'),
]