const client = require('./supabase');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

console.log('[check] typeof client.from =', typeof client.from);

async function userExists(userId: string): Promise<boolean> {
  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  return !(error || !data);
}

function toInt(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0) return null;
  return i;
}

function computePercentage(score: number, total: number): number | null {
  if (total <= 0) return null;
  const pct = (score / total) * 100;
  // keep 1 decimal place as numeric
  return Math.round(pct * 10) / 10;
}

async function logStudySession() {
  const userId = (await ask('User ID: ')).trim();
  if (!userId) return console.log(' User ID is required.');

  const exists = await userExists(userId);
  if (!exists) return console.log(' No user found with that ID.');

  const sessionType = (await ask('Session type (quiz/flashcards/matching/notes): ')).trim();
  const validTypes = ['quiz', 'flashcards', 'matching', 'notes'];
  if (!validTypes.includes(sessionType)) return console.log(' Invalid session type.');

  // topic is not stored in study_sessions yet, but we keep the prompt for future use
  const topic = (await ask('Topic (optional): ')).trim();

  const totalRaw = await ask('Total items (0 if not applicable): ');
  const scoreRaw = await ask('Correct items / score (0 if not applicable): ');
  const minutesRaw = await ask('Minutes spent: ');

  const totalPossible = toInt(totalRaw.trim());
  const score = toInt(scoreRaw.trim());
  const durationMinutes = toInt(minutesRaw.trim());

  if (totalPossible === null) return console.log(' Invalid total items.');
  if (score === null) return console.log(' Invalid score.');
  if (durationMinutes === null) return console.log(' Invalid minutes.');

  if (score > totalPossible) return console.log(' Score cannot exceed total items.');

  const percentage = computePercentage(score, totalPossible);

  const { data, error } = await client
    .from('study_sessions')
    .insert([{
      user_id: userId,
      session_type: sessionType,
      duration_minutes: durationMinutes,
      score: score,
      total_possible: totalPossible,
      percentage: percentage, // can be null if total_possible is 0
      // started_at / ended_at not provided by CLI; can be added later if you want timestamps
      // quiz_id left null
    }])
    .select('*')
    .single();

  if (error) return console.log('Insert error:', error.message);

  console.log('Logged study session:', data);
  if (topic) console.log('Note: topic was provided but is not stored in study_sessions yet.');
}

async function viewProgress() {
  const userId = (await ask('User ID: ')).trim();
  if (!userId) return console.log(' User ID is required.');

  const { data, error } = await client
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return console.log('Query error:', error.message);
  if (!data?.length) return console.log('No study sessions found.');

  console.log('\n=== Study Sessions ===');
  data.forEach((r: any) => {
    const pct = (r.percentage === null || r.percentage === undefined) ? 'N/A' : `${Number(r.percentage).toFixed(1)}%`;
    console.log(`• ${r.session_type} | ${pct} | ${r.duration_minutes} min | score ${r.score}/${r.total_possible}`);
  });
}

async function listSessions(userId: string) {
  const { data, error } = await client
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Query error:', error.message);
    return null;
  }
  if (!data?.length) {
    console.log('No study sessions found.');
    return null;
  }

  console.log('\n# | Type       | Percent  | Minutes | Score');
  console.log('--+------------+----------+---------+-----------');

  data.forEach((r: any, i: number) => {
    const pct = (r.percentage === null || r.percentage === undefined) ? 'N/A' : `${Number(r.percentage).toFixed(1)}%`;
    console.log(
      `${String(i).padEnd(2)}| ${String(r.session_type).padEnd(10)} | ${String(pct).padEnd(8)} | ${String(r.duration_minutes).padEnd(7)} | ${r.score}/${r.total_possible}`
    );
  });

  return data;
}

async function deleteSession() {
  const userId = (await ask('User ID: ')).trim();
  if (!userId) return console.log(' User ID is required.');

  const rows = await listSessions(userId);
  if (!rows) return;

  const index = await ask('\nEnter row # to delete (or Enter to cancel): ');
  if (!index.trim()) return console.log('Cancelled.');

  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0 || idx >= rows.length) return console.log('Invalid index.');

  const id = rows[idx].id;

  const { error } = await client
    .from('study_sessions')
    .delete()
    .eq('id', id);

  if (error) return console.log('Delete error:', error.message);
  console.log('Study session deleted.');
}

async function mainMenu() {
  while (true) {
    console.log('\n=== Progress Tracker Demo (study_sessions) ===');
    console.log('1) Log study session');
    console.log('2) View sessions');
    console.log('3) Delete session');
    console.log('4) Exit');

    const choice = (await ask('Choose an option: ')).trim();
    if (choice === '1') await logStudySession();
    else if (choice === '2') await viewProgress();
    else if (choice === '3') await deleteSession();
    else if (choice === '4') break;
    else console.log('Invalid option.');
  }

  rl.close();
}

mainMenu();
