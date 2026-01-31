# Truly Free Hosting Options (No Credit Card Required)

## 🎯 Your Requirements
- ✅ Free hosting
- ✅ No credit card required
- ✅ Permanently free (not just trial)
- ✅ Easy to deploy

---

## 🏆 Top Recommendation: PythonAnywhere

### Why PythonAnywhere?

| Feature | Details |
|---------|---------|
| **Free Tier** | ✅ Permanently free |
| **Credit Card** | ❌ NOT required for free tier |
| **Database** | SQLite included (free) |
| **Custom Domain** | ❌ Not on free tier (uses `yourname.pythonanywhere.com`) |
| **HTTPS** | ❌ Not on free tier |
| **Resources** | 512MB RAM, limited CPU |
| **Requests** | ~10,000 requests/day |
| **Difficulty** | ⭐ Easy |

### Free Tier Details
- **Web App**: 1 free web app
- **Database**: SQLite (included, no PostgreSQL on free tier)
- **Domain**: `yourname.pythonanywhere.com`
- **Storage**: 512MB disk space
- **CPU**: Limited but sufficient for small apps

### Limitations of Free Tier
- No HTTPS (HTTP only)
- No custom domain
- SQLite only (not ideal for production but works)
- App may sleep after inactivity
- Limited resources

### Is SQLite okay for production?
For a small personal app like yours, SQLite on PythonAnywhere is acceptable:
- Single user or few users
- Low traffic
- Simple CRUD operations
- No complex transactions

### Deployment Steps for PythonAnywhere

