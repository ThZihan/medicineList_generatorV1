from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.conf import settings
import os
import json
from .models import Patient, UserMedicine


@csrf_exempt
@ensure_csrf_cookie
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('patient_id')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=401)
        
        # Log user in
        login(request, user)
        
        # Get patient info
        try:
            patient = Patient.objects.get(user=user)
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'patient_id': patient.user.username,
                'name': patient.user.get_full_name() or patient.user.username
            }, status=200)
        except Patient.DoesNotExist:
            # User exists but no patient record - create one
            patient = Patient.objects.create(user=user)
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'patient_id': patient.user.username,
                'name': patient.user.get_full_name() or patient.user.username
            }, status=200)

    return redirect('/index/')


@csrf_exempt
@ensure_csrf_cookie
def register_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        age = request.POST.get('age')
        email = request.POST.get('email', '')
        username = request.POST.get('patient_id')
        password = request.POST.get('password')

        if not name or not age or not username or not password:
            return JsonResponse({
                'success': False,
                'message': 'Missing required fields'
            }, status=400)

        try:
            age = int(age)
        except ValueError:
            return JsonResponse({
                'success': False,
                'message': 'Age must be a number'
            }, status=400)

        # Check if username already exists
        from django.contrib.auth.models import User
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists'
            }, status=400)

        # Create Django User
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
            email=email
        )
        
        # Create Patient record
        patient = Patient.objects.create(
            user=user,
            age=age,
            email=email
        )

        return JsonResponse({
            'success': True,
            'message': 'Registration successful',
            'patient_id': patient.user.username,
            'name': patient.user.get_full_name() or patient.user.username
        }, status=201)

    return JsonResponse({
        'success': False,
        'message': 'Only POST method allowed'
    }, status=405)


@csrf_exempt
@login_required
def logout_view(request):
    """
    Logout the current user and clear session.
    
    SECURITY: Uses @csrf_exempt because the frontend fetch API
    doesn't automatically include CSRF tokens. The session cookie
    provides sufficient authentication for logout.
    """
    django_logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully'
    }, status=200)


@login_required
def get_patient_profile(request):
    """
    Get patient profile information (name and age).
    GET /api/patient/profile/
    
    Returns:
    {
        "success": true,
        "name": "Patient Full Name",
        "age": 30
    }
    """
    if request.method != 'GET':
        return JsonResponse({
            'success': False,
            'message': 'Only GET method allowed'
        }, status=405)
    
    try:
        patient = Patient.objects.get(user=request.user)
        name = patient.user.get_full_name() or patient.user.username
        
        return JsonResponse({
            'success': True,
            'name': name,
            'age': patient.age
        }, status=200)
    except Patient.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error fetching patient profile: {str(e)}'
        }, status=500)


