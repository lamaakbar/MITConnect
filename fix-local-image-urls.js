const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLocalImageUrls() {
  console.log('🔧 Fixing Local Image URLs...\n');

  try {
    // Get all events with local file URIs
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image, created_at')
      .like('cover_image', 'file://%');

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }

    console.log(`📋 Found ${events.length} events with local file URIs\n`);

    if (events.length === 0) {
      console.log('✅ No events with local file URIs found!');
      return;
    }

    console.log('🔍 Events with local file URIs:');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (ID: ${event.id})`);
      console.log(`   Current: ${event.cover_image}`);
    });

    console.log('\n⚠️  WARNING: This will clear the cover_image field for these events.');
    console.log('   The images will need to be re-uploaded using the correct flow.');
    console.log('   This is necessary because local file URIs are not accessible to other users.\n');

    // Ask for confirmation (in a real scenario, you might want to add a prompt)
    console.log('🔄 Proceeding to clear local file URIs...\n');

    let fixedCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        console.log(`🔄 Fixing event: ${event.title}`);
        
        // Clear the cover_image field
        const { error: updateError } = await supabase
          .from('events')
          .update({ cover_image: null })
          .eq('id', event.id);

        if (updateError) {
          console.error(`   ❌ Error updating event ${event.title}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Cleared cover_image for: ${event.title}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing event ${event.title}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} events`);
    console.log(`   ❌ Errors: ${errorCount} events`);
    console.log(`   📈 Success Rate: ${((fixedCount / events.length) * 100).toFixed(1)}%`);

    if (fixedCount > 0) {
      console.log('\n🎉 Local file URIs have been cleared!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Ensure the event-images bucket exists in Supabase');
      console.log('   2. Re-upload images for the affected events using the app');
      console.log('   3. The new uploads will use the correct Supabase storage flow');
      console.log('   4. Images will then be visible to all users across devices');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixLocalImageUrls(); 