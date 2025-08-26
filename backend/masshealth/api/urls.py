from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/upload-image/', views.upload_profile_image, name='upload_profile_image'),
    path('profile/remove-image/', views.remove_profile_image, name='remove_profile_image'),
     path('profile/metadata/', views.get_user_metadata, name='get_user_metadata'),

]