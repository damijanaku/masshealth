from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class MasshealthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'masshealth'
    
    def ready(self):
        """Initialize MQTT connection when Django starts"""
        import os
        
        # ONLY connect in the main process (not the reloader)
        if os.environ.get('RUN_MAIN') == 'true':
            print("Initializing MQTT in main process...")
            try:
                from masshealth.services.mqtt_client import mqtt_client
                mqtt_client.connect()
            except Exception as e:
                print(f"Error in ready(): {e}")
                import traceback
                traceback.print_exc()