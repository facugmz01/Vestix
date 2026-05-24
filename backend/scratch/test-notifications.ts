import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { SmtpService } from '../src/modules/notifications/channels/smtp.service';
import { WhatsAppEvolutionService } from '../src/modules/notifications/channels/whatsapp-evolution.service';
import { NotificationChannel, TemplateKey, NotificationStatus } from '../src/modules/notifications/models/notification.model';

async function testNotifications() {
  console.log('--- STARTING NOTIFICATIONS VALIDATION SCRIPT ---');

  // Instantiate services manually for unit-like integration testing
  const smtpService = new SmtpService();
  const whatsAppService = new WhatsAppEvolutionService();
  const service = new NotificationsService(smtpService, whatsAppService);

  console.log('\n1. Testing Email Enqueue & Interpolation (ORDER_CONFIRMED)');
  const emailJob = await service.enqueue({
    channel: NotificationChannel.EMAIL,
    templateKey: TemplateKey.ORDER_CONFIRMED,
    recipient: 'test@customer.com',
    variables: {
      customerName: 'Facundo Gomez',
      orderId: 'ORD-998877',
      total: '45000.00',
    },
  });

  console.log(`Job Created: ID=${emailJob.id}, Status=${emailJob.status}`);

  console.log('\n2. Testing WhatsApp Enqueue & Interpolation (WELCOME_CUSTOMER)');
  const waJob = await service.enqueue({
    channel: NotificationChannel.WHATSAPP,
    templateKey: TemplateKey.WELCOME_CUSTOMER,
    recipient: '5491122334455',
    variables: {
      customerName: 'Facundo Gomez',
      storeName: 'Vestix Palace',
    },
  });

  console.log(`Job Created: ID=${waJob.id}, Status=${waJob.status}`);

  // Let's wait a short moment for setImmediate async dispatch to execute
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n3. Reviewing Dispatch Outcomes');
  const queue = service.getQueue();
  console.log(`Total jobs in queue: ${queue.length}`);

  for (const job of queue) {
    console.log(`- Job ${job.id}:`);
    console.log(`  Channel: ${job.channel}`);
    console.log(`  Template: ${job.templateKey}`);
    console.log(`  Recipient: ${job.recipient}`);
    console.log(`  Status: ${job.status}`);
  }

  const allSent = queue.every(job => job.status === NotificationStatus.SENT);
  if (allSent) {
    console.log('\n✅ VALIDATION SUCCESSFUL: All notification jobs interpolated and dispatched correctly!');
  } else {
    console.log('\n❌ VALIDATION FAILED: Some jobs did not dispatch successfully.');
  }
}

testNotifications().catch(err => {
  console.error('Fatal validation error:', err);
});
