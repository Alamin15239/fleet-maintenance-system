import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

console.log('🔍 Getting environment variables for Vercel deployment...\n')

// Try to get the actual DATABASE_URL from current environment
const currentDbUrl = process.env.DATABASE_URL
console.log('Current DATABASE_URL:', currentDbUrl ? '✅ Set' : '❌ Missing')

// If DATABASE_URL is not set in environment, try to get it from .env
if (!currentDbUrl) {
  try {
    const envContent = readFileSync('.env', 'utf8')
    const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
    if (dbUrlMatch && dbUrlMatch[1] && !dbUrlMatch[1].includes('username:password')) {
      console.log('Found DATABASE_URL in .env file:', dbUrlMatch[1])
    }
  } catch (error) {
    console.log('Could not read .env file')
  }
}

// Generate JWT secret if not set
const generateJwtSecret = () => {
  try {
    return execSync('openssl rand -base64 32', { encoding: 'utf8' }).trim()
  } catch (error) {
    // Fallback if openssl is not available
    return 'your-generated-jwt-secret-' + Math.random().toString(36).substring(2)
  }
}

const jwtSecret = process.env.JWT_SECRET || generateJwtSecret()
console.log('JWT Secret:', jwtSecret ? '✅ Generated' : '❌ Missing')

// Get BLOB token
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_VoY1QDdBuwduIFtP_vMCJ6zlWP2qRvrl2xQD7imXEys73iE'
console.log('BLOB Token:', blobToken ? '✅ Set' : '❌ Missing')

console.log('\n📋 Copy these variables to your Vercel Environment Variables:')
console.log('=====================================\n')

console.log('DATABASE_URL=' + (currentDbUrl || 'your-actual-database-url-here'))
console.log('JWT_SECRET=' + jwtSecret)
console.log('BLOB_READ_WRITE_TOKEN=' + blobToken)

console.log('\n🚀 Steps to deploy to Vercel:')
console.log('1. Go to your Vercel project dashboard')
console.log('2. Navigate to Settings → Environment Variables')
console.log('3. Add each variable above with its value')
console.log('4. Redeploy your application')
console.log('5. Test the comprehensive test endpoint: https://your-app.vercel.app/api/comprehensive-test')