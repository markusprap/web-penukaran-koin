import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadToSupabase = async (bucket: string, path: string, file: Buffer | Blob | ArrayBuffer) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: 'application/pdf'
    });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
};
