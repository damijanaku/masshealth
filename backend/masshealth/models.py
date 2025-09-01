from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
import os
import uuid
from PIL import Image


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


class CustomUser(AbstractUser):
    username = None  # remove username
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    friends = models.ManyToManyField("self", blank=True, symmetrical=False)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager() 

    def __str__(self):
        return self.email

class UserMetadata(models.Model):
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

class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        CustomUser, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        CustomUser, related_name="to_user", on_delete=models.CASCADE
    )

class MuscleGroup(models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Routine(models.Model):
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

class Workout(models.Model):
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

class RoutineWorkout(models.Model):
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='routine_workouts')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_routines')
    order = models.PositiveIntegerField(default=0, help_text="Order of workout in routine")
    rest_between_sets = models.PositiveIntegerField(default=60, help_text="Rest time in seconds")
    notes = models.TextField(blank=True, help_text="Specific notes for this workout in this routine")
    
    class Meta:
        ordering = ['routine', 'order']
        unique_together = ['routine', 'workout', 'order']  
    
    def __str__(self):
        return f"{self.routine.name} - {self.workout.name}"
