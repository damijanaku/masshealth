# api/admin_views.py
# Admin-only API endpoints

from rest_framework import status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate

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
def dashboard_stats(request):
    """
    Get dashboard statistics
    """
    from ..models import Workout, Routine
    
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    
    # Basic counts
    total_users = CustomUser.objects.count()
    total_workouts = Workout.objects.count()
    total_routines = Routine.objects.count()
    
    # Active today (users who logged in today)
    active_today = CustomUser.objects.filter(last_login__date=today).count()
    
    # New users this week
    new_users_week = CustomUser.objects.filter(created_at__gte=week_ago).count()
    
    # Weekly chart data - users registered per day
    weekly_user_data = (
        CustomUser.objects
        .filter(created_at__gte=week_ago)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    
    # Weekly chart data - routines created per day
    weekly_routine_data = (
        Routine.objects
        .filter(created_at__gte=week_ago)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    
    # Build chart data for the last 7 days
    chart_data = []
    for i in range(7):
        day = (now - timedelta(days=6-i)).date()
        day_name = day.strftime('%a')
        
        users_count = next(
            (item['count'] for item in weekly_user_data if item['date'] == day), 0
        )
        routines_count = next(
            (item['count'] for item in weekly_routine_data if item['date'] == day), 0
        )
        
        chart_data.append({
            'name': day_name,
            'date': day.isoformat(),
            'users': users_count,
            'routines': routines_count,
        })
    
    # Recent users
    recent_users = CustomUser.objects.order_by('-created_at')[:5]
    recent_users_data = [{
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'created_at': user.created_at,
        'last_login': user.last_login,
    } for user in recent_users]
    
    return Response({
        'stats': {
            'total_users': total_users,
            'active_today': active_today,
            'total_workouts': total_workouts,
            'total_routines': total_routines,
            'new_users_week': new_users_week,
        },
        'chart_data': chart_data,
        'recent_users': recent_users_data,
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


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_user(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if (user.is_staff or user.is_superuser) and not request.user.is_superuser:
        return Response({'error': 'Only superusers can edit admin users'}, status=status.HTTP_403_FORBIDDEN)
    
    full_name = request.data.get('full_name')
    is_active = request.data.get('is_active')
    is_staff = request.data.get('is_staff')
    is_superuser = request.data.get('is_superuser')
    password = request.data.get('password')
    
    if full_name is not None:
        user.full_name = full_name
    if is_active is not None:
        user.is_active = is_active
    if is_staff is not None:
        if is_staff and not request.user.is_superuser and not request.user.is_staff:
            return Response({'error': 'Only admins can promote to admin'}, status=status.HTTP_403_FORBIDDEN)
        user.is_staff = is_staff
    if is_superuser is not None:
        if is_superuser and not request.user.is_superuser:
            return Response({'error': 'Only superusers can promote to superuser'}, status=status.HTTP_403_FORBIDDEN)
        user.is_superuser = is_superuser
    if password:
        user.set_password(password)
    
    user.save()
    
    return Response({
        'message': f'User {user.email} updated',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def send_password_reset(request, user_id):
    from django.core.mail import send_mail
    from django.conf import settings
    import secrets
    
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    token = secrets.token_urlsafe(32)
    
    try:
        send_mail(
            'Password Reset Request',
            f'Click here to reset your password: {settings.FRONTEND_URL}/reset-password?token={token}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return Response({'message': f'Password reset email sent to {user.email}'})
    except Exception as e:
        return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_sounds(request):
    from ..models import Sound
    
    sounds = Sound.objects.all()
    data = [{
        'id': str(sound.id),
        'name': sound.name,
        'file_url': request.build_absolute_uri(sound.file.url) if sound.file else None,
        'duration': sound.duration,
        'created_at': sound.created_at,
    } for sound in sounds]
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_sound(request):
    from ..models import Sound
    from django.conf import settings
    import subprocess
    import tempfile
    import os
    import mutagen
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    name = request.data.get('name', file.name)
    block_size_n = int(request.data.get('block_size_n', 1024))
    discard_m = int(request.data.get('discard_m', 100))
    
    if discard_m >= block_size_n:
        return Response({'error': 'M must be less than N'}, status=status.HTTP_400_BAD_REQUEST)
    
    sound = Sound.objects.create(
        name=name,
        file=file,
        uploaded_by=request.user
    )
    
    compression_stats = {
        'compressed': False,
        'original_size': 0,
        'compressed_size': 0,
        'ratio': 0,
        'savings_percent': 0,
        'error': None
    }
    
    try:
        original_path = sound.file.path
        compression_stats['original_size'] = os.path.getsize(original_path)
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
            tmp_wav_path = tmp_wav.name
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_out:
            tmp_out_path = tmp_out.name
        
        ffmpeg_ok = False
        try:
            subprocess.run([
                'ffmpeg', '-y', '-i', original_path, 
                '-ar', '44100', '-ac', '2', tmp_wav_path
            ], check=True, capture_output=True)
            ffmpeg_ok = True
        except FileNotFoundError:
            compression_stats['error'] = 'ffmpeg not found'
            tmp_wav_path = original_path
        except subprocess.CalledProcessError as e:
            compression_stats['error'] = f'ffmpeg failed: {e.stderr.decode()[:100]}'
            tmp_wav_path = original_path
        
        mdct_path = getattr(settings, 'MDCT_COMPRESSOR_PATH', None)
        if mdct_path and os.path.exists(mdct_path):
            try:
                # Use absolute paths for Windows compatibility
                abs_input = os.path.abspath(tmp_wav_path)
                abs_output = os.path.abspath(tmp_out_path)
                
                print(f"MDCT running: {mdct_path} {abs_input} {abs_output} {block_size_n} {discard_m}")
                
                result = subprocess.run([
                    mdct_path, abs_input, abs_output, 
                    str(block_size_n), str(discard_m)
                ], capture_output=True, timeout=600, cwd=os.path.dirname(mdct_path))
                
                stdout = result.stdout.decode('utf-8', errors='replace') if result.stdout else ''
                stderr = result.stderr.decode('utf-8', errors='replace') if result.stderr else ''
                
                print(f"MDCT returncode: {result.returncode}")
                print(f"MDCT stdout: {stdout}")
                print(f"MDCT stderr: {stderr}")
                
                if result.returncode != 0:
                    compression_stats['error'] = f'MDCT exit {result.returncode}: {stderr or stdout or "no output"}'[:200]
                elif os.path.exists(tmp_out_path) and os.path.getsize(tmp_out_path) > 0:
                    compressed_dir = os.path.join(settings.MEDIA_ROOT, 'sounds', 'compressed')
                    os.makedirs(compressed_dir, exist_ok=True)
                    compressed_path = os.path.join(compressed_dir, f"{sound.id}.wav")
                    os.rename(tmp_out_path, compressed_path)
                    
                    sound.file.name = f"sounds/compressed/{sound.id}.wav"
                    sound.save()
                    
                    compression_stats['compressed'] = True
                    compression_stats['compressed_size'] = os.path.getsize(compressed_path)
                    if compression_stats['original_size'] > 0:
                        compression_stats['ratio'] = round(compression_stats['original_size'] / compression_stats['compressed_size'], 2)
                        compression_stats['savings_percent'] = round(100 * (compression_stats['original_size'] - compression_stats['compressed_size']) / compression_stats['original_size'], 1)
                else:
                    compression_stats['error'] = 'MDCT produced empty output'
                    
            except subprocess.CalledProcessError as e:
                err_msg = e.stderr if e.stderr else (e.stdout if e.stdout else 'no output')
                compression_stats['error'] = f'MDCT failed: {err_msg[:200]}'
                print(f"MDCT CalledProcessError: {err_msg}")
            except Exception as e:
                compression_stats['error'] = f'MDCT error: {str(e)[:100]}'
        else:
            compression_stats['error'] = 'MDCT compressor not configured'
        
        if tmp_wav_path != original_path and os.path.exists(tmp_wav_path):
            os.unlink(tmp_wav_path)
        if os.path.exists(tmp_out_path):
            os.unlink(tmp_out_path)
            
    except Exception as e:
        compression_stats['error'] = f'Pipeline error: {str(e)[:100]}'
    
    try:
        audio = mutagen.File(sound.file.path)
        if audio and hasattr(audio, 'info') and hasattr(audio.info, 'length'):
            sound.duration = audio.info.length
            sound.save()
    except Exception as e:
        print(f"Could not get audio duration: {e}")
    
    return Response({
        'id': str(sound.id),
        'name': sound.name,
        'file_url': request.build_absolute_uri(sound.file.url),
        'duration': sound.duration,
        'created_at': sound.created_at,
        'compression': compression_stats
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_sound(request, sound_id):
    """
    Delete a sound
    """
    from ..models import Sound
    
    try:
        sound = Sound.objects.get(id=sound_id)
    except Sound.DoesNotExist:
        return Response({'error': 'Sound not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Delete the file from storage
    if sound.file:
        sound.file.delete(save=False)
    
    sound.delete()
    
    return Response({'message': 'Sound deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_exercises(request):
    from ..models import Workout, MuscleGroup
    
    exercises = request.data.get('exercises', [])
    if not exercises:
        return Response({'error': 'No exercises provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    created = 0
    updated = 0
    skipped = 0
    errors = []
    
    for ex in exercises:
        try:
            name = ex.get('name')
            if not name:
                errors.append('Exercise missing name')
                continue
            
            overwrite = ex.get('overwrite', False)
            existing = Workout.objects.filter(name__iexact=name).first()
            
            if existing and not overwrite:
                skipped += 1
                continue
            
            muscle_group = None
            mg_name = ex.get('primary_muscle') or ex.get('muscle_group')
            if isinstance(mg_name, dict):
                mg_name = mg_name.get('name')
            if not mg_name and ex.get('primary_muscles'):
                mg_name = ex.get('primary_muscles')[0] if ex.get('primary_muscles') else None
            if mg_name:
                mg_name = mg_name.strip().title()
                muscle_group, _ = MuscleGroup.objects.get_or_create(name=mg_name)
            
            video_url = ''
            video_urls = ex.get('video_urls')
            if video_urls:
                if isinstance(video_urls, dict):
                    video_url = video_urls.get('front') or video_urls.get('side') or ''
                elif isinstance(video_urls, str):
                    video_url = video_urls
            if not video_url:
                video_url = ex.get('video_url', '')
            
            equipment = ex.get('equipment') or ex.get('equipment_required') or ''
            if equipment:
                equipment = equipment.lower().replace(' ', '_').replace('-', '_')
            
            exp_level = ex.get('experience_level', 'beginner')
            if exp_level:
                exp_level = exp_level.lower()
            
            exercise_type = ex.get('exercise_type', 'strength')
            if exercise_type:
                exercise_type = exercise_type.lower().replace(' ', '_')
            
            mechanics = ex.get('mechanics_type') or ex.get('mechanics') or ''
            if mechanics:
                mechanics = mechanics.lower()
            
            force_type = ex.get('force_type', '')
            if force_type:
                force_type = force_type.lower().replace(' ', '_')
            
            defaults = {
                'muscle_group': muscle_group,
                'exercise_type': exercise_type,
                'equipment_required': equipment,
                'experience_level': exp_level,
                'video_url': video_url,
                'mechanics': mechanics,
                'force_type': force_type,
            }
            
            if existing and overwrite:
                for key, value in defaults.items():
                    if value:
                        setattr(existing, key, value)
                existing.save()
                updated += 1
            else:
                Workout.objects.create(name=name, **defaults)
                created += 1
                
        except Exception as e:
            errors.append(f"Error importing {ex.get('name', 'unknown')}: {str(e)}")
    
    return Response({
        'message': f'Import complete: {created} created, {updated} updated, {skipped} skipped',
        'created': created,
        'updated': updated,
        'skipped': skipped,
        'errors': errors
    })