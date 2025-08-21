from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.shortcuts import get_object_or_404
from .serializers import (UserRegistrationSerializer, UserLoginSerializer, 
                         UserProfileSerializer, UserMetadataSerializer)
from ..models import CustomUser, UserMetadata
from .forms import ProfilePicForm
import os

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_profile_image(request):
    try:
        metadata, created = UserMetadata.objects.get_or_create(
            user=request.user,
            defaults={'username': f'user_{request.user.id}'}
        )

        if 'profile_image' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No image file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        form = ProfilePicForm(files=request.FILES, instance=metadata)

        if form.is_valid():
            form.save()

            serializer = UserMetadataSerializer(metadata, context={'request': request})

            return Response({
                'success': True,
                'message': 'Profile image updated successfully!',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        else:
            return Response({
                'success': False,
                'errors': form.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_profile_image(request):
    try:
        metadata = get_object_or_404(UserMetadata, user=request.user)
        
        if metadata.profile_image:
            # Delete the image file
            if os.path.isfile(metadata.profile_image.path):
                os.remove(metadata.profile_image.path)
            
            # Clear the image field
            metadata.profile_image = None
            metadata.save()
            
            return Response({
                'success': True,
                'message': 'Profile image removed successfully!'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'No profile image to remove.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_metadata(request):
    try:
        metadata, created = UserMetadata.objects.get_or_create(
            user=request.user,
            defaults={'username': f'user_{request.user.id}'}
        )
        
        serializer = UserMetadataSerializer(metadata, context={'request': request})
        
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
