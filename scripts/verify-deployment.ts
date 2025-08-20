import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDeployment() {
  console.log('🔍 Verifying Fleet Management System deployment...\n')
  
  const results = {
    database: { status: 'pending', message: '' },
    adminUser: { status: 'pending', message: '' },
    settings: { status: 'pending', message: '' },
    sampleData: { status: 'pending', message: '' },
    overall: { status: 'pending', message: '' }
  }

  try {
    // 1. Test Database Connection
    console.log('1. Testing database connection...')
    try {
      await prisma.$queryRaw`SELECT 1 as test, CURRENT_TIMESTAMP as time`
      results.database = { status: 'success', message: '✅ Database connection successful' }
      console.log(results.database.message)
    } catch (error) {
      results.database = { 
        status: 'failed', 
        message: `❌ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      console.log(results.database.message)
      return results // Exit early if database fails
    }

    // 2. Test Admin User
    console.log('\n2. Testing admin user...')
    try {
      const adminUser = await prisma.user.findUnique({
        where: { email: 'alamin.kha.saadfreeh@gmail.com' }
      })
      
      if (adminUser) {
        results.adminUser = { 
          status: 'success', 
          message: `✅ Admin user found: ${adminUser.email} (${adminUser.role})`
        }
        console.log(results.adminUser.message)
      } else {
        results.adminUser = { 
          status: 'failed', 
          message: '❌ Admin user not found. Run setup script to create admin user.'
        }
        console.log(results.adminUser.message)
      }
    } catch (error) {
      results.adminUser = { 
        status: 'failed', 
        message: `❌ Admin user check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      console.log(results.adminUser.message)
    }

    // 3. Test Settings
    console.log('\n3. Testing settings...')
    try {
      const settings = await prisma.settings.findFirst()
      
      if (settings) {
        results.settings = { 
          status: 'success', 
          message: `✅ Settings found: ${settings.currencyCode} (${settings.currencySymbol})`
        }
        console.log(results.settings.message)
      } else {
        results.settings = { 
          status: 'failed', 
          message: '❌ Settings not found. Run setup script to create default settings.'
        }
        console.log(results.settings.message)
      }
    } catch (error) {
      results.settings = { 
        status: 'failed', 
        message: `❌ Settings check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      console.log(results.settings.message)
    }

    // 4. Test Sample Data
    console.log('\n4. Testing sample data...')
    try {
      const [mechanicCount, truckCount, jobCount] = await Promise.all([
        prisma.mechanic.count(),
        prisma.truck.count(),
        prisma.maintenanceJob.count()
      ])
      
      const sampleDataStatus = [
        mechanicCount > 0,
        truckCount > 0,
        jobCount > 0
      ].every(Boolean)

      if (sampleDataStatus) {
        results.sampleData = { 
          status: 'success', 
          message: `✅ Sample data found: ${mechanicCount} mechanics, ${truckCount} trucks, ${jobCount} maintenance jobs`
        }
        console.log(results.sampleData.message)
      } else {
        results.sampleData = { 
          status: 'warning', 
          message: `⚠️  Incomplete sample data: ${mechanicCount} mechanics, ${truckCount} trucks, ${jobCount} maintenance jobs`
        }
        console.log(results.sampleData.message)
      }
    } catch (error) {
      results.sampleData = { 
        status: 'failed', 
        message: `❌ Sample data check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      console.log(results.sampleData.message)
    }

    // 5. Overall Status
    console.log('\n5. Overall deployment status...')
    const allSuccessful = [
      results.database.status === 'success',
      results.adminUser.status === 'success',
      results.settings.status === 'success'
    ].every(Boolean)

    if (allSuccessful) {
      results.overall = { 
        status: 'success', 
        message: '🎉 Deployment verification successful! Your Fleet Management System is ready to use.'
      }
      console.log(results.overall.message)
    } else {
      results.overall = { 
        status: 'failed', 
        message: '❌ Deployment verification failed. Please check the issues above and run the setup script.'
      }
      console.log(results.overall.message)
    }

  } catch (error) {
    results.overall = { 
      status: 'error', 
      message: `❌ Verification failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    console.log(results.overall.message)
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Database:     ${results.database.status.toUpperCase()}`)
  console.log(`Admin User:   ${results.adminUser.status.toUpperCase()}`)
  console.log(`Settings:     ${results.settings.status.toUpperCase()}`)
  console.log(`Sample Data:  ${results.sampleData.status.toUpperCase()}`)
  console.log(`Overall:      ${results.overall.status.toUpperCase()}`)
  console.log('='.repeat(60))

  // Provide recommendations
  console.log('\nRECOMMENDATIONS:')
  if (results.database.status !== 'success') {
    console.log('• Check your DATABASE_URL environment variable')
    console.log('• Ensure your database is accessible and allows connections')
    console.log('• Verify SSL settings in your database connection string')
  }
  
  if (results.adminUser.status !== 'success') {
    console.log('• Run the setup script: npx tsx scripts/vercel-setup.ts')
    console.log('• Or manually create the admin user in the database')
  }
  
  if (results.settings.status !== 'success') {
    console.log('• Run the setup script to create default settings')
  }
  
  if (results.sampleData.status === 'failed') {
    console.log('• Run the setup script to create sample data')
  } else if (results.sampleData.status === 'warning') {
    console.log('• Consider running the setup script to complete sample data')
  }

  if (results.overall.status === 'success') {
    console.log('\n🚀 Your system is ready! Login with:')
    console.log('   Email: alamin.kha.saadfreeh@gmail.com')
    console.log('   Password: oOck7534#@')
  }

  return results
}

// Run verification
verifyDeployment()
  .catch((e) => {
    console.error('❌ Verification script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })