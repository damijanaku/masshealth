# api/admin_views.py
# Admin-only API endpoints

from rest_framework import status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

CustomUser = get_user_model()


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users (is_staff=True or is_superuser=True)
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_check(request):
    """
    Endpoint to check if current user is an admin
    """
    return Response({
        'is_admin': True,
        'is_staff': request.user.is_staff,
        'is_superuser': request.user.is_superuser,
        'email': request.user.email
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_admins(request):
    """
    List all admin users
    """
    admins = CustomUser.objects.filter(is_staff=True) | CustomUser.objects.filter(is_superuser=True)
    admins = admins.distinct()
    
    data = [{
        'id': admin.id,
        'email': admin.email,
        'full_name': admin.full_name,
        'is_staff': admin.is_staff,
        'is_superuser': admin.is_superuser,
        'created_at': admin.created_at,
        'last_login': admin.last_login
    } for admin in admins]
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_all_users(request):
    """
    List all users (admin only)
    """
    users = CustomUser.objects.all().order_by('-created_at')
    
    # Pagination (basic)
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    total = users.count()
    users_page = users[start:end]
    
    data = [{
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'is_verified': user.is_verified,
        'created_at': user.created_at,
        'last_login': user.last_login
    } for user in users_page]
    
    return Response({
        'users': data,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_admin(request):
    """
    Create a new admin user
    Only existing admins can create new admins
    """
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError
    from ..models import UserMetadata
    
    email = request.data.get('email')
    password = request.data.get('password')
    full_name = request.data.get('full_name', '')
    username = request.data.get('username')
    make_superuser = request.data.get('is_superuser', False)
    
    # Validation
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check existing email
    if CustomUser.objects.filter(email=email).exists():
        return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check existing username
    if UserMetadata.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
    
    # Only superusers can create other superusers
    if make_superuser and not request.user.is_superuser:
        return Response(
            {'error': 'Only superusers can create other superusers'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create the admin user
    if make_superuser:
        user = CustomUser.objects.create_superuser(
            email=email,
            password=password,
            full_name=full_name
        )
    else:
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            full_name=full_name
        )
        user.is_staff = True
        user.save()
    
    # Create UserMetadata
    UserMetadata.objects.create(
        user=user,
        username=username
    )
    
    return Response({
        'message': 'Admin user created successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def promote_to_admin(request, user_id):
    """
    Promote an existing user to admin
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    make_superuser = request.data.get('is_superuser', False)
    
    # Only superusers can create other superusers
    if make_superuser and not request.user.is_superuser:
        return Response(
            {'error': 'Only superusers can create other superusers'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user.is_staff = True
    if make_superuser:
        user.is_superuser = True
    user.save()
    
    return Response({
        'message': f'User {user.email} promoted to admin',
        'user': {
            'id': user.id,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        }
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def demote_admin(request, user_id):
    """
    Remove admin privileges from a user
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Prevent self-demotion
    if user.id == request.user.id:
        return Response(
            {'error': 'You cannot demote yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Only superusers can demote other superusers
    if user.is_superuser and not request.user.is_superuser:
        return Response(
            {'error': 'Only superusers can demote other superusers'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user.is_staff = False
    user.is_superuser = False
    user.save()
    
    return Response({
        'message': f'Admin privileges removed from {user.email}',
        'user': {
            'id': user.id,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_user(request, user_id):
    """
    Delete a user (admin only)
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Prevent self-deletion
    if user.id == request.user.id:
        return Response(
            {'error': 'You cannot delete yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Only superusers can delete other admins
    if (user.is_staff or user.is_superuser) and not request.user.is_superuser:
        return Response(
            {'error': 'Only superusers can delete admin users'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = user.email
    user.delete()
    
    return Response({'message': f'User {email} deleted successfully'})