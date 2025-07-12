from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from .serializers import EmailTokenObtainPairSerializer

User = get_user_model()

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    def validate(self, attrs):
        print("Custom EmailTokenObtainPairSerializer called! auth views")  # Debugging: watch for this! 

        email = attrs.get("email")
        password = attrs.get("password")
        user = None
        print(f"[AUTH BACKEND] EmailBackend called with email={email}, password={password}")
        if email and password:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if user is None:
            raise serializers.ValidationError("No active account found with the given credentials")

        data = super().validate({"username": user.username, "password": password})
        return data