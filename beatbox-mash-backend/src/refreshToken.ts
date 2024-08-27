// refreshToken.ts
import { google } from 'googleapis';

async function refreshGmailToken() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log('New access token:', credentials.access_token);

    // Optionally, store the new access token in your environment or configuration
    if (credentials.access_token) {
        process.env.EMAIL_PASS = credentials.access_token;
      } else {
        console.error('Failed to refresh token: access_token is null or undefined');
      }
      

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    throw error;
  }
}

export default refreshGmailToken;
