import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
let sessionPromise;
function client() {
  if (!supabase) throw new Error('Missing Supabase URL/key. Copy .env.example to .env.local and restart Vite.');
  return supabase;
}
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export function getUser() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const db = client();
      const { session } = checked(await db.auth.getSession());
      if (session?.user) return session.user;
      const { user } = checked(await db.auth.signInAnonymously());
      if (!user) throw new Error('Anonymous sign-in did not return a user.');
      return user;
    })().catch(error => { sessionPromise = undefined; throw error; });
  }
  return sessionPromise;
}
export async function getProfile() {
  const { id } = await getUser();
  return checked(await client().from('profiles').select('*').eq('id', id).maybeSingle());
}
export async function saveProfile({ name, age, bio = '', interests = [], avatar = '🫠' }) {
  const { id } = await getUser();
  return checked(await client().from('profiles').upsert({
    id, auth_id: id, name: name.trim(), age: Number(age), bio: bio.trim(), interests, avatar,
  }).select().single());
}
export async function getLikes() {
  const { id } = await getUser();
  const rows = checked(await client().from('likes').select('reel_id').eq('user_id', id));
  return rows.map(row => row.reel_id);
}
export async function setLike(reelId, liked) {
  const { id } = await getUser();
  const query = client().from('likes');
  if (liked) {
    // ignoreDuplicates uses ON CONFLICT DO NOTHING, so no UPDATE permission is needed.
    checked(await query.upsert({ user_id: id, reel_id: String(reelId) }, { onConflict: 'user_id,reel_id', ignoreDuplicates: true }));
  } else {
    checked(await query.delete().eq('user_id', id).eq('reel_id', String(reelId)));
  }
}
async function rpc(name, args = {}) {
  await getUser();
  return checked(await client().rpc(name, args));
}
export const getMatches = () => rpc('get_matches');
export const getConnections = () => rpc('get_connections');
export const getRouletteState = () => rpc('get_roulette_state');
export const spinRejection = targetId => rpc('spin_rejection', {p_target: targetId});
export const dismissMatch = targetId => rpc('dismiss_match', {p_target: targetId});
export const sendReel = (targetId,reelId) => rpc('send_reel', {p_target:targetId,p_reel:String(reelId)});
export const getReelMessages = targetId => rpc('get_reel_messages', {p_target:targetId});
export const spinAdd = targetId => rpc('spin_add', {p_target:targetId});

// Profile reels are independent of matching likes and private bookmarks.
export const getProfileReels = () => rpc('get_visible_profile_reels');
export async function setProfileReel(reelId, add) {
  const { id } = await getUser();
  const query = client().from('profile_reels');
  if (add) checked(await query.upsert({ user_id: id, reel_id: String(reelId) }, { onConflict: 'user_id,reel_id', ignoreDuplicates: true }));
  else checked(await query.delete().eq('user_id', id).eq('reel_id', String(reelId)));
}
