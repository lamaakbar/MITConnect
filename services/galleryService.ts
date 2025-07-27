import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

// Types
export interface Photo {
  id: string;
  uri: string;
  image_url: string;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  photoCount?: number;
  photos: Photo[];
  cover_image?: string;
}

// Gallery Service Functions

/**
 * Upload image to Supabase Storage using Expo-compatible flow
 */
export const uploadImageToStorage = async (uri: string, fileName: string): Promise<string | null> => {
  try {
    console.log('🚀 Starting ULTRA-FAST upload for:', fileName);
    
    // Read file as base64 (minimal logging for speed)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(base64, 'base64');

    // Detect content type from file extension
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Upload with optimized settings
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(data.path);

    console.log('✅ Upload successful:', fileName);
    return publicUrl;
  } catch (e) {
    console.error('❌ Upload failure:', e);
    return null;
  }
};

/**
 * Upload photo to storage and insert into database (Expo-compatible) - Optimized
 */
export const uploadPhotoToStorage = async (imageUri: string, albumId: string): Promise<boolean> => {
  try {
    console.log('📸 Starting optimized photo upload...');
    console.log('📱 Image URI:', imageUri);
    console.log('🆔 Album ID:', albumId);
    
    // Validate inputs
    if (!imageUri || !albumId) {
      console.error('❌ Invalid inputs:', { imageUri, albumId });
      return false;
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User authentication error:', userError);
      return false;
    }
    
    console.log('👤 Current user ID:', user.id);
    
    // Generate file name and path first
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `gallery_photos/${fileName}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    console.log('🚀 Starting file processing...');
    
    // Read file as base64 (optimized)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Failed to read base64 from file');
      return false;
    }

    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(base64, 'base64');
    
    if (fileBuffer.byteLength === 0) {
      console.error('❌ Buffer is empty (0 bytes)');
      return false;
    }

    console.log('📦 Buffer size:', fileBuffer.byteLength, 'bytes');
    
    // Upload file directly (removed bucket test for speed)
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return false;
    }

    console.log('✅ Upload successful');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path);

    if (!publicUrl) {
      console.error('❌ Failed to get public URL');
      return false;
    }

    console.log('🔗 Public URL generated:', publicUrl);
    
    // Insert into database
    const { error: dbError } = await supabase.from('gallery_photos').insert({
      album_id: albumId,
      image_url: publicUrl,
      user_id: user.id,
    });

    if (dbError) {
      console.error('❌ DB insert error:', dbError);
      return false;
    }

    console.log('✅ Photo uploaded and inserted successfully!');
    return true;

  } catch (err) {
    console.error('❌ uploadPhotoToStorage failed:', err);
    return false;
  }
};

/**
 * Upload cover image to storage (Expo-compatible)
 */
export const uploadCoverImageToStorage = async (imageUri: string): Promise<string | null> => {
  try {
    console.log('🚀 Starting ULTRA-FAST cover upload...');
    
    // Read file as base64 (minimal logging for speed)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      console.error('❌ Failed to read base64 from file');
      return null;
    }

    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(base64, 'base64');

    // Generate file name and path
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `cover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `gallery_covers/${fileName}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Upload with optimized settings
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Cover upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path);

    if (!publicUrl) {
      console.error('❌ Failed to get cover public URL');
      return null;
    }

    console.log('✅ Cover uploaded successfully!');
    return publicUrl;

  } catch (err) {
    console.error('❌ uploadCoverImageToStorage failed:', err);
    return null;
  }
};

/**
 * Fetch all albums with photo counts
 */
export const fetchGalleryAlbums = async (): Promise<Album[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_albums')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching albums:', error.message);
      return [];
    }

    // Get photo counts for each album
    const albumsWithCounts = await Promise.all(
      (data ?? []).map(async (a: any) => {
        const { data: photoData, error: countError } = await supabase
          .from('gallery_photos')
          .select('id')
          .eq('album_id', a.id);
        
        const count = photoData ? photoData.length : 0;
        
        return {
          id: a.id,
          title: a.name,
          photoCount: count || 0,
          cover_image: a.cover_image,
          photos: [], // Will be populated when album is opened
        };
      })
    );
    
    return albumsWithCounts;
  } catch (error) {
    console.error('Error in fetchGalleryAlbums:', error);
    return [];
  }
};

/**
 * Fetch photos for a specific album
 */
export const fetchAlbumPhotos = async (albumId: string): Promise<Photo[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error.message);
      return [];
    }

    // Map the data to include both id and uri for compatibility
    const mappedPhotos = (data ?? []).map((photo: any) => ({
      id: photo.id,
      uri: photo.image_url,
      image_url: photo.image_url,
      created_at: photo.created_at
    }));

    console.log('Fetched photos for album', albumId, ':', mappedPhotos.length, 'photos');
    return mappedPhotos;
  } catch (error) {
    console.error('Error in fetchAlbumPhotos:', error);
    return [];
  }
};

/**
 * Create a new album
 */
export const createAlbum = async (name: string, coverImageUrl: string): Promise<string> => {
  try {
    console.log('📸 Creating album in Supabase...');
    console.log('📝 Album name:', name);
    console.log('🖼️ Cover image URL:', coverImageUrl);
    
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User authentication error:', userError);
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user ID:', user.id);
    
    const { data, error } = await supabase
      .from('gallery_albums')
      .insert([
        {
          name: name,
          cover_image: coverImageUrl,
          created_at: new Date().toISOString(),
          user_id: user.id,
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating album:', error);
      throw error;
    }

    console.log('✅ Album created successfully with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in createAlbum:', error);
    throw error;
  }
};

/**
 * Add photo to album
 */
export const addPhotoToAlbum = async (albumId: string, imageUrl: string): Promise<string> => {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User authentication error:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user ID:', user.id);
    
    const { data, error } = await supabase
      .from('gallery_photos')
      .insert([
        {
          album_id: albumId,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          user_id: user.id, // Use the authenticated user's ID
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding photo to album:', error.message);
      throw error;
    }

    console.log('Photo added to album successfully with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in addPhotoToAlbum:', error);
    throw error;
  }
};

/**
 * Delete photo from album and storage
 */
export const deletePhoto = async (photoId: string, imageUrl: string): Promise<boolean> => {
  try {
    console.log('🚀 Starting fast photo deletion for ID:', photoId);
    
    // Delete from database first (this is the most important)
    const { error: dbError } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('❌ Error deleting photo from database:', dbError);
      throw dbError;
    }

    console.log('✅ Photo deleted from database successfully');

    // Try to delete from storage in background (don't wait for it)
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        // Fire and forget - don't wait for storage deletion
        supabase.storage
          .from('images')
          .remove([fileName])
          .then(() => console.log('✅ Photo deleted from storage'))
          .catch((error) => console.log('⚠️ Storage deletion failed (non-critical):', error));
      }
    } catch (storageError) {
      // Ignore storage errors - database deletion is the main concern
      console.log('⚠️ Storage deletion error (ignored):', storageError);
    }

    console.log('✅ Photo deletion completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in deletePhoto:', error);
    throw error;
  }
};

/**
 * Delete album and all its photos (optimized for speed)
 */
export const deleteAlbum = async (albumId: string): Promise<boolean> => {
  try {
    console.log('🚀 Starting fast album deletion for ID:', albumId);
    
    // Delete photos and album from database in parallel (this is the most important)
    const [photosResult, albumResult] = await Promise.all([
      supabase
        .from('gallery_photos')
        .delete()
        .eq('album_id', albumId),
      supabase
        .from('gallery_albums')
        .delete()
        .eq('id', albumId)
    ]);

    // Check for database errors
    if (photosResult.error) {
      console.error('❌ Error deleting photos from database:', photosResult.error);
      throw photosResult.error;
    }

    if (albumResult.error) {
      console.error('❌ Error deleting album from database:', albumResult.error);
      throw albumResult.error;
    }

    console.log('✅ Album and photos deleted from database successfully');

    // Try to clean up storage in background (don't wait for it)
    try {
      // Get photos for storage cleanup (fire and forget)
      supabase
        .from('gallery_photos')
        .select('image_url')
        .eq('album_id', albumId)
        .then(({ data: photos }) => {
          if (photos && photos.length > 0) {
            const fileNames = photos.map(photo => {
              const urlParts = photo.image_url.split('/');
              return urlParts[urlParts.length - 1];
            }).filter(Boolean);

            if (fileNames.length > 0) {
              // Fire and forget storage deletion
              supabase.storage
                .from('images')
                .remove(fileNames)
                .then(() => console.log('✅ Album photos deleted from storage'))
                .catch((error) => console.log('⚠️ Storage deletion failed (non-critical):', error));
            }
          }
        })
        .catch((error) => console.log('⚠️ Photo fetch for storage cleanup failed (non-critical):', error));
    } catch (storageError) {
      // Ignore storage errors - database deletion is the main concern
      console.log('⚠️ Storage cleanup error (ignored):', storageError);
    }

    console.log('✅ Album deletion completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteAlbum:', error);
    throw error;
  }
};

/**
 * Upload multiple photos to an album (super optimized with bulk insert)
 */
export const uploadPhotosToAlbum = async (albumId: string, photos: { uri: string }[]): Promise<Photo[]> => {
  try {
    console.log(`🚀 Starting super optimized upload of ${photos.length} photos to album ${albumId}`);
    
    // Upload all photos to storage in parallel
    const uploadPromises = photos.map(async (photo, index) => {
      console.log(`📤 Starting upload for photo ${index + 1}/${photos.length}`);
      
      const fileName = `album-photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imageUrl = await uploadImageToStorage(photo.uri, fileName);
      
      if (!imageUrl) {
        console.error(`❌ Failed to upload photo ${index + 1}`);
        return null;
      }
      
      console.log(`✅ Photo ${index + 1} uploaded to storage:`, imageUrl);
      return { imageUrl, originalUri: photo.uri };
    });
    
    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    const successfulUploads = uploadResults.filter(result => result !== null);
    
    console.log(`📊 Upload results: ${successfulUploads.length}/${photos.length} successful`);
    
    // Bulk insert all photos to database (much faster than individual inserts)
    if (successfulUploads.length > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const photoRecords = successfulUploads.map(result => ({
          album_id: albumId,
          image_url: result!.imageUrl,
          created_at: new Date().toISOString(),
          user_id: user?.id
        }));
        
        const { data: insertedPhotos, error: bulkError } = await supabase
          .from('gallery_photos')
          .insert(photoRecords)
          .select('id, image_url, created_at');
        
        if (bulkError) {
          console.error('❌ Bulk insert error:', bulkError);
          throw bulkError;
        }
        
        const uploadedPhotos = insertedPhotos.map((photo: any) => ({
          id: photo.id,
          uri: photo.image_url,
          image_url: photo.image_url,
          created_at: photo.created_at
        }));
        
        console.log(`🎉 Successfully bulk uploaded ${uploadedPhotos.length} photos to album ${albumId}`);
        return uploadedPhotos;
        
      } catch (bulkError) {
        console.error('❌ Bulk insert failed, falling back to individual inserts:', bulkError);
        
        // Fallback to individual inserts if bulk insert fails
        const albumPromises = successfulUploads.map(async (result) => {
          const photoId = await addPhotoToAlbum(albumId, result!.imageUrl);
          console.log(`📎 Photo added to album with ID:`, photoId);
          
          return {
            id: photoId,
            uri: result!.imageUrl,
            image_url: result!.imageUrl,
            created_at: new Date().toISOString()
          };
        });
        
        const uploadedPhotos = await Promise.all(albumPromises);
        console.log(`🎉 Successfully uploaded ${uploadedPhotos.length} photos to album ${albumId} (fallback method)`);
        return uploadedPhotos;
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error in uploadPhotosToAlbum:', error);
    throw error;
  }
};

