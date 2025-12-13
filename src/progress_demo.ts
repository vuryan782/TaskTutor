const client = require('./supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// check for valid user ID
async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await client
    .from('users_public')
    .select('id')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return true;
}

const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

// quick sanity check
console.log('[check] typeof client.from =', typeof client.from);

/**
 * Log a study activity (quiz, flashcards, game, notes)
 */
async function logStudyActivity() {
  const userId = (await ask('User ID: ')).trim();

  if (!userId) {
    console.log(' User ID is required.');
    return;
  }

  const exists = await userExists(userId);
  if (!exists) {
    console.log(' No user found with that ID.');
    return;
  }

  const activityType = (await ask(
    'Activity (quiz/flashcards/matching/notes): '
  )).trim();

  const validTypes = ['quiz', 'flashcards', 'matching', 'notes'];
if (!validTypes.includes(activityType)) {
  console.log(' Invalid activity type.');
  return;
}


  const topic = (await ask('Topic: ')).trim();
  const itemsTotal = Number(await ask('Items total: '));
  const itemsCorrect = Number(await ask('Items correct: '));
  const minutes = Number(await ask('Minutes spent: '));

  const { data, error } = await client
    .from('study_activity')
    .insert([{
      user_id: userId,
      activity_type: activityType,
      topic,
      items_total: itemsTotal,
      items_correct: itemsCorrect,
      duration_minutes: minutes,
    }])
    .select('*')
    .single();

  if (error) {
    console.log('Insert error:', error.message);
    return;
  }

  console.log('Logged activity:', data);
}

/**
 * View all progress for a user
 */
async function viewProgress() {
  const userId = (await ask('User ID: ')).trim();

  const { data, error } = await client
    .from('study_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Query error:', error.message);
    return;
  }

  if (!data.length) {
    console.log('No study activity found.');
    return;
  }

  console.log('\n=== Study Progress ===');
  data.forEach((r: any) => {
    const accuracy =
      r.items_total > 0
        ? ((r.items_correct / r.items_total) * 100).toFixed(1)
        : 'N/A';

    console.log(
      `• ${r.activity_type} | ${r.topic ?? 'N/A'} | ${accuracy}% | ${r.duration_minutes} min`
    );
  });
}

async function listActivities(userId: string) {
  const { data, error } = await client
    .from('study_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data.length) {
    console.log('No study activity found.');
    return null;
  }

  console.log('\n# | Activity | Topic | Accuracy | Minutes');
  console.log('--+----------+-------+----------+--------');

  data.forEach((r: any, i: number) => {
    const accuracy = r.items_total
      ? ((r.items_correct / r.items_total) * 100).toFixed(1)
      : 'N/A';

    console.log(
      `${String(i).padEnd(2)}| ${r.activity_type.padEnd(8)} | ${String(r.topic).padEnd(5)} | ${accuracy.padEnd(8)} | ${r.duration_minutes}`
    );
  });

  return data;
}

async function deleteActivity() {
  const userId = (await ask('User ID: ')).trim();
  const rows = await listActivities(userId);
  if (!rows) return;

  const index = await ask('\nEnter row # to delete (or Enter to cancel): ');
  if (!index.trim()) return console.log('Cancelled.');

  const idx = Number(index);
  if (isNaN(idx) || idx < 0 || idx >= rows.length) {
    console.log('Invalid index.');
    return;
  }

  const id = rows[idx].id;
  const { error } = await client
    .from('study_activity')
    .delete()
    .eq('id', id);

  if (error) {
    console.log('Delete error:', error.message);
    return;
  }

  console.log('Study activity deleted.');
}


/**
 * CLI menu
 */
async function mainMenu() {
  while (true) {
    console.log('\n=== Progress Tracker Demo ===');
    console.log('1) Log study activity');
    console.log('2) View progress');
    console.log('3) Delete study activity');
    console.log('4) Exit');


    const choice = (await ask('Choose an option: ')).trim();

    if (choice === '1') await logStudyActivity();
    else if (choice === '2') await viewProgress();
    else if (choice === '3') await deleteActivity();
    else if (choice === '4') break;
    else console.log('Invalid option.');
  }

  rl.close();
}

mainMenu();