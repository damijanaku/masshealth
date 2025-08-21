from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from ..models import CustomUser, UserMetadata

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

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'full_name', 'is_verified', 'date_joined', 'metadata')
        read_only_fields = ('id', 'email', 'date_joined', 'is_verified')

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
        return None
