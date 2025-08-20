# Fleet Maintenance Management System

A comprehensive fleet maintenance management system built with Next.js 15, TypeScript, and Prisma. This system helps you manage trucks, maintenance records, mechanics, and users with real-time monitoring and predictive analytics.

## 🚀 Features

- **User Management**: Role-based access control (Admin, Manager, User)
- **Truck Management**: Add, edit, and track fleet vehicles with detailed information
- **Maintenance Tracking**: Schedule and track maintenance jobs with cost analysis
- **Mechanic Management**: Manage maintenance staff and their assignments
- **Real-time Monitoring**: Live dashboard with WebSocket connectivity
- **Predictive Analytics**: AI-powered maintenance predictions and alerts
- **Comprehensive Reports**: Generate detailed reports for maintenance costs and fleet status
- **Audit Logging**: Complete activity tracking and audit trails
- **File Upload**: Document and image attachments for trucks and maintenance records

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes with TypeScript
- **Database**: SQLite (default) or Neon (PostgreSQL) with Prisma ORM
- **Authentication**: JWT-based authentication
- **Real-time**: Socket.IO for WebSocket connections
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for data visualization
- **File Handling**: Built-in file upload and preview system

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Installation & Setup Tutorial

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd fleet-maintenance-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all the required packages including:
- Next.js and React
- Prisma and database clients
- UI components and styling libraries
- Authentication and security packages
- Real-time communication packages

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# WebSocket Configuration
WEBSOCKET_URL="http://localhost:3000"
WEBSOCKET_PATH="/socket.io"

# Application Settings
NEXT_PUBLIC_APP_NAME="Fleet Maintenance Management System"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload (Optional)
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB
```

### Step 4: Set Up the Database

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to the database
npm run db:push
```

This will:
- Create the SQLite database file
- Generate the Prisma client
- Set up all the required tables and relationships

### Step 5: Seed the Admin User

```bash
# Run the admin seed script
npx tsx src/lib/seed-admin.ts
```

This will create the default admin user with the following credentials:
- **Email**: admin@fleetmanager.com
- **Password**: admin123
- **Name**: Fleet Manager
- **Role**: ADMIN

### Step 6: Start the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Step 7: Verify the Setup

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the login page
3. Log in with the admin credentials:
   - Email: admin@fleetmanager.com
   - Password: admin123
4. You should be redirected to the dashboard

---

## 🌐 Alternative Setup: Neon Database

For production environments, we recommend using **Neon Database** (PostgreSQL) instead of SQLite for better scalability, performance, and reliability.

### Why Choose Neon Database?

- **Serverless PostgreSQL**: Automatically scales with your application
- **Branching**: Create isolated database branches for development and testing
- **Backup & Recovery**: Automated backups with point-in-time recovery
- **Global Edge Caching**: Faster query performance with edge caching
- **Connection Pooling**: Efficient connection management
- **Integration**: Seamless integration with Vercel and other platforms

### Prerequisites for Neon Setup

- Neon Database account (free tier available)
- Project created in Neon Console
- Database connection string

### Step 1: Create Neon Database

1. **Sign up for Neon**:
   ```bash
   # Visit https://neon.tech and create an account
   ```

2. **Create a new project**:
   - Log in to Neon Console
   - Click "New Project"
   - Choose a region closest to your users
   - Select PostgreSQL version (latest recommended)
   - Give your project a name (e.g., "fleet-maintenance-db")
   - Click "Create Project"

3. **Get connection details**:
   - Once project is created, go to Dashboard
   - Click on "Connection Details"
   - Copy the connection string (it will look like: `postgresql://username:password@hostname/dbname?sslmode=require`)

### Step 2: Update Environment Variables

Create or update your `.env` file with Neon database configuration:

```env
# Neon Database Configuration
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"

# Alternative format with connection pooling (recommended for production)
# DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&pgbouncer=true"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# WebSocket Configuration
WEBSOCKET_URL="http://localhost:3000"
WEBSOCKET_PATH="/socket.io"

# Application Settings
NEXT_PUBLIC_APP_NAME="Fleet Maintenance Management System"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload (Optional)
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB
```

### Step 3: Update Prisma Schema for PostgreSQL

The current schema should work with PostgreSQL, but let's ensure it's optimized:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add SSL mode for Neon
  sslMode  = "require"
}

// ... rest of the schema remains the same
```

### Step 4: Install Additional Dependencies

```bash
# Install PostgreSQL driver (if not already installed)
npm install pg

# Install Prisma with PostgreSQL support
npm install @prisma/client
```

### Step 5: Generate Prisma Client for PostgreSQL

```bash
# Generate Prisma client with PostgreSQL schema
npm run db:generate

# Create initial migration for PostgreSQL
npx prisma migrate dev --name init-postgresql
```

### Step 6: Push Schema to Neon Database

```bash
# Push the schema to Neon database
npx prisma db push

