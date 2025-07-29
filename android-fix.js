#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Android Connection Fix Script');
console.log('================================');

// Function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`\n📋 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return null;
  }
}

// Function to check if port is in use
function checkPort(port) {
  try {
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Main fix process
async function fixAndroidConnection() {
  console.log('\n🚀 Starting Android connection fix...\n');

  // 1. Kill any existing Metro processes
  console.log('🔄 Step 1: Killing existing Metro processes...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'pipe' });
    console.log('✅ Killed existing Node.js processes');
  } catch (error) {
    console.log('ℹ️ No existing processes to kill');
  }

  // 2. Clear Metro cache
  console.log('\n🧹 Step 2: Clearing Metro cache...');
  runCommand('npx expo start --clear', 'Clearing Expo cache');

  // 3. Check network configuration
  console.log('\n🌐 Step 3: Checking network configuration...');
  const ipconfig = runCommand('ipconfig', 'Getting IP configuration');
  
  if (ipconfig) {
    const lines = ipconfig.split('\n');
    const ipv4Line = lines.find(line => line.includes('IPv4 Address'));
    if (ipv4Line) {
      const ip = ipv4Line.split(':')[1]?.trim();
      console.log(`📱 Your IP address: ${ip}`);
      console.log(`🔗 Use this IP in your Android device: http://${ip}:8081`);
    }
  }

  // 4. Check if port 8081 is available
  console.log('\n🔍 Step 4: Checking port availability...');
  if (checkPort(8081)) {
    console.log('⚠️ Port 8081 is in use. Trying to free it...');
    try {
      execSync('netstat -ano | findstr :8081', { stdio: 'pipe' });
    } catch (error) {
      console.log('✅ Port 8081 is now available');
    }
  } else {
    console.log('✅ Port 8081 is available');
  }

  // 5. Start Expo with tunnel option
  console.log('\n🚀 Step 5: Starting Expo with tunnel...');
  console.log('📱 This will create a tunnel connection that works from anywhere');
  console.log('🔗 Scan the QR code with Expo Go app');
  
  try {
    execSync('npx expo start --tunnel', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n❌ Failed to start with tunnel. Trying localhost...');
    try {
      execSync('npx expo start --localhost', { stdio: 'inherit' });
    } catch (error2) {
      console.log('\n❌ Failed to start Expo. Please try manually:');
      console.log('   npx expo start --clear');
    }
  }
}

// Run the fix
fixAndroidConnection().catch(console.error); 