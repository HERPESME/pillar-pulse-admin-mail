need changes
# Corporate Communications Portal

A secure web-based administrative portal designed for corporate communications management. This application enables administrators to efficiently send targeted communications to employees organized by department pillars.

## Overview

The Corporate Communications Portal is a professional-grade web application that streamlines internal company communications. Administrators can log in securely, compose messages, and send them to specific department groups (pillars) with just a few clicks.

## Key Features

### 🔐 Secure Authentication
- Admin-only access with email/password authentication
- Role-based security ensuring only authorized personnel can send communications
- Session management with automatic logout

### 📧 Email Management System
- Compose and send emails to entire department pillars
- Professional email templates with company branding
- Real-time delivery status and confirmation
- Support for rich text formatting in email content

### 🏢 Department Organization
- Employee management organized by pillars/departments
- Visual dashboard showing employee counts per pillar
- Easy selection of target departments for communications

### 📊 Admin Dashboard
- Clean, intuitive interface for administrators
- Real-time statistics and employee counts
- Email composition with live preview
- Delivery tracking and success metrics

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **Email Service**: Resend API for reliable email delivery
- **State Management**: TanStack Query for server state
- **Routing**: React Router for navigation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase project (for backend services)
- Resend account (for email delivery)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd corporate-communications-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Configure your Supabase project credentials
- Add your Resend API key to Supabase Edge Functions secrets

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Configuration

### Database Setup
The application uses Supabase as the backend with the following main tables:
- `admin_users` - Stores administrator account information
- `employees` - Contains employee data organized by pillars
- Row Level Security (RLS) policies ensure data access control

### Email Configuration
- Requires a valid Resend API key
- Domain verification needed for reliable email delivery
- Supports up to 3,000 emails per month on free tier

## Usage

### For Administrators

1. **Login**: Access the admin portal with your credentials
2. **Dashboard**: View employee statistics and pillar information
3. **Compose**: Create your message with subject and content
4. **Target**: Select which department pillar to send to
5. **Send**: Deploy your communication with one click
6. **Monitor**: Track delivery success and any failures

### Pillar Management
The system supports various department pillars such as:
- Human Resources
- Engineering
- Marketing
- Sales
- Operations
- And more...

## Security Features

- **Authentication**: Secure login system with session management
- **Authorization**: Role-based access control for admin functions
- **Data Protection**: Row Level Security on all database operations
- **API Security**: Protected endpoints with authentication verification

## Deployment

The application can be deployed to various platforms:
- Vercel (recommended for frontend)
- Netlify
- Any static hosting service with Node.js support

Supabase handles the backend infrastructure automatically.

## Support

For technical support or feature requests, contact your system administrator or development team.

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

*Corporate Communications Portal - Streamlining internal communications with security and efficiency.*
