from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
import os
import uuid
from PIL import Image
import threading
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

def validate_image_size(image):
    max_size = 5 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError("Image file too large")

def validate_image_format(image):
    valid_extensions = ['.jpg', '.jpeg', '.png']
    ext = os.path.splitext(image.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError("Invalid image format")
    
def profile_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f'profile_images/user_{instance.user.id}/{filename}'

class SyncToSupabaseMixin(models.Model):
    """Mixin to handle Supabase synchronization"""
    synced_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('synced', 'Synced'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        # Check if we're already using supabase to avoid infinite loop
        using_db = kwargs.get('using', 'default')
        
        # Always save locally first (instant response to mobile app)
        super().save(*args, **kwargs)
        
        # Queue sync to Supabase in background (non-blocking)
        # Only sync if we're saving to default database and sync is enabled
        if using_db == 'default' and getattr(settings, 'SYNC_TO_SUPABASE', True):
            threading.Thread(target=self._sync_to_supabase).start()
    
    def _sync_to_supabase(self):
        """Background sync to Supabase"""
        try:
            # Get a fresh copy from the database to avoid threading issues
            obj_copy = self.__class__.objects.using('default').get(pk=self.pk)
            
            # Prepare data for Supabase (handle relationships)
            obj_dict = {}
            for field in obj_copy._meta.fields:
                if field.name not in ['synced_at', 'sync_status']:
                    value = getattr(obj_copy, field.name)
                    # Handle foreign keys - save the ID, not the object
                    if field.many_to_one or field.one_to_one:
                        value = value.pk if value else None
                    obj_dict[field.name] = value
            
            # Check if record exists in Supabase
            exists_in_supabase = False
            try:
                self.__class__.objects.using('supabase').get(pk=self.pk)
                exists_in_supabase = True
            except:
                pass
            
            if exists_in_supabase:
                # Update existing record
                self.__class__.objects.using('supabase').filter(pk=self.pk).update(**obj_dict)
            else:
                # For create, we need to reconstruct the object with proper foreign keys
                create_dict = {}
                for field in obj_copy._meta.fields:
                    if field.name not in ['synced_at', 'sync_status']:
                        value = getattr(obj_copy, field.name)
                        # For foreign keys, get the related object from supabase
                        if field.many_to_one or field.one_to_one:
                            if value:
                                related_model = field.related_model
                                try:
                                    # Get the related object from supabase database
                                    value = related_model.objects.using('supabase').get(pk=value.pk)
                                except:
                                    # If related object doesn't exist in supabase, skip this record
                                    logger.warning(f"Related object {related_model.__name__} {value.pk} not found in Supabase")
                                    return
                            else:
                                value = None
                        create_dict[field.name] = value
                
                create_dict['id'] = self.pk
                self.__class__.objects.using('supabase').create(**create_dict)
            
        except Exception as e:
            # Mark as failed
            self.__class__.objects.using('default').filter(pk=self.pk).update(
                sync_status='failed'
            )
            logger.error(f"Failed to sync {self.__class__.__name__} {self.pk}: {e}")

    def delete(self, *args, **kwargs):
        """Override delete to sync deletion to Supabase"""
        using_db = kwargs.get('using', 'default')
        
        # Delete from Supabase in background if deleting from default
        if using_db == 'default' and getattr(settings, 'SYNC_TO_SUPABASE', True):
            pk_to_delete = self.pk
            threading.Thread(
                target=lambda: self.__class__.objects.using('supabase').filter(pk=pk_to_delete).delete()
            ).start()
        
        # Delete locally
        super().delete(*args, **kwargs)

# custom manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser, SyncToSupabaseMixin):
    username = None  
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    two_factor_auth = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    friends = models.ManyToManyField("self", blank=True, symmetrical=False)
    embedding = models.JSONField(null=True, blank=True)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager() 

    def __str__(self):
        return self.email
    
    def has_face_embedding(self):
        return self.embedding is not None
    
class ConditionOrInjury(SyncToSupabaseMixin, models.Model):
    key = models.CharField(max_length=50, unique=True) # e.g., 'back_injury'
    label = models.CharField(max_length=100)           # e.g., 'Back Injury'

    def __str__(self):
        return self.label

    class Meta:
        db_table = 'masshealth_condition_or_injury'
        verbose_name = "Condition or Injury"
        verbose_name_plural = "Conditions or Injuries"


class FitnessGoal(SyncToSupabaseMixin, models.Model):
    key = models.CharField(max_length=50, unique=True) # e.g., 'weight_loss'
    label = models.CharField(max_length=100)           # e.g., 'Weight Loss'

    def __str__(self):
        return self.label


class UserMetadata(SyncToSupabaseMixin, models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('', 'Not specified'),
    ]
    FITNESS_EXPERIENCE_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='metadata')
    username = models.CharField(max_length=50, unique=True)  # profile handle
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    height = models.FloatField(null=True, blank=True, help_text="Height in centimeters")
    weight = models.FloatField(null=True, blank=True, help_text="Weight in kilograms")
    fitness_experience = models.CharField(max_length=20, choices=FITNESS_EXPERIENCE_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notification_token = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Push notification token for mobile devices"
    )
    conditions_and_injuries = models.ManyToManyField(
        ConditionOrInjury,
        through='UserCondition',
        related_name='users',
        blank=True
    )

    fitness_goals = models.ManyToManyField(
        FitnessGoal,
        through='UserFitnessGoal',
        related_name='users',
        blank=True
    )


    profile_image = models.ImageField(
        upload_to=profile_image_path,
        null=True,
        blank=True,
        validators=[validate_image_size, validate_image_format],
        help_text="Upload a profile image (max 5MB)"
    )

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_instance = UserMetadata.objects.get(pk=self.pk)
                if old_instance.profile_image and old_instance.profile_image != self.profile_image:
                    if os.path.isfile(old_instance.profile_image.path):
                        os.remove(old_instance.profile_image.path)
            except UserMetadata.DoesNotExist:
                pass
        super().save(*args, **kwargs)

        if self.profile_image:
            self.resize_image()
    
    def resize_image(self):
        if not self.profile_image:
            return

        img = Image.open(self.profile_image.path)

        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        img.thumbnail((400, 400), Image.LANCZOS)
        img.save(self.profile_image.path, 'JPEG', quality=85)


    def __str__(self):
        return f"{self.user.full_name} ({self.user.email})"

    class Meta:
        verbose_name = "User Metadata"
        verbose_name_plural = "User Metadata"

class FriendRequest(SyncToSupabaseMixin, models.Model):
    from_user = models.ForeignKey(
        CustomUser, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        CustomUser, related_name="to_user", on_delete=models.CASCADE
    )

class UserLocation(SyncToSupabaseMixin, models.Model):
    """Store user location updates from MQTT for friend tracking"""
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='locations'
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    logged_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Add accuracy if mobile app provides it
    accuracy = models.FloatField(
        null=True, 
        blank=True,
        help_text="Location accuracy in meters"
    )
    
    class Meta:
        ordering = ['-logged_at']
        indexes = [
            models.Index(fields=['user', '-logged_at']),
            models.Index(fields=['logged_at']),  # For admin dashboard queries
        ]
        verbose_name = "User Location"
        verbose_name_plural = "User Locations"
    
    def __str__(self):
        return f"{self.user.full_name} - {self.logged_at.strftime('%Y-%m-%d %H:%M')}"

class MuscleGroup(SyncToSupabaseMixin, models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Routine(SyncToSupabaseMixin, models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='routines', null=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.get_full_name()}"
    
    class Meta:
        ordering = ['-created_at']

class Challenge(SyncToSupabaseMixin, models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('declined', 'Declined'),
    ]

    from_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='challenges_sent')
    to_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='challenges_received')
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

