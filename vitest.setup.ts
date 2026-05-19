import '@testing-library/jest-dom';

vi.mock('@/lib/firebase', () => ({
  db: {},
  firebaseAuth: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  initializeAuth: vi.fn(() => ({})),
  browserLocalPersistence: {},
  browserPopupRedirectResolver: {},
  onAuthStateChanged: vi.fn(() => vi.fn()),
  GoogleAuthProvider: vi.fn(function () { return {}; }),
  signInWithPopup: vi.fn(() => Promise.resolve()),
  signInWithCredential: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
