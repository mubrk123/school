# Scholify - School Administration SaaS PRD

## Original Problem Statement
Build a SaaS app for school administration with:
1. Admission system for new student registration
2. Fee Management System with bill creation, payment tracking, and confirmation dialogs
3. Class-wise student database with detailed information
4. Daily attendance system with Present/Absent toggle buttons (not dropdown)
5. WhatsApp notification system using wa.me links

## User Choices
- JWT-based authentication
- Multiple roles: Principal (full access), Teacher (attendance only)
- Pre-defined classes (1-12)
- Multi-tenant (multiple schools)
- Light theme with dark fonts
- Supabase PostgreSQL backend

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI with SQLAlchemy (async)
- **Database**: Supabase PostgreSQL with Alembic migrations
- **Authentication**: JWT tokens with bcrypt password hashing

## User Personas
1. **Principal**: Full administrative access - students, fees, attendance, notifications
2. **Teacher**: Limited access - attendance marking only

## Core Requirements (Static)
- Multi-tenant school management
- Role-based access control
- Student CRUD operations
- Fee bill creation and payment tracking
- Attendance with toggle buttons
- WhatsApp notifications via wa.me links

## What's Been Implemented (Feb 11, 2026)
- ✅ School registration and login system
- ✅ JWT authentication with role-based access
- ✅ Dashboard with stats (students, classes, fees, attendance)
- ✅ Student admission form with all required fields
- ✅ Class-wise student listing with search/filter
- ✅ Student detail page with fee and attendance history
- ✅ Fee bill creation (Monthly, Registration, etc.)
- ✅ Fee assignment to classes and mark paid with confirmation
- ✅ Daily attendance with Present/Absent toggle buttons
- ✅ Notification system with WhatsApp links (wa.me)
- ✅ Mobile-responsive design
- ✅ Sidebar navigation (drawer on mobile)

## Database Schema
- schools, users, students, fee_bills, student_fees, attendance, notifications

## API Endpoints
- `/api/auth/register-school` - School registration
- `/api/auth/login` - User login
- `/api/students` - Student CRUD
- `/api/fee-bills` - Fee management
- `/api/attendance` - Attendance marking
- `/api/notifications` - WhatsApp notifications

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Authentication system
- [x] Student management
- [x] Fee management
- [x] Attendance system
- [x] Notifications

### P1 (Important)
- [ ] Teacher account creation by Principal
- [ ] Attendance reports/analytics
- [ ] Fee collection reports
- [ ] Bulk WhatsApp sending

### P2 (Nice to have)
- [ ] Export data to Excel/PDF
- [ ] Parent portal
- [ ] SMS notifications
- [ ] Academic year management

## Next Tasks
1. Add teacher management (create/edit teachers)
2. Implement attendance reports with charts
3. Add fee collection reports
4. Bulk attendance marking
5. Student photo upload
