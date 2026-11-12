import { createServer } from 'node:http';
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'), override: true });

const port = Number(process.env.API_PORT || 3001);
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const dataFile = path.join(dataDir, 'store.json');
const defaultCompetition = { id: '00000000-0000-4000-8000-000000000048', title: 'The Ultimate Knowledge Sprint', description: 'General knowledge · Advanced', questionCount: 20, durationMinutes: 10, maxParticipants: 1000, rules: 'One correct answer per question. Highest score wins; ties are broken by fastest completion time.', prize: '₵2,500', entryCode: 'JQ-000048', isPublished: true, status: 'active', createdAt: new Date(0).toISOString() };
const answerKey = [1, 1, 1, 2, 3, 1, 1, 2, 2, 1, 1, 1, 1, 1, 2, 2, 1, 2, 1, 1];
const adminEmail = process.env.ADMIN_EMAIL || 'admin@johnquiz.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'champion123';
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;
const userSessionSecret = process.env.USER_SESSION_SECRET || `${adminSessionSecret}:user`;
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
  : null;

await mkdir(dataDir, { recursive: true });
let store;
try {
  store = JSON.parse(await readFile(dataFile, 'utf8'));
} catch {
  store = { participants: [], submissions: [] };
  await writeFile(dataFile, JSON.stringify(store, null, 2));
}
store.participants ||= [];
store.submissions ||= [];
store.accounts ||= [];
const persist = () => writeFile(dataFile, JSON.stringify(store, null, 2));

function derivePassword(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('hex'));
    });
  });
}

function createUserToken(account) {
  const payload = Buffer.from(JSON.stringify({ accountId: account.id, email: account.email, expiresAt: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', userSessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getSignedUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', userSessionSecret).update(payload).digest();
  const received = Buffer.from(signature, 'base64url');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(session.expiresAt) > Date.now() && typeof session.accountId === 'string' && typeof session.email === 'string' ? session : null;
  } catch { return null; }
}

async function findAccount(email) {
  if (!supabase) return store.accounts.find((account) => account.email === email) || null;
  const { data, error } = await supabase.from('user_accounts').select('id,email,password_salt,password_hash,created_at').eq('email', email).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function createAccount(email, password) {
  const id = randomUUID();
  const salt = randomBytes(16).toString('hex');
  const hash = await derivePassword(password, salt);
  const record = { id, email, passwordSalt: salt, passwordHash: hash, createdAt: new Date().toISOString() };
  if (!supabase) {
    store.accounts.push(record);
    await persist();
    return { id, email };
  }
  const { data, error } = await supabase.from('user_accounts').insert({ id, email, password_salt: salt, password_hash: hash }).select('id,email').single();
  if (error) throw error;
  return data;
}

async function allParticipants() {
  if (!supabase) return store.participants;
  let { data, error } = await supabase.from('participants').select('id,account_id,full_name,email,phone,competition_id,created_at').order('created_at', { ascending: false });
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('participants').select('id,full_name,email,phone,competition_id,created_at').order('created_at', { ascending: false }));
  }
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('participants').select('id,full_name,email,phone,created_at').order('created_at', { ascending: false }));
    if (!error) return data.map((person) => ({ id: person.id, name: person.full_name, email: person.email, phone: person.phone, competitionId: defaultCompetition.id, registeredAt: person.created_at }));
  }
  if (error) throw error;
  return data.map((person) => ({ id: person.id, accountId: person.account_id, name: person.full_name, email: person.email, phone: person.phone, competitionId: person.competition_id, registeredAt: person.created_at }));
}

async function allCompetitions() {
  if (!supabase) return store.competitions || [defaultCompetition];
  let { data, error } = await supabase.from('competitions').select('id,title,slug,entry_code,description,start_time,end_time,duration_seconds,question_count,max_participants,rules,prize_description,status,created_at').order('created_at', { ascending: false });
  if (error?.code === 'PGRST205') return [defaultCompetition];
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('competitions').select('id,title,slug,description,start_time,end_time,duration_seconds,prize_description,status,created_at').order('created_at', { ascending: false }));
    if (!error) return data.length ? data.map((row) => ({ id: row.id, title: row.title, slug: row.slug, entryCode: makeEntryCode(row.id), description: row.description || '', startAt: row.start_time, endAt: row.end_time, questionCount: 20, durationMinutes: Math.max(1, Math.ceil(row.duration_seconds / 60)), maxParticipants: 1000, rules: '', prize: row.prize_description || '', isPublished: row.status === 'active' || row.status === 'scheduled', status: row.status, createdAt: row.created_at })) : [defaultCompetition];
  }
  if (error) throw error;
  return data.map((row) => ({ id: row.id, title: row.title, slug: row.slug, entryCode: row.entry_code || makeEntryCode(row.id), description: row.description, startAt: row.start_time, endAt: row.end_time, questionCount: row.question_count, durationMinutes: Math.max(1, Math.ceil(row.duration_seconds / 60)), maxParticipants: row.max_participants, rules: row.rules, prize: row.prize_description, isPublished: row.status === 'active' || row.status === 'scheduled', status: row.status, createdAt: row.created_at }));
}

function makeEntryCode(id) {
  return `JQ-${String(id).replaceAll('-', '').slice(-6).toUpperCase()}`;
}

function competitionStatus(isPublished, startAt, endAt) {
  if (!isPublished) return 'draft';
  const now = Date.now();
  if (startAt && new Date(startAt).getTime() > now) return 'scheduled';
  if (endAt && new Date(endAt).getTime() < now) return 'completed';
  return 'active';
}

