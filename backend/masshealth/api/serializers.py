from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from ..models import ConditionOrInjury, CustomUser, FitnessGoal, Workout, UserMetadata, MuscleGroup, Routine, RoutineWorkout

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)  

    class Meta:
        model = CustomUser
        fields = ('email', 'full_name', 'username', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        username = validated_data.pop('username')

        # Create CustomUser
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=password
        )

        # Create UserMetadata (profile info)
        UserMetadata.objects.create(
            user=user,
            username=username
        )

        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='metadata.username', read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'full_name', 'is_verified', 'date_joined', 'profile_image_url')
    
    def get_profile_image_url(self, obj):
        try:
            if hasattr(obj, 'metadata') and obj.metadata.profile_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.metadata.profile_image.url)
                return obj.metadata.profile_image.url
        except (AttributeError, UserMetadata.DoesNotExist):
            pass
        return None

class UserMetadataSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserMetadata
        fields = ['username', 'age', 'gender', 'height', 'weight', 'fitness_experience', 
                 'profile_image', 'profile_image_url', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

class TwoFactorAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['two_factor_auth']

    def update(self, instance, validated_data):
        instance.two_factor_auth = validated_data.get('two_factor_auth', instance.two_factor_auth)

        instance.save()
        return instance

class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = ['id', 'name']

class WorkoutSerializer(serializers.ModelSerializer):
    muscle_group = MuscleGroupSerializer(read_only=True)
    
    class Meta:
        model = Workout
        fields = [
            'id', 'name', 'video_url', 'exercise_type', 
            'equipment_required', 'mechanics', 'force_type', 
            'experience_level', 'muscle_group', 'duration_minutes', 
            'sets', 'reps', 'created_at'
        ]

class RoutineWorkoutSerializer(serializers.ModelSerializer):
    workout = WorkoutSerializer(read_only=True)
    effective_sets = serializers.SerializerMethodField()
    effective_reps = serializers.SerializerMethodField() 
    effective_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = RoutineWorkout
        fields = [
            'id', 'workout', 'order', 'workout_mode',
            'custom_sets', 'custom_reps', 'timer_duration', 'duration_minutes',
            'rest_between_sets', 'notes',
            'effective_sets', 'effective_reps', 'effective_duration'
        ]
    
    def get_effective_sets(self, obj):
        return obj.get_effective_sets()
    
    def get_effective_reps(self, obj):
        return obj.get_effective_reps()
    
    def get_effective_duration(self, obj):
        return obj.get_effective_duration()


#seperate serializer for updating/creating   
class RoutineWorkoutCreateUpdateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = RoutineWorkout
        fields = [
            'workout', 'order', 'workout_mode',
            'custom_sets', 'custom_reps', 'timer_duration', 'duration_minutes',
            'rest_between_sets', 'notes'
        ]
    
    def validate(self, attrs):
        workout_mode = attrs.get('workout_mode', 'reps_sets')
        
        if workout_mode == 'timer':
            if not attrs.get('timer_duration'):
                raise serializers.ValidationError({
                    'timer_duration': 'Timer duration is required when using timer mode'
                })
        
        return attrs

class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = [
            'id', 'name', 'description', 'is_public', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class RoutineDetailSerializer(serializers.ModelSerializer):
    workouts = RoutineWorkoutSerializer(source='routine_workouts', many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    total_estimated_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Routine
        fields = [
            'id', 'name', 'description', 'user', 'is_public', 
            'workouts', 'created_at', 'updated_at', 'total_estimated_duration'
        ]
    
    def get_total_estimated_duration(self, obj):
        #total duration
        total_minutes = 0
        
        for routine_workout in obj.routine_workouts.all():
            # Get effective duration for this workout
            duration = routine_workout.get_effective_duration()
            if duration:
                total_minutes += duration
            
            # Add rest time between sets (if applicable)
            if routine_workout.workout_mode == 'reps_sets':
                sets = routine_workout.get_effective_sets() or 1
                if sets > 1:  # Rest time only applies between sets, not after the last set
                    rest_minutes = (routine_workout.rest_between_sets * (sets - 1)) / 60
                    total_minutes += rest_minutes
        
        return round(total_minutes, 1) if total_minutes else None
    
class ConditionOrInjurySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConditionOrInjury
        fields = ['id', 'key', 'label'] 

class FitnessGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessGoal
        fields = ['id', 'key', 'label'] 