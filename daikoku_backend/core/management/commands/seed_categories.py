from django.core.management.base import BaseCommand
from core.models import Category


SYSTEM_CATEGORIES = [
    {"category_name": "Alimentación",       "category_icon": "restaurant"},
    {"category_name": "Transporte",         "category_icon": "car"},
    {"category_name": "Vivienda",           "category_icon": "home"},
    {"category_name": "Salud",              "category_icon": "medical"},
    {"category_name": "Educación",          "category_icon": "school"},
    {"category_name": "Entretenimiento",    "category_icon": "game-controller"},
    {"category_name": "Ropa y calzado",     "category_icon": "shirt"},
    {"category_name": "Tecnología",         "category_icon": "laptop"},
    {"category_name": "Viajes",             "category_icon": "airplane"},
    {"category_name": "Deporte",            "category_icon": "fitness"},
    {"category_name": "Mascotas",           "category_icon": "paw"},
    {"category_name": "Ahorro",             "category_icon": "wallet"},
    {"category_name": "Inversiones",        "category_icon": "trending-up"},
    {"category_name": "Sueldo",             "category_icon": "cash"},
    {"category_name": "Freelance",          "category_icon": "briefcase"},
    {"category_name": "Otros ingresos",     "category_icon": "add-circle"},
    {"category_name": "Otros gastos",       "category_icon": "ellipsis-horizontal"},
]


class Command(BaseCommand):
    help = "Carga las categorías del sistema (predefinidas para todos los usuarios)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Elimina todas las categorías del sistema antes de insertar",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            deleted, _ = Category.objects.filter(user__isnull=True).delete()
            self.stdout.write(self.style.WARNING(f"  {deleted} categorías del sistema eliminadas."))

        created_count = 0
        skipped_count = 0

        for cat in SYSTEM_CATEGORIES:
            obj, created = Category.objects.get_or_create(
                category_name=cat["category_name"],
                user=None,
                defaults={"category_icon": cat["category_icon"]},
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✓ {obj.category_name}")
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nListo. {created_count} categorías creadas, {skipped_count} ya existían."
            )
        )