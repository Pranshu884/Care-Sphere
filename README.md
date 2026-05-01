# CareSphere 🩺

### Your Personal AI Healthcare Assistant

CareSphere is a **production-ready, full-stack MERN healthcare platform** that helps users manage personal health through AI-powered insights, symptom triage, appointment booking, medication reminders, stress tracking, and intelligent health report analysis.

---

## ✨ Features

| Module | Description |
|---|---|
| **Home** | Hero, features overview, how it works, testimonials, emergency support banner |
| **Authentication** | OTP-based passwordless email login + registration with JWT sessions |
| **Dashboard** | Personalized health summary, upcoming appointments, medicine schedule, quick actions |
| **Symptom Checker** | Rule-based triage engine — severity/duration inputs, urgency-coded results (Emergency → Low), non-diagnostic |
| **Appointments** | Book, view, and cancel doctor appointments with real-time status (Pending / Confirmed) |
| **Medicine Reminder** | Set reminders with dosage, frequency, and timing — automated email alerts via node-cron |
| **Stress Tracker** | Log mood, stress levels, and notes with wellness insights |
| **Health Reports** | Upload PDFs/images — **Gemini AI** extracts biomarkers, detects abnormalities, and generates patient-friendly insights |
| **Profile** | Edit personal details, health summary (blood group, height, weight), emergency contact |
| **Doctor Portal** | Dedicated dashboard for doctors to manage appointments |
| **Admin Panel** | User management, doctor management, appointment oversight |

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite 8**
- **React Router v6** with role-based protected routes
- **Tailwind CSS 3**
- **Lucide React** (icons)

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **OTP email verification** (Resend)
- **Cloudinary** — file storage for health reports
- **Google Gemini AI** (`gemini-2.5-flash`) — health report analysis
- **node-cron** — medicine reminder email scheduler
- **pdf-parse** — PDF text extraction

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

---

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

### Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start server
npm run dev
```

Server runs on [http://localhost:4000](http://localhost:4000)

#### Required Environment Variables (`server/.env`)

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_google_gemini_api_key

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=CareSphere <no-reply@yourdomain.com>

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

OTP_PEPPER=your_random_secret
OTP_EXPIRY_SECONDS=300
OTP_COOLDOWN_SECONDS=45
```

---

## 🏗 Build for Production

```bash
# Frontend
npm run build      # Output in /dist

# Backend
cd server
node src/index.js  # Or deploy to Render/Railway
```

---

## 📁 Project Structure

```
care-sphere/
├── src/                        # React frontend
│   ├── components/             # Layout, Navbar, Sidebar, Footer, UI components
│   ├── lib/                    # auth.ts, api.ts, triageEngine.ts
│   ├── pages/                  # Home, Login, Register, Dashboard, etc.
│   │   ├── admin/              # AdminDashboard
│   │   └── doctor/             # DoctorDashboard
│   ├── App.tsx                 # Routing + role guards
│   └── main.tsx
├── server/                     # Express backend
│   └── src/
│       ├── models/             # User, Appointment, Medicine, Report, Doctor
│       ├── routes/             # Auth, Admin, Doctor, Reports, Medicines, User
│       ├── services/           # aiService, authService, emailService, medicineScheduler
│       ├── middleware/         # authMiddleware, rbacMiddleware
│       └── utils/              # medicalReference, jwt
├── vercel.json                 # Vercel SPA routing config
└── package.json
```

---

## 🔐 Roles & Access

| Role | Access |
|---|---|
| **Patient** | All health features — dashboard, symptoms, appointments, medicines, reports, profile |
| **Doctor** | Doctor dashboard — view & manage assigned appointments |
| **Admin** | Admin panel — manage users, doctors, appointments |

---

## 🤖 AI Health Reports

1. Upload a PDF or image of any medical report
2. Gemini AI performs OCR and extracts biomarkers
3. A math validation engine checks values against clinical reference ranges
4. AI generates patient-friendly summaries, flags abnormalities, and gives discussion points
5. All results are saved to MongoDB and displayed in the Health Reports page

---

## 📄 License

MIT
