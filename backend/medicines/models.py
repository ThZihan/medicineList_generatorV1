from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    age = models.IntegerField()
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.user.username


class UserColorPreferences(models.Model):
    """Store user-specific color preferences for medicine timing"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    
    # Palette type: 'default' or 'vibrant'
    palette_type = models.CharField(max_length=20, default='default')
    
    # Base colors
    morning_color = models.CharField(max_length=7, default='#72CB92')  # Teal
    noon_color = models.CharField(max_length=7, default='#D79E63')    # Orange
    night_color = models.CharField(max_length=7, default='#7DA7D7')   # Purple
    
    # Combined colors (can be custom or auto-calculated)
    morning_noon_color = models.CharField(max_length=7, blank=True, null=True)
    morning_night_color = models.CharField(max_length=7, blank=True, null=True)
    noon_night_color = models.CharField(max_length=7, blank=True, null=True)
    all_day_color = models.CharField(max_length=7, blank=True, null=True)
    
    # Track which combined colors are custom (not auto-calculated)
    custom_morning_noon = models.BooleanField(default=False)
    custom_morning_night = models.BooleanField(default=False)
    custom_noon_night = models.BooleanField(default=False)
    custom_all_day = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.palette_type} palette"
    
    class Meta:
        verbose_name = "User Color Preferences"
        verbose_name_plural = "User Color Preferences"


class GlobalMedicine(models.Model):
    medicine_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    indication = models.CharField(max_length=255)

    def __str__(self):
        return self.medicine_name


class UserMedicine(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medicines')
    medicine_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    dose = models.CharField(max_length=50, blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    cycle = models.CharField(max_length=50)
    schedule = models.CharField(max_length=50)
    with_food = models.CharField(max_length=50)
    indication = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.medicine_name
