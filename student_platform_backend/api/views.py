from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CustomUser
from .serializers import RegisterSerializer, UserProfileSerializer
from google.oauth2 import id_token
from google.auth.transport import requests
from django.shortcuts import redirect
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
import requests as http_requests
from django.conf import settings
from rest_framework import status



class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class GoogleLoginView(APIView):
    def post(self, request):
        token = request.data.get("token")
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            "448182731678-g7b3qs9t2fldltht51ih0rejra9r4gl6.apps.googleusercontent.com"
        )
        email = idinfo["email"]
        username = idinfo.get("name", email)

        user, _ = CustomUser.objects.get_or_create(email=email, defaults={"username": username})
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })



class LineLoginView(APIView):
    def post(self, request):
        code = request.data.get("code")
        redirect_uri = request.data.get("redirect_uri")  # 前端傳過來

        if not code or not redirect_uri:
            return Response({"error": "Missing code or redirect_uri"}, status=status.HTTP_400_BAD_REQUEST)

        # 換 access token
        token_url = "https://api.line.me/oauth2/v2.1/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.LINE_CHANNEL_ID,
            "client_secret": settings.LINE_CHANNEL_SECRET,
        }

        token_res = http_requests.post(token_url, headers=headers, data=data)
        if token_res.status_code != 200:
            return Response({"error": "Failed to get access token"}, status=status.HTTP_400_BAD_REQUEST)

        access_token = token_res.json().get("access_token")

        # 用 access token 取得用戶資訊
        profile_res = http_requests.get(
            "https://api.line.me/v2/profile",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if profile_res.status_code != 200:
            return Response({"error": "Failed to get profile"}, status=status.HTTP_400_BAD_REQUEST)

        profile = profile_res.json()
        user_id = profile.get("userId")
        display_name = profile.get("displayName")

        if not user_id:
            return Response({"error": "Invalid LINE profile"}, status=status.HTTP_400_BAD_REQUEST)

        email = f"{user_id}@line.user"  # 模擬 email（LINE 不提供）
        user, _ = CustomUser.objects.get_or_create(email=email, defaults={"username": display_name})

        # JWT token
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })
