const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/(^['"]|['"]$)/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase variables in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const email = 'luyandochikandula63@gmail.com';
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  
  // 1. Check/List users
  const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }
  
  const users = data.users || [];
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`User ${email} does not exist in Auth. Creating...`);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: 'Luyando Chikandula' }
    });
    if (createError) {
      console.error('Error creating user:', createError);
      process.exit(1);
    }
    console.log('User created with ID:', newUser.user.id);
  } else {
    console.log(`User ${email} found with ID: ${user.id}. Resetting password...`);
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: 'password123' }
    );
    if (updateError) {
      console.error('Error updating password:', updateError);
      process.exit(1);
    }
    console.log('Password updated successfully to "password123".');
  }
}

main();
