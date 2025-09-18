# MassHealth

A Django-based health and fitness tracking application.

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd masshealth
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

4. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Populate initial data**
   ```bash
   # Add muscle groups to database
   python manage.py populate_muscle_groups
   
   # Add workout data to database
   python manage.py populate_workouts
   ```

6. **Run the development server (use second option if u build on physical device)**
   ```bash
   python manage.py runserver
   python manage.py runserver 0.0.0.0:8000 
   ```

## Management Commands

This project includes custom Django management commands to help set up your database:

### `populate_muscle_groups`
Adds predefined muscle groups to the database (Chest, Back, Legs, etc.).

```bash
python manage.py populate_muscle_groups
```

**What it does:**
- Creates muscle group entries if they don't exist
- Shows which groups were created vs already existed
- Safe to run multiple times (won't create duplicates)

### `populate_workouts`
Adds sample workout data to the database.

```bash
python manage.py populate_workouts
```

**What it does:**
- Creates sample workout routines
- Links workouts to appropriate muscle groups
- Provides initial data for testing and development

## Development

To reset your database and repopulate:

```bash
# Delete database 
rm db.sqlite3

# Recreate database
python manage.py migrate

# Repopulate with initial data
python manage.py populate_muscle_groups
python manage.py populate_workouts
```


## Frontend Setup (React Native/Expo)
```bash
cd frontend
npm install
```

```bash
npx expo run:android --device
```


# For physical device with network issues (creates tunnel)
```bash
npx expo start --tunnel
# then click a for open android on your keyboard
```

# based on your device and network change base url in api.ts
```bash
const baseURL = "http://10.0.2.2:8000"; // emulator
const baseURL = "http://<your:ip>:8000"; // physical device

```

