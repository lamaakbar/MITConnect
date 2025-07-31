const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEventStorage() {
  console.log('🚀 Setting up Event Storage Infrastructure...\n');

  try {
    // Step 1: Check existing buckets
    console.log('1️⃣ Checking existing buckets...');
    const { data: existingBuckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(`   📋 Found ${existingBuckets.length} existing buckets:`, existingBuckets.map(b => b.id));

    // Step 2: Create event-images bucket if it doesn't exist
    console.log('\n2️⃣ Creating event-images bucket...');
    const eventImagesBucketExists = existingBuckets.some(b => b.id === 'event-images');
    
    if (eventImagesBucketExists) {
      console.log('   ✅ event-images bucket already exists');
    } else {
      const { data: bucketData, error: createError } = await supabase.storage.createBucket('event-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error('   ❌ Error creating bucket:', createError);
        return;
      }

      console.log('   ✅ event-images bucket created successfully');
      console.log('   📁 Bucket settings:', {
        public: bucketData.public,
        allowedMimeTypes: bucketData.allowedMimeTypes,
        fileSizeLimit: bucketData.fileSizeLimit
      });
    }

    // Step 3: Create event-covers folder structure
    console.log('\n3️⃣ Creating folder structure...');
    try {
      // Create a placeholder file to establish the folder structure
      const placeholderData = Buffer.from('placeholder');
      const { error: folderError } = await supabase.storage
        .from('event-images')
        .upload('event-covers/.placeholder', placeholderData, {
          contentType: 'text/plain',
          upsert: true
        });

      if (folderError) {
        console.log('   ⚠️  Folder creation note:', folderError.message);
      } else {
        console.log('   ✅ event-covers folder structure created');
      }
    } catch (folderError) {
      console.log('   ℹ️  Folder structure will be created automatically on first upload');
    }

    // Step 4: Set up RLS policies via SQL
    console.log('\n4️⃣ Setting up RLS policies...');
    const rlsPolicies = `
      -- Enable RLS on storage.objects
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Policy for public read access to event-images bucket
      CREATE POLICY "Public read access for event-images" ON storage.objects
        FOR SELECT USING (bucket_id = 'event-images');

      -- Policy for admin insert access to event-images bucket
      CREATE POLICY "Admin insert access for event-images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'event-images' 
          AND auth.role() = 'authenticated'
          AND (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          )
        );

      -- Policy for admin update access to event-images bucket
      CREATE POLICY "Admin update access for event-images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'event-images' 
          AND auth.role() = 'authenticated'
          AND (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          )
        );

      -- Policy for admin delete access to event-images bucket
      CREATE POLICY "Admin delete access for event-images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'event-images' 
          AND auth.role() = 'authenticated'
          AND (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          )
        );
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsPolicies });
    
    if (rlsError) {
      console.log('   ⚠️  RLS policies may need to be set up manually in Supabase dashboard');
      console.log('   📋 Required policies:');
      console.log('      - Public read access for event-images bucket');
      console.log('      - Admin-only insert/update/delete for event-images bucket');
    } else {
      console.log('   ✅ RLS policies created successfully');
    }

    // Step 5: Test bucket access
    console.log('\n5️⃣ Testing bucket access...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (testError) {
      console.error('   ❌ Error testing bucket access:', testError);
    } else {
      console.log(`   ✅ Bucket access working - found ${testFiles.length} files in event-covers/`);
    }

    // Step 6: Verify bucket configuration
    console.log('\n6️⃣ Verifying bucket configuration...');
    const { data: buckets, error: verifyError } = await supabase.storage.listBuckets();
    
    if (verifyError) {
      console.error('   ❌ Error verifying buckets:', verifyError);
    } else {
      const eventBucket = buckets.find(b => b.id === 'event-images');
      if (eventBucket) {
        console.log('   ✅ event-images bucket verified:');
        console.log(`      - Public: ${eventBucket.public}`);
        console.log(`      - File size limit: ${eventBucket.fileSizeLimit || 'unlimited'}`);
        console.log(`      - Allowed MIME types: ${eventBucket.allowedMimeTypes?.join(', ') || 'all'}`);
      }
    }

    console.log('\n🎉 Event storage setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test uploading an event image from the app');
    console.log('   2. Verify the image appears correctly for all user roles');
    console.log('   3. Run the migration script if you have existing events with images');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupEventStorage(); 