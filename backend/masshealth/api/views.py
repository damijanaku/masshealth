from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.shortcuts import get_object_or_404
from .serializers import (UserRegistrationSerializer, UserLoginSerializer, 
                         UserProfileSerializer, UserMetadataSerializer,
                         WorkoutSerializer, RoutineSerializer, RoutineDetailSerializer)
from ..models import CustomUser, UserMetadata, FriendRequest, Workout, Routine, RoutineWorkout, MuscleGroup
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
    
# Add these views to your existing views.py

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_friend_request(request, userId):
    try:
        from_user = request.user
        to_user = get_object_or_404(CustomUser, id=userId)
        
        # Check if users are already friends
        if from_user.friends.filter(id=userId).exists():
            return Response({
                'success': False,
                'message': 'You are already friends with this user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if request already exists
        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            return Response({
                'success': False,
                'message': 'Friend request already sent'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create friend request
        friend_request = FriendRequest.objects.create(
            from_user=from_user, 
            to_user=to_user
        )
        
        return Response({
            'success': True,
            'message': 'Friend request sent successfully',
            'request_id': friend_request.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_friend_request(request, requestId):
    try:
        friend_request = get_object_or_404(FriendRequest, id=requestId)
        
        # Check if the current user is the recipient of the request
        if friend_request.to_user != request.user:
            return Response({
                'success': False,
                'message': 'You can only accept friend requests sent to you'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Add each other as friends
        friend_request.to_user.friends.add(friend_request.from_user)
        friend_request.from_user.friends.add(friend_request.to_user)
        
        # Delete the friend request
        friend_request.delete()
        
        return Response({
            'success': True,
            'message': 'Friend request accepted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_requests(request):
    try:
        pending_requests = FriendRequest.objects.filter(to_user=request.user)
        
        requests_data = []
        for req in pending_requests:
            requests_data.append({
                'id': req.id,
                'from_user': {
                    'id': req.from_user.id,
                    'name': req.from_user.full_name,
                    'username': req.from_user.metadata.username if hasattr(req.from_user, 'metadata') else f'user_{req.from_user.id}'
                }
            })
        
        return Response({
            'success': True,
            'requests': requests_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_friends_list(request):
    try:
        friends = request.user.friends.all()
        
        friends_data = []
        for friend in friends:
            friends_data.append({
                'id': friend.id,
                'name': friend.full_name,
                'username': friend.metadata.username if hasattr(friend, 'metadata') else f'user_{friend.id}',
                'profile_image_url': friend.metadata.profile_image.url if hasattr(friend, 'metadata') and friend.metadata.profile_image else None
            })
        
        return Response({
            'success': True,
            'friends': friends_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    try:
        username = request.data.get('username', '').strip()
        
        if not username:
            return Response({
                'success': False,
                'message': 'Username is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Search for users by metadata username
        users = CustomUser.objects.filter(
            metadata__username__icontains=username
        ).exclude(id=request.user.id)[:10]  # Limit to 10 results
        
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'name': user.full_name,
                'username': user.metadata.username,
                'is_friend': request.user.friends.filter(id=user.id).exists(),
                'request_sent': FriendRequest.objects.filter(
                    from_user=request.user, 
                    to_user=user
                ).exists()
            })
        
        return Response({
            'success': True,
            'users': users_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class WorkoutListView(generics.ListAPIView):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer  
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  
        queryset = Workout.objects.all()
        
        muscle_group = self.request.query_params.get('muscle_group')
        exercise_type = self.request.query_params.get('exercise_type')
        experience_level = self.request.query_params.get('experience_level')
        
        if muscle_group:
            queryset = queryset.filter(muscle_group__name__icontains=muscle_group)
        if exercise_type:
            queryset = queryset.filter(exercise_type=exercise_type)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
            
        return queryset

class RoutineCreateView(generics.CreateAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):  
        routine = serializer.save(user=self.request.user)

        workout_data = self.request.data.get('workouts', [])

        for index, workout_info in enumerate(workout_data):
            workout_id = workout_info.get('workout_id')
            workout = get_object_or_404(Workout, id=workout_id)

            RoutineWorkout.objects.create(
                routine=routine,
                workout=workout,
                order=index + 1,
                rest_between_sets=workout_info.get('rest_between_sets', 60),
                notes=workout_info.get('notes', '')
            )

class RoutineDetailView(generics.RetrieveAPIView):
    serializer_class = RoutineDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  
        return Routine.objects.filter(user=self.request.user)

class RoutineListView(generics.ListAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # Removed incorrect decorators
        return Routine.objects.filter(user=self.request.user)

class RoutineUpdateView(generics.UpdateAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        routine = serializer.save()
        
        # Handle workout updates if provided
        workout_data = self.request.data.get('workouts')
        if workout_data is not None:
            # Clear existing workout relationships
            RoutineWorkout.objects.filter(routine=routine).delete()
            
            # Add new workout relationships
            for index, workout_info in enumerate(workout_data):
                workout_id = workout_info.get('workout_id')
                workout = get_object_or_404(Workout, id=workout_id)
                
                RoutineWorkout.objects.create(
                    routine=routine,
                    workout=workout,
                    order=index + 1,
                    rest_between_sets=workout_info.get('rest_between_sets', 60),
                    notes=workout_info.get('notes', '')
                )

class RoutineDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_routine_with_workouts(request):
    """
    Create a routine with workouts in a single request
    
    Expected JSON format:
    {
        "name": "My Routine",
        "description": "Description here",
        "is_public": false,
        "workouts": [
            {
                "workout_id": 1,
                "rest_between_sets": 60,
                "notes": "Go slow on this one"
            },
            {
                "workout_id": 5,
                "rest_between_sets": 90,
                "notes": ""
            }
        ]
    }
    """
    try:
        # Create routine
        routine_data = {
            'name': request.data.get('name'),
            'description': request.data.get('description', ''),
            'is_public': request.data.get('is_public', False)
        }
        
        routine_serializer = RoutineSerializer(data=routine_data)
        if routine_serializer.is_valid():
            routine = routine_serializer.save(user=request.user)
            
            # Add workouts to routine
            workout_data = request.data.get('workouts', [])
            routine_workouts = []
            
            for index, workout_info in enumerate(workout_data):
                workout_id = workout_info.get('workout_id')
                
                if not workout_id:
                    return Response(
                        {'error': f'workout_id is required for workout at index {index}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    workout = Workout.objects.get(id=workout_id)
                except Workout.DoesNotExist:
                    return Response(
                        {'error': f'Workout with id {workout_id} does not exist'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                routine_workout = RoutineWorkout.objects.create(
                    routine=routine,
                    workout=workout,
                    order=index + 1,
                    rest_between_sets=workout_info.get('rest_between_sets', 60),
                    notes=workout_info.get('notes', '')
                )
                routine_workouts.append(routine_workout)
            
            # Return detailed routine data
            detailed_serializer = RoutineDetailSerializer(routine)
            return Response(detailed_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(routine_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_workout_by_muscle_group(request, muscle_group_name):
    try:
        muscle_group = MuscleGroup.objects.get(name__iexact=muscle_group_name)
        workouts = Workout.objects.filter(muscle_group=muscle_group)
        serializer = WorkoutSerializer(workouts, many=True)
        return Response(serializer.data)
    
    except MuscleGroup.DoesNotExist:
        return Response(
            {'error': f'Muscle group "{muscle_group_name}" not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['GET'])
def get_muscle_groups(request):
    try:
        muscle_groups = MuscleGroup.objects.all()
        serializer = MuscleGroupSerializer(muscle_groups, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)