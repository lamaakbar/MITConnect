const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleImageCheck() {
  console.log('🔍 Simple Image Flow Check...\n');

  try {
    // Step 1: Check all available buckets
    console.log('1️⃣ Checking all available buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(`   📋 Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`      - ${bucket.id} (public: ${bucket.public})`);
    });

    // Step 2: Check if event-images bucket exists
    const eventImagesBucket = buckets.find(b => b.id === 'event-images');
    if (eventImagesBucket) {
      console.log('\n2️⃣ event-images bucket found!');
      console.log(`   📁 Bucket settings:`);
      console.log(`      - Public: ${eventImagesBucket.public}`);
      console.log(`      - File size limit: ${eventImagesBucket.fileSizeLimit || 'unlimited'}`);
      console.log(`      - Allowed MIME types: ${eventImagesBucket.allowedMimeTypes?.join(', ') || 'all'}`);
    } else {
      console.log('\n2️⃣ event-images bucket NOT found');
      console.log('   🔧 You need to create the event-images bucket manually in Supabase dashboard');
      return;
    }

    // Step 3: Test bucket access and list files
    console.log('\n3️⃣ Testing event-images bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (filesError) {
      console.error('   ❌ Error accessing bucket:', filesError);
      console.log('   🔧 This might be a permissions issue. Check RLS policies.');
    } else {
      console.log(`   ✅ Bucket access working - found ${files.length} files in event-covers/`);
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`      - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      } else {
        console.log('   ℹ️  No files found in event-covers/ folder');
      }
    }

    // Step 4: Test URL generation
    console.log('\n4️⃣ Testing URL generation...');
    const testPath = 'event-covers/test-image.jpg';
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
    
    console.log(`   ✅ Public URL generation working:`);
    console.log(`      Test URL: ${urlData.publicUrl}`);

    // Step 5: Check events with cover images in database
    console.log('\n5️⃣ Checking events with cover images in database...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image, created_at')
      .not('cover_image', 'is', null)
      .neq('cover_image', '')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('   ❌ Error fetching events:', eventsError);
    } else {
      console.log(`   📋 Found ${events.length} events with cover images`);
      
      if (events.length === 0) {
        console.log('   ℹ️  No events with cover images found in database');
      } else {
        events.forEach((event, index) => {
          console.log(`\n   Event ${index + 1}: ${event.title}`);
          console.log(`      ID: ${event.id}`);
          console.log(`      Cover Image: ${event.cover_image}`);
          console.log(`      Created: ${event.created_at}`);
          
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
              console.log(`      ❌ Not a full URL - this is the problem!`);
              console.log(`      💡 This should be a full Supabase storage URL`);
            }
          }
        });
      }
    }

    // Step 6: Check if there are any events with images in wrong bucket
    console.log('\n6️⃣ Checking for events with images in wrong bucket...');
    const { data: wrongBucketEvents, error: wrongBucketError } = await supabase
      .from('events')
      .select('id, title, cover_image')
      .not('cover_image', 'is', null)
      .neq('cover_image', '')
      .like('cover_image', '%images/%')
      .not('cover_image', 'like', '%event-images%');

    if (wrongBucketError) {
      console.error('   ❌ Error checking wrong bucket events:', wrongBucketError);
    } else {
      console.log(`   📋 Found ${wrongBucketEvents.length} events with images in wrong bucket`);
      if (wrongBucketEvents.length > 0) {
        wrongBucketEvents.forEach(event => {
          console.log(`      - ${event.title}: ${event.cover_image}`);
        });
        console.log('   🔧 These events need to be migrated to event-images bucket');
      }
    }

    // Step 7: Summary and recommendations
    console.log('\n📊 Summary:');
    console.log(`   ✅ Buckets found: ${buckets.length}`);
    console.log(`   ✅ event-images bucket: ${eventImagesBucket ? 'EXISTS' : 'MISSING'}`);
    console.log(`   ✅ Events with cover images: ${events.length}`);
    console.log(`   ✅ Events in wrong bucket: ${wrongBucketEvents.length}`);
    
    if (eventImagesBucket) {
      console.log('\n🎯 Current Status:');
      console.log('   ✅ event-images bucket exists and is configured');
      console.log('   ✅ URL generation is working');
      
      if (events.length === 0) {
        console.log('   ℹ️  No events with cover images found');
        console.log('   💡 Try uploading a new event image to test the flow');
      } else {
        const correctBucketEvents = events.filter(e => e.cover_image && e.cover_image.includes('event-images'));
        const wrongBucketEvents = events.filter(e => e.cover_image && e.cover_image.includes('images/'));
        
        console.log(`   ✅ Events with correct bucket: ${correctBucketEvents.length}`);
        console.log(`   ⚠️  Events with wrong bucket: ${wrongBucketEvents.length}`);
        
        if (wrongBucketEvents.length > 0) {
          console.log('\n🔧 Action Required:');
          console.log('   Run the migration script to move images to event-images bucket');
        }
      }
    } else {
      console.log('\n🔧 Action Required:');
      console.log('   1. Create event-images bucket in Supabase dashboard');
      console.log('   2. Set bucket as public');
      console.log('   3. Configure RLS policies');
      console.log('   4. Test image upload');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
simpleImageCheck(); 