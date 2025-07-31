const { createClient } = require('@supabase/supabase-js');

// Direct Supabase configuration
const SUPABASE_URL = 'https://kiijnueatpbsenrtepxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUploadFlow() {
  console.log('🧪 Testing Upload Flow and RLS Policies...\n');

  try {
    // Test 1: Check if event-images bucket is accessible
    console.log('1️⃣ Testing event-images bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (listError) {
      console.log('   ❌ Cannot access event-images bucket:', listError.message);
      console.log('   🔧 This suggests RLS policies are not set up correctly');
    } else {
      console.log('   ✅ event-images bucket is accessible');
      console.log(`   📁 Found ${files.length} files in event-covers folder`);
    }

    // Test 2: Check RLS policies on storage.objects
    console.log('\n2️⃣ Testing storage.objects RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('storage.objects')
      .select('*')
      .limit(1);

    if (policyError) {
      console.log('   ❌ RLS policy error:', policyError.message);
      if (policyError.message.includes('row-level security policy')) {
        console.log('   🔧 RLS policies need to be configured');
      }
    } else {
      console.log('   ✅ RLS policies allow access to storage.objects');
    }

    // Test 3: Test upload to event-images bucket
    console.log('\n3️⃣ Testing upload to event-images bucket...');
    
    // Create a simple test file (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testBuffer = Buffer.from(testImageBase64, 'base64');
    const testFileName = `test-${Date.now()}.png`;
    const testPath = `event-covers/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(testPath, testBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.log('   ❌ Upload failed:', uploadError.message);
      if (uploadError.message.includes('row-level security policy')) {
        console.log('   🔧 RLS policies are blocking uploads');
        console.log('   📋 Run the SQL script to fix RLS policies');
      }
    } else {
      console.log('   ✅ Upload successful!');
      console.log('   📁 Uploaded file path:', uploadData.path);
      
      // Test 4: Get public URL
      console.log('\n4️⃣ Testing public URL generation...');
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
      
      if (urlData && urlData.publicUrl) {
        console.log('   ✅ Public URL generated successfully');
        console.log('   🔗 URL:', urlData.publicUrl);
        
        // Clean up test file
        console.log('\n5️⃣ Cleaning up test file...');
        const { error: deleteError } = await supabase.storage
          .from('event-images')
          .remove([testPath]);
        
        if (deleteError) {
          console.log('   ⚠️  Could not delete test file:', deleteError.message);
        } else {
          console.log('   ✅ Test file cleaned up');
        }
      } else {
        console.log('   ❌ Failed to generate public URL');
      }
    }

    // Test 5: Check events table RLS
    console.log('\n6️⃣ Testing events table RLS...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .limit(1);

    if (eventsError) {
      console.log('   ❌ Events table RLS error:', eventsError.message);
      if (eventsError.message.includes('row-level security policy')) {
        console.log('   🔧 Events table RLS policies need to be configured');
      }
    } else {
      console.log('   ✅ Events table RLS policies allow access');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testUploadFlow(); 