function isCompetitionOpen(competition) {
  const now = Date.now();
  return competition.isPublished && competition.status !== 'draft' && competition.status !== 'completed'
    && (!competition.startAt || new Date(competition.startAt).getTime() <= now)
    && (!competition.endAt || new Date(competition.endAt).getTime() >= now);
}

function selectCurrentCompetition(rows) {
  const current = rows.find((row) => row.status === 'active' && isCompetitionOpen(row))
    || rows.find((row) => row.status === 'scheduled' && isCompetitionOpen(row));
  const upcoming = rows.filter((row) => row.status === 'scheduled' && row.startAt && new Date(row.startAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  return current || upcoming || rows.find(isCompetitionOpen) || defaultCompetition;
}

async function currentCompetition() {
  return selectCurrentCompetition(await allCompetitions());
}

async function allSubmissions() {
  if (!supabase) return store.submissions;
  const { data, error } = await supabase.from('submissions').select('id,participant_id,score,elapsed_seconds,answers,submitted_at');
  if (error) throw error;
  return data.map((entry) => ({ id: entry.id, participantId: entry.participant_id, score: entry.score, elapsedSeconds: entry.elapsed_seconds, answers: entry.answers, submittedAt: entry.submitted_at }));
}

async function insertParticipant(person) {
  if (!supabase) {
    store.participants.push(person);
    await persist();
    return person;
  }
  let { data, error } = await supabase.from('participants').insert({ id: person.id, account_id: person.accountId, full_name: person.name, email: person.email, phone: person.phone, competition_id: person.competitionId }).select('id,account_id,full_name,email,phone,competition_id,created_at').single();
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('participants').insert({ id: person.id, full_name: person.name, email: person.email, phone: person.phone, competition_id: person.competitionId }).select('id,full_name,email,phone,competition_id,created_at').single());
  }
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('participants').insert({ id: person.id, full_name: person.name, email: person.email, phone: person.phone }).select('id,full_name,email,phone,created_at').single());
    if (!error) return { id: data.id, name: data.full_name, email: data.email, phone: data.phone, competitionId: defaultCompetition.id, registeredAt: data.created_at };
  }
  if (error) throw error;
  return { id: data.id, accountId: data.account_id, name: data.full_name, email: data.email, phone: data.phone, competitionId: data.competition_id, registeredAt: data.created_at };
}

async function insertCompetition(competition) {
  if (!supabase) {
    store.competitions ||= [];
    store.competitions.unshift(competition);
    await persist();
    return competition;
  }
  const slug = `${competition.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${competition.id.slice(0, 8)}`;
  const status = competitionStatus(competition.isPublished, competition.startAt, competition.endAt);
  const entryCode = competition.entryCode || makeEntryCode(competition.id);
  let { data, error } = await supabase.from('competitions').insert({ id: competition.id, title: competition.title, slug, entry_code: entryCode, description: competition.description, start_time: competition.startAt || null, end_time: competition.endAt || null, duration_seconds: competition.durationMinutes * 60, question_count: competition.questionCount, max_participants: competition.maxParticipants, rules: competition.rules, prize_description: competition.prize, status }).select('id,title,slug,entry_code,description,start_time,end_time,duration_seconds,question_count,max_participants,rules,prize_description,status,created_at').single();
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data, error } = await supabase.from('competitions').insert({ id: competition.id, title: competition.title, slug, description: competition.description, start_time: competition.startAt || null, end_time: competition.endAt || null, duration_seconds: competition.durationMinutes * 60, question_count: competition.questionCount, max_participants: competition.maxParticipants, rules: competition.rules, prize_description: competition.prize, status }).select('id,title,slug,description,start_time,end_time,duration_seconds,question_count,max_participants,rules,prize_description,status,created_at').single());
  }
  if (error) throw error;
  return { id: data.id, title: data.title, slug: data.slug, entryCode: data.entry_code || entryCode, description: data.description, startAt: data.start_time, endAt: data.end_time, questionCount: data.question_count, durationMinutes: Math.max(1, Math.ceil(data.duration_seconds / 60)), maxParticipants: data.max_participants, rules: data.rules, prize: data.prize_description, isPublished: data.status === 'active' || data.status === 'scheduled', status: data.status, createdAt: data.created_at };
}

async function updateCompetition(id, updates) {
  const status = competitionStatus(updates.isPublished, updates.startAt, updates.endAt);
  const values = { title: updates.title, description: updates.description, start_time: updates.startAt || null, end_time: updates.endAt || null, duration_seconds: updates.durationMinutes * 60, question_count: updates.questionCount, max_participants: updates.maxParticipants, rules: updates.rules, prize_description: updates.prize, status };
  if (!supabase) {
    const index = (store.competitions || []).findIndex((item) => item.id === id);
    if (index < 0) return null;
    store.competitions[index] = { ...store.competitions[index], ...updates, status, isPublished: status !== 'draft' };
    await persist();
    return store.competitions[index];
  }
  const { data, error } = await supabase.from('competitions').update(values).eq('id', id).select('id,title,slug,entry_code,description,start_time,end_time,duration_seconds,question_count,max_participants,rules,prize_description,status,created_at').maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, title: data.title, slug: data.slug, entryCode: data.entry_code || makeEntryCode(data.id), description: data.description, startAt: data.start_time, endAt: data.end_time, questionCount: data.question_count, durationMinutes: Math.ceil(data.duration_seconds / 60), maxParticipants: data.max_participants, rules: data.rules, prize: data.prize_description, isPublished: data.status === 'active' || data.status === 'scheduled', status: data.status, createdAt: data.created_at } : null;
}

async function deleteCompetition(id) {
  if (!supabase) {
    store.competitions = (store.competitions || []).filter((item) => item.id !== id);
    store.participants = store.participants.filter((person) => person.competitionId !== id);
    await persist();
    return;
  }
  const { error } = await supabase.from('competitions').delete().eq('id', id);
  if (error) throw error;
}

