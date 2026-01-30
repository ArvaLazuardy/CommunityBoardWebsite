import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efdzffpndsvxhzpugfad.supabase.co'
const supabaseKey = 'sb_publishable_GNDXjm0AJN4MYhfs3M3OWg_OIAMx5qS'

export const supabase = createClient(supabaseUrl, supabaseKey)