#### Step 1: Create Account
1. Go to [pythonanywhere.com](https://www.pythonanywhere.com)
2. Click "Create a free account"
3. Fill in details (NO credit card required)
4. Verify email

#### Step 2: Prepare Your Code

**No major changes needed!** Your current structure works.

Just update [`backend/medlist_backend/settings.py`](backend/medlist_backend/settings.py):

```python
# Keep SQLite for PythonAnywhere free tier
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Update ALLOWED_HOSTS
ALLOWED_HOSTS = ['yourusername.pythonanywhere.com']

# Keep DEBUG=False for production
DEBUG = False
```

#### Step 3: Upload Code to PythonAnywhere

1. Go to PythonAnywhere dashboard
2. Click "Files" tab
3. Upload your project files OR use git:
   - Go to "Consoles" → "Bash"
   - `git clone https://github.com/YOUR_USERNAME/medicine-list-generator.git`

#### Step 4: Create Virtual Environment

In the Bash console:
```bash
cd ~/medicine-list-generator/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 5: Configure Web App

1. Go to "Web" tab
2. Click "Add a new web app"
3. Choose:
   - Framework: Django
   - Python version: 3.11 or 3.12
   - Project directory: `/home/yourusername/medicine-list-generator/backend`
   - Virtualenv: `/home/yourusername/medicine-list-generator/backend/venv`

4. Update WSGI configuration:
   - Edit the WSGI file
   - Set: `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlist_backend.settings')`

5. Update static files:
   - Static files path: `/home/yourusername/medicine-list-generator/backend/staticfiles`
   - URL: `/static/`

#### Step 6: Run Migrations

In the Bash console:
```bash
cd ~/medicine-list-generator/backend
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### Step 7: Access Your App

Your app will be available at:
`https://yourusername.pythonanywhere.com`

---

## 🥈 Second Option: Fly.io

### Why Fly.io?

| Feature | Details |
|---------|---------|
| **Free Tier** | ✅ Permanently free (with limits) |
| **Credit Card** | ❌ NOT required for free tier |
| **Database** | ✅ PostgreSQL included (free) |
| **Custom Domain** | ✅ Supported |
| **HTTPS** | ✅ Automatic |
| **Resources** | 256MB RAM, 1 vCPU |
| **Difficulty** | ⭐⭐⭐ Medium (requires CLI) |

### Free Tier Details
- **Apps**: 3 free apps
- **CPU**: 3 shared-cpu-1x VMs (256MB RAM each)
- **Storage**: 3GB volume storage
- **Bandwidth**: 160GB egress/month
- **Database**: PostgreSQL included (1GB free)

### Deployment Steps for Fly.io

#### Step 1: Install Fly CLI

```bash
# Windows
iwr https://fly.io/install.ps1 -useb | iex

# Mac
curl -L https://fly.io/install.sh | sh

# Linux
curl -L https://fly.io/install.sh | sh
```

#### Step 2: Sign Up

```bash
fly auth signup
```

Follow the prompts (NO credit card required for free tier).

#### Step 3: Login

```bash
fly auth login
```

#### Step 4: Prepare Your Project

Create [`fly.toml`](fly.toml) in project root:

```toml
app = "medicine-list-generator"
primary_region = "sin"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  DJANGO_SETTINGS_MODULE = "medlist_backend.settings"
  DEBUG = "False"
  ALLOWED_HOSTS = "medicine-list-generator.fly.dev"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[statics]]
  guest_path = "/app/backend/staticfiles"
  url_prefix = "/static/"
```

Create [`backend/requirements.txt`](backend/requirements.txt):

```txt
Django==5.0.1
python-dotenv==1.0.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
whitenoise==6.6.0
```

Create [`backend/Dockerfile`](backend/Dockerfile):

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "medlist_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### Step 5: Create PostgreSQL Database

```bash
flyctl postgres create
```

Follow prompts:
- Name: `medlist-db`
- Region: choose closest to you

Save the connection URL (you'll see it in output).

#### Step 6: Deploy

```bash
flyctl launch
```

Follow prompts:
- App name: `medicine-list-generator`
- Region: same as database
- Deploy now: Yes

#### Step 7: Configure Environment Variables

```bash
flyctl secrets set DATABASE_URL="your-database-url-from-step-5"
flyctl secrets set SECRET_KEY="your-secret-key"
flyctl secrets set ALLOWED_HOSTS="medicine-list-generator.fly.dev"
```

#### Step 8: Run Migrations

```bash
flyctl ssh console
cd backend
python manage.py migrate
python manage.py createsuperuser
exit
```

#### Step 9: Access Your App

Your app will be available at:
`https://medicine-list-generator.fly.dev`

---

## 🥉 Third Option: Railway.app

### Why Railway?

| Feature | Details |
|---------|---------|
| **Free Tier** | ✅ $5 credit/month (renews monthly) |
| **Credit Card** | ❌ NOT required for free tier |
| **Database** | ✅ PostgreSQL included |
| **Custom Domain** | ✅ Supported |
| **HTTPS** | ✅ Automatic |
| **Resources** | 512MB RAM |
| **Difficulty** | ⭐⭐ Easy |

### Free Tier Details
- **Credit**: $5/month (renews every month)
- **Services**: Can run 1-2 small services
- **Database**: PostgreSQL included
- **Storage**: 1GB

### Deployment Steps for Railway

1. Sign up at [railway.app](https://railway.app) with GitHub (no credit card)
2. Create new project
3. Deploy from GitHub
4. Add PostgreSQL database
5. Configure environment variables

---

## 📊 Comparison: Free No-Credit-Card Options

| Platform | Free Tier | Credit Card | Database | HTTPS | Custom Domain | Difficulty |
|----------|-----------|-------------|----------|-------|---------------|------------|
| **PythonAnywhere** | Permanent | ❌ No | SQLite | ❌ No | ❌ No | ⭐ Easy |
| **Fly.io** | Permanent | ❌ No | PostgreSQL | ✅ Yes | ✅ Yes | ⭐⭐⭐ Medium |
| **Railway.app** | $5/mo credit | ❌ No | PostgreSQL | ✅ Yes | ✅ Yes | ⭐⭐ Easy |

---

## 🎯 My Recommendation for You

### If you want EASIEST: PythonAnywhere
- No CLI needed
- Web-based interface
- Simple setup
- No credit card
- Permanently free

**Trade-offs:**
- No HTTPS
- No custom domain
- SQLite only
- Uses `yourname.pythonanywhere.com` URL

### If you want BEST FEATURES: Fly.io
- PostgreSQL included
- HTTPS automatic
- Custom domain supported
- No credit card
- Permanently free

**Trade-offs:**
- Requires CLI installation
- More complex setup
- Docker knowledge helpful

---

## 🚀 Quick Decision Guide

| Your Priority | Choose |
|---------------|--------|
| Easiest setup | **PythonAnywhere** |
| Best free features | **Fly.io** |
| Need HTTPS | **Fly.io** |
| Need custom domain | **Fly.io** |
| No CLI wanted | **PythonAnywhere** |
| Want PostgreSQL | **Fly.io** |

---

## 💡 Important Notes

### PythonAnywhere Limitations
- **No HTTPS** means your login credentials are sent in plain text
- **SQLite** may have issues with concurrent users
- **Sleeps** when inactive (takes time to wake up)

### Fly.io Limitations
- **CLI-based** - requires terminal usage
- **256MB RAM** - may be tight for Django
- **Complex setup** - Docker, fly.toml configuration

---

## 📝 Final Recommendation

**For your use case, I recommend PythonAnywhere** because:
1. Easiest to set up (web interface, no CLI)
2. No credit card required
3. Permanently free
4. Your current code structure works as-is
5. SQLite is acceptable for a personal/small app

**If you need HTTPS or PostgreSQL**, then choose Fly.io.

---

## 🚀 Next Steps

**For PythonAnywhere:**
1. Create free account at pythonanywhere.com
2. Upload your code
3. Follow the steps above

**For Fly.io:**
1. Install Fly CLI
2. Create `fly.toml` and `Dockerfile`
3. Follow the deployment steps

Let me know which option you prefer, and I can provide more detailed guidance!