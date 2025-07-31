const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEventStorage() {
  console.log('🔍 Verifying Event Storage Setup...\n');

  try {
    // Step 1: Check if event-images bucket exists
    console.log('1️⃣ Checking event-images bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      return;
    }

    const eventImagesBucket = buckets.find(b => b.id === 'event-images');
    if (eventImagesBucket) {
      console.log('   ✅ event-images bucket exists');
      console.log(`   📁 Bucket settings:`);
      console.log(`      - Public: ${eventImagesBucket.public}`);
      console.log(`      - File size limit: ${eventImagesBucket.fileSizeLimit || 'unlimited'}`);
      console.log(`      - Allowed MIME types: ${eventImagesBucket.allowedMimeTypes?.join(', ') || 'all'}`);
    } else {
      console.log('   ❌ event-images bucket not found');
      console.log('   📋 Available buckets:', buckets.map(b => b.id).join(', '));
      console.log('\n   🔧 Please create the event-images bucket manually:');
      console.log('      1. Go to Supabase Dashboard > Storage');
      console.log('      2. Click "Create a new bucket"');
      console.log('      3. Set bucket name: event-images');
      console.log('      4. Check "Public bucket" ✅');
      console.log('      5. Set file size limit: 5MB');
      console.log('      6. Set allowed MIME types: image/jpeg, image/png, image/gif, image/webp');
      console.log('      7. Click "Create bucket"');
      return;
    }

    // Step 2: Test bucket access
    console.log('\n2️⃣ Testing bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (filesError) {
      console.error('   ❌ Error accessing bucket:', filesError);
    } else {
      console.log(`   ✅ Bucket access working - found ${files.length} files in event-covers/`);
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`      - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      }
    }

    // Step 3: Test URL generation
    console.log('\n3️⃣ Testing URL generation...');
    const testPath = 'event-covers/test-image.jpg';
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
    
    console.log(`   ✅ Public URL generation working:`);
    console.log(`      Test URL: ${urlData.publicUrl}`);

    // Step 4: Check events with cover images
    console.log('\n4️⃣ Checking events with cover images...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image')
      .not('cover_image', 'is', null)
      .neq('cover_image', '')
      .limit(5);

    if (eventsError) {
      console.error('   ❌ Error fetching events:', eventsError);
    } else {
      console.log(`   📋 Found ${events.length} events with cover images`);
      
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}: ${event.title}`);
        console.log(`      ID: ${event.id}`);
        console.log(`      Cover Image: ${event.cover_image}`);
        
        // Analyze the image URL
        if (event.cover_image) {
          if (event.cover_image.startsWith('http')) {
            console.log(`      ✅ Full URL detected`);
            
            // Check if it's from the correct bucket
            if (event.cover_image.includes('event-images')) {
              console.log(`      ✅ Correct bucket (event-images)`);
            } else if (event.cover_image.includes('images')) {
              console.log(`      ⚠️  Wrong bucket (images) - needs migration`);
            } else {
              console.log(`      ℹ️  External URL or unknown bucket`);
            }
          } else {
            console.log(`      ⚠️  Relative path - needs full URL`);
          }
        }
      });
    }

    console.log('\n🎉 Verification completed!');
    
    if (eventImagesBucket) {
      console.log('\n✅ Your event-images bucket is ready!');
      console.log('📱 You can now test uploading event images from the app.');
      console.log('🔗 Images will be accessible to all authenticated users.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyEventStorage(); 