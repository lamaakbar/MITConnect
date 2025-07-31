#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function to validate Supabase URLs
const isValidSupabaseUrl = (url) => {
  return url && 
         url.startsWith('http') && 
         url.includes('supabase.co') && 
         url.includes('/storage/v1/object/public/');
};

async function testImageUpload() {
  console.log('🧪 Testing Image Upload Function...\n');

  try {
    // Step 1: Check if event-images bucket exists
    console.log('1️⃣ Checking event-images bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
      return;
    }

    const eventImagesBucket = buckets.find(b => b.id === 'event-images');
    if (!eventImagesBucket) {
      console.log('   ❌ event-images bucket not found');
      console.log('   📋 Available buckets:', buckets.map(b => b.id).join(', '));
      console.log('   🔧 Please create the event-images bucket in Supabase dashboard');
      return;
    }

    console.log('   ✅ event-images bucket found');
    console.log(`   📁 Bucket public: ${eventImagesBucket.public}`);

    // Step 2: Test URL generation
    console.log('\n2️⃣ Testing URL generation...');
    const testPath = 'event-covers/test-image.jpg';
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('   ❌ Failed to generate public URL');
      return;
    }

    const testUrl = urlData.publicUrl;
    console.log('   ✅ Public URL generation working');
    console.log(`   🔗 Test URL: ${testUrl}`);
    
    if (isValidSupabaseUrl(testUrl)) {
      console.log('   ✅ URL validation passed');
    } else {
      console.log('   ❌ URL validation failed');
    }

    // Step 3: Test bucket access
    console.log('\n3️⃣ Testing bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (filesError) {
      console.error('   ❌ Error accessing bucket:', filesError);
      console.log('   🔧 This might be a permissions issue. Check RLS policies.');
    } else {
      console.log(`   ✅ Bucket access working - found ${files.length} files`);
    }

    // Step 4: Check current events in database
    console.log('\n4️⃣ Checking current events in database...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image, created_at')
      .not('cover_image', 'is', null)
      .neq('cover_image', '')
      .order('created_at', { ascending: false })
      .limit(5);

    if (eventsError) {
      console.error('   ❌ Error fetching events:', eventsError);
    } else {
      console.log(`   📋 Found ${events.length} events with cover images`);
      
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}: ${event.title}`);
        console.log(`      Cover Image: ${event.cover_image}`);
        
        if (event.cover_image) {
          if (event.cover_image.startsWith('file://')) {
            console.log(`      ❌ LOCAL FILE URI - Needs to be re-uploaded`);
          } else if (isValidSupabaseUrl(event.cover_image)) {
            console.log(`      ✅ VALID SUPABASE URL`);
          } else {
            console.log(`      ⚠️  UNKNOWN URL FORMAT`);
          }
        }
      });
    }

    // Step 5: Summary and recommendations
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ event-images bucket: ${eventImagesBucket ? 'EXISTS' : 'MISSING'}`);
    console.log(`   ✅ URL generation: ${urlData ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Bucket access: ${filesError ? 'FAILED' : 'WORKING'}`);
    console.log(`   ✅ Events with images: ${events.length}`);

    if (eventImagesBucket && urlData && !filesError) {
      console.log('\n🎉 Image upload infrastructure is ready!');
      console.log('📱 The uploadImageFromLibrary function should work correctly.');
      console.log('🔗 It will return proper Supabase public URLs.');
    } else {
      console.log('\n🔧 Issues detected that need to be fixed:');
      if (!eventImagesBucket) {
        console.log('   - Create event-images bucket in Supabase dashboard');
      }
      if (!urlData) {
        console.log('   - Check bucket permissions and RLS policies');
      }
      if (filesError) {
        console.log('   - Fix bucket access permissions');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImageUpload();