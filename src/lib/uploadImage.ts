import { supabase } from './supabase';

export const uploadImage = async (
  file: File,
  pathFolder: string = 'productos',
  bucket: string = 'imagenes'
): Promise<string | null> => {
  try {
    if (!file) return null;

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${pathFolder}/${cleanFileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error subiendo imagen a Supabase:', error.message || error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error inesperado en uploadImage:', err);
    return null;
  }
};
