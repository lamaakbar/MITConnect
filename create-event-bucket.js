const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEventBucket() {
  console.log('🚀 Creating event-images bucket...\n');

  try {
    // Step 1: Check if bucket already exists
    console.log('1️⃣ Checking if event-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      return;
    }

    const eventImagesBucket = buckets.find(b => b.id === 'event-images');
    if (eventImagesBucket) {
      console.log('   ✅ event-images bucket already exists');
      console.log(`   📁 Bucket settings:`);
      console.log(`      - Public: ${eventImagesBucket.public}`);
      console.log(`      - File size limit: ${eventImagesBucket.fileSizeLimit || 'unlimited'}`);
      console.log(`      - Allowed MIME types: ${eventImagesBucket.allowedMimeTypes?.join(', ') || 'all'}`);
      return;
    }

    // Step 2: Create the bucket
    console.log('2️⃣ Creating event-images bucket...');
    const { data: bucketData, error: createError } = await supabase.storage.createBucket('event-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('   ❌ Error creating bucket:', createError);
      console.log('   🔧 This might be a permissions issue. Try creating manually in Supabase dashboard.');
      return;
    }

    console.log('   ✅ event-images bucket created successfully');
    console.log('   📁 Bucket settings:', {
      public: bucketData.public,
      allowedMimeTypes: bucketData.allowedMimeTypes,
      fileSizeLimit: bucketData.fileSizeLimit
    });

    // Step 3: Test bucket access
    console.log('\n3️⃣ Testing bucket access...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (testError) {
      console.error('   ❌ Error testing bucket access:', testError);
    } else {
      console.log(`   ✅ Bucket access working - found ${testFiles.length} files in event-covers/`);
    }

    // Step 4: Test URL generation
    console.log('\n4️⃣ Testing URL generation...');
    const testPath = 'event-covers/test-image.jpg';
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
    
    console.log(`   ✅ Public URL generation working:`);
    console.log(`      Test URL: ${urlData.publicUrl}`);

    console.log('\n🎉 event-images bucket setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Set up RLS policies (run the SQL script)');
    console.log('   2. Test uploading an event image from the app');
    console.log('   3. Verify the image appears correctly for all user roles');

  } catch (error) {
    console.error('❌ Bucket creation failed:', error);
  }
}

// Run the bucket creation
createEventBucket(); 