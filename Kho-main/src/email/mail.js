const sgMail = require('@sendgrid/mail');

const ApiKey = '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';
sgMail.setApiKey(ApiKey);

const sendVerificationMail = (email, verificationCode) => {
    sgMail.send({
        to: email,
        from: 'Kaiser <team@kaiser.com>',
        subject: 'Verify your code',
        html: `<h1>${verificationCode}</h1>`
    });
}

module.exports = { sendVerificationMail }