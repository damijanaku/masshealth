from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count
from django.conf import settings
import jwt
from datetime import datetime, timedelta

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mqtt_credentials(request):
    """
    Generate temporary MQTT credentials for the authenticated user
    """
    user = request.user
    
    # Create a JWT token for MQTT authentication (optional enhanced security)
    mqtt_token = jwt.encode({
        'user_id': str(user.id),
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, settings.SECRET_KEY, algorithm='HS256')
    
    return Response({
        'broker': settings.MQTT_CONFIG['broker'],
        'port': 8884,  # WebSocket port
        'username': settings.MQTT_CONFIG['username'],
        'password': settings.MQTT_CONFIG['password'],
        'topics': {
            'publish': [
                f"users/{user.id}/location",
                f"users/{user.id}/status"
            ],
            'subscribe': [
                f"friends/{user.id}/locations",
                f"rivalries/+/updates"  # + is wildcard
            ]
        }
    })

# masshealth/urls.py - Add this endpoint
urlpatterns = [
    # ... your existing URLs
    path('api/sync-status/', sync_status, name='sync-status'),
]