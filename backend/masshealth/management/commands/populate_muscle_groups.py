
from django.core.management.base import BaseCommand
from masshealth.models import MuscleGroup  

class Command(BaseCommand):
    help = 'Populate muscle groups in the database'
    
    def handle(self, *args, **options):
        muscle_groups = [
            "Abductors", "Abs", "Adductors", "Biceps", "Calves", 
            "Chest", "Forearms", "Glutes", "Hamstrings", "Lats", 
            "Neck", "Quads", "Shoulders", "Traps", "Triceps"
        ]
        
        created_count = 0
        existing_count = 0
        
        for mg_name in muscle_groups:
            muscle_group, created = MuscleGroup.objects.get_or_create(name=mg_name)
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created muscle group: {mg_name}')
                )
            else:
                existing_count += 1
                self.stdout.write(f'Muscle group already exists: {mg_name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} created, {existing_count} already existed'
            )
        )