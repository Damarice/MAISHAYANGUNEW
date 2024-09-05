const express = require('express');
const bodyParser = require('body-parser');
const mailchimp = require('@mailchimp/mailchimp_marketing');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Mailchimp with your API key
mailchimp.setConfig({
    apiKey: '0e55d6b8aec36b0d4ff7db1795ca5641-us22',
    server: 'us22',
});

// POST route to handle form submissions
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        // Add the subscriber to your audience
        const response = await mailchimp.lists.addListMember('44c5356e1c', {
            email_address: email,
            status: 'subscribed',
        });

        console.log('Subscriber added:', response);

        res.status(200).send('Subscription successful!');
    } catch (error) {
        console.error('Error subscribing:', error);
        res.status(500).send('Error subscribing. Please try again later.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
