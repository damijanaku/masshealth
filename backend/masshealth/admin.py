from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, MuscleGroup, Routine, UserMetadata, Workout, RoutineWorkout

class UserMetadataInline(admin.StackedInline):
    model = UserMetadata
    can_delete = False
    verbose_name_plural = 'User Metadata'

class CustomUserAdmin(UserAdmin):
    inlines = (UserMetadataInline,)
    list_display = ('email', 'full_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('email', 'full_name')
    ordering = ('email',)

@admin.register(UserMetadata)
class UserMetadataAdmin(admin.ModelAdmin):
    list_display = ('username', 'user_email', 'age', 'gender', 'fitness_experience')
    list_filter = ('gender', 'fitness_experience', 'created_at')
    search_fields = ('username', 'user__email')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

@admin.register(MuscleGroup)
class MuscleGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
    ordering = ['name']

@admin.register(Routine)
class RoutineAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'user__email', 'user__full_name']
    ordering = ['-created_at']

# Inline admin for RoutineWorkout to show workouts within a routine
class RoutineWorkoutInline(admin.TabularInline):
    model = RoutineWorkout
    extra = 0
    fields = ['workout', 'order', 'rest_between_sets', 'notes']
    ordering = ['order']

@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'muscle_group', 
        'exercise_type', 
        'experience_level', 
        'equipment_required',
        'created_at'
    ]
    list_filter = [
        'muscle_group', 
        'exercise_type', 
        'experience_level', 
        'equipment_required',
        'mechanics',
        'created_at'
    ]
    search_fields = ['name', 'muscle_group__name']
    ordering = ['name']
    
    # Show related fields
    readonly_fields = ['created_at']
    
    # Group fields for better organization
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'video_url', 'muscle_group')
        }),
        ('Exercise Details', {
            'fields': ('exercise_type', 'equipment_required', 'mechanics', 'force_type', 'experience_level')
        }),
        ('Workout Parameters', {
            'fields': ('duration_minutes', 'sets', 'reps')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

# Enhanced Routine Admin with workout inline
class EnhancedRoutineAdmin(RoutineAdmin):
    inlines = [RoutineWorkoutInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('routine_workouts__workout')

@admin.register(RoutineWorkout)
class RoutineWorkoutAdmin(admin.ModelAdmin):
    list_display = ['routine_name', 'workout_name', 'order', 'rest_between_sets']
    list_filter = ['routine__user', 'routine__created_at']
    search_fields = ['routine__name', 'workout__name']
    ordering = ['routine', 'order']
    
    def routine_name(self, obj):
        return obj.routine.name
    routine_name.short_description = 'Routine'
    
    def workout_name(self, obj):
        return obj.workout.name
    workout_name.short_description = 'Workout'

# Register the enhanced admin
admin.site.unregister(Routine)  # Unregister the basic one first
admin.site.register(Routine, EnhancedRoutineAdmin)
admin.site.register(CustomUser, CustomUserAdmin)