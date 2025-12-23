
const axios = require('axios');

const pushNotification = async (in_data) => {
    const data = {
        app_id: process.env.ONESIGNAL_APP_ID,
        ...in_data
        // headings: { "en": "Notification Title" },
        // subtitle: { "en": "Notification Subtitle" },
        // contents: { "en": "Notification Content" },
        // chrome_web_image: "https://yourwebsite.com/logo.png",
        // included_segments: [ "Total Subscriptions" ],
    };

    const config = {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
    };

    try {
        const response = await axios.post('https://onesignal.com/api/v1/notifications', data, config);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

module.exports = {
    pushNotification,
};
