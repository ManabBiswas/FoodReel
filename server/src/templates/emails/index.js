// Central export for all email templates
// Add new templates here and they'll be automatically available

import { welcomeEmail } from './welcome.email.js';
import { orderConfirmationTemplate } from './orderConfirmation.email.js';
import { orderCancelledTemplate } from './orderCancelled.email.js';
import { orderShippedTemplate } from './orderShipped.email.js';
import { passwordResetTemplate } from './passwordReset.email.js';
import { partnerApprovedTemplate } from './partnerApproved.email.js';
import { partnerRejectedTemplate } from './partnerRejected.email.js';
import { contactResponseTemplate } from './contactResponse.email.js';

export default {
    // User emails
    welcomeEmail,
    passwordResetTemplate,
    
    // Order emails
    orderConfirmationTemplate,
    orderCancelledTemplate,
    orderShippedTemplate,
    
    // Partner emails
    partnerApprovedTemplate,
    partnerRejectedTemplate,
    
    // Contact email
    contactResponseTemplate,
};
