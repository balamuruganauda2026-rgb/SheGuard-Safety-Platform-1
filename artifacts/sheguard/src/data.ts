export type DemoRole = 'user' | 'admin';
export type Contact = { id: string; name: string; relationship: string; email?: string; phone?: string };
export type CheckIn = { deadline: number; status: 'active' | 'completed' | 'cancelled' | 'overdue' };
export type CommunityPost = { id: string; author: string; topic: string; body: string; createdAt: number };
export type LocalReport = { id: string; postId: string; reason: string; status: 'open' | 'reviewed' | 'dismissed' };
export type DemoState = {
  session: { email: string; role: DemoRole } | null;
  contacts: Contact[];
  checkIn: CheckIn | null;
  completedModuleIds: string[];
  posts: CommunityPost[];
  reports: LocalReport[];
  blockedAuthorIds: string[];
  theme: 'light' | 'dark';
  language: 'English' | 'Tamil';
};

const KEY = 'sheguard-demo-v1';
const defaultPosts: CommunityPost[] = [];

export const initialState: DemoState = {
  session: null, contacts: [], checkIn: null, completedModuleIds: [], posts: defaultPosts,
  reports: [], blockedAuthorIds: [], theme: 'light', language: 'English',
};

export function readDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      ...initialState, ...parsed,
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : defaultPosts,
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      completedModuleIds: Array.isArray(parsed.completedModuleIds) ? parsed.completedModuleIds : [],
      blockedAuthorIds: Array.isArray(parsed.blockedAuthorIds) ? parsed.blockedAuthorIds : [],
    };
  } catch {
    return initialState;
  }
}

export function writeDemoState(state: DemoState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearDemoState(): boolean {
  try { localStorage.removeItem(KEY); return true; } catch { return false; }
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function validEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateContact(input: Omit<Contact, 'id'>, contacts: Contact[], editingId?: string): string | null {
  if (!input.name.trim() || !input.relationship.trim()) return 'Name and relationship are required.';
  if (!input.phone?.trim() && !input.email?.trim()) return 'Add a phone or email for this demo contact.';
  if (!validEmail(input.email?.trim() ?? '')) return 'Enter a valid email address.';
  const duplicate = contacts.some((item) => item.id !== editingId && (
    (input.phone && item.phone?.trim() === input.phone.trim()) ||
    (input.email && item.email?.trim().toLowerCase() === input.email.trim().toLowerCase())
  ));
  return duplicate ? 'That phone or email is already in your demo contacts.' : null;
}

export function demoCredentials(email: string, password: string): DemoRole | null {
  if (email.toLowerCase() === 'demo@sheguard.test' && password === 'Demo@12345') return 'user';
  if (email.toLowerCase() === 'admin@sheguard.test' && password === 'Admin@12345') return 'admin';
  return null;
}

export const guideEntries = [
  { q: 'emergency', title: 'Immediate danger', answer: 'If you are in immediate danger, move toward a populated, safer place if you can and call emergency services yourself at 112. SheGuard does not dispatch help or notify anyone automatically.', tags: 'sos urgent help' },
  { q: 'check in', title: 'Safety check-in', answer: 'Set a countdown for a planned journey or situation. This demo only shows an on-screen status when time passes; it does not alert contacts or services.', tags: 'timer journey plan' },
  { q: 'location', title: 'Location sharing', answer: 'Location is never stored. If you choose a session action, your browser may ask for permission and the result can be copied or shared by you. It is not sent automatically.', tags: 'privacy map share' },
  { q: 'digital safety', title: 'Account privacy', answer: 'Review app permissions, use unique passwords, enable multi-factor authentication where available, and sign out of shared devices. This is general information, not professional advice.', tags: 'phone account password' },
  { q: 'rights', title: 'Know your rights', answer: 'Browse the rights topics for plain-language orientation. This guide is not legal advice; check the source and jurisdiction before acting.', tags: 'legal law support' },
];

export const resourceEntries = [
  { id: 'res-1', title: 'Emergency Response Support System (ERSS)', kind: 'Emergency', description: 'Ministry of Home Affairs, Government of India. Official information for the national emergency number 112.', source: 'Ministry of Home Affairs · India', url: 'https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss' },
  { id: 'res-2', title: 'Other Useful Helplines', kind: 'Helplines', description: 'National Commission for Women, Government of India. Lists 181, 112, and Cyber Crime Helpline 1930.', source: 'National Commission for Women · India', url: 'https://www.ncw.gov.in/other-useful-helplines' },
  { id: 'res-3', title: 'National Cyber Crime Reporting Portal', kind: 'Digital safety', description: 'Government of India portal. Notes 112, 181, and 1930 and advises contacting local police for emergencies or other crime.', source: 'Ministry of Home Affairs · India', url: 'https://www.cybercrime.gov.in/Webform/Accept.aspx' },
  { id: 'res-4', title: 'Support conversation plan', kind: 'Planning', description: 'Prompts for choosing a trusted person and asking for practical support.', source: 'Built-in demo guide · not an official service', url: '' },
];