@login_required
def update_patient_profile(request):
    """
    Update patient profile information (name and age).
    POST /api/patient/profile/update/
    
    Expected JSON payload:
    {
        "name": "New Patient Name",
        "age": 31
    }
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Only POST method allowed'
        }, status=405)
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if 'name' not in data or not data['name']:
            return JsonResponse({
                'success': False,
                'message': 'Name is required'
            }, status=400)
        
        if 'age' not in data or data['age'] is None:
            return JsonResponse({
                'success': False,
                'message': 'Age is required'
            }, status=400)
        
        try:
            age = int(data['age'])
            if age < 0 or age > 150:
                return JsonResponse({
                    'success': False,
                    'message': 'Age must be between 0 and 150'
                }, status=400)
        except ValueError:
            return JsonResponse({
                'success': False,
                'message': 'Age must be a valid number'
            }, status=400)
        
        # Get patient record
        patient = Patient.objects.get(user=request.user)
        
        # Update user's name
        name_parts = data['name'].split(maxsplit=1)
        patient.user.first_name = name_parts[0]
        patient.user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        patient.user.save()
        
        # Update patient's age
        patient.age = age
        patient.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'name': data['name'],
            'age': age
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Patient.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error updating patient profile: {str(e)}'
        }, status=500)


# Serve HTML pages
@require_http_methods(["GET"])
def serve_login_page(request):
    """Serve the login page"""
    return render(request, 'login.html')


@require_http_methods(["GET"])
@login_required
def serve_index_page(request):
    """Serve the index page"""
    # Get patient info
    try:
        patient = Patient.objects.get(user=request.user)
        return render(request, 'index.html', {'patient': patient})
    except Patient.DoesNotExist:
        return render(request, 'index.html')


# Serve static files
@require_http_methods(["GET"])
def serve_static_file(request, filename):
    """Serve static files from the medicineList_generator directory"""
    import mimetypes
    from django.http import HttpResponse, Http404
    
    file_path = os.path.join(settings.BASE_DIR.parent, 'medicineList_generator', filename)
    
    if not os.path.exists(file_path):
        raise Http404(f"File not found: {filename}")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # Read and return the file
    with open(file_path, 'rb') as f:
        content = f.read()
    
    return HttpResponse(content, content_type=content_type)


# ===================================
# USER MEDICINE CRUD API VIEWS
# ===================================

@login_required
def get_user_medicines(request):
    """
    Fetch all medicines for the logged-in user.
    GET /api/medicines/
    
    SECURITY: Only returns medicines belonging to request.user.patient
    """
    if request.method != 'GET':
        return JsonResponse({
            'success': False,
            'message': 'Only GET method allowed'
        }, status=405)
    
    try:
        # Get the patient record for the logged-in user
        # This ensures we only access data for the authenticated user
        patient = Patient.objects.get(user=request.user)
        
        # Fetch all medicines for this patient only
        # The filter ensures we cannot access another user's medicines
        medicines = UserMedicine.objects.filter(patient=patient)
        
        # Convert to list of dictionaries
        medicines_data = []
        for med in medicines:
            medicines_data.append({
                'id': med.id,
                'medicine_name': med.medicine_name,
                'generic_name': med.generic_name,
                'dose': med.dose,
                'instructions': med.instructions,
                'cycle': med.cycle,
                'schedule': med.schedule,
                'with_food': med.with_food,
                'indication': med.indication
            })
        
        return JsonResponse({
            'success': True,
            'medicines': medicines_data,
            'count': len(medicines_data)
        }, status=200)
        
    except Patient.DoesNotExist:
        # Patient record doesn't exist for this user
        # This is a 404, not 403, because the user is authenticated
        # but has no patient record
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error fetching medicines: {str(e)}'
        }, status=500)


@login_required
def add_user_medicine(request):
    """
    Add a new medicine for the logged-in user.
    POST /api/medicines/
    
    Expected JSON payload:
    {
        "medicine_name": "Medicine Name",
        "generic_name": "Generic Name",
        "dose": "50mg",
        "instructions": "Instructions",
        "cycle": "Daily",
        "schedule": "1-0-0",
        "with_food": "BEFORE FOOD",
        "indication": "Used For"
    }
    
    SECURITY: Only creates medicines for request.user.patient
    Cannot create medicines for another user even if patient_id is provided
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Only POST method allowed'
        }, status=405)
    
    try:
        # Parse JSON request body
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['medicine_name', 'dose', 'cycle', 'schedule', 'with_food']
        for field in required_fields:
            if field not in data or not data[field]:
                return JsonResponse({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }, status=400)
        
        # SECURITY: Get the patient record for the logged-in user only
        # This ensures we can only create medicines for the authenticated user
        # Even if client sends a patient_id in the payload, we ignore it
        # and use request.user.patient instead
        patient = Patient.objects.get(user=request.user)
        
        # Create new UserMedicine record
        # The patient field is set from request.user, not from the request body
        # This prevents creating medicines for another user
        medicine = UserMedicine.objects.create(
            patient=patient,  # Set from authenticated user, not from request
            medicine_name=data['medicine_name'],
            generic_name=data.get('generic_name', ''),
            dose=data['dose'],
            instructions=data.get('instructions', ''),
            cycle=data['cycle'],
            schedule=data['schedule'],
            with_food=data['with_food'],
            indication=data.get('indication', '')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Medicine added successfully',
            'medicine': {
                'id': medicine.id,
                'medicine_name': medicine.medicine_name,
                'generic_name': medicine.generic_name,
                'dose': medicine.dose,
                'instructions': medicine.instructions,
                'cycle': medicine.cycle,
                'schedule': medicine.schedule,
                'with_food': medicine.with_food,
                'indication': medicine.indication
            }
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Patient.DoesNotExist:
        # Patient record doesn't exist for this user
        # This is a 404, not 403, because the user is authenticated
        # but has no patient record
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error adding medicine: {str(e)}'
        }, status=500)


