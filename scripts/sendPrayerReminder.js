/**
 * Masjid Mehmoodiya – Firebase Cloud Messaging (FCM) Prayer Alert Sender
 * 
 * Usage:
 *   node scripts/sendPrayerReminder.js adhan Fajr "05:25 AM"
 *   node scripts/sendPrayerReminder.js namaz Fajr "05:50 AM"
 *   node scripts/sendPrayerReminder.js pre_jamaat Fajr "05:50 AM" 15
 * 
 * Features:
 *   - Wakes up phone from lock/off state (Priority: High)
 *   - Drops floating Heads-Up banner on top of other apps
 *   - Plays authentic vocal Adhan audio (sound: 'adhan')
 * 
 * Setup:
 *   1. Download Service Account Key from Firebase Console:
 *      Project Settings -> Service Accounts -> Generate new private key
 *   2. Save as `scripts/serviceAccountKey.json` OR set GOOGLE_APPLICATION_CREDENTIALS environment variable.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const alertType = (args[0] || 'adhan').toLowerCase(); // 'adhan' | 'namaz' | 'pre_jamaat'
  const prayerName = args[1] || 'Fajr';
  const scheduledTime = args[2] || '05:25 AM';
  const leadMinutes = args[3] || '15';

  console.log(`\n======================================================`);
  console.log(`🕌 Masjid Mehmoodiya – FCM Alert Sender`);
  console.log(`   Alert Type:     ${alertType.toUpperCase()}`);
  console.log(`   Prayer Name:    ${prayerName}`);
  console.log(`   Scheduled Time: ${scheduledTime}`);
  console.log(`======================================================\n`);

  let title = '';
  let body = '';

  if (alertType === 'adhan') {
    title = `🕌 ${prayerName} Adhan (اذان کا وقت)`;
    body = `Allahu Akbar! The official Adhan for ${prayerName} is now (${scheduledTime}) at Masjid Mehmoodiya – Sawangi. Click to open and control audio.`;
  } else if (alertType === 'namaz') {
    title = `🕋 ${prayerName} Jama'at (جماعت کا وقت)`;
    body = `The congregational Jama'at prayer for ${prayerName} is starting now (${scheduledTime}) at Masjid Mehmoodiya. Please prepare for Salah.`;
  } else if (alertType === 'pre_jamaat') {
    title = `⏰ ${leadMinutes} mins to ${prayerName} Jama'at`;
    body = `Congregational Salah will begin at ${scheduledTime}. Prepare your Wudhu and head towards Masjid Mehmoodiya.`;
  } else {
    console.error(`Invalid alert type "${alertType}". Must be 'adhan', 'namaz', or 'pre_jamaat'.`);
    process.exit(1);
  }

  // Dual Android + Web FCM Payload with High Priority Heads-Up Display
  const messagePayload = {
    notification: {
      title,
      body,
    },
    data: {
      type: alertType,
      prayerName,
      time: scheduledTime,
      leadMinutes: String(leadMinutes),
      click_action: '/',
      tag: `prayer_${prayerName.toLowerCase()}_${alertType}`,
    },
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

  // Check for firebase-admin
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.log(`ℹ️ Notice: 'firebase-admin' npm package is not installed globally or locally.`);
    console.log(`   To send live push notifications from this script:`);
    console.log(`   Run: npm install firebase-admin --save-dev\n`);
    console.log(`📦 Simulated FCM Payload that will be dispatched:`);
    console.log(JSON.stringify(messagePayload, null, 2));
    return;
  }

  // Look for service account key
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    console.log(`⚠️ Warning: serviceAccountKey.json not found in scripts/`);
    console.log(`   Please place your Firebase Service Account JSON at:`);
    console.log(`   ${serviceAccountPath}`);
    console.log(`\n📦 Formatted Payload ready for Firebase Console:`);
    console.log(JSON.stringify(messagePayload, null, 2));
    return;
  }

  try {
    const response = await admin.messaging().send(messagePayload);
    console.log('✅ Successfully sent FCM notification:', response);
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
  }
}

main().catch(console.error);
