from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .views import CustomTokenObtainPairView


router = DefaultRouter()
router.register(r"transactions", views.TransactionViewSet,
                basename="transaction")
router.register(r"goals",        views.GoalViewSet,        basename="goal")
router.register(r"budgets",      views.BudgetViewSet,      basename="budget")

urlpatterns = [

    # --- Autenticación JWT ---
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/refresh/",        TokenRefreshView.as_view(),
         name="token_refresh"),
    path("auth/register/",       views.RegisterView.as_view(),   name="register"),
    path("auth/profile/",        views.ProfileView.as_view(),    name="profile"),
    path("auth/change-password/",
         views.ChangePasswordView.as_view(), name="change_password"),
    path("auth/onboarding/", views.CompleteOnboardingView.as_view(), name="onboarding"),
    # --- Categorías ---
    path("categories/",          views.CategoryListCreateView.as_view(),
         name="category_list"),
    path("categories/<int:pk>/", views.CategoryDetailView.as_view(),
         name="category_detail"),
    path("auth/google/", views.GoogleLoginView.as_view(), name="google_login"),

    # --- Transacciones y Metas (via router) ---
    path("", include(router.urls)),
]
