from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    age = models.IntegerField()
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.user.username


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
    dose = models.CharField(max_length=50)
    instructions = models.TextField(blank=True, null=True)
    cycle = models.CharField(max_length=50)
    schedule = models.CharField(max_length=50)
    with_food = models.CharField(max_length=50)
    indication = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.medicine_name
