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
    console.log(`📁 Target: ${bucket}/${folder}`);
    
    // Step 1: Pick image from library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: false, // Important: Don't get base64 from picker
    });

    if (result.canceled) {
      console.log('❌ Image picker was canceled');
      return null;
    }

    const fileUri = result.assets[0].uri;
    console.log('📱 Selected image URI:', fileUri);
    
    // Validate that we have a proper URI
    if (!fileUri || fileUri.startsWith('file://')) {
      console.log('✅ Valid file URI detected');
    } else {
      console.log('⚠️  Unexpected URI format:', fileUri);
    }
    
    // Step 2: Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `image-${timestamp}-${randomId}.${fileExt}`;
    const fullPath = `${folder}/${fileName}`;
    
    console.log('📄 Processing file:', fileName);
    console.log('📂 Full path:', fullPath);
    
    // Step 3: Read file as base64
    console.log('📖 Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Failed to read file as base64');
      return null;
    }

    console.log('📊 File size (base64):', Math.round(base64.length / 1024), 'KB');
    
    // Step 4: Convert to binary
    console.log('🔄 Converting to binary...');
    const binaryFile = decode(base64);
    
    if (!binaryFile || binaryFile.byteLength === 0) {
      console.error('❌ Failed to convert to binary or empty file');
      return null;
    }

    console.log('📊 Binary file size:', binaryFile.byteLength, 'bytes');
    
    // Step 5: Upload to Supabase
    console.log('🔄 Uploading to Supabase...');
    console.log(`📤 Uploading to: ${bucket}/${fullPath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, binaryFile, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Image upload failed:', uploadError.message);
      console.error('❌ Upload error details:', uploadError);
      return null;
    }

    if (!uploadData) {
      console.error('❌ Upload succeeded but no data returned');
      return null;
    }

    console.log('✅ Upload successful!');
    console.log('📁 Uploaded file path:', uploadData.path);
    
    // Step 6: Get public URL
    console.log('🔗 Getting public URL...');
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('❌ Failed to get public URL');
      return null;
    }

    const publicUrl = urlData.publicUrl;
    console.log('🎉 Image upload complete!');
    console.log('🔗 Public URL:', publicUrl);
    
    // Validate the returned URL
    if (!publicUrl.startsWith('http')) {
      console.error('❌ Invalid public URL returned:', publicUrl);
      return null;
    }
    
    if (!publicUrl.includes('supabase.co')) {
      console.error('❌ URL is not a Supabase URL:', publicUrl);
      return null;
    }
    
    console.log('✅ URL validation passed - returning public URL');
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('⏰ Timeout error - network may be slow');
      } else if (error.message.includes('Network')) {
        console.error('🌐 Network error - check connection');
      } else if (error.message.includes('permission')) {
        console.error('🔒 Permission error - check storage permissions');
      } else if (error.message.includes('bucket')) {
        console.error('📦 Bucket error - check if bucket exists and is accessible');
      }
    }
    
    return null;
  }
};

// Enhanced fallback upload method using Buffer
export const uploadImageFromLibraryFallback = async (
  bucket: string,
  folder: string
): Promise<string | null> => {
  try {
    console.log('🔄 Using enhanced fallback upload method...');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: false,
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `image-${timestamp}-${randomId}.${fileExt}`;
    const fullPath = `${folder}/${fileName}`;
    
    console.log('📄 Fallback processing:', fileName);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Fallback: Failed to read file');
      return null;
    }

    // Use Buffer for better compatibility
    const fileBuffer = Buffer.from(base64, 'base64');
    
    console.log('🔄 Fallback uploading...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Fallback upload failed:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('❌ Fallback: Failed to get public URL');
      return null;
    }
    
    console.log('🎉 Fallback upload complete:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Fallback upload error:', error);
    return null;
  }
};

// Utility function to validate Supabase URLs
export const isValidSupabaseUrl = (url: string): boolean => {
  return Boolean(url && 
         url.startsWith('http') && 
         url.includes('supabase.co') && 
         url.includes('/storage/v1/object/public/'));
};

// Utility function to get file extension from URI
export const getFileExtension = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase();
  return ext === 'jpg' ? 'jpeg' : ext || 'jpeg';
}; 