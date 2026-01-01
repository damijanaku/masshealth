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
    path('profile/get-2fa/', views.get_two_factor_auth, name='get_two_factor_auth'),
    path('profile/update-2fa/', views.update_two_factor_auth, name='update_2fa'),
    path('enroll/', views.enroll, name='enroll_image_for_2fa'),
    path('authenticate_2fa/', views.authenticate_2fa, name='authenticate_user_with_2fa'),

    
    path('send-friend-request/<int:userId>/', views.send_friend_request, name="send_friend_request"),
    path('accept-friend-request/<int:requestId>/', views.accept_friend_request, name="accept_friend_request"),
    path('pending-requests/', views.get_pending_requests, name="pending_requests"),
    path('friends-list/', views.get_friends_list, name="friends_list"),
    path('search-users/', views.search_users, name="search_users"),
    path('challenge/<int:friendId>/<int:routineId>/', views.challenge_friend, name='challenge_friend'),
    path('challenge/<int:challengeId>/accept/', views.accept_challenge, name='accept_challenge'),
    path('challenge/<int:challengeId>/decline/', views.decline_challenge, name='decline_challenge'),
    path('challenges/pending/', views.get_pending_challenges, name='get_pending_challenges'),
    path('challenge/<int:challengeId>/routine/', views.get_challenge_routine_detail, name='challenge-routine-detail'),


    path('notifications/token/', views.save_notification_token, name='save-notification-token'),
    path('notifications/token/update/', views.update_notification_token, name='update-notification-token'),
    path('notifications/token/get/', views.get_notification_token, name='get-notification-token'),
    path('notifications/token/delete/', views.delete_notification_token, name='delete-notification-token'),
    
    path('workouts/', views.WorkoutListView.as_view(), name="workout-list"), 
    path('workouts/muscle-group/<str:muscle_group_name>/', 
         views.get_workout_by_muscle_group, name='workout-by-muscle-group'),
    
    path('muscle-groups/', views.get_muscle_groups, name='muscle-groups'),
    
    path('routines/', views.RoutineListView.as_view(), name='routine-list'),
    path('routines/create/', views.RoutineCreateView.as_view(), name='routine-create'),
    path('routines/<int:pk>/', views.RoutineDetailView.as_view(), name='routine-detail'),
    path('routines/<int:pk>/update/', views.RoutineUpdateView.as_view(), name='routine-update'),
    path('routines/<int:pk>/delete/', views.RoutineDeleteView.as_view(), name='routine-delete'),
    path('routines/create-with-workouts/', 
         views.create_routine_with_workouts, name='routine-create-with-workouts'),

     path('routines/<int:routine_id>/workouts/<int:workout_order>/', 
         views.update_routine_workout, name='update-routine-workout'),      
     path('workout-modes/', 
         views.get_workout_modes, name='workout-modes'),

     path('routines/<int:routine_id>/workouts/', 
         views.get_routine_workouts, name='get-routine-workouts'),
     path('routines/<int:routine_id>/workouts/add/', 
         views.add_workout_to_routine, name='add-workout-to-routine'),
     path('routines/<int:routine_id>/workouts/<int:workout_order>/delete/', 
         views.remove_workout_from_routine, name='remove-workout-from-routine'),
]