class Workout(SyncToSupabaseMixin, models.Model):
    EXPERIENCE_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'), 
        ('advanced', 'Advanced'),
    ]
    
    EXERCISE_TYPES = [
        ('strength', 'Strength'),
        ('warmup', 'Warmup'),
        ('smr', 'SMR'),
        ('plyometrics', 'Plyometrics'),
        ('olympic_weightlifting', 'Olympic Weightlifting'),
        ('conditioning', 'Conditioning'),
        ('activation', 'Activation'),  
    ]
    
    EQUIPMENT_REQUIRED = [  
        ('bands', 'Bands'),
        ('barbell', 'Barbell'),
        ('bench', 'Bench'),
        ('bodyweight', 'Bodyweight'),
        ('box', 'Box'),
        ('cable', 'Cable'),
        ('chains', 'Chains'),
        ('dumbbell', 'Dumbbell'), 
        ('ez_bar', 'EZ Bar'),
        ('exercise_ball', 'Exercise Ball'),
        ('foam_roll', 'Foam Roll'),
        ('hip_thruster', 'Hip Thruster'),
        ('jump_rope', 'Jump Rope'),
        ('kettle_bells', 'Kettle Bells'),
        ('lacrosse_ball', 'Lacrosse Ball'),
        ('landmine', 'Landmine'),
        ('machine', 'Machine'),
        ('medicine_ball', 'Medicine Ball'),
        ('other', 'Other'),
        ('sled', 'Sled'),
        ('tiger_tail', 'Tiger Tail'),
        ('trap_bar', 'Trap Bar'),
        ('valslide', 'Valslide'),
    ]
    
    MECHANICS = [
        ('compound', 'Compound'),
        ('isolation', 'Isolation'),
    ]
    
    FORCE_TYPES = [
        ('compression', 'Compression'),
        ('dynamic_stretching', 'Dynamic Stretching'),
        ('hinge_bilateral', 'Hinge (Bilateral)'),
        ('hinge_unilateral', 'Hinge (Unilateral)'),
        ('isometric', 'Isometric'),
        ('press_bilateral', 'Press (Bilateral)'),
        ('pull', 'Pull'),  
        ('pull_bilateral', 'Pull (Bilateral)'),
        ('pull_unilateral', 'Pull (Unilateral)'),
        ('push', 'Push'),
        ('push_bilateral', 'Push (Bilateral)'),
        ('push_unilateral', 'Push (Unilateral)'),
        ('static_stretching', 'Static Stretching'),
    ]
    
    name = models.CharField(max_length=200)
    video_url = models.URLField(max_length=500)
    exercise_type = models.CharField(max_length=30, choices=EXERCISE_TYPES, blank=True)  
    equipment_required = models.CharField(max_length=30, choices=EQUIPMENT_REQUIRED, blank=True)  
    mechanics = models.CharField(max_length=20, choices=MECHANICS, blank=True) 
    force_type = models.CharField(max_length=30, choices=FORCE_TYPES, blank=True) 
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, default='beginner', blank=True)
    muscle_group = models.ForeignKey(MuscleGroup, on_delete=models.CASCADE, related_name='workouts', blank=True)
    duration_minutes = models.PositiveIntegerField(help_text="Duration in minutes", blank=True, null=True)
    sets = models.PositiveIntegerField(default=1, blank=True)
    reps = models.PositiveIntegerField(null=True, blank=True, help_text="Reps per set (optional)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        ordering = ['name']


class RoutineWorkout(SyncToSupabaseMixin, models.Model):
    WORKOUT_MODES = [
        ('reps_sets', 'Reps & Sets'),
        ('timer', 'Timer'),
        ('duration', 'Duration Only'),  
    ]
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='routine_workouts')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_routines')
    order = models.PositiveIntegerField(default=0, help_text="Order of workout in routine")
    
    # Workout execution mode
    workout_mode = models.CharField(
        max_length=20,
        choices=WORKOUT_MODES,
        default='reps_sets',
        help_text="How this workout should be performed"
    )

    custom_sets = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Override workout's default sets"
    )

    custom_reps = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Override workout's default reps per set"
    )

    timer_duration = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        help_text="Timer duration in seconds (for timer mode)"
    )
    
    # Add this missing field
    duration_minutes = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        help_text="Custom duration in minutes (overrides workout default)"
    )

    rest_between_sets = models.PositiveIntegerField(default=60, help_text="Rest time in seconds")
    notes = models.TextField(blank=True, help_text="Specific notes for this workout in this routine")
    
    class Meta:
        ordering = ['routine', 'order']
        unique_together = ['routine', 'workout', 'order']  
    
    def __str__(self):
        return f"{self.routine.name} - {self.workout.name} ({self.get_workout_mode_display()})"
    
    def get_effective_sets(self):
        if self.custom_sets is not None:
            return self.custom_sets
        elif self.workout.sets is not None:
            return self.workout.sets
        else:
            # Sensible defaults based on workout type
            if self.workout.exercise_type == 'strength':
                return 3
            elif self.workout.exercise_type in ['conditioning', 'plyometrics']:
                return 4
            else:
                return 3  # General default

    def get_effective_reps(self):
        if self.custom_reps is not None:
            return self.custom_reps
        elif self.workout.reps is not None:
            return self.workout.reps
        else:
            # Sensible defaults based on workout type
            if self.workout.exercise_type == 'strength':
                return 10
            elif self.workout.exercise_type == 'conditioning':
                return 15
            elif self.workout.exercise_type == 'plyometrics':
                return 8
            else:
                return 12  # General default
    
    def get_effective_duration(self):
        if self.workout_mode == 'timer' and self.timer_duration:
            return self.timer_duration / 60  # Convert seconds to minutes
        elif self.duration_minutes is not None:
            return self.duration_minutes
        elif self.workout.duration_minutes is not None:
            return self.workout.duration_minutes
        else:
            # Sensible defaults based on workout type
            if self.workout.exercise_type in ['warmup', 'smr']:
                return 5
            elif self.workout.exercise_type == 'conditioning':
                return 20
            elif self.workout.exercise_type in ['strength', 'olympic_weightlifting']:
                return 15
            else:
                return 10  # General default
    
    def clean(self):
        if self.workout_mode == 'timer' and not self.timer_duration:
            raise ValidationError({
                'timer_duration': 'Timer duration is required when using timer mode'
            })
            

def sound_file_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f'sounds/{filename}'


class Sound(models.Model):
    """Sound/audio file model for workout soundbites"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to=sound_file_path)
    duration = models.FloatField(default=0, help_text="Duration in seconds")
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        'CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_sounds'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
