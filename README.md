# DriveMint Car Rental App

Full-stack car rental demo built with Express, EJS, sessions, and JSON file persistence.

## Included Features

- User signup and login
- Browse cars
- Search cars by city
- Car details page
- Book a car
- Booking history
- Profile management
- Admin add, edit, and delete cars
- Admin booking review with accept and reject actions
- Admin user management
- Admin revenue dashboard
- React Native Expo Android app in `mobile/`

## Run Locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

- User: `aarav@example.com` / `user123`
- Admin: `admin@drivemint.com` / `admin123`

## Data Storage

App data is stored in `data/store.json`. The file is created automatically with seed data on first run.

### Production Storage

For production hosting, you can override the storage locations with environment variables:

```env
SESSION_SECRET=replace-this
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

This is useful on Render when you attach a persistent disk.

## Android App

A proper Android client now lives in `mobile/` and talks to the Express server through `/api` JSON endpoints.

### Backend

From the project root:

```bash
npm start
```

### Mobile App

From `mobile/`:

```bash
npm install
npx expo start
```

For Android emulator use:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
```

For a physical Android device on the same Wi-Fi, replace `10.0.2.2` with your computer's LAN IP.

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.8:3000/api
```

### Important Local Setup Note

This machine did not have `java` or `adb` configured, so the Android project was scaffolded and bundle-validated, but not launched in a local emulator here. To run `npm run android`, install Android Studio plus the Android SDK tools first.

## Deploy On Render

This repo includes a `render.yaml` blueprint for a Node web service with a persistent disk.

### Quick Deploy

1. Push this repo to GitHub.
2. In Render, connect your GitHub account.
3. Click `New +` -> `Blueprint`.
4. Select this repository.
5. Render will detect `render.yaml`.
6. Review the service and create it.
7. After the deploy completes, open the generated `onrender.com` URL.

### What The Blueprint Configures

- `npm install` build command
- `npm start` start command
- `SESSION_SECRET` generated automatically
- persistent disk mounted at `/var/data`
- app data in `/var/data/data`
- uploaded car photos in `/var/data/uploads`
