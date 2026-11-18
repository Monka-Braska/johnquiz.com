import { createServer } from 'node:http';
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'), override: true });

const port = Number(process.env.API_PORT || 3001);
const maxQuestions = 50;
function phoneDigitCount(value) {
  return (String(value || '').match(/\p{Nd}/gu) || []).length;
}
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dataDir = isServerless ? path.join('/tmp', 'data') : path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const dataFile = path.join(dataDir, 'store.json');
const defaultCompetition = { id: '00000000-0000-4000-8000-000000000048', title: 'The Ultimate Knowledge Sprint', description: 'Law students · Legal reasoning', questionCount: 20, durationMinutes: 10, maxParticipants: 1000, rules: 'Answer each question in writing. Highest score wins; ties are broken by fastest completion time.', prize: '₵2,500', entryCode: 'JQ-000048', isPublished: true, status: 'active', createdAt: new Date(0).toISOString() };
const adminEmail = process.env.ADMIN_EMAIL || 'admin@johnquiz.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'champion123';
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;
const userSessionSecret = process.env.USER_SESSION_SECRET || `${adminSessionSecret}:user`;
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
  : null;

try {
  await mkdir(dataDir, { recursive: true });
} catch {
  // Read-only filesystem fallback
}

let store;
try {
  store = JSON.parse(await readFile(dataFile, 'utf8'));
} catch {
  store = { participants: [], submissions: [], accounts: [] };
  try {
    await writeFile(dataFile, JSON.stringify(store, null, 2));
  } catch {
    // Read-only filesystem fallback
  }
}
store.participants ||= [];
store.submissions ||= [];
store.accounts ||= [];
const knownUsernames = new Set();
for (const account of store.accounts) {
  const emailName = String(account.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 20);
  let username = String(account.username || emailName || 'player').toLowerCase();
  if (username.length < 3) username = `user_${username}`;
  if (knownUsernames.has(username)) username = `${username.slice(0, 13)}_${String(account.id || randomUUID()).replaceAll('-', '').slice(-6)}`;
  account.username = username;
  knownUsernames.add(username);
  account.phone ||= store.participants.find((person) => person.accountId === account.id && person.phone)?.phone || '';
  account.classLevel ||= '';
}
const persist = async () => {
  try {
    await writeFile(dataFile, JSON.stringify(store, null, 2));
  } catch {
    // Read-only filesystem
  }
};

function derivePassword(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('hex'));
    });
  });
}

