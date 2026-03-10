from django.contrib import admin
from .models import Patient, GlobalMedicine, UserMedicine


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'email')
    list_filter = ('age',)
    search_fields = ('user__username', 'email')


@admin.register(GlobalMedicine)
class GlobalMedicineAdmin(admin.ModelAdmin):
    list_display = ('medicine_name', 'generic_name', 'indication')
    list_filter = ('indication',)
    search_fields = ('medicine_name', 'generic_name', 'indication')


@admin.register(UserMedicine)
class UserMedicineAdmin(admin.ModelAdmin):
    list_display = ('medicine_name', 'generic_name', 'dose', 'cycle', 'schedule', 'with_food', 'indication', 'patient')
    list_filter = ('cycle', 'schedule', 'with_food', 'patient')
    search_fields = ('medicine_name', 'generic_name', 'indication')
    ordering = ('patient', 'medicine_name')
