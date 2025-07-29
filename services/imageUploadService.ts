import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { Buffer } from 'buffer';

export const uploadImageFromLibrary = async (
  bucket: string,
  folder: string
): Promise<string | null> => {
  try {
    console.log('🚀 Starting image upload process...');
    
    // Note: MediaTypeOptions.Images is deprecated but still works in expo-image-picker v16.1.4
    // TODO: Update to MediaType.Images when upgrading to newer version
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Reduced quality for faster upload
      base64: false, // Don't get base64 from picker
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    console.log('📱 Selected image URI:', fileUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `image-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('📄 Processing file:', fileName);
    
    // Read file as base64 with timeout
    const base64 = await Promise.race([
      FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File reading timeout')), 30000)
      )
    ]) as string;

    if (!base64) {
      console.error('❌ Failed to read file as base64');
      return null;
    }

    console.log('📊 File size (base64):', Math.round(base64.length / 1024), 'KB');
    
    // Convert to binary with timeout
    const binaryFile = await Promise.race([
      Promise.resolve(decode(base64)),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Binary conversion timeout')), 10000)
      )
    ]) as ArrayBuffer;

    console.log('🔄 Uploading to Supabase...');
    
    // Upload with timeout
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, binaryFile, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    const { data, error } = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000)
      )
    ]) as any;

    if (error) {
      console.error('❌ Image upload failed:', error.message);
      return null;
    }

    console.log('✅ Upload successful, getting public URL...');
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
    console.log('🎉 Image upload complete:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('⏰ Timeout error - network may be slow');
      } else if (error.message.includes('Network')) {
        console.error('🌐 Network error - check connection');
      }
    }
    
    return null;
  }
};

// Fallback upload method using Buffer (more reliable for large files)
export const uploadImageFromLibraryFallback = async (
  bucket: string,
  folder: string
): Promise<string | null> => {
  try {
    console.log('🔄 Using fallback upload method...');
    
    // Note: MediaTypeOptions.Images is deprecated but still works in expo-image-picker v16.1.4
    // TODO: Update to MediaType.Images when upgrading to newer version
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Even lower quality for fallback
      base64: false,
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `image-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('📄 Fallback processing:', fileName);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Fallback: Failed to read file');
      return null;
    }

    // Use Buffer instead of decode for better compatibility
    const fileBuffer = Buffer.from(base64, 'base64');
    
    console.log('🔄 Fallback uploading...');
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, fileBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('❌ Fallback upload failed:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`);
    console.log('🎉 Fallback upload complete:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Fallback upload error:', error);
    return null;
  }
}; 