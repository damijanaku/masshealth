from django.core.management.base import BaseCommand
from django.apps import apps
from django.conf import settings
from django.utils import timezone

class Command(BaseCommand):
    help = 'Pull records from Supabase to local Django database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--full',
            action='store_true',
            help='Pull all records from Supabase',
        )
        parser.add_argument(
            '--model',
            type=str,
            help='Pull only a specific model (e.g., MuscleGroup)',
        )
    
    def handle(self, *args, **options):
        if not getattr(settings, 'SYNC_TO_SUPABASE', False):
            self.stdout.write('Supabase sync is disabled')
            return
        
        full_pull = options.get('full', False)
        specific_model = options.get('model')
        
        if full_pull:
            self.stdout.write(self.style.WARNING('FULL PULL MODE - Pulling all records from Supabase'))
        
        # Sync models in order of dependencies (no foreign keys first)
        sync_order = [
            'CustomUser',
            'UserMetadata', 
            'MuscleGroup',
            'FriendRequest',
            'Routine',
            'Workout',
            'RoutineWorkout',
        ]
        
        # If specific model requested, only pull that one
        if specific_model:
            sync_order = [specific_model]
        
        for model_name in sync_order:
            try:
                model = apps.get_model('masshealth', model_name)
                self.pull_model(model, full_pull)
            except LookupError:
                self.stdout.write(
                    self.style.ERROR(f'Model {model_name} not found')
                )
                continue
    
    def pull_model(self, model, full_pull=False):
        """Pull records from Supabase to local database"""
        batch_size = getattr(settings, 'SYNC_BATCH_SIZE', 1000)
        
        # Get records from Supabase
        try:
            supabase_records = model.objects.using('supabase').all()[:batch_size]
            count = supabase_records.count()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\nFailed to query {model.__name__} from Supabase: {e}')
            )
            return
        
        self.stdout.write(f'\nPulling {model.__name__}... ({count} records from Supabase)')
        
        if count == 0:
            self.stdout.write(self.style.WARNING(f'  No records found in Supabase'))
            return
        
        success_count = 0
        fail_count = 0
        created_count = 0
        updated_count = 0
        
        for supabase_obj in supabase_records:
            try:
                # Prepare the data dictionary
                data = {}
                for field in supabase_obj._meta.fields:
                    # Skip sync tracking fields
                    if field.name in ['synced_at', 'sync_status']:
                        continue
                    
                    value = getattr(supabase_obj, field.name)
                    
                    # Handle foreign keys
                    if field.many_to_one and value is not None:
                        # Get the foreign key ID
                        fk_id = value.pk if hasattr(value, 'pk') else value
                        data[field.name + '_id'] = fk_id
                    elif not field.many_to_one:
                        data[field.name] = value
                
                # Check if exists locally
                try:
                    local_obj = model.objects.using('default').get(pk=supabase_obj.pk)
                    # Update existing record
                    for key, value in data.items():
                        setattr(local_obj, key, value)
                    local_obj.sync_status = 'synced'
                    local_obj.synced_at = timezone.now()
                    local_obj.save(using='default')
                    updated_count += 1
                    
                except model.DoesNotExist:
                    # Create new record
                    data['id'] = supabase_obj.pk
                    data['sync_status'] = 'synced'
                    data['synced_at'] = timezone.now()
                    local_obj = model(**data)
                    local_obj.save(using='default', force_insert=True)
                    created_count += 1
                
                success_count += 1
                
            except Exception as e:
                fail_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed {model.__name__} {supabase_obj.pk}: {str(e)}')
                )
        
        # Summary
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Created {created_count} new records')
            )
        if updated_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Updated {updated_count} existing records')
            )
        if fail_count > 0:
            self.stdout.write(
                self.style.ERROR(f'  ✗ Failed to pull {fail_count}/{count} records')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'  Total: {success_count}/{count} records pulled successfully')
        )