# Alternatively, use migrations for production
npx prisma migrate deploy
```

### Step 7: Seed the Admin User (Neon Database)

```bash
# Run the admin seed script with Neon database
npx tsx src/lib/seed-admin.ts
```

### Step 8: Verify Neon Database Connection

```bash
# Test database connection
npx prisma db execute --stdin

# Enter: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Press Ctrl+D to execute

# You should see all your tables listed
```

### Step 9: Start Development Server with Neon

```bash
# Start the development server
npm run dev
```

### Step 10: Monitor Neon Database

1. **Check Neon Dashboard**:
   - Monitor database performance
   - View query analytics
   - Check connection usage
   - Monitor storage usage

2. **Set up Alerts**:
   - Configure email alerts for high CPU usage
   - Set up storage limit notifications
   - Monitor connection pool usage

---

## 🔄 Migration from SQLite to Neon

If you have existing data in SQLite and want to migrate to Neon:

### Step 1: Export SQLite Data

```bash
# Install SQLite export tool
npm install -g sqlite-to-postgres

# Export data from SQLite
sqlite-to-postgres --source ./dev.db --destination ./export.sql
```

### Step 2: Import to Neon

```bash
# Use psql to import data to Neon
psql "$DATABASE_URL" < export.sql
```

### Step 3: Verify Migration

```bash
# Check record counts in both databases
# SQLite
sqlite3 dev.db "SELECT COUNT(*) FROM users;"

# Neon
npx prisma db execute --stdin --stdin "SELECT COUNT(*) FROM users;"
```

---

## 🚀 Production Deployment with Neon

### Environment Variables for Production

```env
# Production Neon Database
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&pgbouncer=true"

# Production Settings
NODE_ENV="production"
JWT_SECRET="your-production-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
WEBSOCKET_URL="https://your-domain.com"

# Security
CORS_ORIGIN="https://your-domain.com"
```

### Deployment to Vercel with Neon

1. **Connect Vercel to Neon**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project to Vercel
   vercel

   # Add environment variables
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   ```

2. **Deploy to Vercel**:
   ```bash
   # Build and deploy
   vercel --prod

   # Or use the standard build command
   npm run build
   vercel --prod
   ```

### Performance Optimization with Neon

1. **Enable Connection Pooling**:
   ```env
   DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&pgbouncer=true"
   ```

2. **Add Indexes for Performance**:
   ```sql
   -- Add these to your schema or run manually
   CREATE INDEX idx_trucks_vin ON trucks(vin);
   CREATE INDEX idx_maintenance_truck_id ON maintenance_records(truck_id);
   CREATE INDEX idx_maintenance_date ON maintenance_records(date_performed);
   CREATE INDEX idx_users_email ON users(email);
   ```

3. **Monitor Query Performance**:
   ```bash
   # Enable query logging in development
   npx prisma studio
   ```

---

## 🐛 Neon Database Troubleshooting

### Common Issues

1. **Connection Timeout**:
   ```bash
   # Add connection timeout to DATABASE_URL
   DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&connect_timeout=30"
   ```

2. **SSL Certificate Issues**:
   ```bash
   # Update SSL mode if needed
   DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&sslrootcert=/path/to/cert"
   ```

3. **Connection Pool Exhaustion**:
   ```bash
   # Use connection pooling
   DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require&pgbouncer=true&pool_size=20"
   ```

4. **Migration Failures**:
   ```bash
   # Reset database and retry
   npx prisma migrate reset --force
   npx prisma migrate dev --name fresh-start
   ```

### Neon Dashboard Monitoring

1. **Performance Metrics**:
   - CPU Usage
   - Memory Usage
   - Storage Usage
   - Connection Count

2. **Query Analytics**:
   - Slow queries
   - Query patterns
   - Index usage

3. **Alerts**:
   - Set up email notifications
   - Configure Slack alerts
   - Monitor usage thresholds

---

## 📊 Neon vs SQLite Comparison

| Feature | SQLite | Neon (PostgreSQL) |
|---------|---------|-------------------|
| **Use Case** | Development, Small Projects | Production, Large Scale |
| **Performance** | Good for small datasets | Excellent for large datasets |
| **Scalability** | Limited | Highly scalable |
| **Concurrent Users** | Limited | High concurrency |
| **Backups** | Manual | Automated |
| **Branching** | Not available | Database branching |
| **Cost** | Free | Free tier + paid plans |
| **Setup** | Simple | Requires Neon account |
| **Production Ready** | Not recommended | Production ready |

### When to Use SQLite:
- Development and testing
- Small projects with limited users
- Prototyping and MVPs
- Applications with simple data needs

### When to Use Neon:
- Production deployments
- Applications with many concurrent users
- Projects requiring high availability
- Applications needing scalability
- Enterprise-level deployments

## 📁 Project Structure