async function questionsFor(competitionId) {
  if (!supabase) return (store.questions || []).filter((question) => question.competitionId === competitionId);
  let { data: questions, error } = await supabase.from('questions').select('id,competition_id,question_text,marks,explanation,position,category,status').eq('competition_id', competitionId).order('position', { ascending: true });
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data: questions, error } = await supabase.from('questions').select('id,competition_id,question_text,marks,explanation,position').eq('competition_id', competitionId).order('position', { ascending: true }));
    if (error) throw error;
    questions = questions.map((question) => ({ ...question, category: 'General knowledge', status: 'published' }));
  }
  if (error) throw error;
  if (!questions.length) return [];
  const { data: options, error: optionError } = await supabase.from('question_options').select('id,question_id,option_text,is_correct,position').in('question_id', questions.map((question) => question.id)).order('position', { ascending: true });
  if (optionError) throw optionError;
  return questions.map((question) => ({ id: question.id, competitionId: question.competition_id, question: question.question_text, options: options.filter((option) => option.question_id === question.id).map((option) => option.option_text), correctIndex: options.filter((option) => option.question_id === question.id).findIndex((option) => option.is_correct), marks: Number(question.marks), explanation: question.explanation || '', position: question.position, category: question.category, status: question.status }));
}

async function saveQuestion(question) {
  if (!supabase) {
    store.questions ||= [];
    store.questions.push(question);
    await persist();
    return question;
  }
  const { data, error } = await supabase.from('questions').insert({ id: question.id, competition_id: question.competitionId, question_text: question.question, question_type: 'mcq_single', marks: question.marks, accepted_answers: [], explanation: question.explanation, position: question.position, category: question.category, status: question.status }).select('id,competition_id,question_text,marks,explanation,position,category,status').single();
  if (error) throw error;
  const rows = question.options.map((option, position) => ({ id: randomUUID(), question_id: data.id, option_text: option, is_correct: position === question.correctIndex, position }));
  const { error: optionError } = await supabase.from('question_options').insert(rows);
  if (optionError) {
    await supabase.from('questions').delete().eq('id', data.id);
    throw optionError;
  }
  return { ...question, id: data.id };
}

async function getSettings() {
  if (!supabase) return store.settings || { platformName: 'John quiz.com', supportEmail: 'hello@johnquiz.com', timezone: 'Africa/Accra', dateFormat: 'DD/MM/YYYY' };
  const { data, error } = await supabase.from('platform_settings').select('platform_name,support_email,timezone,date_format').eq('singleton', true).single();
  if (error) throw error;
  return { platformName: data.platform_name, supportEmail: data.support_email, timezone: data.timezone, dateFormat: data.date_format };
}

async function saveSettings(settings) {
  if (!supabase) {
    store.settings = settings;
    await persist();
    return settings;
  }
  const { data, error } = await supabase.from('platform_settings').upsert({ singleton: true, platform_name: settings.platformName, support_email: settings.supportEmail, timezone: settings.timezone, date_format: settings.dateFormat, updated_at: new Date().toISOString() }).select('platform_name,support_email,timezone,date_format').single();
  if (error) throw error;
  return { platformName: data.platform_name, supportEmail: data.support_email, timezone: data.timezone, dateFormat: data.date_format };
}

async function insertSubmission(entry) {
  if (!supabase) {
    store.submissions.push(entry);
    await persist();
    return entry;
  }
  const { data, error } = await supabase.from('submissions').insert({ id: entry.id, participant_id: entry.participantId, score: entry.score, elapsed_seconds: entry.elapsedSeconds, answers: entry.answers }).select('id,participant_id,score,elapsed_seconds,answers,submitted_at').single();
  if (error) throw error;
  return { id: data.id, participantId: data.participant_id, score: data.score, elapsedSeconds: data.elapsed_seconds, answers: data.answers, submittedAt: data.submitted_at };
}

const questions = [
  ['Which element has the chemical symbol “Au”?', ['Silver', 'Gold', 'Argon', 'Aluminium']],
  ['Which planet has the shortest day in our solar system?', ['Mars', 'Jupiter', 'Venus', 'Mercury']],
  ['Who wrote the novel “Things Fall Apart”?', ['Wole Soyinka', 'Chinua Achebe', 'Ngũgĩ wa Thiong’o', 'Ben Okri']],
  ['What is the capital city of Canada?', ['Toronto', 'Vancouver', 'Ottawa', 'Montreal']],
  ['Which ocean is the largest by surface area?', ['Atlantic', 'Indian', 'Arctic', 'Pacific']],
  ['What is the largest mammal on Earth?', ['African elephant', 'Blue whale', 'Giraffe', 'Orca']],
  ['Which country is home to the ancient city of Petra?', ['Egypt', 'Jordan', 'Greece', 'Morocco']],
  ['What is the square root of 144?', ['10', '11', '12', '14']],
  ['Which gas do plants absorb from the atmosphere?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen']],
  ['In which year did Ghana gain independence?', ['1952', '1957', '1960', '1963']],
  ['What is the hardest naturally occurring substance?', ['Quartz', 'Diamond', 'Granite', 'Iron']],
  ['Which instrument measures atmospheric pressure?', ['Thermometer', 'Barometer', 'Hygrometer', 'Anemometer']],
  ['How many sides does a hexagon have?', ['Five', 'Six', 'Seven', 'Eight']],
  ['Which artist painted the Mona Lisa?', ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Caravaggio']],
  ['What is the smallest prime number?', ['0', '1', '2', '3']],
  ['Which organ pumps blood around the human body?', ['Liver', 'Lungs', 'Heart', 'Kidney']],
  ['What is the official language of Brazil?', ['Spanish', 'Portuguese', 'French', 'English']],
  ['Which is the nearest star to Earth?', ['Sirius', 'Proxima Centauri', 'The Sun', 'Alpha Centauri A']],
  ['What is the chemical symbol for iron?', ['Ir', 'Fe', 'In', 'I']],
  ['Which continent contains the Sahara Desert?', ['Asia', 'Africa', 'South America', 'Australia']],
].map(([question, options], index) => ({ id: index + 1, question, options }));

