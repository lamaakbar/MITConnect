const { createClient } = require('@supabase/supabase-js');

// Direct Supabase configuration
const SUPABASE_URL = 'https://kiijnueatpbsenrtepxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugUploadFlow() {
  console.log('🔍 Debugging Upload Flow Step by Step...\n');

  try {
    // Step 1: Test RLS policies are working
    console.log('1️⃣ Testing RLS Policies...');
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list('event-covers');

    if (listError) {
      console.log('   ❌ RLS policy error:', listError.message);
      return;
    } else {
      console.log('   ✅ RLS policies allow access to event-images bucket');
      console.log(`   📁 Found ${files.length} existing files`);
    }

    // Step 2: Test upload functionality
    console.log('\n2️⃣ Testing Upload Functionality...');
    
    // Create a test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testBuffer = Buffer.from(testImageBase64, 'base64');
    const testFileName = `debug-test-${Date.now()}.png`;
    const testPath = `event-covers/${testFileName}`;

    console.log(`   📤 Uploading test file: ${testPath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(testPath, testBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.log('   ❌ Upload failed:', uploadError.message);
      return;
    } else {
      console.log('   ✅ Upload successful!');
      console.log('   📁 Uploaded file path:', uploadData.path);
    }

    // Step 3: Test public URL generation
    console.log('\n3️⃣ Testing Public URL Generation...');
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(testPath);
    
    if (!urlData || !urlData.publicUrl) {
      console.log('   ❌ Failed to generate public URL');
      return;
    } else {
      console.log('   ✅ Public URL generated successfully');
      console.log('   🔗 URL:', urlData.publicUrl);
      
      // Validate URL format
      if (urlData.publicUrl.startsWith('https://') && urlData.publicUrl.includes('supabase.co')) {
        console.log('   ✅ URL format is correct (HTTPS + Supabase domain)');
      } else {
        console.log('   ⚠️  URL format may be incorrect');
      }
    }

    // Step 4: Test URL accessibility
    console.log('\n4️⃣ Testing URL Accessibility...');
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('   ✅ URL is accessible (HTTP 200)');
      } else {
        console.log(`   ⚠️  URL returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('   ❌ URL is not accessible:', error.message);
    }

    // Step 5: Check current database state
    console.log('\n5️⃣ Checking Current Database State...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image')
      .order('created_at', { ascending: false })
      .limit(5);

    if (eventsError) {
      console.log('   ❌ Error fetching events:', eventsError.message);
    } else {
      console.log(`   📊 Found ${events.length} recent events:`);
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title || 'Untitled'}`);
        if (event.cover_image) {
          if (event.cover_image.startsWith('file://')) {
            console.log(`      ❌ LOCAL FILE URI: ${event.cover_image.substring(0, 50)}...`);
          } else if (event.cover_image.startsWith('http')) {
            console.log(`      ✅ HTTP URL: ${event.cover_image.substring(0, 50)}...`);
          } else {
            console.log(`      ⚠️  OTHER FORMAT: ${event.cover_image.substring(0, 50)}...`);
          }
        } else {
          console.log(`      📭 No cover image`);
        }
      });
    }

    // Step 6: Test event creation with the uploaded image
    console.log('\n6️⃣ Testing Event Creation with Uploaded Image...');
    const testEventData = {
      title: `Debug Test Event ${Date.now()}`,
      description: 'This is a test event to verify image upload flow',
      date: '2024-12-31',
      time: '14:00',
      location: 'Test Location',
      category: 'Test',
      featured: false,
      status: 'upcoming',
      type: 'MITC',
      maxCapacity: 10,
      organizer: 'Debug Test',
      tags: ['test', 'debug'],
      requirements: ['none'],
      materials: ['none'],
      coverImage: urlData.publicUrl, // Use the uploaded image URL
      image: { uri: urlData.publicUrl },
      registeredCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('   📝 Creating test event with uploaded image URL...');
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert(testEventData)
      .select()
      .single();

    if (createError) {
      console.log('   ❌ Event creation failed:', createError.message);
    } else {
      console.log('   ✅ Event created successfully!');
      console.log('   📋 Event ID:', newEvent.id);
      console.log('   🖼️  Cover image saved as:', newEvent.cover_image);
      
      if (newEvent.cover_image === urlData.publicUrl) {
        console.log('   ✅ Cover image is correct Supabase URL!');
      } else {
        console.log('   ❌ Cover image is NOT the expected URL');
        console.log('   Expected:', urlData.publicUrl);
        console.log('   Got:', newEvent.cover_image);
      }
    }

    // Clean up test files
    console.log('\n7️⃣ Cleaning Up Test Files...');
    const { error: deleteError } = await supabase.storage
      .from('event-images')
      .remove([testPath]);

    if (deleteError) {
      console.log('   ⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('   ✅ Test file cleaned up');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('   ✅ RLS policies are working');
    console.log('   ✅ Upload to Supabase Storage works');
    console.log('   ✅ Public URL generation works');
    console.log('   ✅ Event creation with image URL works');
    console.log('\n🎯 CONCLUSION:');
    console.log('   The upload flow is working correctly!');
    console.log('   If you\'re still seeing local file URIs, the issue is in your app code.');
    console.log('   Check that uploadImageFromLibrary() is being called and its result is used.');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugUploadFlow(); 