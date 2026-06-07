"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_service_1 = require("../src/modules/notifications/notifications.service");
const smtp_service_1 = require("../src/modules/notifications/channels/smtp.service");
const whatsapp_evolution_service_1 = require("../src/modules/notifications/channels/whatsapp-evolution.service");
const notification_model_1 = require("../src/modules/notifications/models/notification.model");
async function testNotifications() {
    console.log('--- STARTING NOTIFICATIONS VALIDATION SCRIPT ---');
    const smtpService = new smtp_service_1.SmtpService();
    const whatsAppService = new whatsapp_evolution_service_1.WhatsAppEvolutionService();
    const service = new notifications_service_1.NotificationsService(smtpService, whatsAppService);
    console.log('\n1. Testing Email Enqueue & Interpolation (ORDER_CONFIRMED)');
    const emailJob = await service.enqueue({
        channel: notification_model_1.NotificationChannel.EMAIL,
        templateKey: notification_model_1.TemplateKey.ORDER_CONFIRMED,
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
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        templateKey: notification_model_1.TemplateKey.WELCOME_CUSTOMER,
        recipient: '5491122334455',
        variables: {
            customerName: 'Facundo Gomez',
            storeName: 'Vestix Palace',
        },
    });
    console.log(`Job Created: ID=${waJob.id}, Status=${waJob.status}`);
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
    const allSent = queue.every(job => job.status === notification_model_1.NotificationStatus.SENT);
    if (allSent) {
        console.log('\n✅ VALIDATION SUCCESSFUL: All notification jobs interpolated and dispatched correctly!');
    }
    else {
        console.log('\n❌ VALIDATION FAILED: Some jobs did not dispatch successfully.');
    }
}
testNotifications().catch(err => {
    console.error('Fatal validation error:', err);
});
//# sourceMappingURL=test-notifications.js.map