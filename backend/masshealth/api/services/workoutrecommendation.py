from typing import List, Dict, Set
import random
from collections import defaultdict

class WorkoutRecommendationEngine:
    
    # Goal to muscle group mapping
    GOAL_MUSCLE_MAPPING = {
        'losing_weight': {
            'primary': ['abs', 'quads', 'hamstrings', 'glutes'],
            'secondary': ['chest', 'lats', 'shoulders'],
            'exercise_types': ['conditioning', 'strength', 'plyometrics'],
            'intensity': 'high'
        },
        'cardio': {
            'primary': ['quads', 'hamstrings', 'calves', 'glutes'],
            'secondary': ['abs'],
            'exercise_types': ['conditioning', 'plyometrics'],
            'intensity': 'high'
        },
        'maintaining_weight': {
            'primary': ['chest', 'lats', 'quads', 'shoulders'],
            'secondary': ['abs', 'triceps', 'biceps'],
            'exercise_types': ['strength'],
            'intensity': 'medium'
        },
        'weightlifting': {
            'primary': ['chest', 'lats', 'quads', 'hamstrings', 'shoulders'],
            'secondary': ['triceps', 'biceps', 'traps'],
            'exercise_types': ['strength', 'olympic_weightlifting'],
            'intensity': 'high'
        },
        'getting_sixpack': {
            'primary': ['abs'],
            'secondary': ['obliques'],
            'exercise_types': ['strength', 'conditioning'],
            'intensity': 'high'
        },
        'staying_active': {
            'primary': ['quads', 'chest', 'lats', 'abs'],
            'secondary': ['shoulders', 'hamstrings'],
            'exercise_types': ['strength', 'conditioning'],
            'intensity': 'low'
        }
    }
    
    CONDITION_RESTRICTIONS = {
        'neck_injury': {
            'avoid_muscle_groups': ['neck', 'traps'],
            'avoid_exercises': [
                'military_press', 'overhead_press', 'shrug', 
                'behind_neck_press', 'upright_row'
            ],
            'preferred_equipment': ['dumbbell', 'cable', 'machine']
        },
        'back_injury': {
            'avoid_muscle_groups': ['lower_back'],
            'avoid_exercises': [
                'deadlift', 'good_morning', 'squat', 'bent_over_row'
            ],
            'preferred_equipment': ['machine', 'cable'],
            'modifications': 'lower_intensity'
        },
        'diabetes': {
            'preferred_types': ['conditioning', 'strength'],
            'intensity_cap': 'medium',
            'include_warmup': True
        },
        'hypertension': {
            'avoid_exercises': ['heavy_compound'],
            'preferred_types': ['conditioning', 'strength'],
            'intensity_cap': 'medium',
            'include_warmup': True,
            'longer_rest': True
        }
    }
    
    def __init__(self, workouts_data: List[Dict], user_profile: Dict):
        self.workouts = workouts_data
        self.user_profile = user_profile
        self.goals = user_profile.get('goals', [])
        self.conditions = user_profile.get('conditions', [])
        self.experience_level = user_profile.get('experience_level', 'beginner')
        
    def generate_routines(self, num_routines: int = 3, workouts_per_routine: int = 5) -> List[Dict]:
        routines = []
        
        # Generate different types of routines
        routine_types = self._determine_routine_types()
        
        for i, routine_type in enumerate(routine_types[:num_routines]):
            routine = {
                'name': self._generate_routine_name(routine_type, i + 1),
                'description': self._generate_routine_description(routine_type),
                'type': routine_type,
                'workouts': self._select_workouts_for_routine(
                    routine_type, 
                    workouts_per_routine
                )
            }
            routines.append(routine)
            
        return routines
    
    def _determine_routine_types(self) -> List[str]:
        routine_types = []
        
        # Primary goal-based routine
        if self.goals:
            routine_types.append(f"goal_{self.goals[0]}")
        
        # Full body routine (always useful)
        routine_types.append("full_body")
        
        # Add specialized routines based on goals
        if 'losing_weight' in self.goals or 'cardio' in self.goals:
            routine_types.append("cardio_focus")
        elif 'weightlifting' in self.goals:
            routine_types.append("strength_focus")
        elif 'getting_sixpack' in self.goals:
            routine_types.append("core_focus")
        else:
            routine_types.append("balanced")
            
        return routine_types
    
    def _generate_routine_name(self, routine_type: str, number: int) -> str:
        """Generate a descriptive name for the routine"""
        name_map = {
            'full_body': f'Full Body Workout #{number}',
            'cardio_focus': f'Cardio Blast #{number}',
            'strength_focus': f'Strength Builder #{number}',
            'core_focus': f'Core Crusher #{number}',
            'balanced': f'Balanced Routine #{number}'
        }
        
        # Handle goal-specific routines
        if routine_type.startswith('goal_'):
            goal = routine_type.replace('goal_', '').replace('_', ' ').title()
            return f'{goal} Program #{number}'
            
        return name_map.get(routine_type, f'Workout Routine #{number}')
    
    def _generate_routine_description(self, routine_type: str) -> str:
        """Generate a description for the routine"""
        desc_map = {
            'full_body': 'A comprehensive full-body workout targeting all major muscle groups',
            'cardio_focus': 'High-intensity cardio-focused routine to boost endurance and burn calories',
            'strength_focus': 'Build muscle and strength with compound movements',
            'core_focus': 'Targeted core workout for abs and obliques',
            'balanced': 'A well-rounded routine for overall fitness'
        }
        
        if routine_type.startswith('goal_'):
            goal = routine_type.replace('goal_', '')
            goal_desc = self.GOAL_MUSCLE_MAPPING.get(goal, {})
            return f"Personalized routine designed for {goal.replace('_', ' ')}"
            
        return desc_map.get(routine_type, 'Personalized workout routine')
    
    def _select_workouts_for_routine(self, routine_type: str, count: int) -> List[Dict]:
        # Filter workouts based on conditions
        available_workouts = self._filter_workouts_by_conditions()

        if not available_workouts:
            available_workouts = self.workouts
        
        # Get target muscle groups for this routine type
        target_muscles = self._get_target_muscles(routine_type)
        
        # Categorize workouts by muscle group
        workouts_by_muscle = self._categorize_by_muscle(available_workouts)
        
        # Select workouts with smart distribution
        selected_workouts = []
        
        # Always include a warmup if user has conditions
        if self.conditions and self._should_include_warmup():
            warmup = self._get_warmup_exercise(available_workouts)
            if warmup:
                selected_workouts.append(self._configure_workout(warmup, 'warmup'))
                count -= 1
        
        # Distribute remaining slots across target muscle groups
        slots_per_muscle = max(1, count // len(target_muscles))
        
        for muscle in target_muscles:
            if len(selected_workouts) >= count:
                break
                
            muscle_workouts = workouts_by_muscle.get(muscle.lower(), [])
            
            # Filter by experience level
            suitable_workouts = [
                w for w in muscle_workouts 
                if self._is_suitable_difficulty(w)
            ]
            
            if suitable_workouts:
                # Select 1-2 workouts from this muscle group
                num_to_select = min(slots_per_muscle, len(suitable_workouts))
                selected = random.sample(suitable_workouts, num_to_select)
                
                for workout in selected:
                    if len(selected_workouts) < count:
                        selected_workouts.append(
                            self._configure_workout(workout, routine_type)
                        )
        
        # If we still need more workouts, fill with general exercises
        while len(selected_workouts) < count:
            remaining = [w for w in available_workouts if w not in selected_workouts]
            if not remaining:
                break
            workout = random.choice(remaining)
            selected_workouts.append(self._configure_workout(workout, routine_type))
        
        return selected_workouts[:count]
    
    def _filter_workouts_by_conditions(self) -> List[Dict]:
        """Filter out workouts that conflict with user's conditions"""
        filtered = []
        
        for workout in self.workouts:
            # Skip if workout targets restricted muscle group
            should_skip = False
            
            for condition in self.conditions:
                restrictions = self.CONDITION_RESTRICTIONS.get(condition, {})
                
                # Check muscle group restrictions
                avoid_muscles = restrictions.get('avoid_muscle_groups', [])
                workout_muscle = workout.get('target_muscle_group', '').lower()
                
                if any(muscle.lower() in workout_muscle for muscle in avoid_muscles):
                    should_skip = True
                    break
                    
                # Check exercise name restrictions
                avoid_exercises = restrictions.get('avoid_exercises', [])
                workout_name = workout.get('name', '').lower()
                
                if any(ex in workout_name for ex in avoid_exercises):
                    should_skip = True
                    break
            
            if not should_skip:
                filtered.append(workout)
                
        return filtered
    
    def _get_target_muscles(self, routine_type: str) -> List[str]:
        """Get target muscle groups for a routine type"""
        if routine_type.startswith('goal_'):
            goal = routine_type.replace('goal_', '')
            goal_config = self.GOAL_MUSCLE_MAPPING.get(goal, {})
            primary = goal_config.get('primary', [])
            secondary = goal_config.get('secondary', [])
            return primary + secondary[:2]  # Limit secondary muscles
        
        # Default muscle distribution for routine types
        type_muscles = {
            'full_body': ['chest', 'lats', 'quads', 'abs', 'shoulders'],
            'cardio_focus': ['quads', 'hamstrings', 'calves', 'abs'],
            'strength_focus': ['chest', 'lats', 'quads', 'shoulders', 'hamstrings'],
            'core_focus': ['abs', 'obliques'],
            'balanced': ['chest', 'lats', 'quads', 'abs', 'shoulders']
        }
        
        return type_muscles.get(routine_type, ['chest', 'lats', 'quads', 'abs'])
    
    def _categorize_by_muscle(self, workouts: List[Dict]) -> Dict[str, List[Dict]]:
        """Categorize workouts by target muscle group"""
        categorized = defaultdict(list)
        
        for workout in workouts:
            muscle = workout.get('target_muscle_group', '').lower()
            if muscle:
                categorized[muscle].append(workout)
                
        return categorized
    
    def _is_suitable_difficulty(self, workout: Dict) -> bool:
        """Check if workout difficulty matches user's experience level"""
        workout_level = workout.get('experience_level', 'beginner').lower()
        user_level = self.experience_level.lower()
        
        level_hierarchy = {'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3}
        
        workout_rank = level_hierarchy.get(workout_level, 0)
        user_rank = level_hierarchy.get(user_level, 0)
        
        # Allow workouts at user's level or one level below/above
        return abs(workout_rank - user_rank) <= 1
    
    def _should_include_warmup(self) -> bool:
        """Determine if warmup exercises should be included"""
        warmup_conditions = ['diabetes', 'hypertension', 'back_injury', 'neck_injury']
        return any(cond in self.conditions for cond in warmup_conditions)
    
    def _get_warmup_exercise(self, workouts: List[Dict]) -> Dict:
        """Get a suitable warmup exercise, return None if none found"""
        warmups = [
            w for w in workouts 
            if w.get('exercise_type', '').lower() == 'warmup'
        ]
        return random.choice(warmups) if warmups else None
    
    def _configure_workout(self, workout: Dict, routine_type: str) -> Dict:
        workout_config = {
            'workout_id': workout.get('id'),  
            'name': workout.get('name'),
            'video_url': workout.get('video_url'),
            'target_muscle_group': workout.get('target_muscle_group'),
            'exercise_type': workout.get('exercise_type'),
        }
        
        # Determine workout mode based on exercise type
        exercise_type = workout.get('exercise_type', '').lower()
        
        if exercise_type in ['conditioning', 'plyometrics']:
            workout_config['workout_mode'] = 'timer'
            workout_config['timer_duration'] = self._get_timer_duration(exercise_type)
        elif exercise_type in ['warmup', 'smr']:
            workout_config['workout_mode'] = 'duration'
            workout_config['duration_minutes'] = 5
        else:
            workout_config['workout_mode'] = 'reps_sets'
            workout_config['custom_sets'] = self._get_sets(routine_type)
            workout_config['custom_reps'] = self._get_reps(exercise_type, routine_type)
        
        # Rest period between sets
        workout_config['rest_between_sets'] = self._get_rest_period()
        
        return workout_config
    
    def _get_timer_duration(self, exercise_type: str) -> int:
        """Get timer duration in seconds based on exercise type and conditions"""
        base_durations = {
            'conditioning': 180,  # 3 minutes
            'plyometrics': 120,   # 2 minutes
        }
        
        duration = base_durations.get(exercise_type, 120)
        
        # Reduce for beginners or if user has conditions
        if self.experience_level == 'beginner':
            duration = int(duration * 0.7)
        
        if self.conditions:
            duration = int(duration * 0.8)
            
        return duration
    
    def _get_sets(self, routine_type: str) -> int:
        """Determine number of sets based on routine type and experience"""
        base_sets = {
            'beginner': 3,
            'intermediate': 4,
            'advanced': 4,
            'expert': 5
        }
        
        sets = base_sets.get(self.experience_level, 3)
        
        # Adjust for specific routine types
        if 'cardio' in routine_type or 'conditioning' in routine_type:
            sets += 1
        
        # Reduce for users with conditions
        if self.conditions:
            sets = max(2, sets - 1)
            
        return sets
    
    def _get_reps(self, exercise_type: str, routine_type: str) -> int:
        """Determine number of reps based on exercise and routine type"""
        base_reps = {
            'strength': 10,
            'olympic_weightlifting': 5,
            'conditioning': 15,
            'plyometrics': 8,
        }
        
        reps = base_reps.get(exercise_type, 12)
        
        # Adjust for goals
        if 'losing_weight' in self.goals or 'cardio' in self.goals:
            reps += 3
        elif 'weightlifting' in self.goals:
            reps = max(5, reps - 2)
        
        # Adjust for experience
        if self.experience_level == 'beginner':
            reps = max(8, reps - 2)
        elif self.experience_level in ['advanced', 'expert']:
            reps += 2
            
        return reps
    
    def _get_rest_period(self) -> int:
        """Determine rest period between sets in seconds"""
        base_rest = {
            'beginner': 90,
            'intermediate': 60,
            'advanced': 45,
            'expert': 45
        }
        
        rest = base_rest.get(self.experience_level, 60)
        
        # Increase rest for users with hypertension
        if 'hypertension' in self.conditions:
            rest += 30
            
        # Decrease rest for cardio-focused goals
        if 'cardio' in self.goals or 'losing_weight' in self.goals:
            rest = max(30, rest - 15)
            
        return rest


def generate_user_routines(workouts_json: List[Dict], user_goals: List[str], 
                          user_conditions: List[str], experience_level: str = 'beginner') -> List[Dict]:

    user_profile = {
        'goals': user_goals,
        'conditions': user_conditions,
        'experience_level': experience_level
    }
    
    engine = WorkoutRecommendationEngine(workouts_json, user_profile)
    routines = engine.generate_routines(num_routines=3, workouts_per_routine=5)
    
    return routines

