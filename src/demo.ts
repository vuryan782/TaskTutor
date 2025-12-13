const client = require('./supabase');           // <-- default export now
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));
const emailLooksValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// quick check (should print "function")
console.log('[check] typeof client.from =', typeof client.from);

async function addUser() {
  const name = (await ask('Name: ')).trim();
  const email = (await ask('Email: ')).trim();

  if (!name) return console.log(' Name is required.');
  if (!emailLooksValid(email)) return console.log(' Invalid email.');

  const { data, error } = await client
    .from('users_public')
    .insert([{ name, email }])
    .select('*')
    .single();

  if (error) return console.log(' Insert error:', error.message);
  console.log(' Inserted:', data);
}

async function listUsers() {
  const { data, error } = await client
    .from('users_public')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.log(' List error:', error.message);
  if (!data?.length) return console.log('ℹ No users yet.');
  console.log('\n#  id                                   | name             | email');
  console.log('---+-------------------------------------+------------------+--------------------------');
  data.forEach((r: any, i: number) =>
    console.log(`${String(i).padEnd(2)} | ${r.id} | ${String(r.name).padEnd(16)} | ${r.email}`)
  );
  return data;
}

async function deleteUser() {
  const rows = await listUsers();
  if (!rows?.length) return;
  const index = await ask('\nEnter row # to delete (or Enter to cancel): ');
  if (!index.trim()) return console.log('↩️ Cancelled.');
  const idx = Number(index);
  if (isNaN(idx) || idx < 0 || idx >= rows.length) return console.log(' Invalid index.');
  const id = rows[idx].id;
  const { data, error } = await client.from('users_public').delete().eq('id', id).select('*').single();
  if (error) return console.log(' Delete error:', error.message);
  console.log(' Deleted:', data);
}

async function mainMenu() {
  while (true) {
    console.log('\n=== Users Demo ===');
    console.log('1) Add user');
    console.log('2) List users');
    console.log('3) Delete user');
    console.log('4) Exit');
    const choice = (await ask('Choose an option: ')).trim();
    if (choice === '1') await addUser();
    else if (choice === '2') await listUsers();
    else if (choice === '3') await deleteUser();
    else if (choice === '4') break;
    else console.log(' Invalid option.');
  }
  rl.close();
}

mainMenu();