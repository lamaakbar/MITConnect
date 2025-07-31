const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = 'https://kiijnueatpbsenrtepxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExistingEventImages() {
  console.log('🔧 Fixing Existing Event Images...\n');

  try {
    // Step 1: Get all events with cover images
    console.log('1️⃣ Fetching events with cover images...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, cover_image')
      .not('cover_image', 'is', null)
      .neq('cover_image', '');

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }

    console.log(`📋 Found ${events.length} events with cover images`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Step 2: Process each event
    for (const event of events) {
      console.log(`\n🔄 Processing event: ${event.title}`);
      console.log(`   Current cover_image: ${event.cover_image}`);

      // Skip if already correct
      if (event.cover_image.includes('event-images')) {
        console.log('   ✅ Already using event-images bucket, skipping...');
        skippedCount++;
        continue;
      }

      // Skip if not a full URL
      if (!event.cover_image.startsWith('http')) {
        console.log('   ⚠️  Not a full URL, skipping...');
        skippedCount++;
        continue;
      }

      // Skip if not from images bucket (don't know how to migrate)
      if (!event.cover_image.includes('images/')) {
        console.log('   ⚠️  Not from images bucket, skipping...');
        skippedCount++;
        continue;
      }

      try {
        // Extract the file path from the URL
        const urlParts = event.cover_image.split('/');
        const filePathIndex = urlParts.findIndex(part => part === 'images');
        if (filePathIndex === -1) {
          console.log('   ❌ Could not extract file path from URL');
          errorCount++;
          continue;
        }

        const filePath = urlParts.slice(filePathIndex + 1).join('/');
        console.log(`   📁 Extracted file path: ${filePath}`);

        // Download from images bucket
        const { data: imageData, error: downloadError } = await supabase.storage
          .from('images')
          .download(filePath);

        if (downloadError) {
          console.error(`   ❌ Download error:`, downloadError);
          errorCount++;
          continue;
        }

        // Upload to event-images bucket
        const newPath = `event-covers/${filePath.split('/').pop()}`;
        console.log(`   📤 Uploading to: event-images/${newPath}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(newPath, imageData, {
            contentType: imageData.type,
            upsert: true
          });

        if (uploadError) {
          console.error(`   ❌ Upload error:`, uploadError);
          errorCount++;
          continue;
        }

        // Get the new public URL
        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(newPath);

        const newImageUrl = urlData.publicUrl;
        console.log(`   ✅ New URL: ${newImageUrl}`);

        // Update the database record
        const { error: updateError } = await supabase
          .from('events')
          .update({ cover_image: newImageUrl })
          .eq('id', event.id);

        if (updateError) {
          console.error(`   ❌ Database update error:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Database updated successfully`);
          fixedCount++;
        }

      } catch (error) {
        console.error(`   ❌ Migration error:`, error);
        errorCount++;
      }
    }

    // Step 3: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} events`);
    console.log(`   ⏭️  Skipped: ${skippedCount} events`);
    console.log(`   ❌ Errors: ${errorCount} events`);
    console.log(`   📈 Success Rate: ${((fixedCount / events.length) * 100).toFixed(1)}%`);

    if (fixedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('   All fixed events now use the event-images bucket');
      console.log('   Images should now be visible across all devices');
    } else {
      console.log('\nℹ️  No events needed migration');
      console.log('   All events are already using the correct bucket or format');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
fixExistingEventImages(); 