function createUserToken(account) {
  const payload = Buffer.from(JSON.stringify({ accountId: account.id, username: account.username, phone: account.phone || '', classLevel: account.classLevel || account.class_level || '', expiresAt: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
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
    return Number(session.expiresAt) > Date.now() && typeof session.accountId === 'string' && typeof session.username === 'string' ? session : null;
  } catch { return null; }
}

async function findAccount(username) {
  const normalized = username.trim().toLowerCase();
  if (!supabase) return store.accounts.find((account) => account.username?.toLowerCase() === normalized) || null;
  const { data, error } = await supabase.from('user_accounts').select('id,username,phone,class_level,password_salt,password_hash,created_at').eq('username', normalized).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function createAccount(username, password, phone, classLevel) {
  const id = randomUUID();
  const salt = randomBytes(16).toString('hex');
  const hash = await derivePassword(password, salt);
  const account = { id, username: username.trim().toLowerCase(), phone: phone.trim(), classLevel: classLevel.trim(), passwordSalt: salt, passwordHash: hash, createdAt: new Date().toISOString() };
  if (!supabase) {
    if (store.accounts.some((item) => item.username?.toLowerCase() === account.username)) {
      const error = new Error('That username is already taken. Choose another.');
      error.code = '23505';
      throw error;
    }
    store.accounts.push(account);
    await persist();
    return account;
  }
  const { data, error } = await supabase.from('user_accounts').insert({ id, username: account.username, email: null, phone: account.phone, class_level: account.classLevel, password_salt: salt, password_hash: hash }).select('id,username,phone,class_level').single();
  if (error) throw error;
  return data;
}

function publicAccount(account) {
  return { id: account.id, username: account.username, phone: account.phone || '', classLevel: account.classLevel || account.class_level || '' };
}

async function updateAccountProfile(accountId, phone, classLevel) {
  if (!supabase) {
    const account = store.accounts.find((item) => item.id === accountId);
    if (!account) return null;
    account.phone = phone;
    account.classLevel = classLevel;
    await persist();
    return account;
  }
  const { data, error } = await supabase.from('user_accounts').update({ phone, class_level: classLevel }).eq('id', accountId).select('id,username,phone,class_level').single();
  if (error) throw error;
  return data;
}

async function allParticipants() {
  if (!supabase) return store.participants.map((person) => ({ ...person, username: person.username || '', phone: person.phone || '', classLevel: person.classLevel || '' }));
  let { data, error } = await supabase.from('participants').select('id,account_id,full_name,email,username,phone,class_level,competition_id,created_at').order('created_at', { ascending: false });
  if (['42703', 'PGRST204'].includes(error?.code)) {
    ({ data, error } = await supabase.from('participants').select('id,account_id,full_name,email,phone,competition_id,created_at').order('created_at', { ascending: false }));
    if (!error) return data.map((person) => ({ id: person.id, accountId: person.account_id, name: person.full_name, username: String(person.email || '').split('@')[0], email: person.email || '', phone: person.phone || '', classLevel: '', competitionId: person.competition_id, registeredAt: person.created_at }));
  }
  if (['42703', 'PGRST204'].includes(error?.code)) {
    ({ data, error } = await supabase.from('participants').select('id,full_name,email,phone,created_at').order('created_at', { ascending: false }));
    if (!error) return data.map((person) => ({ id: person.id, name: person.full_name, username: String(person.email || '').split('@')[0], email: person.email || '', phone: person.phone || '', classLevel: '', competitionId: defaultCompetition.id, registeredAt: person.created_at }));
  }
  if (error) throw error;
  return data.map((person) => ({ id: person.id, accountId: person.account_id, name: person.full_name, username: person.username, email: person.email, phone: person.phone, classLevel: person.class_level, competitionId: person.competition_id, registeredAt: person.created_at }));
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
  // Keep the displayed event and its entry code tied to a real published row
  // when every real competition is closed. Falling back to the demo event here
  // showed a code that the participant registration endpoint could not find.
  const latestPublished = rows.find((row) => row.isPublished && row.status !== 'draft');
  return current || upcoming || rows.find(isCompetitionOpen) || latestPublished || defaultCompetition;
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
  const { data, error } = await supabase.from('participants').insert({ id: person.id, account_id: person.accountId, full_name: person.name, email: '', username: person.username, phone: person.phone, class_level: person.classLevel, competition_id: person.competitionId }).select('id,account_id,full_name,email,username,phone,class_level,competition_id,created_at').single();
  if (error) throw error;
  return { id: data.id, accountId: data.account_id, name: data.full_name, username: data.username, email: data.email, phone: data.phone, classLevel: data.class_level, competitionId: data.competition_id, registeredAt: data.created_at };
}

async function reserveParticipantAttempt(accountId, competitionId) {
  if (!supabase) {
    return !store.participants.some((person) => person.accountId === accountId && person.competitionId === competitionId);
  }
  const { error } = await supabase.from('participant_attempts').insert({ account_id: accountId, competition_id: competitionId });
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

async function releaseParticipantAttempt(accountId, competitionId) {
  if (!supabase) return;
  const { error } = await supabase.from('participant_attempts').delete().eq('account_id', accountId).eq('competition_id', competitionId);
  if (error) throw error;
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
  if (!supabase) return (store.questions || []).filter((question) => question.competitionId === competitionId).map((question) => ({
    ...question,
    questionType: 'short_answer',
    acceptedAnswers: question.acceptedAnswers?.length ? question.acceptedAnswers : [question.options?.[question.correctIndex] || ''].filter(Boolean),
  }));
  let { data: questions, error } = await supabase.from('questions').select('id,competition_id,question_text,question_type,accepted_answers,marks,explanation,position,category,status').eq('competition_id', competitionId).order('position', { ascending: true });
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    ({ data: questions, error } = await supabase.from('questions').select('id,competition_id,question_text,marks,explanation,position').eq('competition_id', competitionId).order('position', { ascending: true }));
    if (error) throw error;
    questions = questions.map((question) => ({ ...question, category: 'General knowledge', status: 'published' }));
  }
  if (error) throw error;
  if (!questions.length) return [];
  const { data: options, error: optionError } = await supabase.from('question_options').select('id,question_id,option_text,is_correct,position').in('question_id', questions.map((question) => question.id)).order('position', { ascending: true });
  if (optionError) throw optionError;
  return questions.map((question) => {
    const questionOptions = options.filter((option) => option.question_id === question.id);
    const legacyAccepted = questionOptions.filter((option) => option.is_correct).map((option) => option.option_text);
    const acceptedAnswers = Array.isArray(question.accepted_answers) && question.accepted_answers.length
      ? question.accepted_answers
      : legacyAccepted;
    return { id: question.id, competitionId: question.competition_id, question: question.question_text, questionType: 'short_answer', acceptedAnswers, options: questionOptions.map((option) => option.option_text), correctIndex: questionOptions.findIndex((option) => option.is_correct), marks: Number(question.marks), explanation: question.explanation || '', position: question.position, category: question.category, status: question.status };
  });
}

async function saveQuestion(question) {
  if (!supabase) {
    store.questions ||= [];
    store.questions.push(question);
    await persist();
    return question;
  }
  const { data, error } = await supabase.from('questions').insert({ id: question.id, competition_id: question.competitionId, question_text: question.question, question_type: 'short_answer', marks: question.marks, accepted_answers: question.acceptedAnswers, explanation: question.explanation, position: question.position, category: question.category, status: question.status }).select('id,competition_id,question_text,marks,explanation,position,category,status').single();
  if (error) throw error;
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
  ['What is the supreme law of Ghana?', ['1992 Constitution', 'Constitution of Ghana 1992']],
  ['What standard of proof generally applies in Ghanaian civil cases?', ['Balance of probabilities', 'Preponderance of probabilities']],
  ['What standard of proof applies to criminal guilt?', ['Beyond reasonable doubt']],
  ['What is the legal principle that requires courts to follow binding earlier decisions?', ['Stare decisis']],
  ['What is the binding legal reason for a court’s decision called?', ['Ratio decidendi', 'Ratio']],
  ['What is a judge’s non-binding observation outside the core reasoning called?', ['Obiter dictum', 'Obiter']],
  ['What writ requires a detained person to be brought before a court?', ['Habeas corpus']],
  ['What is the presumption that an accused person is not guilty until proven otherwise?', ['Presumption of innocence']],
  ['What is the legal term for a civil wrong, apart from breach of contract?', ['Tort']],
  ['What is the legal term for a person who brings a civil claim?', ['Claimant', 'Plaintiff']],
  ['What is the legal term for the party against whom a civil claim is brought?', ['Defendant']],
  ['What is a formal promise enforceable by law between parties called?', ['Contract']],
  ['What is the intentional or reckless creation of fear of immediate unlawful force called?', ['Assault']],
  ['What is the unlawful application of force to another person called?', ['Battery']],
  ['What is the defence that a person acted to protect themselves from imminent harm?', ['Self-defence', 'Self defense']],
  ['What is the principle that no one should be a judge in their own cause?', ['Nemo judex in causa sua', 'Rule against bias']],
  ['What Latin phrase means “hear the other side”?', ['Audi alteram partem']],
  ['What is the legal process of resolving a dispute in court called?', ['Litigation']],
  ['What is a court order requiring a person to do or stop doing something called?', ['Injunction']],
  ['What is the doctrine that prevents a matter already finally decided from being litigated again?', ['Res judicata']],
].map(([question, acceptedAnswers], index) => ({ id: index + 1, question, acceptedAnswers }));

function fallbackQuestions(count) {
  return questions.slice(0, count).map((question, index) => ({ id: `default-${index + 1}`, question: question.question, acceptedAnswers: question.acceptedAnswers, options: [], status: 'published' }));
}

function normalizeAnswer(answer) {
  return String(answer || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

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
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body || '{}');
      } catch {
        return {};
      }
    }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 32_000) throw new Error('Request body too large');
  }
  return JSON.parse(raw || '{}');
}

