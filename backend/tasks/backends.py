print("Custom EmailBackend loaded!")  # To confirm it loads at Django startup

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        identifier = kwargs.get('email') or username
        print(f"[AUTH BACKEND] EmailBackend called with identifier={identifier}, password={password}")
        if identifier is None or password is None:
            print("No identifier or password provided")
            return None
        try:
            user = UserModel.objects.get(**{UserModel.USERNAME_FIELD: identifier})
            print(f"User found: {user.email}, is_active: {user.is_active}")
        except UserModel.DoesNotExist:
            print("User not found in database")
            return None
        if user.check_password(password):
            print("Password correct!")
        else:
            print("Password INCORRECT!")
        if user.check_password(password) and self.user_can_authenticate(user):
            print("User authenticated and active.")
            return user
        print("User authentication failed (wrong password or inactive).")
        return None