/**
 * Get album by ID
 */
export const getAlbumById = async (albumId: string): Promise<Album | null> => {
  try {
    const { data, error } = await supabase
      .from('gallery_albums')
      .select('*')
      .eq('id', albumId)
      .single();

    if (error) {
      console.error('Error fetching album:', error.message);
      return null;
    }

    // Get photo count
    const { data: photoData } = await supabase
      .from('gallery_photos')
      .select('id')
      .eq('album_id', albumId);

    const photoCount = photoData ? photoData.length : 0;

    return {
      id: data.id,
      title: data.name,
      photoCount: photoCount,
      cover_image: data.cover_image,
      photos: []
    };
  } catch (error) {
    console.error('Error in getAlbumById:', error);
    return null;
  }
};

/**
 * Test upload function to verify everything works
 */
export const testUpload = async (imageUri: string): Promise<boolean> => {
  try {
    console.log('🧪 Testing upload with URI:', imageUri);
    
    // Test the basic upload function
    const fileName = `test-${Date.now()}.jpg`;
    const result = await uploadImageToStorage(imageUri, fileName);
    
    if (result) {
      console.log('✅ Test upload successful:', result);
      return true;
    } else {
      console.log('❌ Test upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Test upload error:', error);
    return false;
  }
};

/**
 * Debug function to check current user authentication
 */
export const debugUserAuth = async (): Promise<void> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth error:', error);
      return;
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.id);
      console.log('👤 User email:', user.email);
    } else {
      console.log('❌ No user authenticated');
    }
  } catch (error) {
    console.error('❌ Debug auth error:', error);
  }
}; 