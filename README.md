# Notification Application

Frontend-only React application for Stage 2.

## What Is Included

- React + Vite frontend in `notification_app_fe`
- Reusable logging package in `logging_middleware`
- Vanilla CSS only
- Notification filters: `All`, `Event`, `Result`, `Placement`
- API query parameters: `limit`, `page`, `notification_type`

## How To Run

```powershell
cd notification_app_fe
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## API Token

The evaluation API returns `401 Unauthorized` until a valid token is provided. Create `notification_app_fe/.env`:

```text
VITE_EVALUATION_AUTH_TOKEN=your-token-here
```

Then restart:

```powershell
npm run dev
```
