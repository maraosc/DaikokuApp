from django.shortcuts import render
from django.db.models import Sum, Q
from django.utils import timezone

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

from .models import Category, Goal, Transaction, User
from .serializers import (
    CategorySerializer,
    ChangePasswordSerializer,
    GoalContributionSerializer,
    GoalSerializer,
    TransactionSerializer,
    TransactionSummarySerializer,
    UserProfileSerializer,
    UserRegisterSerializer,
)

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — registro público, no requiere token."""

    queryset           = User.objects.all()
    serializer_class   = UserRegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/auth/profile/ — perfil del usuario autenticado."""

    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """PUT /api/auth/change-password/ — cambio de contraseña."""

    serializer_class   = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña actualizada correctamente."})


class CategoryListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/categories/ — lista categorías del sistema + las propias.
    POST /api/categories/ — crea una categoría personalizada.
    """

    serializer_class   = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Categorías del sistema (user=null) + las del usuario autenticado
        return Category.objects.filter(
            Q(user__isnull=True) | Q(user=self.request.user)
        ).order_by("category_name")


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/categories/<id>/ — solo categorías propias."""

    serializer_class   = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # El usuario solo puede editar/borrar las suyas, no las del sistema
        return Category.objects.filter(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    GET    /api/transactions/          — lista paginada con filtros
    POST   /api/transactions/          — crear transacción
    GET    /api/transactions/<id>/     — detalle
    PATCH  /api/transactions/<id>/     — editar
    DELETE /api/transactions/<id>/     — eliminar
    GET    /api/transactions/summary/  — resumen del mes
    """

    serializer_class   = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related(
            "category", "goal"
        )

        # Filtros opcionales por query params
        tx_type  = self.request.query_params.get("type")       # income | expense
        category = self.request.query_params.get("category")   # id de categoría
        month    = self.request.query_params.get("month")       # YYYY-MM
        goal_id  = self.request.query_params.get("goal")        # id de meta

        if tx_type:
            qs = qs.filter(type=tx_type)
        if category:
            qs = qs.filter(category_id=category)
        if goal_id:
            qs = qs.filter(goal_id=goal_id)
        if month:
            try:
                year, m = month.split("-")
                qs = qs.filter(date__year=int(year), date__month=int(m))
            except (ValueError, AttributeError):
                pass  # ignorar parámetro malformado

        return qs

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Resumen del mes indicado (o mes actual si no se especifica).
        GET /api/transactions/summary/?month=2025-04
        """
        month = request.query_params.get("month")
        try:
            year, m = month.split("-")
            year, m = int(year), int(m)
        except (ValueError, AttributeError, TypeError):
            today = timezone.now().date()
            year, m = today.year, today.month

        qs = Transaction.objects.filter(
            user=request.user,
            date__year=year,
            date__month=m,
        )

        total_income   = qs.filter(type=Transaction.TransactionType.INCOME).aggregate(
            t=Sum("amount")
        )["t"] or 0

        total_expenses = qs.filter(type=Transaction.TransactionType.EXPENSE).aggregate(
            t=Sum("amount")
        )["t"] or 0

        balance = total_income - total_expenses

        # Porcentaje del presupuesto mensual consumido
        budget = request.user.monthly_budget or 0
        budget_used_pct = float(total_expenses / budget * 100) if budget > 0 else 0.0

        data = {
            "total_income":    total_income,
            "total_expenses":  total_expenses,
            "balance":         balance,
            "budget_used_pct": min(budget_used_pct, 100.0),
        }

        serializer = TransactionSummarySerializer(data)
        return Response(serializer.data)


class GoalViewSet(viewsets.ModelViewSet):
    """
    GET    /api/goals/                     — lista de metas
    POST   /api/goals/                     — crear meta
    GET    /api/goals/<id>/                — detalle
    PATCH  /api/goals/<id>/                — editar
    DELETE /api/goals/<id>/                — eliminar
    POST   /api/goals/<id>/contribute/     — aportar a una meta
    """

    serializer_class   = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Goal.objects.filter(user=self.request.user)

        state = self.request.query_params.get("state")  # active | paused | completed | cancelled
        if state:
            qs = qs.filter(state=state)

        return qs

    @action(detail=True, methods=["post"], url_path="contribute")
    def contribute(self, request, pk=None):
        """
        Aporte manual directo a una meta sin generar transacción.
        POST /api/goals/<id>/contribute/  body: { "amount": 500 }
        """
        goal       = self.get_object()
        serializer = GoalContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(goal=goal)

        return Response(
            GoalSerializer(goal, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CompleteOnboardingView(generics.UpdateAPIView):
    """PATCH /api/auth/onboarding/ — guarda presupuesto y marca full_register = True"""

    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.full_register = True
        user.save(update_fields=['full_register'])
        return Response(serializer.data)