const { createClient } = require('@supabase/supabase-js');

// Direct Supabase configuration
const SUPABASE_URL = 'https://kiijnueatpbsenrtepxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCoverImageUrls() {
  console.log('🔍 Checking cover_image URLs in events table...\n');

  try {
    // Fetch all events with their cover_image values
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, cover_image')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching events:', error);
      return;
    }

    if (!events || events.length === 0) {
      console.log('📋 No events found in database');
      return;
    }

    console.log(`📊 Found ${events.length} events\n`);

    let httpUrls = 0;
    let fileUris = 0;
    let nullValues = 0;
    let otherValues = 0;

    events.forEach((event, index) => {
      console.log(`${index + 1}. Event: ${event.title || 'Untitled'}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Cover Image: ${event.cover_image || 'null'}`);

      if (!event.cover_image) {
        console.log('   ✅ NULL value (no image)');
        nullValues++;
      } else if (event.cover_image.startsWith('http')) {
        console.log('   ✅ HTTP URL (correct)');
        httpUrls++;
      } else if (event.cover_image.startsWith('file://')) {
        console.log('   ❌ LOCAL FILE URI - needs to be re-uploaded');
        fileUris++;
      } else {
        console.log('   ⚠️  OTHER format - needs investigation');
        otherValues++;
      }
      console.log('');
    });

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   ✅ HTTP URLs: ${httpUrls}`);
    console.log(`   ❌ File URIs: ${fileUris}`);
    console.log(`   📭 Null values: ${nullValues}`);
    console.log(`   ⚠️  Other formats: ${otherValues}`);

    if (fileUris > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log(`   ${fileUris} events have local file URIs that need to be re-uploaded.`);
      console.log('   These images will only be visible on the uploading device.');
      console.log('   Run fix-local-image-urls.js to clear these problematic URIs.');
    } else {
      console.log('\n✅ All cover_image values are correct HTTP URLs or null!');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the check
checkCoverImageUrls(); 