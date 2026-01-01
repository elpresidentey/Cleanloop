# 🌱 CleanLoop Platform

<!-- Updated: January 2025 - Vercel deployment ready with environment variables -->

**A comprehensive waste management platform for residents, collectors, and administrators.**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.14-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

## 🚀 **Live Demo**

**Development Server:** `http://localhost:3000` (after setup)

## ✨ **Features**

### 🏠 **For Residents**
- **Dashboard** - Personalized overview of services and activities
- **Payment Management** - Track payments with professional PDF receipts
- **Pickup Requests** - Schedule and track waste collection
- **Subscription Management** - Manage service plans and billing
- **Complaints System** - Report and track service issues
- **Location Management** - Update service addresses

### 🚛 **For Collectors**
- **Route Management** - Optimize collection routes
- **Customer Management** - Track customer information
- **Pickup Tracking** - Real-time pickup status updates
- **Performance Metrics** - Collection efficiency analytics

### 👨‍💼 **For Administrators**
- **User Management** - Manage residents and collectors
- **Area Monitoring** - Oversee service areas
- **Complaint Review** - Handle customer complaints
- **Audit Trail** - Track system activities
- **Analytics Dashboard** - Business intelligence and reporting

## 🎯 **Key Highlights**

### 📄 **Professional PDF Receipts**
- CleanLoop branded receipts
- Complete payment details
- Print, download, and preview functionality
- Works offline with test data

### 📱 **Mobile-First Design**
- Fully responsive on all devices
- Touch-friendly interfaces
- No horizontal scrolling
- Optimized for mobile users

### ⚡ **Performance Optimized**
- Fast loading times (< 3 seconds)
- Smooth animations and transitions
- Efficient data loading
- Optimized bundle size

### 🔒 **Security & Authentication**
- Secure user authentication
- Role-based access control
- Row Level Security (RLS)
- Data protection compliance

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **jsPDF** - PDF generation for receipts

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Database-level security
- **Real-time subscriptions** - Live data updates

### **Development Tools**
- **ESLint & Prettier** - Code quality and formatting
- **Jest** - Testing framework
- **TypeScript** - Static type checking
- **Hot Module Replacement** - Fast development

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cleanloop-platform.git
   cd cleanloop-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 **Environment Setup**

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CONVEX_URL=your_convex_url
NODE_ENV=development
```

## 📊 **Database Setup**

### **Option 1: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in `supabase/migrations/` folder in order

### **Option 2: Supabase CLI**
```bash
supabase db reset
```

### **Sample Data**
Run `DIRECT_PAYMENT_INSERT.sql` in Supabase SQL Editor for test data.

## 🧪 **Testing**

### **Run Tests**
```bash
npm test
```

### **Test Coverage**
```bash
npm run test:coverage
```

### **PDF Receipt Testing**
- Navigate to Payment History page
- Use "Test Preview", "Test Download", "Test Print" buttons
- No database data required for PDF testing

## 📱 **Mobile Testing**

1. Open browser developer tools (F12)
2. Click device toolbar icon
3. Test different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1200px+)

## 🚀 **Deployment**

### **Build for Production**
```bash
npm run build
```

### **Preview Production Build**
```bash
npm run preview
```

### **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

## 📁 **Project Structure**

```
cleanloop-platform/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── auth/           # Authentication components
│   │   ├── resident/       # Resident-specific components
│   │   ├── collector/      # Collector-specific components
│   │   ├── admin/          # Admin-specific components
│   │   ├── common/         # Shared components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   ├── services/           # API services and business logic
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── lib/                # Third-party library configurations
├── supabase/
│   └── migrations/         # Database schema migrations
├── public/                 # Static assets
├── docs/                   # Documentation files
└── tests/                  # Test suites
```

## 🎨 **Design System**

### **Colors**
- **Primary:** Green (#22c55e) - CleanLoop brand color
- **Secondary:** Gray (#6b7280) - Text and UI elements
- **Success:** Green (#10b981) - Success states
- **Error:** Red (#ef4444) - Error states
- **Warning:** Yellow (#f59e0b) - Warning states

### **Typography**
- **Font Family:** Cabin (Google Fonts)
- **Headings:** Bold weights for hierarchy
- **Body:** Regular weight for readability

### **Spacing**
- **Consistent spacing scale** using Tailwind CSS
- **Proper form spacing** with adequate padding
- **Mobile-optimized touch targets**

## 📚 **Documentation**

- **[Setup Instructions](SETUP_INSTRUCTIONS.md)** - Detailed setup guide
- **[Testing Guide](START_REAL_USER_TESTING.md)** - Comprehensive testing documentation
- **[API Documentation](src/services/README.md)** - Service layer documentation
- **[Database Schema](supabase/README.md)** - Database structure and migrations
- **[Deployment Guide](DEPLOYMENT_SUMMARY.md)** - Production deployment steps

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Maintain mobile responsiveness
- Follow the existing code style
- Update documentation as needed

## 🐛 **Known Issues**

- **Schema Cache Issue:** Temporary Supabase schema cache issue may affect payment creation through the app. Use SQL method or wait for cache refresh.
- **PDF Generation:** Works perfectly with test buttons, may need real data for full testing.

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Supabase** - For the excellent backend-as-a-service platform
- **Tailwind CSS** - For the utility-first CSS framework
- **React Team** - For the amazing React library
- **Vite Team** - For the fast build tool

## 📞 **Support**

For support, email support@cleanloop.ng or create an issue in this repository.

## 🌟 **Star this repo**

If you find this project helpful, please give it a star! ⭐

---

**Built with ❤️ for sustainable waste management**