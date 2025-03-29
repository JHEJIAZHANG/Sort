from django.urls import path
from .views import (
                    RegisterView, 
                    UserProfileView, 
                    GoogleLoginView,
                    LineLoginView
                    )
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Google OAuth
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),

    # LINE OAuth
    path('auth/line/', LineLoginView.as_view(), name='line-login'),
]
