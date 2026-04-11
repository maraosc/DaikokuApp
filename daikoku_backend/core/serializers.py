from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction as db_transaction
from .models import User, Category, Transaction, Goal


class UserRegisterSerializer(serializers.ModelSerializer):
    """Registro de usuario. Maneja la creación con password hasheado."""

    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirmar contraseña")

    class Meta:
        model  = User
        fields = ["id", "username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """Lectura y actualización del perfil (sin password)."""

    class Meta:
        model  = User
        fields = [
            "id", "username", "email",
            "register_date", "last_login",
            "monthly_budget", "full_register",
        ]
        read_only_fields = ["id", "email", "register_date", "last_login"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class CategorySerializer(serializers.ModelSerializer):
    """
    Lectura: devuelve categorías del sistema + las del usuario autenticado.
    Escritura: asigna automáticamente el usuario autenticado como owner.
    """

    is_system = serializers.SerializerMethodField(
        help_text="True si es una categoría predefinida del sistema"
    )

    class Meta:
        model  = Category
        fields = ["id", "category_name", "category_icon", "is_system"]

    def get_is_system(self, obj) -> bool:
        return obj.user_id is None

    def create(self, validated_data):
        # El usuario owner siempre es el autenticado
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

class TransactionSerializer(serializers.ModelSerializer):
    """CRUD completo de transacciones."""

    # Lectura: muestra el nombre de la categoría y tipo en texto legible
    category_name = serializers.CharField(source="category.category_name", read_only=True)
    type_display  = serializers.CharField(source="get_type_display", read_only=True)

    # Escritura: recibe el id de categoría
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        allow_null=True,
        required=False
    )
    goal = serializers.PrimaryKeyRelatedField(
        queryset=Goal.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model  = Transaction
        fields = [
            "id", "type", "type_display",
            "category", "category_name",
            "amount", "description", "date",
            "goal",
        ]
        read_only_fields = ["id", "type_display", "category_name"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        return value

    def validate(self, attrs):
        request = self.context["request"]

        # Verificar que la categoría pertenece al usuario o es del sistema
        category = attrs.get("category")
        if category and category.user and category.user != request.user:
            raise serializers.ValidationError(
                {"category": "Esta categoría no te pertenece."}
            )

        # Verificar que la meta pertenece al usuario
        goal = attrs.get("goal")
        if goal and goal.user != request.user:
            raise serializers.ValidationError(
                {"goal": "Esta meta no te pertenece."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        with db_transaction.atomic():
            instance = super().create(validated_data)
            # Si la transacción está ligada a una meta y es un ingreso, aportar
            if instance.goal and instance.type == Transaction.TransactionType.INCOME:
                instance.goal.add_contribution(instance.amount)
        return instance


class TransactionSummarySerializer(serializers.Serializer):
    """
    Resumen agregado: total de ingresos, gastos y balance
    para un período dado (mes actual por defecto).
    """

    total_income   = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance        = serializers.DecimalField(max_digits=12, decimal_places=2)
    budget_used_pct = serializers.FloatField(
        help_text="Porcentaje del presupuesto mensual consumido (0–100)"
    )

class GoalSerializer(serializers.ModelSerializer):
    """CRUD de metas de ahorro."""

    progress_percentage = serializers.FloatField(read_only=True)
    remaining_amount    = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    state_display = serializers.CharField(source="get_state_display", read_only=True)

    class Meta:
        model  = Goal
        fields = [
            "id", "name",
            "target_amount", "current_amount",
            "creation_date", "deadline",
            "state", "state_display",
            "progress_percentage", "remaining_amount",
        ]
        read_only_fields = [
            "id", "current_amount", "creation_date",
            "state_display", "progress_percentage", "remaining_amount",
        ]

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto objetivo debe ser mayor a 0.")
        return value

    def validate(self, attrs):
        deadline = attrs.get("deadline")
        if deadline:
            from django.utils.timezone import now
            if deadline < now().date():
                raise serializers.ValidationError(
                    {"deadline": "La fecha límite no puede ser en el pasado."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class GoalContributionSerializer(serializers.Serializer):
    """Aporte manual a una meta (sin crear transacción)."""

    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("El aporte debe ser mayor a 0.")
        return value

    def save(self, goal: Goal):
        goal.add_contribution(self.validated_data["amount"])
        return goal