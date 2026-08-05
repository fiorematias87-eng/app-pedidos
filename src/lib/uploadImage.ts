import { supabase } from './supabase';

export async function uploadImage(file: File, folder: string) {
  const filePath = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error } = await supabase.storage.from('imagenes').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('imagenes').getPublicUrl(filePath);
  return data.publicUrl;
}
