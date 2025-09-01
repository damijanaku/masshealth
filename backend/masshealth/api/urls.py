from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth URLs
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/upload-image/', views.upload_profile_image, name='upload_profile_image'),
    path('profile/remove-image/', views.remove_profile_image, name='remove_profile_image'),
    path('profile/metadata/', views.get_user_metadata, name='get_user_metadata'),
    
    # Friends URLs
    path('send-friend-request/<int:userId>/', views.send_friend_request, name="send_friend_request"),
    path('accept-friend-request/<int:requestId>/', views.accept_friend_request, name="accept_friend_request"),
    path('pending-requests/', views.get_pending_requests, name="pending_requests"),
    path('friends-list/', views.get_friends_list, name="friends_list"),
    path('search-users/', views.search_users, name="search_users"),
    
    # Workout URLs
    path('workouts/', views.WorkoutListView.as_view(), name="workout-list"),  # Fixed: added ()
    path('workouts/muscle-group/<str:muscle_group_name>/', 
         views.get_workout_by_muscle_group, name='workout-by-muscle-group'),
    
    # Muscle Groups URL (ADD THIS)
    path('muscle-groups/', views.get_muscle_groups, name='muscle-groups'),
    
    # Routine URLs
    path('routines/', views.RoutineListView.as_view(), name='routine-list'),
    path('routines/create/', views.RoutineCreateView.as_view(), name='routine-create'),
    path('routines/<int:pk>/', views.RoutineDetailView.as_view(), name='routine-detail'),
    path('routines/<int:pk>/update/', views.RoutineUpdateView.as_view(), name='routine-update'),
    path('routines/<int:pk>/delete/', views.RoutineDeleteView.as_view(), name='routine-delete'),
    path('routines/create-with-workouts/', 
         views.create_routine_with_workouts, name='routine-create-with-workouts'),
]