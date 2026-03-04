
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudents() {
    console.log('Checking students table structure...');
    const { data: students, error } = await supabase.from('students').select('*').limit(1);
    if (error) {
        console.error('Error fetching students:', error.message);
    } else {
        console.log('Found students sample:', students);
        if (students && students.length > 0) {
            const keys = Object.keys(students[0]);
            console.log('Columns:', keys);
        } else {
            // If empty, try to insert a dummy to see error or just assume columns exist? 
            // Better to just try selecting specific columns to verify they exist
            const { data, error: colError } = await supabase.from('students').select('discount_type, discount_value, discount_end_date').limit(1);
            if (colError) {
                console.error('Columns validation error:', colError.message);
            } else {
                console.log('Columns validation success');
            }
        }
    }
}

checkStudents();
