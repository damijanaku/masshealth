from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserMetadata

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


admin.site.register(CustomUser, CustomUserAdmin)