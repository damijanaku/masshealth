from django.core.management.base import BaseCommand
from django.apps import apps
from django.conf import settings
from django.utils import timezone

class Command(BaseCommand):
    help = 'Sync pending records to Supabase'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--full',
            action='store_true',
            help='Sync all records, not just pending ones',
        )
    
    def handle(self, *args, **options):
        if not getattr(settings, 'SYNC_TO_SUPABASE', False):
            self.stdout.write('Supabase sync is disabled')
            return
        
        full_sync = options.get('full', False)
        
        if full_sync:
            self.stdout.write(self.style.WARNING('FULL SYNC MODE - Syncing all records'))
        
        # Sync models in order of dependencies (no foreign keys first)
        sync_order = [
            'CustomUser',
            'UserMetadata', 
            'MuscleGroup',
            'FriendRequest',
            'Routine',
            'Workout',
            'RoutineWorkout',
            'Challenge',
            'FitnessGoal',
            'ConditionOrInjury',
            'UserCondition',
            'UserFitnessGoal',
        ]
        
        for model_name in sync_order:
            try:
                model = apps.get_model('masshealth', model_name)
                if hasattr(model, 'sync_status'):
                    self.sync_model(model, full_sync)
            except LookupError:
                continue
    
    def sync_model(self, model, full_sync=False):
        """Sync records for a model"""
        batch_size = getattr(settings, 'SYNC_BATCH_SIZE', 1000)
        
        # Get records to sync
        if full_sync:
            records = model.objects.using('default').all()[:batch_size]
        else:
            records = model.objects.using('default').filter(sync_status='pending')[:batch_size]
        
        count = records.count()
        self.stdout.write(f'\nSyncing {model.__name__}... ({count} records)')
        
        if count == 0:
            return
        
        success_count = 0
        fail_count = 0
        
        for obj in records:
            try:
                # Prepare the data dictionary
                data = {}
                for field in obj._meta.fields:
                    if field.name in ['synced_at', 'sync_status']:
                        continue
                    
                    value = getattr(obj, field.name)
                    
                    # Handle foreign keys - use _id field directly
                    if field.many_to_one and value is not None:
                        data[f'{field.name}_id'] = value.pk
                    elif not field.many_to_one:
                        data[field.name] = value
                
                # Check if exists in Supabase
                exists = model.objects.using('supabase').filter(pk=obj.pk).exists()
                
                if exists:
                    # Update existing
                    model.objects.using('supabase').filter(pk=obj.pk).update(**data)
                else:
                    # Insert new
                    supabase_obj = model(**data)
                    supabase_obj.pk = obj.pk
                    supabase_obj.save(using='supabase', force_insert=True)
                
                # Update sync status locally
                model.objects.using('default').filter(pk=obj.pk).update(
                    sync_status='synced',
                    synced_at=timezone.now()
                )
                
                success_count += 1
                
            except Exception as e:
                # Mark as failed
                model.objects.using('default').filter(pk=obj.pk).update(
                    sync_status='failed'
                )
                fail_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed {model.__name__} {obj.pk}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ Successfully synced {success_count}/{count} records')
        )
        if fail_count > 0:
            self.stdout.write(
                self.style.ERROR(f'  ✗ Failed to sync {fail_count}/{count} records')
            )