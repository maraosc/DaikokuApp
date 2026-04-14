from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):

    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Usuario personalizado. Hereda AbstractBaseUser para tener control total
    sobre el modelo (en lugar de extender el User por defecto de Django).
    """

    username        = models.CharField(max_length=150, unique=True)
    email           = models.EmailField(unique=True)

    register_date   = models.DateField(default=timezone.now)
    last_login      = models.DateTimeField(null=True, blank=True)

    monthly_budget  = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        help_text="Presupuesto mensual del usuario"
    )
    full_register   = models.BooleanField(
        default=False,
        help_text="True cuando el usuario completó el onboarding"
    )

    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD  = "email"          # login con email
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.username} <{self.email}>"


class Category(models.Model):
    """
    Categorías de transacciones.
    Si user es null → categoría del sistema (predefinida para todos).
    Si user tiene valor → categoría personalizada de ese usuario.
    """

    category_name = models.CharField(max_length=100)
    category_icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="Nombre del ícono o URL (ej: 'food', 'transport')"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_categories",
        help_text="Dejar en null para categorías predefinidas del sistema"
    )

    class Meta:
        db_table = "categories"
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category_name"],
                condition=models.Q(user__isnull=False),
                name="unique_category_per_user"
            )
        ]

    def __str__(self):
        owner = self.user.username if self.user else "sistema"
        return f"{self.category_name} ({owner})"


class Transaction(models.Model):

    class TransactionType(models.TextChoices):
        INCOME  = "income",  "Ingreso"
        EXPENSE = "expense", "Gasto"

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    type        = models.CharField(max_length=10, choices=TransactionType.choices)
    category    = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions"
    )
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    date        = models.DateField(default=timezone.now)

    goal        = models.ForeignKey(
        "Goal",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contributions",
        help_text="Si este gasto/ingreso es un aporte a una meta"
    )

    class Meta:
        db_table = "transactions"
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.get_type_display()} ${self.amount} – {self.user.username} ({self.date})"


class Goal(models.Model):

    class GoalState(models.TextChoices):
        ACTIVE    = "active",    "Activa"
        PAUSED    = "paused",    "Pausada"
        COMPLETED = "completed", "Completada"
        CANCELLED = "cancelled", "Cancelada"

    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    name           = models.CharField(max_length=200)
    target_amount  = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    creation_date = models.DateField(default=timezone.localdate)
    deadline       = models.DateField(
        null=True, blank=True,
        help_text="Fecha límite opcional para la meta"
    )
    state          = models.CharField(
        max_length=10,
        choices=GoalState.choices,
        default=GoalState.ACTIVE
    )

    class Meta:
        db_table = "goals"
        verbose_name = "Meta"
        verbose_name_plural = "Metas"
        ordering = ["-creation_date"]


    @property
    def progress_percentage(self) -> float:
        """Retorna el porcentaje de avance (0–100)."""
        if self.target_amount <= 0:
            return 0.0
        pct = float(self.current_amount / self.target_amount * 100)
        return min(pct, 100.0)

    @property
    def remaining_amount(self):
        return max(self.target_amount - self.current_amount, 0)

    def add_contribution(self, amount):
        """
        Suma un aporte a current_amount y marca como completada
        si se alcanzó el objetivo.
        """
        self.current_amount += amount
        if self.current_amount >= self.target_amount:
            self.state = self.GoalState.COMPLETED
        self.save(update_fields=["current_amount", "state"])

    def __str__(self):
        return f"{self.name} – {self.user.username} ({self.progress_percentage:.0f}%)"