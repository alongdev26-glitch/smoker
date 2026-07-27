/* Optional Firebase email/password accounts + Firestore sync.
   Stays fully inert (isConfigured=false) until firebase-config.js has real
   keys, so the app works exactly as before with no account set up. */
(function (global) {
  const hasSDK = typeof firebase !== 'undefined';
  const cfg = global.FIREBASE_CONFIG || {};
  const isConfigured = !!(hasSDK && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_'));

  let currentUser = null;
  let auth, db;
  const listeners = [];

  if (isConfigured) {
    firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.onAuthStateChanged(user => {
      currentUser = user;
      listeners.forEach(cb => cb(user));
      if (!user) {
        // No user at all (not even anonymous) — sign in silently so every
        // guest has a stable uid for the Coach chat's server-side rate limit.
        // This never triggers cloud sync of app data: Store.save and the
        // pullState flow both check !isAnonymous before touching Firestore.
        auth.signInAnonymously().catch(err => console.error('Anonymous sign-in failed', err));
      }
    });
  }

  function onChange(cb) {
    listeners.push(cb);
    if (isConfigured) cb(currentUser);
  }

  function signUp(email, password) {
    if (!isConfigured) return Promise.reject(new Error('not-configured'));
    return auth.createUserWithEmailAndPassword(email, password);
  }

  function signIn(email, password) {
    if (!isConfigured) return Promise.reject(new Error('not-configured'));
    return auth.signInWithEmailAndPassword(email, password);
  }

  function signInWithGoogle() {
    if (!isConfigured) return Promise.reject(new Error('not-configured'));
    return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  function signOutUser() {
    if (!isConfigured) return Promise.resolve();
    return auth.signOut();
  }

  function pullState() {
    if (!isConfigured || !currentUser || currentUser.isAnonymous) return Promise.resolve(null);
    return db.collection('users').doc(currentUser.uid).get()
      .then(doc => (doc.exists ? doc.data().state : null));
  }

  let pushTimer = null;
  function pushState(state) {
    if (!isConfigured || !currentUser || currentUser.isAnonymous) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      db.collection('users').doc(currentUser.uid)
        .set({ state, updatedAt: Date.now() })
        .catch(err => console.error('Firestore sync failed', err));
    }, 600);
  }

  function errorMessage(err) {
    const map = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/wrong-password': 'Wrong email or password',
      'auth/user-not-found': 'Wrong email or password',
      'auth/too-many-requests': 'Too many attempts — try again in a few minutes',
      'auth/network-request-failed': 'Network problem — check your internet connection',
      'auth/popup-closed-by-user': 'Sign-in window was closed before completing',
      'auth/popup-blocked': 'Sign-in popup was blocked by the browser'
    };
    return (err && map[err.code]) || 'Something went wrong, please try again';
  }

  global.Auth = {
    isConfigured, onChange, signUp, signIn, signInWithGoogle, signOutUser, pullState, pushState, errorMessage,
    get currentUser() { return currentUser; }
  };
})(window);