export async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.searchParams.has('__route')) {
    const route = url.searchParams.get('__route');
    url.searchParams.delete('__route');
    url.pathname = route.startsWith('/') ? `/api${route}` : `/api/${route}`;
  } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api') && !req.headers['x-matched-path'].includes('/api/index')) {
    url.pathname = req.headers['x-matched-path'];
  }
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok', service: 'john-quiz-api', accountAuth: true });
    if (req.method === 'POST' && ['/api/account/signup', '/api/account/login'].includes(url.pathname)) {
      const data = await readJson(req);
      const username = typeof data.username === 'string' ? data.username.trim().toLowerCase() : '';
      const password = typeof data.password === 'string' ? data.password : '';
      if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return send(res, 400, { error: 'Username must be 3–24 characters using letters, numbers, dots, dashes or underscores.' });
      if (url.pathname.endsWith('/signup') && password.length < 8) return send(res, 400, { error: 'Choose a password with at least 8 characters.' });
      if (!password) return send(res, 400, { error: 'Enter your password.' });
      const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
      const classLevel = typeof data.classLevel === 'string' ? data.classLevel.trim() : '';
      if (url.pathname.endsWith('/signup') && phoneDigitCount(phone) < 7) return send(res, 400, { error: 'Enter a phone number with at least 7 digits.' });
      if (url.pathname.endsWith('/signup') && (classLevel.length < 2 || classLevel.length > 60)) return send(res, 400, { error: 'Enter your class or level (2–60 characters).'});
      let account = await findAccount(username);
      if (url.pathname.endsWith('/signup')) {
        if (account) return send(res, 409, { error: 'That username is already taken. Choose another.' });
        try {
          account = await createAccount(username, password, phone, classLevel);
        } catch (error) {
          if (error?.code === '23505') return send(res, 409, { error: 'That username is already taken. Choose another.' });
          throw error;
        }
      } else {
        if (!account) return send(res, 401, { error: 'Username or password is incorrect.' });
        const salt = account.passwordSalt || account.password_salt;
        const savedHash = account.passwordHash || account.password_hash;
        const incomingHash = Buffer.from(await derivePassword(password, salt), 'hex');
        const expectedHash = Buffer.from(savedHash, 'hex');
        if (incomingHash.length !== expectedHash.length || !timingSafeEqual(incomingHash, expectedHash)) return send(res, 401, { error: 'Username or password is incorrect.' });
      }
      return send(res, url.pathname.endsWith('/signup') ? 201 : 200, { token: createUserToken(account), account: publicAccount(account) });
    }
    if (req.method === 'GET' && url.pathname === '/api/account/me') {
      const session = getSignedUser(req);
      if (!session) return send(res, 401, { error: 'Please sign in to continue.' });
      const account = await findAccount(session.username);
      return account ? send(res, 200, { account: publicAccount(account) }) : send(res, 401, { error: 'Please sign in to continue.' });
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
        if (typeof data.title !== 'string' || data.title.trim().length < 3 || !Number.isInteger(questionCount) || questionCount < 1 || questionCount > maxQuestions || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180 || !Number.isInteger(maxParticipants) || maxParticipants < 1) return send(res, 400, { error: 'Check the title, question count (1–50), time limit and participant limit.' });
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
        return send(res, 200, { competitionId: selectedCompetition, questions: await questionsFor(selectedCompetition) });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/questions') {
        const data = await readJson(req);
        const targetCompetitionId = data.competitionId || (await currentCompetition()).id;
        const targetCompetition = (await allCompetitions()).find((competition) => competition.id === targetCompetitionId);
        if (!targetCompetition) return send(res, 404, { error: 'Target competition not found.' });
        const text = typeof data.question === 'string' ? data.question.trim() : '';
        const rawAnswers = Array.isArray(data.acceptedAnswers) ? data.acceptedAnswers : String(data.correctAnswer || '').split(/[;\n]+/);
        const acceptedAnswers = [...new Set(rawAnswers.map((answer) => String(answer).trim()).filter(Boolean))];
        if (!text || !acceptedAnswers.length || acceptedAnswers.length > 12 || acceptedAnswers.some((answer) => answer.length > 500)) return send(res, 400, { error: 'Enter the question and at least one valid accepted answer (up to 12 answer variations).'});
        const existing = await questionsFor(targetCompetitionId);
        if (existing.length >= maxQuestions) return send(res, 400, { error: 'A quiz can contain up to 50 questions. Remove a question before adding another.' });
        const created = await saveQuestion({ id: randomUUID(), competitionId: targetCompetitionId, question: text, questionType: 'short_answer', acceptedAnswers, marks: Math.max(1, Number(data.marks) || 1), explanation: String(data.explanation || ''), position: existing.length, category: String(data.category || 'Law'), status: data.status === 'draft' ? 'draft' : 'published' });
        return send(res, 201, { question: created });
      }
      if (req.method === 'POST' && url.pathname === '/api/admin/questions/bulk') {
        const data = await readJson(req);
        if (!Array.isArray(data.questions) || !data.questions.length || data.questions.length > maxQuestions) return send(res, 400, { error: 'Upload between 1 and 50 questions per CSV.' });
        const targetCompetitionId = data.competitionId || (await currentCompetition()).id;
        const targetCompetition = (await allCompetitions()).find((competition) => competition.id === targetCompetitionId);
        if (!targetCompetition) return send(res, 404, { error: 'Select a competition before importing questions.' });
        const existing = await questionsFor(targetCompetitionId);
        const knownQuestions = new Set(existing.map((question) => normalizeAnswer(question.question)));
        const importRows = [];
        let skippedDuplicates = 0;
        for (const [index, row] of data.questions.entries()) {
          const rawAnswers = Array.isArray(row.acceptedAnswers) ? row.acceptedAnswers : String(row.correctAnswer || '').split(/[;\n]+/);
          const acceptedAnswers = [...new Set(rawAnswers.map((answer) => String(answer).trim()).filter(Boolean))];
          const questionText = typeof row.question === 'string' ? row.question.trim() : '';
          if (!questionText || !acceptedAnswers.length) return send(res, 400, { error: `Question ${index + 1} is missing its text or accepted answer.` });
          const questionKey = normalizeAnswer(questionText);
          if (knownQuestions.has(questionKey)) {
            skippedDuplicates++;
            continue;
          }
          knownQuestions.add(questionKey);
          importRows.push({ ...row, questionText, acceptedAnswers });
        }
        if (existing.length + importRows.length > maxQuestions) return send(res, 400, { error: `This quiz can contain up to 50 questions. It already has ${existing.length}; remove questions or upload a smaller batch.` });
        const savedQuestions = [];
        for (const row of importRows) {
          savedQuestions.push(await saveQuestion({ id: randomUUID(), competitionId: targetCompetitionId, question: row.questionText, questionType: 'short_answer', acceptedAnswers: row.acceptedAnswers, marks: Math.max(1, Number(row.marks) || 1), explanation: String(row.explanation || ''), position: existing.length + savedQuestions.length, category: String(row.category || 'Law'), status: 'published' }));
        }
        return send(res, 201, { imported: savedQuestions.length, skippedDuplicates });
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
          const content = bank.length ? bank : fallbackQuestions(competition.questionCount);
          content.forEach((question, index) => {
            const answered = entries.filter((entry) => typeof entry.answers?.[index] === 'string' && entry.answers[index].trim());
            const accepted = question.acceptedAnswers || [];
            const missed = answered.filter((entry) => !accepted.some((candidate) => normalizeAnswer(candidate) === normalizeAnswer(entry.answers[index]))).length;
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
        if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > maxQuestions) return send(res, 400, { error: `Question count must be between 1 and ${maxQuestions}.` });
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
      const quizQuestions = configuredQuestions.length ? configuredQuestions : fallbackQuestions(item.questionCount);
      return send(res, 200, { competition: { ...item, questionCount: quizQuestions.length }, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, type: 'short_answer' })) });
    }
    if (req.method === 'GET' && url.pathname === '/api/competition/current') {
      const configuredCompetition = await currentCompetition();
      const configuredQuestions = (await questionsFor(configuredCompetition.id)).filter((question) => question.status !== 'draft').slice(0, configuredCompetition.questionCount);
      const quizQuestions = configuredQuestions.length ? configuredQuestions : fallbackQuestions(configuredCompetition.questionCount);
      const activeCompetition = { ...configuredCompetition, questionCount: quizQuestions.length };
      const [people, submissions] = await Promise.all([allParticipants(), allSubmissions()]);
      const competitionPeople = people.filter((person) => person.competitionId === activeCompetition.id);
      const competitionSubmissions = submissions.filter((submission) => competitionPeople.some((person) => person.id === submission.participantId));
      return send(res, 200, { competition: activeCompetition, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, type: 'short_answer' })), participants: competitionPeople.length, submissions: competitionSubmissions.length, perfectScores: competitionSubmissions.filter((submission) => submission.score === activeCompetition.questionCount).length });
    }
    if (req.method === 'POST' && url.pathname === '/api/participants') {
      const data = await readJson(req);
      const account = getSignedUser(req);
      if (!account) return send(res, 401, { error: 'Sign in with your username and password to continue.' });
      if (typeof data.name !== 'string' || data.name.trim().length < 2) return send(res, 400, { error: 'Please provide your full name.' });
      const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
      if (phoneDigitCount(phone) < 7) return send(res, 400, { error: 'Enter a contact phone number with at least 7 digits.' });
      const classLevel = typeof data.classLevel === 'string' ? data.classLevel.trim() : '';
      if (classLevel.length < 2 || classLevel.length > 60) return send(res, 400, { error: 'Enter your class or level (2–60 characters).'});
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
      const quizQuestions = configuredQuestions.length ? configuredQuestions : fallbackQuestions(configuredCompetition.questionCount);
      const activeCompetition = { ...configuredCompetition, questionCount: quizQuestions.length };
      await updateAccountProfile(account.accountId, phone, classLevel);
      const newParticipant = {
        id: randomUUID(), accountId: account.accountId, name: data.name.trim(), username: account.username,
        competitionId: activeCompetition.id,
        email: '',
        phone,
        classLevel,
        registeredAt: new Date().toISOString(),
      };
      const attemptReserved = await reserveParticipantAttempt(account.accountId, activeCompetition.id);
      if (!attemptReserved) return send(res, 409, { error: 'You have already used your one entry for this competition. Each signed-in account gets one attempt.' });
      let participant;
      try {
        participant = await insertParticipant(newParticipant);
      } catch (error) {
        await releaseParticipantAttempt(account.accountId, activeCompetition.id);
        throw error;
      }
      return send(res, 201, { participant: { id: participant.id, name: participant.name }, competition: activeCompetition, questions: quizQuestions.map((question) => ({ id: question.id, q: question.question, type: 'short_answer' })) });
    }
    if (req.method === 'POST' && url.pathname === '/api/submissions') {
      const data = await readJson(req);
      const people = await allParticipants();
      const participant = people.find((item) => item.id === data.participantId);
      if (!participant) return send(res, 404, { error: 'Participant not found.' });
      const configuredCompetition = (await allCompetitions()).find((item) => item.id === participant.competitionId) || defaultCompetition;
      const configuredQuestions = (await questionsFor(configuredCompetition.id)).filter((question) => question.status !== 'draft').slice(0, configuredCompetition.questionCount);
      const activeQuestions = configuredQuestions.length ? configuredQuestions : fallbackQuestions(configuredCompetition.questionCount);
      const activeCompetition = { ...configuredCompetition, questionCount: activeQuestions.length };
      if (!Array.isArray(data.answers) || data.answers.length !== activeQuestions.length || data.answers.some((answer) => answer !== null && (typeof answer !== 'string' || answer.length > 2000))) {
        return send(res, 400, { error: `Submit one written answer or a blank for each of the ${activeQuestions.length} questions.` });
      }
      const existingSubmissions = await allSubmissions();
      const accountParticipants = new Set(people.filter((item) => participant.accountId && item.accountId === participant.accountId && item.competitionId === participant.competitionId).map((item) => item.id));
      accountParticipants.add(participant.id);
      if (existingSubmissions.some((item) => accountParticipants.has(item.participantId))) return send(res, 409, { error: 'Your one attempt for this competition has already been submitted.' });
      const score = data.answers.reduce((sum, answer, index) => {
        const question = activeQuestions[index];
        const accepted = question.acceptedAnswers?.length ? question.acceptedAnswers : [];
        const normalized = normalizeAnswer(answer);
        return sum + (normalized && accepted.some((candidate) => normalized === normalizeAnswer(candidate)) ? 1 : 0);
      }, 0);
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
    const usernameSchemaMissing = ['42703', 'PGRST204'].includes(error?.code) && ['username', 'class_level'].some((column) => String(error?.message || '').includes(column));
    const attemptSchemaMissing = ['42P01', 'PGRST205'].includes(error?.code) && String(error?.message || '').includes('participant_attempts');
    if (usernameSchemaMissing && (url.pathname.startsWith('/api/account/') || url.pathname === '/api/admin/participants' || url.pathname === '/api/participants')) message = 'Username, phone and class fields are not set up yet. Run supabase/migrations/202611130002_username_phone_class_accounts.sql in the Supabase SQL Editor, then restart the backend.';
    else if (attemptSchemaMissing && url.pathname === '/api/participants') message = 'Run supabase/migrations/202611140003_one_attempt_per_account.sql in the Supabase SQL Editor, then retry.';
    else if (accountSchemaMissing) message = 'User account storage is not set up yet. Run supabase/migrations/202611120004_user_accounts.sql in the Supabase SQL Editor, then restart the backend.';
    else if (url.pathname.startsWith('/api/account/')) message = error?.message || message;
    if (url.pathname.startsWith('/api/admin/questions') && isAdmin(req)) {
      if (['PGRST204', '42703'].includes(error?.code) && ['accepted_answers', 'question_type'].some((column) => String(error?.message || '').includes(column))) message = 'Run supabase/migrations/202611140001_short_answer_law_questions.sql in the Supabase SQL Editor, then restart the backend.';
      else if (['PGRST205', 'PGRST204', '42703'].includes(error?.code)) message = 'Question storage is missing required columns or tables. Run the John quiz.com competition and question bank migrations in Supabase, then restart the backend.';
      else message = `Question import failed${error?.code ? ` (${error.code})` : ''}: ${error?.message || 'check the question schema and try again.'}`;
    }
    console.error(error);
    return send(res, accountSchemaMissing || usernameSchemaMissing ? 503 : duplicateEventAccount ? 409 : 400, { error: message });
  }
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution && !process.env.VERCEL) {
  createServer(handleRequest).listen(port, '0.0.0.0', () => {
    const mode = supabase ? 'Supabase' : 'local JSON fallback';
    console.log(`John quiz.com API listening on http://localhost:${port} (${mode})`);
    if (!supabase) console.log('Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env to use your Supabase project.');
  });
}
