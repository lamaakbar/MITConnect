const { createClient } = require('@supabase/supabase-js');

// Direct Supabase configuration
const SUPABASE_URL = 'https://kiijnueatpbsenrtepxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies...\n');

  try {
    // Check if we can list files (this should work with anon key)
    console.log('1️⃣ Testing file listing (should work with anon key)...');
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (listError) {
      console.log('   ❌ Cannot list files:', listError.message);
    } else {
      console.log('   ✅ Can list files (read access works)');
      console.log(`   📁 Found ${files.length} files`);
    }

    // Check if we can upload (this should work with authenticated user)
    console.log('\n2️⃣ Testing upload (requires authenticated user)...');
    
    // First, try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('   ❌ Session error:', sessionError.message);
    } else if (!session) {
      console.log('   ⚠️  No active session (user not logged in)');
      console.log('   📋 This explains why uploads are failing');
      console.log('   💡 Uploads require authenticated user, not anon key');
    } else {
      console.log('   ✅ User is authenticated:', session.user.id);
      
      // Test upload with authenticated user
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const testBuffer = Buffer.from(testImageBase64, 'base64');
      const testFileName = `auth-test-${Date.now()}.png`;
      const testPath = `event-covers/${testFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(testPath, testBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.log('   ❌ Upload still failed:', uploadError.message);
      } else {
        console.log('   ✅ Upload successful with authenticated user!');
        console.log('   📁 Uploaded file path:', uploadData.path);
        
        // Clean up
        await supabase.storage.from('event-images').remove([testPath]);
        console.log('   🧹 Test file cleaned up');
      }
    }

    // Check current RLS policies by trying to query storage.objects
    console.log('\n3️⃣ Checking storage.objects table access...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);

      if (policyError) {
        console.log('   ❌ Cannot access storage.objects:', policyError.message);
        if (policyError.message.includes('row-level security policy')) {
          console.log('   🔧 RLS policies are blocking access to storage.objects table');
        }
      } else {
        console.log('   ✅ Can access storage.objects table');
      }
    } catch (error) {
      console.log('   ❌ Error accessing storage.objects:', error.message);
    }

    // Summary and recommendations
    console.log('\n📋 ANALYSIS:');
    if (!session) {
      console.log('   ❌ No authenticated session found');
      console.log('   💡 This is why uploads are failing');
      console.log('   📋 RLS policies require authenticated users for uploads');
      console.log('\n🔧 SOLUTION:');
      console.log('   1. Make sure user is logged in when uploading images');
      console.log('   2. Check that supabase.auth.getSession() returns a valid session');
      console.log('   3. Verify RLS policies allow authenticated users to INSERT');
    } else {
      console.log('   ✅ User is authenticated');
      console.log('   ❌ But uploads are still failing');
      console.log('   🔧 RLS policies may need adjustment');
    }

  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

// Run the check
checkRLSPolicies(); 