const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBucketVisibility() {
  console.log('🔍 Debugging Bucket Visibility Issue...\n');

  try {
    // Step 1: List all buckets
    console.log('1️⃣ Listing all buckets via API...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      console.error('   🔍 Error details:', JSON.stringify(bucketsError, null, 2));
      return;
    }

    console.log(`   📋 Found ${buckets.length} buckets via API:`);
    buckets.forEach((bucket, index) => {
      console.log(`      ${index + 1}. ${bucket.id} (public: ${bucket.public})`);
    });

    // Step 2: Check if event-images exists
    const eventImagesBucket = buckets.find(b => b.id === 'event-images');
    console.log(`\n2️⃣ event-images bucket via API: ${eventImagesBucket ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Step 3: Try to access event-images directly
    console.log('\n3️⃣ Testing direct access to event-images...');
    try {
      const { data: files, error: filesError } = await supabase.storage
        .from('event-images')
        .list('', { limit: 1 });

      if (filesError) {
        console.error('   ❌ Direct access failed:', filesError.message);
        console.error('   🔍 Error details:', JSON.stringify(filesError, null, 2));
      } else {
        console.log('   ✅ Direct access successful!');
        console.log(`   📁 Found ${files.length} files in root`);
      }
    } catch (directError) {
      console.error('   ❌ Direct access exception:', directError.message);
    }

    // Step 4: Test other buckets for comparison
    console.log('\n4️⃣ Testing other buckets for comparison...');
    const testBuckets = ['images', 'highlight-images'];
    
    for (const bucketName of testBuckets) {
      try {
        const { data: testFiles, error: testError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });

        if (testError) {
          console.log(`   ❌ ${bucketName}: ${testError.message}`);
        } else {
          console.log(`   ✅ ${bucketName}: Accessible (${testFiles.length} files)`);
        }
      } catch (error) {
        console.log(`   ❌ ${bucketName}: Exception - ${error.message}`);
      }
    }

    // Step 5: Test bucket creation (this might fail due to permissions)
    console.log('\n5️⃣ Testing bucket creation permissions...');
    try {
      const { data: createData, error: createError } = await supabase.storage.createBucket('test-bucket-visibility', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800 // 50MB
      });

      if (createError) {
        console.log(`   ❌ Cannot create buckets: ${createError.message}`);
        console.log('   ℹ️  This is normal - anon key typically cannot create buckets');
      } else {
        console.log('   ✅ Bucket creation successful!');
        console.log('   ⚠️  This is unusual - anon key should not be able to create buckets');
      }
    } catch (createException) {
      console.log(`   ❌ Bucket creation exception: ${createException.message}`);
    }

    // Step 6: Check authentication status
    console.log('\n6️⃣ Checking authentication status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('   ❌ Auth check failed:', authError.message);
    } else if (session) {
      console.log('   ✅ Authenticated user:', session.user.email);
      console.log('   👤 User role:', session.user.user_metadata?.role || 'unknown');
    } else {
      console.log('   ℹ️  No authenticated session (using anon key)');
    }

    // Step 7: Test with different client configuration
    console.log('\n7️⃣ Testing with different client configuration...');
    const testClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: testBuckets2, error: testError2 } = await testClient.storage.listBuckets();
    
    if (testError2) {
      console.log('   ❌ Test client failed:', testError2.message);
    } else {
      const testEventImages = testBuckets2.find(b => b.id === 'event-images');
      console.log(`   ${testEventImages ? '✅' : '❌'} Test client sees event-images: ${testEventImages ? 'YES' : 'NO'}`);
    }

    // Step 8: Summary and recommendations
    console.log('\n📊 Summary:');
    console.log(`   📋 Total buckets via API: ${buckets.length}`);
    console.log(`   🎯 event-images visible: ${eventImagesBucket ? 'YES' : 'NO'}`);
    console.log(`   🔑 Using anon key: ${!session ? 'YES' : 'NO'}`);

    if (!eventImagesBucket) {
      console.log('\n🔧 Possible Solutions:');
      console.log('   1. Check if bucket was created with different permissions');
      console.log('   2. Verify bucket name spelling (case-sensitive)');
      console.log('   3. Check if bucket is in a different project/region');
      console.log('   4. Try creating bucket via API with service role key');
      console.log('   5. Check if there are any RLS policies blocking access');
      console.log('   6. Verify the bucket is actually public in dashboard');
    } else {
      console.log('\n🎉 Bucket is visible! The issue might be elsewhere.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugBucketVisibility(); 