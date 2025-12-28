
import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testEmail() {
    console.log('Testing email configuration...');
    console.log('User:', process.env.EMAIL_USER);
    // Be careful not to log the full password
    console.log('Password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);


    // strip spaces from password just in case
    const cleanPassword = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';
    console.log('Clean password length:', cleanPassword.length);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: cleanPassword // Try with clean password
        },
        tls: {
            rejectUnauthorized: false
        },
        // debug: true, // show debug output
        // logger: true // log information to console
    });

    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully.');
    } catch (error) {
        console.error('❌ SMTP Connection failed:', error);
        // Don't return, try sending anyway to see the error from sendMail
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Test Email from DADJ Auto Shop',
        text: 'If you receive this, email sending is working correctly.'
    };

    try {
        console.log('Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

testEmail().then(() => console.log('Test script finished.')).catch(err => console.error('Script crased:', err));

