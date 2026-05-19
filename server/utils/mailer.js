export async function getMailgunClient() {
    const apiKey = process.env.MAILGUN_API_KEY || process.env.API_KEY;
    const domain = process.env.MAILGUN_DOMAIN || 'mail.francismistica.me';

    if (!apiKey) {
        return null;
    }

    try {
        const [{ default: FormData }, { default: Mailgun }] = await Promise.all([
            import('form-data'),
            import('mailgun.js'),
        ]);

        const mailgun = new Mailgun(FormData);
        const client = mailgun.client({
            username: 'api',
            key: apiKey,
        });

        return { client, domain };
    } catch (error) {
        if (error?.code === 'ERR_MODULE_NOT_FOUND') {
            console.warn('Mailgun disabled: mailgun.js package is not installed');
            return null;
        }

        throw error;
    }
}
