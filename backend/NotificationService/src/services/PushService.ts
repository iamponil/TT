import webpush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = 'mailto:admin@example.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
} else {
  console.warn('NotificationService: VAPID keys not found. Web Push disabled.');
}

export const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    if (!publicKey || !privateKey) return;
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    console.error('Error sending push notification', err);
  }
};
