# SazeLogistics App Structure

## Overview
Saze Logistics is a logistics-based food ordering platform available on both web (Next.js) and mobile (Expo - React Native). The app includes four main roles:
- 
- **User** (Default role)
- **Rider** (Registers separately, provides additional details)
- **Vendor** (Registers separately, provides additional details)
- **Admin** (Has additional tools like support and media management)

To prevent redundant code, the project follows a **monorepo** structure with shared utilities, components, and logic.

---

## Folder Structure
```
saze-logistics/
├── apps/
│   ├── web/                # Next.js App (Frontend + API Routes)
│   │   ├── app/
│   │   │   ├── (admin)
│   │   │   ├── (rider)
│   │   │   ├── (user)
│   │   │   ├── (root)
│   │   │   └── (vendor)
│   │   ├── components/   # Reusable components
│   │   │   ├── admin/
│   │   │   ├── rider/
│   │   │   ├── user/
│   │   │   ├── vendor/
│   │   ├── pages/
│   │   │   ├── index.tsx   # Landing page
│   │   │   ├── login.tsx   # Login page
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           └── login.ts  # API route for login using Supabase
│   │   ├── public/         # Public assets (images, etc.)
│   │   ├── styles/         # CSS/SCSS files
│   │   ├── .env.local      # Environment variables for Supabase
│   │   └── package.json
│   ├── mobile/             # Expo React Native App
│   │   ├── App.tsx         # Main entry file
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   └── LoginScreen.tsx  # Login screen
│   │   │   └── supabaseClient.ts    # Supabase client setup
│   │   ├── app.json        # Expo configuration
│   │   └── package.json
├── packages/
│   └── shared/             # Shared logic, types, utilities
│       ├── auth.ts         # Common authentication helpers (if needed)
│       └── types.ts        # Shared TypeScript types (User, Order, etc.)
├── .gitignore
└── package.json            # Root package.json for managing dependencies
```

---

## Role-Based Authentication & Navigation
### Authentication Flow
- Users, Riders, and Vendors register separately.
- Admins are created manually or through a specific invite system.
- Authenticated users receive a token and role-based permissions.

### Web (Next.js)
- Uses NextAuth or a custom authentication system.
- Middleware checks user roles before granting access to pages.
- Dynamic routing for user, rider, vendor, and admin dashboards.

### Mobile (Expo - React Native)
- Uses Supabase Auth or a backend-based JWT system.
- React Navigation for role-based screens.
- Secure storage for tokens.

---

## Shared Code (Packages/Shared)
### Reusable Components
- Buttons, Inputs, Modals, Cards, etc.

### Hooks
- `useAuth()` - Handles authentication logic.
- `useFetch()` - Fetch wrapper to prevent duplicate calls.

### Utilities
- `auth.ts` - Token validation, user role checks.
- `constants.ts` - API endpoints, role definitions.

### Types
- Defines TypeScript interfaces for User, Rider, Vendor, Admin, Orders, etc.

---

## Admin Features
- **User Management** (View, delete, suspend users)
- **Order Management** (Track orders, resolve disputes)
- **Support & Media Management** (Handle tickets, upload media)
- **Dashboard Analytics** (Track sales, vendors, deliveries)

---

## Next Steps
1. **Set up monorepo with Turborepo**
2. **Implement authentication system**
3. **Define API routes and database schema**
4. **Develop role-based UI components**

