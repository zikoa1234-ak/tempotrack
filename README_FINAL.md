# TempoTrack - Complete Productivity Tracker

A full-featured productivity tracking application with multilingual support, task scheduling, and user accounts.

## ✅ **All Features Implemented**

### **Core Features:**
1. **User Authentication**
   - Login/Registration with email/password
   - Phone number with country code support
   - Persistent login sessions (30-day tokens)
   - Secure password hashing

2. **Multilingual Support** 🌍
   - English 🇺🇸 (default)
   - French 🇫🇷 
   - Arabic 🇸🇦 (with automatic RTL layout)
   - Browser language detection
   - Language persistence in localStorage

3. **Task Management** ✅
   - Create, edit, delete tasks
   - Three time horizons: Day, Month, Year
   - Priority levels: Low, Medium, High
   - Categories: Work, Health, Learning, Personal, Finance, Creative, General
   - Progress tracking (0-100%)
   - Due dates and time estimates
   - Automatic overdue detection

4. **Dashboard & Analytics** 📊
   - Focus score calculation
   - Task completion statistics
   - Progress visualization
   - Timeline view

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Modern web browser

### **Installation**
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tempotrack.git
cd tempotrack

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Production Build**
```bash
npm run build
npm start
```

## 🐳 **Docker Deployment**
```bash
# Build Docker image
docker build -t tempotrack .

# Run container
docker run -p 3000:3000 tempotrack
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Optional: Custom database path
DATABASE_PATH=/data/data.db

# Server port (default: 3000)
PORT=3000
```

## 📱 **Features in Detail**

### **User Registration**
- Name, email, password
- Phone number with country code selector
- No precreated demo tasks (clean start)
- Secure account creation

### **Task Creation (Simplified)**
1. **Title** - Main task description
2. **Category** - Work/Health/Learning/etc.
3. **Priority** - Low/Medium/High
4. **Due Date** - When it's due
5. **Period** - Day/Month/Year
6. **Time Estimate** - Minutes required
7. **Progress** - 0-100% slider
8. **Notes** - Optional details

### **Language Switching**
- Click globe icon in top-right corner
- Select preferred language
- Arabic automatically switches to RTL
- All UI elements translated

### **Phone Validation**
- Only accepts numbers (0-9)
- Country code selection
- International format support
- Client-side validation

## 🧪 **Testing**

### **Manual Testing Checklist**
```bash
# 1. Test registration with phone
# 2. Test language switching
# 3. Test task creation/editing
# 4. Test login persistence
# 5. Test overdue detection
```

### **Run TypeScript Check**
```bash
npx tsc --noEmit
```

## 📁 **Project Structure**
```
tempotrack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities, auth, i18n
│   │   └── App.tsx        # Main app component
├── server/                # Express backend
│   ├── storage.ts         # Database operations
│   └── index.ts          # Server setup
├── shared/               # Shared TypeScript schemas
├── public/               # Static assets
└── package.json          # Dependencies
```

## 🎨 **UI/UX Features**
- **Dark/Light theme** support
- **Responsive design** for mobile/desktop
- **Icons** for better visual cues
- **Progress indicators** and badges
- **Toast notifications** for feedback
- **Loading states** and skeletons

## 🔒 **Security Features**
- Password hashing with scrypt
- JWT token authentication
- SQL injection protection
- XSS prevention
- Secure session management

## 📊 **Database Schema**
```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  country_code TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  progress INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  due_date TEXT,
  start_date TEXT,
  end_date TEXT,
  time_estimate INTEGER,
  metric_target INTEGER,
  metric_unit TEXT,
  created_at TEXT NOT NULL
);
```

## 🌐 **Browser Support**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## 🤝 **Contributing**
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 **License**
MIT License - see LICENSE file

## 🙏 **Acknowledgments**
- Built with React, Express, TypeScript
- UI components from shadcn/ui
- Icons from Lucide React
- Database with SQLite

## 📞 **Support**
For issues or questions:
1. Check existing issues
2. Create new issue with details
3. Include browser/OS information
4. Provide steps to reproduce

---

**Enjoy tracking your productivity with TempoTrack!** 🚀