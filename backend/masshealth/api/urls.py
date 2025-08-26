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
    path('send-friend-request/<int:userId>/', views.send_friend_request, name="send_friend_request"),
    path('accept-friend-request/<int:requestId>/', views.accept_friend_request, name="accept_friend_request"),
    path('pending-requests/', views.get_pending_requests, name="pending_requests"),
    path('friends-list/', views.get_friends_list, name="friends_list"),
    path('search-users/', views.search_users, name="search_users"),
]