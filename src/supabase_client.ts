import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwdubdyctrapycbpghbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZHViZHljdHJhcHljYnBnaGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NzU4ODksImV4cCI6MjA2MDA1MTg4OX0.BxP2A-IxdiPvFQdz7Fwv89KcFhH-eEfRf74QH8Ynta8'; // Use a anon key
export const supabase = createClient(supabaseUrl, supabaseKey);