/**
 * Masjid Mehmoodiya – Automated 1-Minute Cron Scheduler for Prayer & Adhan Alerts
 * 
 * Runs continuously in the background (e.g. on server, PM2, or systemd).
 * Checks the official prayer timetable every minute.
 * When current time matches:
 *   1. Adhan Time -> Dispatches High-Priority Adhan FCM Notification (wakes device, plays sound, floats banner)
 *   2. Namaz Time -> Dispatches Congregational Salah Reminder
 * 
 * Usage:
 *   node scripts/prayerCronScheduler.js
 */

const fs = require('fs');
const path = require('path');

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  // Graceful fallback
}

// Default timetable fallback if Firestore is unreachable
const DEFAULT_TIMETABLE = {
  Fajr: { adhan: '05:25 AM', jamaat: '05:50 AM' },
  Dhuhr: { adhan: '12:30 PM', jamaat: '01:15 PM' },
  Asr: { adhan: '04:35 PM', jamaat: '04:50 PM' },
  Maghrib: { adhan: '06:00 PM', jamaat: '06:05 PM' },
  Isha: { adhan: '08:15 PM', jamaat: '08:30 PM' },
};

function initFirebase() {
  if (!admin) return false;
  if (admin.apps.length) return true;

  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(keyPath)) {
    const cert = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: 'masjid-mehmodiya',
    });
    return true;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'masjid-mehmodiya',
    });
    return true;
  }
  return false;
}

async function fetchTodaysSchedule() {
  if (!admin || !admin.apps.length) return DEFAULT_TIMETABLE;

  try {
    const db = admin.firestore();
    const doc = await db.collection('prayer_schedules').doc('latest_overrides').get();
    if (doc.exists) {
      const data = doc.data();
      const schedule = {};
      ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
        if (data[p]) {
          schedule[p] = {
            adhan: data[p].adhan || DEFAULT_TIMETABLE[p].adhan,
            jamaat: data[p].jamaat || DEFAULT_TIMETABLE[p].jamaat,
          };
        } else {
          schedule[p] = DEFAULT_TIMETABLE[p];
        }
      });
      return schedule;
    }
  } catch (err) {
    console.warn('[Scheduler] Could not fetch from Firestore, using baseline schedule:', err.message);
  }
  return DEFAULT_TIMETABLE;
}

async function sendNotification(title, body, payload, alertType) {
  console.log(`\n📢 [FCM BROADCAST] ${title} - ${body}`);
  if (!admin || !admin.apps.length) {
    console.log('   (Simulated - firebase-admin not initialized)');
    return;
  }

  const message = {
    notification: { title, body },
    data: payload,
    android: {
      priority: 'high',
      notification: {
        channelId: alertType === 'adhan' ? 'adhan_channel' : 'namaz_channel',
        sound: alertType === 'adhan' ? 'adhan' : 'default',
        priority: 'max',
        visibility: 'public',
        defaultVibrateTimings: true,
        clickAction: '/',
      },
    },
    topic: 'prayer_reminders',
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('   ✅ FCM Response ID:', response);
  } catch (err) {
    console.error('   ❌ FCM Send Error:', err.message);
  }
}

const triggeredAlerts = new Set();

async function checkAndTrigger() {
  const now = new Date();
  
  // Format local 12-hour time: "05:25 AM"
  let h = now.getHours();
  const m = now.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const currentHm = `${pad(h)}:${pad(m)} ${period}`;
  const dateKey = now.toISOString().split('T')[0];

  const schedule = await fetchTodaysSchedule();

  for (const [prayerName, times] of Object.entries(schedule)) {
    // 1. Check Adhan Time
    if (times.adhan === currentHm) {
      const adhanKey = `${dateKey}_${prayerName}_adhan_${currentHm}`;
      if (!triggeredAlerts.has(adhanKey)) {
        triggeredAlerts.add(adhanKey);
        await sendNotification(
          `🕌 ${prayerName} Adhan (اذان کا وقت)`,
          `Allahu Akbar! The official Adhan for ${prayerName} is now (${times.adhan}) at Masjid Mehmoodiya. Click to open and control audio.`,
          {
            type: 'adhan',
            prayerName,
            time: times.adhan,
          },
          'adhan'
        );
      }
    }

    // 2. Check Namaz / Jamaat Time
    if (times.jamaat === currentHm) {
      const jamaatKey = `${dateKey}_${prayerName}_jamaat_${currentHm}`;
      if (!triggeredAlerts.has(jamaatKey)) {
        triggeredAlerts.add(jamaatKey);
        await sendNotification(
          `🕋 ${prayerName} Jama'at (جماعت کا وقت)`,
          `The congregational Jama'at prayer for ${prayerName} is starting now (${times.jamaat}) at Masjid Mehmoodiya.`,
          {
            type: 'namaz',
            prayerName,
            time: times.jamaat,
          },
          'namaz'
        );
      }
    }
  }

  // Cleanup old triggered keys at midnight
  if (triggeredAlerts.size > 100) {
    triggeredAlerts.clear();
  }
}

async function start() {
  console.log('========================================================');
  console.log('🕌 Masjid Mehmoodiya – Prayer Cron Scheduler Started');
  console.log('   Checks timetable every 60 seconds');
  console.log('   Dispatches High-Priority Heads-Up Alerts to mobile');
  console.log('   Press Ctrl+C to terminate');
  console.log('========================================================\n');

  initFirebase();

  // Run immediate initial check
  await checkAndTrigger();

  // Run every 60 seconds
  setInterval(checkAndTrigger, 60 * 1000);
}

start();
