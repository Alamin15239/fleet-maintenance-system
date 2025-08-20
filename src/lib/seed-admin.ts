import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function seedAdmin() {
  try {
    console.log('Seeding admin user...')

    // Delete all existing users except the admin we want to keep
    const existingUsers = await db.user.findMany()
    console.log(`Found ${existingUsers.length} existing users`)

    // Delete all users first
    await db.user.deleteMany()
    console.log('Deleted all existing users')

    // Create the default admin user "Fleet Manager"
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await db.user.create({
      data: {
        email: 'admin@fleetmanager.com',
        name: 'Fleet Manager',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        isApproved: true,
        isDeleted: false,
        permissions: {
          canManageUsers: true,
          canManageTrucks: true,
          canManageMaintenance: true,
          canManageMechanics: true,
          canViewReports: true,
          canManageSettings: true,
          canDeleteData: true
        }
      }
    })

    console.log('Created admin user:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    })

    console.log('Admin user seeded successfully!')
    console.log('Login credentials:')
    console.log('Email: admin@fleetmanager.com')
    console.log('Password: admin123')
    console.log('Name: Fleet Manager')

  } catch (error) {
    console.error('Error seeding admin user:', error)
    throw error
  }
}

// Run the seed function
seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin user:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })