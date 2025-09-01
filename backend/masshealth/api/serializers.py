from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from ..models import CustomUser, Workout, UserMetadata, MuscleGroup, Routine, RoutineWorkout

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
    
    class Meta:
        model = RoutineWorkout
        fields = ['workout', 'order', 'rest_between_sets', 'notes']

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
    
    class Meta:
        model = Routine
        fields = [
            'id', 'name', 'description', 'user', 'is_public', 
            'workouts', 'created_at', 'updated_at'
        ]