```
fleet-maintenance-system/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── trucks/        # Truck management endpoints
│   │   │   ├── maintenance/   # Maintenance record endpoints
│   │   │   ├── mechanics/     # Mechanic management endpoints
│   │   │   ├── users/         # User management endpoints
│   │   │   ├── admin/         # Admin-only endpoints
│   │   │   └── ...            # Other API endpoints
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── login/             # Login page
│   │   ├── trucks/            # Truck management pages
│   │   ├── maintenance/      # Maintenance tracking pages
│   │   ├── mechanics/        # Mechanic management pages
│   │   ├── users/             # User management pages
│   │   ├── admin/             # Admin panel pages
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout.tsx        # Main layout component
│   │   ├── navigation.tsx    # Navigation component
│   │   └── ...               # Other components
│   ├── lib/                  # Utility libraries
│   │   ├── db.ts            # Database connection
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── utils.ts         # General utilities
│   │   └── ...              # Other libraries
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React contexts
│   └── ...                  # Other source files
├── prisma/
│   └── schema.prisma        # Database schema
├── public/                  # Static files
├── scripts/                # Utility scripts
└── ...                     # Configuration files
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database

# Production
npm run build        # Build the application
npm run start        # Start production server
```

## 🎯 Core Functionality

### User Management

1. **Admin Role**: Full access to all features
   - Manage users and permissions
   - View audit logs and activities
   - System settings and configuration
   - Generate reports

2. **Manager Role**: Limited administrative access
   - Manage trucks and maintenance
   - View reports and analytics
   - Manage mechanics

3. **User Role**: Basic access
   - View assigned trucks
   - Create maintenance requests
   - View maintenance history

### Truck Management

- Add new trucks with VIN, make, model, year, and license plate
- Track current mileage and maintenance history
- Upload truck images and documents
- Monitor truck health and predictive alerts
- Soft delete support with recovery options

### Maintenance Tracking

- Schedule maintenance jobs with predefined tasks
- Track maintenance costs (parts and labor)
- Assign mechanics to maintenance jobs
- Upload maintenance documents and images
- Generate maintenance reports and analytics

### Real-time Features

- Live dashboard updates
- Real-time notifications
- WebSocket-based communication
- Offline support with local storage
- Automatic reconnection handling

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Audit logging for all activities
- Soft delete support for data recovery
- CORS protection
- Rate limiting (optional)

## 📊 Analytics and Reporting

- Maintenance cost analysis
- Fleet health monitoring
- Predictive maintenance alerts
- User activity reports
- System performance metrics
- Custom report generation

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Setup for Production

1. Set up production environment variables
2. Configure production database
3. Set up file storage (if using cloud storage)
4. Configure WebSocket server for production
5. Set up monitoring and logging

### Database Migration for Production

```bash
# Generate production migration
npx prisma migrate dev --name production-setup

# Deploy to production
npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL in .env file
   - Ensure database file exists
   - Run `npm run db:push` to recreate schema

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check user is approved and active
   - Clear browser cache and cookies

3. **WebSocket Connection Issues**
   - Check WebSocket URL configuration
   - Verify firewall settings
   - Check server logs for connection errors

4. **Build Issues**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors

### Log Files

- Development logs: `dev.log`
- Production logs: `server.log`
- Database queries: Check console output

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the logs for error messages
- Ensure all environment variables are properly set
- Verify database connectivity

---

## 📝 Quick Start Checklist

### SQLite Setup (Development)
- [ ] Clone the repository
- [ ] Install dependencies with `npm install`
- [ ] Set up environment variables in `.env` (SQLite: `DATABASE_URL="file:./dev.db"`)
- [ ] Run `npm run db:generate` to generate Prisma client
- [ ] Run `npm run db:push` to set up SQLite database
- [ ] Run `npx tsx src/lib/seed-admin.ts` to create admin user
- [ ] Start development server with `npm run dev`
- [ ] Log in with admin credentials (admin@fleetmanager.com / admin123)
- [ ] Explore the dashboard and features

### Neon Database Setup (Production)
- [ ] Create Neon Database account at https://neon.tech
- [ ] Create a new project in Neon Console
- [ ] Get connection string from Neon Dashboard
- [ ] Install dependencies with `npm install`
- [ ] Set up environment variables in `.env` (Neon: `DATABASE_URL="postgresql://..."`)
- [ ] Update Prisma schema to use PostgreSQL provider
- [ ] Run `npm run db:generate` to generate Prisma client
- [ ] Run `npx prisma migrate dev --name init-postgresql` to set up Neon database
- [ ] Run `npx tsx src/lib/seed-admin.ts` to create admin user
- [ ] Start development server with `npm run dev`
- [ ] Log in with admin credentials (admin@fleetmanager.com / admin123)
- [ ] Verify database connection through Neon Dashboard
- [ ] Set up monitoring and alerts in Neon Console

## 🎯 Next Steps

After setting up the system:

1. **Configure Settings**: Update company information and currency settings
2. **Add Mechanics**: Create mechanic profiles for maintenance assignments
3. **Add Trucks**: Import or manually add your fleet vehicles
4. **Set Up Maintenance Jobs**: Create predefined maintenance tasks
5. **Configure Notifications**: Set up email or in-app notifications
6. **Explore Reports**: Generate and customize reports for your needs

---

**Note**: This system is designed for production use. Ensure you change the default admin password and JWT secret before deploying to production.# fleet-maintenance-system
