# Corporate Communications Portal

A secure, enterprise-grade web application designed for corporate administrators to efficiently manage and send targeted communications to employees organized by department pillars. Built with modern web technologies and enterprise security standards.

![Corporate Communications Portal](https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&crop=center)

## 🌟 Project Overview

The Corporate Communications Portal is a full-stack web application that streamlines internal company communications. It provides a secure, role-based interface for administrators to compose and send emails to specific department groups (pillars) with real-time delivery tracking and comprehensive audit logging.

### Key Features

- **🔐 Secure Authentication**: Admin-only access with email/password authentication and session management
- **📧 Email Management**: Compose and send emails to entire department pillars with rich text support
- **🏢 Department Organization**: Employee management organized by pillars/departments with visual dashboards
- **📊 Real-time Analytics**: Live statistics showing employee counts per pillar and delivery metrics
- **🛡️ Security Features**: Input sanitization, rate limiting, audit logging, and Row Level Security (RLS)
- **📱 Responsive Design**: Mobile-first design with professional UI/UX using Tailwind CSS
- **⚡ Performance**: Optimized loading states, caching, and efficient database queries

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Tailwind CSS** with shadcn/ui components for modern, accessible UI
- **TanStack Query** for efficient server state management and caching
- **React Router** for client-side routing
- **Vite** for fast development and optimized builds

### Backend & Database
- **Supabase** for backend-as-a-service (PostgreSQL database, authentication, edge functions)
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Edge Functions** for serverless email processing

### Email Service
- **Resend API** for reliable email delivery with professional templates
- **HTML email templates** with responsive design

### Security & Monitoring
- **Row Level Security (RLS)** for database-level access control
- **Audit logging** for all administrative actions
- **Input sanitization** to prevent XSS attacks
- **Rate limiting** to prevent abuse
- **CORS protection** for API security

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account
- Resend account (for email delivery)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd corporate-communications-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   The application uses Supabase for backend services. The environment variables are automatically configured when you connect to Supabase.

4. **Database Setup**
   
   The database schema is automatically created through Supabase migrations:
   - `admin_users` - Administrator account management
   - `employees` - Employee data organized by pillars
   - `admin_audit_log` - Security audit trail

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📋 Usage Guide

### For Administrators

1. **Login**
   - Access the admin portal with your administrator credentials
   - The system uses secure email/password authentication

2. **Dashboard Overview**
   - View real-time employee statistics
   - See department pillar breakdown
   - Monitor system status

3. **Compose Messages**
   - Enter email subject (max 200 characters)
   - Write message content (max 10,000 characters)
   - Content is automatically sanitized for security

4. **Target Departments**
   - Select specific department pillars
   - Preview recipient lists before sending
   - View employee counts per department

5. **Send Communications**
   - One-click sending to entire departments
   - Real-time delivery status
   - Automatic audit logging

6. **Monitor Results**
   - Track successful deliveries
   - View failed delivery reports
   - Access comprehensive audit logs

### Department Pillars

The system supports various organizational structures:
- Human Resources
- Engineering
- Marketing
- Sales
- Operations
- Finance
- Customer Support
- And more...

## 🔧 Configuration

### Email Service Setup

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Get your API key** from the Resend dashboard
3. **Configure in Supabase**:
   - Go to your Supabase project settings
   - Navigate to Edge Functions secrets
   - Add `RESEND_API_KEY` with your Resend API key

### Domain Verification

For production email delivery:
1. Verify your domain in Resend
2. Configure DNS records as provided by Resend
3. Update the `from` address in the edge function

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   └── ui/            # Base UI components (shadcn/ui)
├── contexts/          # React contexts (Auth)
├── hooks/            # Custom React hooks
├── integrations/     # External service integrations
├── pages/           # Route components
├── styles/          # CSS and animations
└── utils/           # Utility functions
```

### Database Schema
```sql
-- Admin users table
admin_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  email TEXT UNIQUE,
  created_at TIMESTAMP
)

-- Employees table
employees (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  employee_id INTEGER UNIQUE,
  pillar TEXT,
  level TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Audit log table
admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID,
  action TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
)
```

### Security Model

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Role-based access control (admin-only)
- **Data Protection**: Row Level Security (RLS) policies
- **Input Validation**: Server-side sanitization and validation
- **Audit Trail**: Comprehensive logging of all actions

## 🔒 Security Features

### Data Protection
- **Row Level Security (RLS)** ensures users can only access authorized data
- **Input sanitization** prevents XSS and injection attacks
- **CORS protection** secures API endpoints
- **Rate limiting** prevents abuse and brute force attacks

### Audit & Compliance
- **Comprehensive audit logging** tracks all administrative actions
- **IP address and user agent tracking** for security monitoring
- **Failed attempt logging** for security analysis
- **Data access logging** for compliance requirements

### Authentication Security
- **Secure session management** with automatic timeout
- **Password validation** with minimum requirements
- **Failed login attempt tracking** with temporary lockouts
- **Secure token handling** for API authentication

## 📊 Performance Features

- **Optimized loading states** with skeleton screens and spinners
- **Efficient database queries** with proper indexing
- **Client-side caching** using TanStack Query
- **Lazy loading** for improved initial load times
- **Responsive images** and optimized assets

## 🚀 Deployment

### Frontend Deployment (Recommended: Vercel/Netlify)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel: Connect your GitHub repository
   - Netlify: Drag and drop the `dist` folder

### Backend Deployment

The backend is automatically deployed through Supabase:
- Database migrations are applied automatically
- Edge functions are deployed to Supabase's global network
- Authentication is handled by Supabase Auth

## 🧪 Testing

### Manual Testing Checklist

- [ ] Admin login/logout functionality
- [ ] Employee data loading and display
- [ ] Email composition and validation
- [ ] Department pillar selection
- [ ] Email sending (with and without Resend API)
- [ ] Audit logging verification
- [ ] Responsive design on mobile devices
- [ ] Error handling and user feedback

### Security Testing

- [ ] Unauthorized access attempts
- [ ] Input validation bypass attempts
- [ ] SQL injection prevention
- [ ] XSS attack prevention
- [ ] Rate limiting effectiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify Supabase credentials in environment variables
- Check if RLS policies are properly configured
- Ensure admin user exists in `admin_users` table

**Email Delivery Issues**
- Verify Gmail credentials are configured
- Check if 2FA is enabled on Gmail account
- Ensure app password is correctly generated
- Review email content for spam triggers

**Authentication Problems**
- Clear browser cache and cookies
- Verify user exists in Supabase Auth
- Check if user is registered as admin

### Getting Help

For technical support or feature requests:
1. Check the troubleshooting guide above
2. Review the audit logs for error details
3. Contact your system administrator

## 🎯 Future Enhancements

- **Email Templates**: Pre-built templates for common communications
- **Scheduling**: Ability to schedule emails for future delivery
- **Analytics Dashboard**: Advanced metrics and reporting
- **Multi-language Support**: Internationalization for global companies
- **Mobile App**: Native mobile application for administrators
- **Integration APIs**: Connect with HR systems and other tools

---

**Corporate Communications Portal** - Streamlining internal communications with security, efficiency, and professional design.

*Built with ❤️ using modern web technologies*