@login_required
def delete_user_medicine(request, medicine_id):
    """
    Delete a medicine owned by the logged-in user.
    DELETE /api/medicines/<id>/
    
    SECURITY: Only deletes medicines belonging to request.user.patient
    Returns 403 if attempting to delete another user's medicine
    """
    if request.method != 'DELETE':
        return JsonResponse({
            'success': False,
            'message': 'Only DELETE method allowed'
        }, status=405)
    
    try:
        # SECURITY: Get the patient record for the logged-in user only
        patient = Patient.objects.get(user=request.user)
        
        # SECURITY: Explicit ownership check before deletion
        # We first try to get the medicine with the patient filter
        # If it doesn't exist, we check if it exists at all
        try:
            medicine = UserMedicine.objects.get(id=medicine_id, patient=patient)
        except UserMedicine.DoesNotExist:
            # Medicine doesn't exist for this patient
            # Check if it exists at all (belongs to another user)
            if UserMedicine.objects.filter(id=medicine_id).exists():
                # Medicine exists but belongs to another user
                # Return 403 Forbidden - unauthorized access attempt
                return JsonResponse({
                    'success': False,
                    'message': 'You do not have permission to delete this medicine'
                }, status=403)
            else:
                # Medicine doesn't exist at all
                return JsonResponse({
                    'success': False,
                    'message': 'Medicine not found'
                }, status=404)
        
        # Delete the medicine
        medicine.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Medicine deleted successfully'
        }, status=200)
        
    except Patient.DoesNotExist:
        # Patient record doesn't exist for this user
        # This is a 404, not 403, because the user is authenticated
        # but has no patient record
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error deleting medicine: {str(e)}'
        }, status=500)


@login_required
def update_user_medicine(request, medicine_id):
    """
    Update a medicine owned by the logged-in user.
    PUT /api/medicines/<id>/update/
    
    Expected JSON payload:
    {
        "medicine_name": "Updated Medicine Name",
        "generic_name": "Updated Generic Name",
        "dose": "100mg",
        "instructions": "Updated instructions",
        "cycle": "Weekly",
        "schedule": "1-1-1",
        "with_food": "AFTER FOOD",
        "indication": "Updated indication"
    }
    
    SECURITY: Only updates medicines belonging to request.user.patient
    Returns 403 if attempting to update another user's medicine
    """
    if request.method != 'PUT':
        return JsonResponse({
            'success': False,
            'message': 'Only PUT method allowed'
        }, status=405)
    
    try:
        # Parse JSON request body
        data = json.loads(request.body)
        
        # SECURITY: Get the patient record for the logged-in user only
        patient = Patient.objects.get(user=request.user)
        
        # SECURITY: Explicit ownership check before update
        try:
            medicine = UserMedicine.objects.get(id=medicine_id, patient=patient)
        except UserMedicine.DoesNotExist:
            # Medicine doesn't exist for this patient
            # Check if it exists at all (belongs to another user)
            if UserMedicine.objects.filter(id=medicine_id).exists():
                # Medicine exists but belongs to another user
                # Return 403 Forbidden - unauthorized access attempt
                return JsonResponse({
                    'success': False,
                    'message': 'You do not have permission to update this medicine'
                }, status=403)
            else:
                # Medicine doesn't exist at all
                return JsonResponse({
                    'success': False,
                    'message': 'Medicine not found'
                }, status=404)
        
        # Validate required fields
        required_fields = ['medicine_name', 'dose', 'cycle', 'schedule', 'with_food']
        for field in required_fields:
            if field in data and not data[field]:
                return JsonResponse({
                    'success': False,
                    'message': f'Field {field} cannot be empty'
                }, status=400)
        
        # Update medicine fields (only if provided in request)
        if 'medicine_name' in data:
            medicine.medicine_name = data['medicine_name']
        if 'generic_name' in data:
            medicine.generic_name = data.get('generic_name', '')
        if 'dose' in data:
            medicine.dose = data['dose']
        if 'instructions' in data:
            medicine.instructions = data.get('instructions', '')
        if 'cycle' in data:
            medicine.cycle = data['cycle']
        if 'schedule' in data:
            medicine.schedule = data['schedule']
        if 'with_food' in data:
            medicine.with_food = data['with_food']
        if 'indication' in data:
            medicine.indication = data.get('indication', '')
        
        # Save the updated medicine
        medicine.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Medicine updated successfully',
            'medicine': {
                'id': medicine.id,
                'medicine_name': medicine.medicine_name,
                'generic_name': medicine.generic_name,
                'dose': medicine.dose,
                'instructions': medicine.instructions,
                'cycle': medicine.cycle,
                'schedule': medicine.schedule,
                'with_food': medicine.with_food,
                'indication': medicine.indication
            }
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Patient.DoesNotExist:
        # Patient record doesn't exist for this user
        return JsonResponse({
            'success': False,
            'message': 'Patient record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error updating medicine: {str(e)}'
        }, status=500)
