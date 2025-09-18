# management/commands/populate_workouts.py

import json
from django.core.management.base import BaseCommand
from masshealth.models import Workout, MuscleGroup  

class Command(BaseCommand):
    help = 'Populate workouts from JSON data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to JSON file containing workout data',
            default='workouts.json'
        )
    
    def handle(self, *args, **options):
        file_path = options['file']
        
        try:
            with open(file_path, 'r') as file:
                workouts_data = json.load(file)
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'File {file_path} not found')
            )
            return
        except json.JSONDecodeError:
            self.stdout.write(
                self.style.ERROR('Invalid JSON format')
            )
            return
        
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for workout_data in workouts_data:
            try:
                # Skip entries without names or with empty target_muscle_group
                if not workout_data.get('name') or not workout_data.get('target_muscle_group'):
                    skipped_count += 1
                    continue
                
                # Get or create muscle group
                muscle_group_name = workout_data['target_muscle_group']
                muscle_group, _ = MuscleGroup.objects.get_or_create(name=muscle_group_name)
                
                # Map field values to model choices
                exercise_type = self.map_exercise_type(workout_data.get('exercise_type', ''))
                equipment = self.map_equipment(workout_data.get('equipment_required', ''))
                experience_level = workout_data.get('experience_level', 'Beginner').lower()
                
                # Create workout if it doesn't exist
                workout, created = Workout.objects.get_or_create(
                    name=workout_data['name'],
                    defaults={
                        'video_url': workout_data.get('video_url', ''),
                        'exercise_type': exercise_type,
                        'equipment_required': equipment,
                        'mechanics': workout_data.get('mechanics', '').lower(),
                        'force_type': self.map_force_type(workout_data.get('force_type', '')),
                        'experience_level': experience_level,
                        'muscle_group': muscle_group,
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(f'Created: {workout_data["name"]}')
                else:
                    skipped_count += 1
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Error creating workout {workout_data.get("name", "Unknown")}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} created, {skipped_count} skipped, {error_count} errors'
            )
        )
    
    def map_exercise_type(self, exercise_type):
        mapping = {
            'Strength': 'strength',
            'Warmup': 'warmup',
            'SMR': 'smr',
            'Plyometrics': 'plyometrics',
            'Olympic Weightlifting': 'olympic_weightlifting',
            'Conditioning': 'conditioning',
            'Activation': 'activation',
        }
        return mapping.get(exercise_type, 'strength')
    
    def map_equipment(self, equipment):
        mapping = {
            'Bands': 'bands',
            'Barbell': 'barbell',
            'Bench': 'bench',
            'Bodyweight': 'bodyweight',
            'Box': 'box',
            'Cable': 'cable',
            'Chains': 'chains',
            'Dumbbell': 'dumbbell',
            'EZ Bar': 'ez_bar',
            'Exercise Ball': 'exercise_ball',
            'Foam Roll': 'foam_roll',
            'Hip Thruster': 'hip_thruster',
            'Jump Rope': 'jump_rope',
            'Kettle Bells': 'kettle_bells',
            'Lacrosse Ball': 'lacrosse_ball',
            'Landmine': 'landmine',
            'Machine': 'machine',
            'Medicine Ball': 'medicine_ball',
            'Other': 'other',
            'Sled': 'sled',
            'Tiger Tail': 'tiger_tail',
            'Trap Bar': 'trap_bar',
            'Valslide': 'valslide',
        }
        return mapping.get(equipment, 'other')
    
    def map_force_type(self, force_type):
        mapping = {
            'Compression': 'compression',
            'Dynamic Stretching': 'dynamic_stretching',
            'Hinge (Bilateral)': 'hinge_bilateral',
            'Hinge (Unilateral)': 'hinge_unilateral',
            'Isometric': 'isometric',
            'Press (Bilateral)': 'press_bilateral',
            'Pull': 'pull',
            'Pull (Bilateral)': 'pull_bilateral',
            'Pull (Unilateral)': 'pull_unilateral',
            'Push': 'push',
            'Push (Bilateral)': 'push_bilateral',
            'Push (Unilateral)': 'push_unilateral',
            'Static Stretching': 'static_stretching',
        }
        return mapping.get(force_type, 'push')