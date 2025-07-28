import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { Buffer } from 'buffer';

export const uploadPDFFromLibrary = async (
  bucket: string = 'book-pdfs',
  folder: string = 'pdfs'
): Promise<string | null> => {
  try {
    console.log('🚀 Starting PDF upload process...');
    
    // Check authentication status
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return null;
    }
    
    if (!session) {
      console.error('❌ No active session found');
      return null;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    console.log('📱 Selected PDF:', fileName, 'URI:', fileUri);
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const uniqueFileName = `book-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('📄 Processing file:', uniqueFileName);
    
    // Read file as base64 with timeout
    const base64 = await Promise.race([
      FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File reading timeout')), 60000)
      )
    ]) as string;

    if (!base64) {
      console.error('❌ Failed to read PDF file as base64');
      return null;
    }

    console.log('📊 PDF file size (base64):', Math.round(base64.length / 1024), 'KB');
    
    // Convert to binary with timeout
    const binaryFile = await Promise.race([
      Promise.resolve(decode(base64)),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Binary conversion timeout')), 15000)
      )
    ]) as ArrayBuffer;

    console.log('🔄 Uploading PDF to Supabase...');
    
    // Upload with timeout
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(`${folder}/${uniqueFileName}`, binaryFile, {
        contentType: 'application/pdf',
        upsert: true,
      });

    const { data, error } = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 120000)
      )
    ]) as any;

    if (error) {
      console.error('❌ PDF upload failed:', error.message);
      
      // Check if it's an RLS policy error
      if (error.message.includes('row-level security') || error.message.includes('RLS')) {
        console.error('🔒 RLS Policy Error - Check storage bucket permissions');
        console.error('💡 Make sure the book-pdfs bucket exists and has proper policies');
      }
      
      // Check if it's an authentication error
      if (error.message.includes('JWT') || error.message.includes('token')) {
        console.error('🔑 Authentication Error - User may not be properly authenticated');
      }
      
      return null;
    }

    console.log('✅ PDF upload successful, getting public URL...');
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${folder}/${uniqueFileName}`);
    console.log('🎉 PDF upload complete:', urlData.publicUrl);
    
    // Return the storage path for database storage
    return `${folder}/${uniqueFileName}`;
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    
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

// Alternative upload method using existing images bucket (if book-pdfs has RLS issues)
export const uploadPDFToImagesBucket = async (
  folder: string = 'pdfs'
): Promise<string | null> => {
  try {
    console.log('🔄 Using images bucket for PDF upload...');
    
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const uniqueFileName = `book-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('📄 Processing PDF for images bucket:', uniqueFileName);
    
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Failed to read PDF file');
      return null;
    }

    const fileBuffer = Buffer.from(base64, 'base64');
    
    console.log('🔄 Uploading PDF to images bucket...');
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`${folder}/${uniqueFileName}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('❌ Images bucket upload failed:', error.message);
      return null;
    }

    console.log('🎉 PDF upload to images bucket complete');
    
    // Return the storage path for database storage
    return `${folder}/${uniqueFileName}`;
  } catch (error) {
    console.error('❌ Images bucket PDF upload error:', error);
    return null;
  }
};

// Fallback upload method using Buffer (more reliable for large files)
export const uploadPDFFromLibraryFallback = async (
  bucket: string = 'book-pdfs',
  folder: string = 'pdfs'
): Promise<string | null> => {
  try {
    console.log('🔄 Using fallback PDF upload method...');
    
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const uniqueFileName = `book-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('📄 Fallback processing:', uniqueFileName);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Fallback: Failed to read PDF file');
      return null;
    }

    // Use Buffer instead of decode for better compatibility
    const fileBuffer = Buffer.from(base64, 'base64');
    
    console.log('🔄 Fallback uploading PDF...');
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${uniqueFileName}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('❌ Fallback PDF upload failed:', error.message);
      
      // If book-pdfs bucket fails, try images bucket
      if (error.message.includes('row-level security') || error.message.includes('RLS')) {
        console.log('🔄 Trying images bucket as alternative...');
        return await uploadPDFToImagesBucket(folder);
      }
      
      return null;
    }

    console.log('🎉 Fallback PDF upload complete');
    
    // Return the storage path for database storage
    return `${folder}/${uniqueFileName}`;
  } catch (error) {
    console.error('❌ Fallback PDF upload error:', error);
    return null;
  }
};

// Function to get public URL from storage path
export const getPDFPublicUrl = (pdfPath: string, bucket: string = 'book-pdfs'): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(pdfPath);
  return data.publicUrl;
};

// Function to delete PDF from storage
export const deletePDFFromStorage = async (pdfPath: string, bucket: string = 'book-pdfs'): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([pdfPath]);

    if (error) {
      console.error('❌ Failed to delete PDF:', error.message);
      return false;
    }

    console.log('✅ PDF deleted successfully:', pdfPath);
    return true;
  } catch (error) {
    console.error('❌ Error deleting PDF:', error);
    return false;
  }
}; 