function send(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function isAdmin(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = createHmac('sha256', adminSessionSecret).update(payload).digest();
  let received;
  try { received = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.email === adminEmail && Number(session.expiresAt) > Date.now();
  } catch { return false; }
}

function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({ email: adminEmail, expiresAt: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', adminSessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 32_000) throw new Error('Request body too large');
  }
  return JSON.parse(raw || '{}');
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok', service: 'john-quiz-api', accountAuth: true });
    if (req.method === 'POST' && ['/api/account/signup', '/api/account/login'].includes(url.pathname)) {
      const data = await readJson(req);
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      const password = typeof data.password === 'string' ? data.password : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Enter a valid email address.' });
      if (url.pathname.endsWith('/signup') && password.length < 8) return send(res, 400, { error: 'Choose a password with at least 8 characters.' });
      if (!password) return send(res, 400, { error: 'Enter your password.' });
      let account = await findAccount(email);
      if (url.pathname.endsWith('/signup')) {
        if (account) return send(res, 409, { error: 'An account with this email already exists. Sign in instead.' });
        try {
          account = await createAccount(email, password);
        } catch (error) {
          if (error?.code === '23505') return send(res, 409, { error: 'An account with this email already exists. Sign in instead.' });
          throw error;
        }
      } else {
        if (!account) return send(res, 401, { error: 'Email or password is incorrect.' });
        const salt = account.passwordSalt || account.password_salt;
        const savedHash = account.passwordHash || account.password_hash;
        const incomingHash = Buffer.from(await derivePassword(password, salt), 'hex');
        const expectedHash = Buffer.from(savedHash, 'hex');
        if (incomingHash.length !== expectedHash.length || !timingSafeEqual(incomingHash, expectedHash)) return send(res, 401, { error: 'Email or password is incorrect.' });
      }
      return send(res, 200, { token: createUserToken(account), account: { id: account.id, email: account.email } });
    }
    if (req.method === 'GET' && url.pathname === '/api/account/me') {
      const session = getSignedUser(req);
      return session ? send(res, 200, { account: { id: session.accountId, email: session.email } }) : send(res, 401, { error: 'Please sign in to continue.' });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      const data = await readJson(req);
      if (data.email !== adminEmail || data.password !== adminPassword) return send(res, 401, { error: 'Email or password is incorrect.' });
      const token = createAdminToken();
      return send(res, 200, { token, admin: { email: adminEmail } });
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!isAdmin(req)) return send(res, 401, { error: 'Administrator sign-in required.' });
      const competitionMatch = url.pathname.match(/^\/api\/admin\/competitions\/([^/]+)$/);
      if (competitionMatch && req.method === 'PUT') {
        const id = competitionMatch[1];
        const data = await readJson(req);
        const questionCount = Number(data.questionCount);
        const durationMinutes = Number(data.durationMinutes);
        const maxParticipants = Number(data.maxParticipants);
        if (typeof data.title !== 'string' || data.title.trim().length < 3 || !Number.isInteger(questionCount) || questionCount < 1 || questionCount > questions.length || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180 || !Number.isInteger(maxParticipants) || maxParticipants < 1) return send(res, 400, { error: 'Check the title, question count, time limit and participant limit.' });
        const updated = await updateCompetition(id, { title: data.title.trim(), description: String(data.description || ''), startAt: data.startAt || null, endAt: data.endAt || null, questionCount, durationMinutes, maxParticipants, rules: String(data.rules || ''), prize: String(data.prize || ''), isPublished: Boolean(data.isPublished) });
        return updated ? send(res, 200, { competition: updated }) : send(res, 404, { error: 'Competition not found.' });
      }
      if (competitionMatch && req.method === 'DELETE') {
        const existing = (await allCompetitions()).find((item) => item.id === competitionMatch[1]);
        if (!existing) return send(res, 404, { error: 'Competition not found.' });
        await deleteCompetition(competitionMatch[1]);
        return send(res, 200, { deleted: true });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/participants') {
        const [people, submissions, items] = await Promise.all([allParticipants(), allSubmissions(), allCompetitions()]);
        return send(res, 200, { participants: people.map((person) => ({ ...person, competitionTitle: items.find((item) => item.id === person.competitionId)?.title || 'Quiz', submission: submissions.find((item) => item.participantId === person.id) || null })) });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/competitions') {
        const [items, people] = await Promise.all([allCompetitions(), allParticipants()]);
        return send(res, 200, { competitions: items.map((item) => ({ ...item, participantCount: people.filter((person) => person.competitionId === item.id).length })) });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/questions') {
        const selectedCompetition = url.searchParams.get('competitionId') || (await currentCompetition()).id;
        return send(res, 200, { questions: await questionsFor(selectedCompetition) });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/questions') {
        const data = await readJson(req);
        const targetCompetitionId = data.competitionId || (await currentCompetition()).id;
        const text = typeof data.question === 'string' ? data.question.trim() : '';
        const options = Array.isArray(data.options) ? data.options.map((option) => String(option).trim()) : [];
        const correctIndex = Number(data.correctIndex);
        if (!text || options.length < 2 || options.length > 4 || options.some((option) => !option) || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return send(res, 400, { error: 'Enter the question, 2–4 answer options, and the correct answer.' });
        const existing = await questionsFor(targetCompetitionId);
        const created = await saveQuestion({ id: randomUUID(), competitionId: targetCompetitionId, question: text, options, correctIndex, marks: Math.max(1, Number(data.marks) || 1), explanation: String(data.explanation || ''), position: existing.length, category: String(data.category || 'General knowledge'), status: data.status === 'draft' ? 'draft' : 'published' });
        return send(res, 201, { question: created });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/questions/bulk') {
        const data = await readJson(req);
        if (!Array.isArray(data.questions) || !data.questions.length || data.questions.length > 500) return send(res, 400, { error: 'Upload a CSV containing between 1 and 500 valid questions.' });
        const targetCompetitionId = data.competitionId || (await currentCompetition()).id;
        const targetCompetition = (await allCompetitions()).find((competition) => competition.id === targetCompetitionId);
        if (!targetCompetition) return send(res, 404, { error: 'Select a competition before importing questions.' });
        const existing = await questionsFor(targetCompetitionId);
        const savedQuestions = [];
        for (const [index, row] of data.questions.entries()) {
          const options = Array.isArray(row.options) ? row.options.map((option) => String(option).trim()) : [];
          const correctIndex = Number(row.correctIndex);
          if (typeof row.question !== 'string' || !row.question.trim() || options.length !== 4 || options.some((option) => !option) || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return send(res, 400, { error: `Question ${index + 1} is missing text, four options, or a valid correct answer.` });
          savedQuestions.push(await saveQuestion({ id: randomUUID(), competitionId: targetCompetitionId, question: row.question.trim(), options, correctIndex, marks: Math.max(1, Number(row.marks) || 1), explanation: String(row.explanation || ''), position: existing.length + index, category: String(row.category || 'General knowledge'), status: 'published' }));
        }
        return send(res, 201, { imported: savedQuestions.length });
      }
      const questionDelete = req.method === 'DELETE' && url.pathname.match(/^\/api\/admin\/questions\/([^/]+)$/);
      if (questionDelete) {
        const id = questionDelete[1];
        if (supabase) {
          const { error: optionError } = await supabase.from('question_options').delete().eq('question_id', id);
          if (optionError) throw optionError;
          const { error } = await supabase.from('questions').delete().eq('id', id);
          if (error) throw error;
        } else {
          store.questions = (store.questions || []).filter((question) => question.id !== id);
          await persist();
        }
        return send(res, 200, { deleted: true });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/live') {
        const active = await currentCompetition();
        const [people, submissions] = await Promise.all([allParticipants(), allSubmissions()]);
        const peopleInCompetition = people.filter((person) => person.competitionId === active.id);
        const participantIds = new Set(peopleInCompetition.map((person) => person.id));
        const rows = submissions.filter((submission) => participantIds.has(submission.participantId)).map((submission) => ({ ...submission, name: peopleInCompetition.find((person) => person.id === submission.participantId)?.name || 'Participant' })).sort((a, b) => b.score - a.score || a.elapsedSeconds - b.elapsedSeconds || a.submittedAt.localeCompare(b.submittedAt));
        return send(res, 200, { competition: active, participants: peopleInCompetition.length, submissions: rows.length, pending: peopleInCompetition.length - rows.length, perfectScores: rows.filter((row) => row.score === active.questionCount).length, leaderboard: rows });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/reports') {
        const [people, submissions, competitions] = await Promise.all([allParticipants(), allSubmissions(), allCompetitions()]);
        const scores = submissions.map((row) => row.score);
        const elapsed = submissions.map((row) => row.elapsedSeconds);
        const totalPossible = submissions.reduce((sum, row) => sum + (row.answers?.length || 20), 0);
        const totalCorrect = scores.reduce((sum, score) => sum + score, 0);
        const byCompetition = competitions.map((competition) => {
          const ids = new Set(people.filter((person) => person.competitionId === competition.id).map((person) => person.id));
          const entries = submissions.filter((submission) => ids.has(submission.participantId));
          const averageScore = entries.length ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0;
          const averagePercent = entries.length ? entries.reduce((sum, entry) => sum + (entry.score / (entry.answers?.length || 20)) * 100, 0) / entries.length : 0;
          return { id: competition.id, title: competition.title, participants: ids.size, submissions: entries.length, averageScore, averagePercent };
        });
        const missedQuestions = [];
        for (const competition of competitions) {
          const participantIds = new Set(people.filter((person) => person.competitionId === competition.id).map((person) => person.id));
          const entries = submissions.filter((submission) => participantIds.has(submission.participantId));
          const bank = (await questionsFor(competition.id)).filter((question) => question.status !== 'draft');
          const content = bank.length ? bank : questions.slice(0, competition.questionCount).map((question, index) => ({ question: question.q, correctIndex: answerKey[index] }));
          content.forEach((question, index) => {
            const answered = entries.filter((entry) => entry.answers?.[index] !== null && entry.answers?.[index] !== undefined);
            const missed = answered.filter((entry) => entry.answers[index] !== question.correctIndex).length;
            if (missed) missedQuestions.push({ question: question.question, missed, rate: Math.round((missed / answered.length) * 100) });
          });
        }
        const today = new Date();
        const activity = Array.from({ length: 14 }, (_, offset) => {
          const day = new Date(today);
          day.setHours(0, 0, 0, 0);
          day.setDate(day.getDate() - (13 - offset));
          const next = new Date(day);
          next.setDate(next.getDate() + 1);
          const registered = people.filter((person) => { const date = new Date(person.registeredAt); return date >= day && date < next; }).length;
          const completed = submissions.filter((entry) => { const date = new Date(entry.submittedAt); return date >= day && date < next; }).length;
          return { date: day.toISOString().slice(0, 10), participants: registered, submissions: completed };
        });
        return send(res, 200, { participants: people.length, submissions: submissions.length, averageScore: scores.length ? totalCorrect / scores.length : 0, averageSeconds: elapsed.length ? elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length : 0, accuracy: totalPossible ? (totalCorrect / totalPossible) * 100 : 0, perfectScores: scores.filter((score, index) => score === (submissions[index].answers?.length || 20)).length, competitionCount: competitions.length, competitions: byCompetition, activity, missedQuestions: missedQuestions.sort((a, b) => b.rate - a.rate).slice(0, 5) });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/winners') {
        if (!supabase) return send(res, 200, { winners: store.winners || [] });
        const { data, error } = await supabase.from('competition_winners').select('id,competition_id,participant_id,submission_id,declared_at').order('declared_at', { ascending: false });
        if (error) throw error;
        const [people, submissions, items] = await Promise.all([allParticipants(), allSubmissions(), allCompetitions()]);
        return send(res, 200, { winners: data.map((winner) => ({ ...winner, name: people.find((person) => person.id === winner.participant_id)?.name || 'Participant', score: submissions.find((submission) => submission.id === winner.submission_id)?.score || 0, declaredAt: winner.declared_at, submissionId: winner.submission_id, competitionTitle: items.find((item) => item.id === winner.competition_id)?.title || 'Quiz' })) });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/winners') {
        const data = await readJson(req);
        const submissions = await allSubmissions();
        const submission = submissions.find((item) => item.id === data.submissionId);
        const people = await allParticipants();
        const winner = submission && people.find((person) => person.id === submission.participantId);
        if (!submission || !winner) return send(res, 404, { error: 'Submission not found.' });
        if (!supabase) {
          store.winners ||= [];
          if (store.winners.some((item) => item.participantId === winner.id)) return send(res, 409, { error: 'This participant is already declared as a winner.' });
          const declared = { id: randomUUID(), competitionId: winner.competitionId, participantId: winner.id, submissionId: submission.id, name: winner.name, score: submission.score, declaredAt: new Date().toISOString() };
          store.winners.push(declared);
          await persist();
          return send(res, 201, { winner: declared });
        }
        const { data: created, error } = await supabase.from('competition_winners').insert({ competition_id: winner.competitionId, participant_id: winner.id, submission_id: submission.id }).select('id,competition_id,participant_id,submission_id,declared_at').single();
        if (error) throw error;
        return send(res, 201, { winner: { id: created.id, name: winner.name, score: submission.score, declaredAt: created.declared_at } });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/settings') return send(res, 200, { settings: await getSettings() });
      if (req.method === 'PUT' && url.pathname === '/api/admin/settings') {
        const data = await readJson(req);
        if (typeof data.platformName !== 'string' || !data.platformName.trim() || typeof data.supportEmail !== 'string') return send(res, 400, { error: 'Platform name and support email are required.' });
        return send(res, 200, { settings: await saveSettings({ platformName: data.platformName.trim(), supportEmail: data.supportEmail.trim(), timezone: String(data.timezone || 'Africa/Accra'), dateFormat: String(data.dateFormat || 'DD/MM/YYYY') }) });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/competitions') {
        const data = await readJson(req);
        const questionCount = Number(data.questionCount);
        const durationMinutes = Number(data.durationMinutes);
        const maxParticipants = Number(data.maxParticipants);
        if (typeof data.title !== 'string' || data.title.trim().length < 3) return send(res, 400, { error: 'Enter a competition title with at least 3 characters.' });
        if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > questions.length) return send(res, 400, { error: `Question count must be between 1 and ${questions.length}.` });
        if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) return send(res, 400, { error: 'Time limit must be between 1 and 180 minutes.' });
        if (!Number.isInteger(maxParticipants) || maxParticipants < 1) return send(res, 400, { error: 'Maximum participants must be at least 1.' });
        let created;
        const id = randomUUID();
        try {
          created = await insertCompetition({
          id, entryCode: makeEntryCode(id), title: data.title.trim(), description: String(data.description || ''),
          startAt: data.startAt || null, endAt: data.endAt || null, questionCount, durationMinutes,
          maxParticipants, rules: String(data.rules || ''), prize: String(data.prize || ''),
          isPublished: Boolean(data.isPublished), status: competitionStatus(Boolean(data.isPublished), data.startAt, data.endAt), createdAt: new Date().toISOString(),
          });
        } catch (error) {
          if (['PGRST205', 'PGRST204', '42703'].includes(error?.code)) return send(res, 503, { error: 'Run the competitions migration in Supabase before creating quizzes.' });
          throw error;
        }
        return send(res, 201, { competition: created });
      }
      if (req.method === 'GET' && url.pathname === '/api/admin/submissions') return send(res, 200, { submissions: await allSubmissions() });
    }
    if (req.method === 'GET' && url.pathname === '/api/competitions') {
      const [items, people] = await Promise.all([allCompetitions(), allParticipants()]);
      const publicItems = items.filter((item) => item.status !== 'draft');
      return send(res, 200, { competitions: publicItems.map((item) => {
        const opensAt = item.startAt ? new Date(item.startAt) : null;
        const closesAt = item.endAt ? new Date(item.endAt) : null;
        const locked = !isCompetitionOpen(item);
        const lockReason = opensAt && opensAt.getTime() > Date.now()
          ? `Opens ${opensAt.toLocaleString()}`
          : item.status === 'completed' || (closesAt && closesAt.getTime() < Date.now())
            ? `Closed ${closesAt ? closesAt.toLocaleString() : ""}`.trim()
            : undefined;
        return { ...item, isLocked: locked, lockReason, participantCount: people.filter((person) => person.competitionId === item.id).length };
      }) });
    }
    if (req.method === 'GET' && url.pathname === '/api/public/home') {
      const [items, people, submissions, settings] = await Promise.all([
        allCompetitions(), allParticipants(), allSubmissions(),
        getSettings().catch(() => ({ platformName: 'John quiz.com', supportEmail: 'hello@johnquiz.com' })),
      ]);
      const competition = selectCurrentCompetition(items);
      const playerIds = new Set(people.filter((person) => person.competitionId === competition.id).map((person) => person.id));
      const currentSubmissions = submissions.filter((entry) => playerIds.has(entry.participantId));
      const competitions = items.filter((item) => item.status !== 'draft').map((item) => {
        const opensAt = item.startAt ? new Date(item.startAt) : null;
        const closesAt = item.endAt ? new Date(item.endAt) : null;
        const locked = !isCompetitionOpen(item);
        const lockReason = opensAt && opensAt.getTime() > Date.now()
          ? `Opens ${opensAt.toLocaleString()}`
          : item.status === 'completed' || (closesAt && closesAt.getTime() < Date.now())
            ? `Closed ${closesAt ? closesAt.toLocaleString() : ''}`.trim()
            : undefined;
        return { ...item, isLocked: locked, lockReason, participantCount: people.filter((person) => person.competitionId === item.id).length };
      });
      return send(res, 200, { competition: { ...competition, isLocked: !isCompetitionOpen(competition) }, participants: playerIds.size, submissions: currentSubmissions.length, competitions, settings });
    }
    if (req.method === 'GET' && url.pathname === '/api/settings') {
      const { platformName, supportEmail } = await getSettings();
      return send(res, 200, { settings: { platformName, supportEmail } });
    }
    if (req.method === 'GET' && url.pathname === '/api/competition/by-code') {
      const code = String(url.searchParams.get('code') || '').trim().toUpperCase();
      const item = (await allCompetitions()).find((competition) => competition.entryCode?.toUpperCase() === code);
      if (!item || !isCompetitionOpen(item)) return send(res, 404, { error: 'That entry code is invalid or the event is not open.' });
      const configuredQuestions = (await questionsFor(item.id)).filter((question) => question.status !== 'draft').slice(0, item.questionCount);
      const quizQuestions = configuredQuestions.length ? configuredQuestions : questions.slice(0, item.questionCount).map((question, index) => ({ id: `default-${index + 1}`, question: question.q, options: question.opts }));
      return send(res, 200, { competition: { ...item, questionCount: quizQuestions.length }, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, opts: question.options })) });
    }
    if (req.method === 'GET' && url.pathname === '/api/competition/current') {
      const configuredCompetition = await currentCompetition();
      const configuredQuestions = (await questionsFor(configuredCompetition.id)).filter((question) => question.status !== 'draft').slice(0, configuredCompetition.questionCount);
      const quizQuestions = configuredQuestions.length ? configuredQuestions : questions.slice(0, configuredCompetition.questionCount).map((question, index) => ({ id: `default-${index + 1}`, question: question.q, options: question.opts }));
      const activeCompetition = { ...configuredCompetition, questionCount: quizQuestions.length };
      const [people, submissions] = await Promise.all([allParticipants(), allSubmissions()]);
      const competitionPeople = people.filter((person) => person.competitionId === activeCompetition.id);
      const competitionSubmissions = submissions.filter((submission) => competitionPeople.some((person) => person.id === submission.participantId));
      return send(res, 200, { competition: activeCompetition, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, opts: question.options })), participants: competitionPeople.length, submissions: competitionSubmissions.length, perfectScores: competitionSubmissions.filter((submission) => submission.score === activeCompetition.questionCount).length });
    }
    if (req.method === 'POST' && url.pathname === '/api/participants') {
      const data = await readJson(req);
      const account = getSignedUser(req);
      if (!account) return send(res, 401, { error: 'Sign in with your email and password to continue.' });
      if (typeof data.name !== 'string' || data.name.trim().length < 2) return send(res, 400, { error: 'Please provide your full name.' });
      const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
      if (phone.replace(/\D/g, '').length < 7) return send(res, 400, { error: 'Enter a valid contact phone number (at least 7 digits).'});
      const competitions = await allCompetitions();
      const requestedCode = String(data.entryCode || '').trim().toUpperCase();
      const configuredCompetition = requestedCode
        ? competitions.find((competition) => competition.entryCode?.toUpperCase() === requestedCode)
        : await currentCompetition();
      if (!configuredCompetition) return send(res, 400, { error: 'That entry code was not found. Copy the code shown on the event card and try again.' });
      if (!isCompetitionOpen(configuredCompetition)) {
        const opensAt = configuredCompetition.startAt && new Date(configuredCompetition.startAt);
        const closesAt = configuredCompetition.endAt && new Date(configuredCompetition.endAt);
        if (opensAt && opensAt.getTime() > Date.now()) return send(res, 400, { error: `This event is locked until ${opensAt.toLocaleString()}.` });
        if (closesAt && closesAt.getTime() < Date.now()) return send(res, 400, { error: 'This event has closed and is no longer accepting entries.' });
        return send(res, 400, { error: 'This event is not currently accepting entries.' });
      }
      const configuredQuestions = (await questionsFor(configuredCompetition.id)).filter((question) => question.status !== 'draft').slice(0, configuredCompetition.questionCount);
      const quizQuestions = configuredQuestions.length ? configuredQuestions : questions.slice(0, configuredCompetition.questionCount).map((question, index) => ({ id: `default-${index + 1}`, question: question.q, options: question.opts }));
      const activeCompetition = { ...configuredCompetition, questionCount: quizQuestions.length };
      const newParticipant = {
        id: randomUUID(), accountId: account.accountId, name: data.name.trim(),
        competitionId: activeCompetition.id,
        email: account.email,
        phone,
        registeredAt: new Date().toISOString(),
      };
      let participant;
      participant = await insertParticipant(newParticipant);
      return send(res, 201, { participant: { id: participant.id, name: participant.name }, competition: activeCompetition, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, opts: question.options })) });
    }
    if (req.method === 'POST' && url.pathname === '/api/submissions') {
      const data = await readJson(req);
      const people = await allParticipants();
      const participant = people.find((item) => item.id === data.participantId);
      if (!participant) return send(res, 404, { error: 'Participant not found.' });
      const configuredCompetition = (await allCompetitions()).find((item) => item.id === participant.competitionId) || defaultCompetition;
      const configuredQuestions = (await questionsFor(configuredCompetition.id)).filter((question) => question.status !== 'draft').slice(0, configuredCompetition.questionCount);
      const activeQuestions = configuredQuestions.length ? configuredQuestions : questions.slice(0, configuredCompetition.questionCount);
      const activeCompetition = { ...configuredCompetition, questionCount: activeQuestions.length };
      if (!Array.isArray(data.answers) || data.answers.length !== activeQuestions.length || data.answers.some((answer) => answer !== null && (!Number.isInteger(answer) || answer < 0 || answer > 3))) {
        return send(res, 400, { error: `Submit one answer or a blank for each of the ${activeQuestions.length} questions.` });
      }
      const existingSubmissions = await allSubmissions();
      if (existingSubmissions.some((item) => item.participantId === participant.id)) return send(res, 409, { error: 'A submission has already been recorded for this participant.' });
      const score = data.answers.reduce((sum, answer, index) => sum + (answer === (configuredQuestions.length ? configuredQuestions[index].correctIndex : answerKey[index]) ? 1 : 0), 0);
      const newSubmission = {
        id: randomUUID(), participantId: participant.id, score,
        elapsedSeconds: Number.isInteger(data.elapsedSeconds) ? Math.max(0, Math.min(activeCompetition.durationMinutes * 60, data.elapsedSeconds)) : 0,
        answers: data.answers,
        submittedAt: new Date().toISOString(),
      };
      const submission = await insertSubmission(newSubmission);
      return send(res, 201, { submission });
    }
    if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
      const [competition, submissions, people] = await Promise.all([currentCompetition(), allSubmissions(), allParticipants()]);
      const participants = people.filter((person) => person.competitionId === competition.id);
      const participantIds = new Set(participants.map((person) => person.id));
      const rows = submissions.filter((submission) => participantIds.has(submission.participantId)).map((submission) => {
        const player = participants.find((item) => item.id === submission.participantId);
        const names = (player?.name || 'Player').trim().split(/\s+/);
        return { name: names[0] || 'Player', initial: names.length > 1 ? names.at(-1)[0] : '', score: submission.score, elapsedSeconds: submission.elapsedSeconds, submittedAt: submission.submittedAt };
      }).sort((a, b) => b.score - a.score || a.elapsedSeconds - b.elapsedSeconds || a.submittedAt.localeCompare(b.submittedAt));
      const startAt = competition.startAt ? new Date(competition.startAt).getTime() : null;
      const endAt = competition.endAt ? new Date(competition.endAt).getTime() : null;
      const now = Date.now();
      const remainingSeconds = startAt && startAt > now ? Math.ceil((startAt - now) / 1000) : endAt && endAt > now ? Math.ceil((endAt - now) / 1000) : null;
      return send(res, 200, {
        competition,
        leaderboard: rows,
        participants: participants.length,
        perfectScores: rows.filter((row) => row.score === competition.questionCount).length,
        timeRemainingSeconds: remainingSeconds,
        eventClosed: !isCompetitionOpen(competition) && !(startAt && startAt > now),
      });
    }
    return send(res, 404, { error: 'Route not found.' });
  } catch (error) {
    let message = error instanceof SyntaxError ? 'Invalid JSON request.' : 'The server could not complete this request.';
    const duplicateEventAccount = error?.code === '23505' && error?.message?.includes('participants_account_competition_unique');
    if (duplicateEventAccount) message = 'The database still has the one-entry-per-account rule enabled. Run supabase/migrations/202611120006_allow_shared_event_emails.sql in the Supabase SQL Editor, then try again.';
    const accountSchemaMissing = url.pathname.startsWith('/api/account/') && ['PGRST205', 'PGRST204', '42P01'].includes(error?.code);
    if (accountSchemaMissing) message = 'User account storage is not set up yet. Run supabase/migrations/202611120004_user_accounts.sql in the Supabase SQL Editor, then restart the backend.';
    else if (url.pathname.startsWith('/api/account/')) message = error?.message || message;
    if (url.pathname.startsWith('/api/admin/questions') && isAdmin(req)) {
      if (['PGRST205', 'PGRST204', '42703'].includes(error?.code)) message = 'Question storage is missing required columns or tables. Run the John quiz.com competition and question bank migrations in Supabase, then restart the backend.';
      else message = `Question import failed${error?.code ? ` (${error.code})` : ''}: ${error?.message || 'check the question schema and try again.'}`;
    }
    console.error(error);
    return send(res, accountSchemaMissing ? 503 : duplicateEventAccount ? 409 : 400, { error: message });
  }
}).listen(port, '0.0.0.0', () => {
  const mode = supabase ? 'Supabase' : 'local JSON fallback';
  console.log(`John quiz.com API listening on http://localhost:${port} (${mode})`);
  if (!supabase) console.log('Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env to use your Supabase project.');
});
