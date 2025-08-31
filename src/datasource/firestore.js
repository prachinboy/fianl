
import admin from 'firebase-admin'

export function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  }
  return admin.firestore()
}

export async function fetchUsers(db) {
  const users = []
  const snap = await db.collection('users').get()
  snap.forEach(d => users.push({ id: d.id, ...d.data() }))
  return users
}

export async function fetchLikeLogs(db) {
  const logs = []
  const snap = await db.collection('like_dishes_logs').get()
  snap.forEach(d => logs.push({ id: d.id, ...d.data() }))
  return logs
}
