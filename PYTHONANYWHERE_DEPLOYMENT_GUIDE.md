# PythonAnywhere Deployment Guide

## Overview

This guide explains how to deploy the Medicine List Generator application to PythonAnywhere with the new secure Gemini API implementation.

## Prerequisites

- PythonAnywhere account (free tier)
- GitHub repository with master branch updated
- MySQL database (free tier on PythonAnywhere)
- Gemini API key configured with restrictions

## Deployment Steps

### Step 1: Prepare GitHub Repository

Your repository is already updated with:
- ✅ Backend proxy endpoint for Gemini API
- ✅ Frontend no longer contains API keys
- ✅ Rate limiting enabled
- ✅ Security documentation added

### Step 2: Fork or Clone Repository on PythonAnywhere

1. Log in to PythonAnywhere
2. Go to "Web" → "Consoles" → "Bash"
3. Clone your repository:
   ```bash
   git clone https://github.com/ThZihan/medicineList_generatorV1.git
   cd medicineList_generatorV1
   ```

### Step 3: Configure Database

1. Go to PythonAnywhere "Databases" tab
2. Create a new MySQL database (free tier)
3. Note down:
   - Database name
   - Database username
   - Database password
   - Database host (e.g., `yourname.mysql.pythonanywhere-services.com`)
   - Database port (usually 3306)

### Step 4: Set Environment Variables

1. Go to PythonAnywhere "Web" page
2. Scroll down to "Variables" section
3. Add the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `GEMINI_API_KEY` | Your production API key | **Required** |
| `DEBUG` | `False` | Production setting |
| `SECRET_KEY` | Generate new secret key | Recommended |
| `DB_NAME` | Your database name | **Required** |
| `DB_USER` | Your database username | **Required** |
| `DB_PASSWORD` | Your database password | **Required** |
| `DB_HOST` | Your database host | **Required** |
| `DB_PORT` | `3306` | Default port |

**Important:** 
- Use a different API key for production (not the same as development)
- Generate a new SECRET_KEY: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### Step 5: Configure Web App

1. Go to PythonAnywhere "Web" page
2. Click "Add new web app"
3. Fill in the form:

| Field | Value |
|-------|-------|
| Project name | `medicineList_generator` |
| Python version | `3.12` (or latest) |
| Python framework | `Django` |
| Project directory | `/home/yourusername/medicineList_generatorV1` |
| Virtualenv | Create a new virtualenv |
| Automatic domain | Choose a subdomain or use custom |

4. Click "Next" → "Configure WSGI"
5. WSGI configuration file: `/home/yourusername/medicineList_generatorV1/backend/medlist_backend/wsgi.py`
6. Virtualenv path: `/home/yourusername/.virtualenvs/medicineList_generator`

### Step 6: Install Dependencies

In the PythonAnywhere Bash console:

```bash
cd ~/medicineList_generatorV1/backend
source ~/.virtualenvs/medicineList_generator/bin/activate
pip install -r requirements.txt
```

### Step 7: Run Migrations

```bash
cd ~/medicineList_generatorV1/backend
python manage.py makemigrations
python manage.py migrate
```

### Step 8: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### Step 9: Create Superuser (Optional)

If you need to access Django admin:

```bash
python manage.py createsuperuser
```

### Step 10: Configure ALLOWED_HOSTS

Update [`backend/medlist_backend/settings.py`](backend/medlist_backend/settings.py:31):

```python
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='yourpythonanywhere-username.pythonanywhere.com', cast=Csv())
```

Then commit and push to GitHub.

### Step 11: Reload Web App

1. Go to PythonAnywhere "Web" page
2. Click "Reload" button for your web app

## Post-Deployment Checklist

- [ ] Web app loads without errors
- [ ] Login page accessible
- [ ] User can register and login
- [ ] Medicine list displays correctly
- [ ] OCR functionality works
- [ ] API key is not exposed in browser DevTools
- [ ] Static files are loading correctly
- [ ] Database migrations completed successfully

## Troubleshooting

### Issue: "500 Internal Server Error"

**Possible causes:**
- Missing environment variables
- Database connection issues
- Missing dependencies

**Solution:**
1. Check error logs in PythonAnywhere "Web" → "Logs"
2. Verify all environment variables are set
3. Run `python manage.py check` in Bash console

### Issue: "Static files not loading"

**Solution:**
```bash
python manage.py collectstatic --noinput --clear
```

### Issue: "Database connection error"

**Solution:**
1. Verify database credentials in environment variables
2. Check database is running in PythonAnywhere "Databases" tab
3. Test connection manually in Bash console

### Issue: "OCR not working"

**Solution:**
1. Verify `GEMINI_API_KEY` is set in environment variables
2. Check Google Cloud Console for API key restrictions
3. Ensure application restrictions include your PythonAnywhere domain
4. Check error logs for specific error messages

## Security Configuration

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your production API key
3. Click "Edit API key"
4. Set Application Restrictions:
   - Select "HTTP referrers"
   - Add: `https://yourpythonanywhere-username.pythonanywhere.com/*`
5. Set API Restrictions:
   - Select "Restrict key"
   - Choose only "Generative Language API"
6. Click "Save"

### Why This Matters

- Prevents API key from being used by unauthorized domains
- Limits API key to only Generative Language API
- Adds layer of security even if code is exposed

## Monitoring

### Check Logs Regularly

1. Go to PythonAnywhere "Web" → "Logs"
2. Monitor for:
   - API errors
   - Unusual traffic patterns
   - Failed authentication attempts

### Google Cloud Console

1. Monitor API usage in Google Cloud Console
2. Set up billing alerts for unusual spending
3. Review quota usage regularly

## Rolling Back

If deployment fails:

```bash
# In PythonAnywhere Bash console
cd ~/medicineList_generatorV1
git pull origin master
source ~/.virtualenvs/medicineList_generator/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

Then reload web app in PythonAnywhere dashboard.

## References

- [PythonAnywhere Django Guide](https://help.pythonanywhere.com/pages/howtosetupadjangowebappwithpostgresandstaticfiles/)
- [Environment Variables Guide](backend/ENVIRONMENT_VARIABLES_GUIDE.md)
- [Security Plan](plans/GEMINI_API_SECURITY_PLAN.md)
