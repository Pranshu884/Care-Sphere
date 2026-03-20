# CareSphere

**Your Personal AI Healthcare Assistant**

CareSphere is a production-ready healthcare web application frontend that helps users manage personal health, track symptoms, schedule appointments, manage medications, monitor stress, and view health reports.

## Features

- **Home** — Hero, features, how it works, testimonials, emergency support banner
- **Authentication** — Register (name, email, password, age, gender) and Login
- **Dashboard** — Personalized health summary, activity timeline, quick actions
- **Symptom Checker** — Searchable symptoms, severity/duration, non-diagnostic insights
- **Appointments** — Book, view, and cancel doctor appointments
- **Medicine Reminder** — Set medication reminders with dosage, frequency, and timing
- **Stress Tracker** — Log mood, stress level, and notes with wellness tips
- **Health Reports** — Symptom, appointment, medication, and stress overview with export
- **Profile** — Edit personal details and change password

## Tech Stack

- **React 19** + TypeScript
- **Vite 8**
- **React Router 6**
- **Tailwind CSS 3**
- **Lucide React** (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

Output is in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
care-sphere/
├── src/
│   ├── components/    # Layout, Navbar, Sidebar, Footer
│   ├── pages/         # Home, Login, Register, Dashboard, etc.
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
└── package.json
```

## Backend Integration

The frontend is designed for easy API integration:

- **Auth**: Replace `localStorage` with JWT/session tokens
- **Appointments**: Connect to booking API endpoints
- **Medications**: Sync reminders with backend
- **Stress/Symptoms**: Persist to database via REST or GraphQL

Data is currently stored in `localStorage` for demo purposes.

## Design

- Clean, professional healthcare aesthetic
- Calm medical palette (white, blue, teal, soft green)
- Mobile-first responsive layout
- Accessible and fast-loading

## License

MIT
