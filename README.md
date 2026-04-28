# 🎵 SongDrop — Real-Time Song Suggestion App

A full-stack MERN app for collecting and managing song requests in real time — built for events, DJ sets, or parties. Handles 100+ concurrent users via Socket.IO.

---

## 📁 File Structure

```
song-suggestions/
├── package.json              ← root scripts (dev, build, install:all)
├── render.yaml               ← Render.com deployment config
├── .gitignore
│
├── server/
│   ├── index.js              ← Express + Socket.IO entry point
│   ├── package.json
│   ├── .env.example          ← Copy to .env and fill in values
│   ├── config/
│   │   └── db.js             ← MongoDB Atlas connection
│   ├── models/
│   │   └── Suggestion.js     ← Mongoose schema (duplicate index)
│   ├── middleware/
│   │   └── auth.js           ← JWT admin auth middleware
│   └── routes/
│       ├── auth.js           ← POST /api/auth/admin-login
│       └── suggestions.js    ← All suggestion CRUD + vote endpoints
│
└── client/
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.js            ← Router + providers
        ├── App.css           ← Full dark-theme CSS
        ├── index.js
        ├── context/
        │   ├── SocketContext.js   ← Socket.IO client provider
        │   └── AuthContext.js     ← Admin JWT session
        ├── utils/
        │   └── api.js            ← Axios instance + all API calls
        ├── components/
        │   ├── SuggestionForm.js ← Submit form with dupe detection
        │   └── SuggestionList.js ← Live list with voting
        └── pages/
            ├── HomePage.js
            └── AdminPage.js      ← Password-protected admin dashboard
```

---

## 🚀 Local Setup (Step by Step)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd song-suggestions
npm run install:all
```

### 2. Configure Server Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/song-suggestions?retryWrites=true&w=majority
JWT_SECRET=some_very_long_random_string_here
ADMIN_PASSWORD=mySecureAdminPass123
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Configure Client Environment

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a DB user (Database Access)
4. Whitelist IP: `0.0.0.0/0` for dev, or your server IP for prod (Network Access)
5. Get the connection string: Clusters → Connect → Drivers → Node.js
6. Paste it into `MONGODB_URI` in `server/.env`

### 5. Run in Development

```bash
# From root folder
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Admin: http://localhost:3000/admin

---

## 🌐 Deployment

### Option A: Render.com (Recommended — Free Tier)

1. Push your repo to GitHub
2. Create a Render account at render.com
3. New → Blueprint → connect your GitHub repo → Render reads `render.yaml`
4. Set environment variables in the Render dashboard for the server service:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `CLIENT_URL` → set to your frontend Render URL (e.g. `https://song-suggestions.onrender.com`)

### Option B: Manual Deploy

**Server** — any Node.js host (Railway, Fly.io, DigitalOcean):
```bash
cd server
npm install
NODE_ENV=production node index.js
```

**Client** — any static host (Vercel, Netlify, Render Static):
```bash
cd client
REACT_APP_API_URL=https://your-server.onrender.com/api \
REACT_APP_SOCKET_URL=https://your-server.onrender.com \
npm run build
# Deploy the /build folder
```

---

## 🔑 Features

| Feature | Details |
|---|---|
| Real-time sync | Socket.IO — new suggestions, votes, status changes push to all clients |
| Duplicate detection | MongoDB compound unique index on `songNameNormalized + singerNameNormalized` |
| Voting | 1 vote per IP per song (server-side hashed IP check) |
| Admin dashboard | Password → JWT token (8h expiry), filter by status, change status, delete |
| Rate limiting | 5 submissions per 10 min, 60 API calls per min, 5 login attempts per 15 min |
| Security | Helmet, CORS, JWT auth, input size limits |
| 100-user ready | Socket.IO tuned, MongoDB connection pooling (max 10), rate limiting |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/suggestions` | — | Submit suggestion |
| GET | `/api/suggestions?status=pending&sort=votes` | — | Get public suggestions |
| PATCH | `/api/suggestions/:id/vote` | — | Upvote |
| POST | `/api/auth/admin-login` | — | Admin login → JWT |
| GET | `/api/suggestions/admin/all` | Admin | All suggestions |
| PATCH | `/api/suggestions/admin/:id/status` | Admin | Update status |
| DELETE | `/api/suggestions/admin/:id` | Admin | Delete one |
| DELETE | `/api/suggestions/admin/clear/all` | Admin | Delete all |
| GET | `/api/health` | — | Server health check |

---

## ⚙️ Scaling Beyond 100 Users

If you need to scale further:
- Switch to Redis adapter for Socket.IO (`socket.io-redis`) when running multiple server instances
- Add Mongoose connection pooling increase (`maxPoolSize: 50`)
- Add CDN (Cloudflare) in front of your static client

---

## 🛡️ Security Checklist Before Production

- [ ] Change `ADMIN_PASSWORD` to something strong
- [ ] Use a long random `JWT_SECRET` (32+ chars)
- [ ] Restrict MongoDB Atlas Network Access to your server's IP
- [ ] Set `CLIENT_URL` to your actual frontend URL (not `*`)
- [ ] Enable HTTPS (Render provides this automatically)
