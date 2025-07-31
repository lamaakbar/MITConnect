const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseImages() {
  console.log('🔍 Checking Database Image URLs...\n');

  try {
    // Get all events with cover images
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image, created_at')
      .not('cover_image', 'is', null)
      .neq('cover_image', '')
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }

    console.log(`📋 Found ${events.length} events with cover images\n`);

    if (events.length === 0) {
      console.log('ℹ️  No events with cover images found in database');
      return;
    }

    let localUriCount = 0;
    let supabaseUrlCount = 0;
    let otherUrlCount = 0;
    let invalidUrlCount = 0;

    events.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Cover Image: ${event.cover_image}`);
      console.log(`   Created: ${event.created_at}`);
      
      // Analyze the image URL
      if (event.cover_image) {
        if (event.cover_image.startsWith('file://')) {
          console.log(`   ❌ LOCAL FILE URI - Only accessible on uploading device`);
          localUriCount++;
        } else if (event.cover_image.startsWith('http') && event.cover_image.includes('supabase.co')) {
          console.log(`   ✅ SUPABASE URL - Accessible to all users`);
          supabaseUrlCount++;
        } else if (event.cover_image.startsWith('http')) {
          console.log(`   ℹ️  EXTERNAL URL - May or may not be accessible`);
          otherUrlCount++;
        } else {
          console.log(`   ❌ INVALID URL - Not a proper URL`);
          invalidUrlCount++;
        }
      }
      console.log('');
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   ❌ Local file URIs: ${localUriCount}`);
    console.log(`   ✅ Supabase URLs: ${supabaseUrlCount}`);
    console.log(`   ℹ️  External URLs: ${otherUrlCount}`);
    console.log(`   ❌ Invalid URLs: ${invalidUrlCount}`);
    console.log(`   📈 Total events with images: ${events.length}`);

    if (localUriCount > 0) {
      console.log('\n🔧 Action Required:');
      console.log(`   ${localUriCount} events have local file URIs that need to be fixed.`);
      console.log('   These events will show blank images for other users.');
      console.log('   Consider re-uploading images for these events or running a migration script.');
    }

    if (supabaseUrlCount > 0) {
      console.log('\n✅ Good News:');
      console.log(`   ${supabaseUrlCount} events have proper Supabase URLs.`);
      console.log('   These should display correctly for all users.');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkDatabaseImages(); 