# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP to replace Resend API for free email sending without requiring a domain.

## 🎯 Why Gmail SMTP?

- **Free**: 500 emails per day
- **No domain required**: Uses your Gmail address
- **Reliable**: Google's infrastructure
- **Professional**: Emails come from your Gmail address
- **Easy setup**: No complex configuration needed

## 📋 Prerequisites

1. A Gmail account (create one at [gmail.com](https://gmail.com) if you don't have one)
2. Access to your Supabase project dashboard

## 🔧 Step-by-Step Setup

### Step 1: Enable 2-Factor Authentication

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click on **Security** in the left sidebar
3. Find **2-Step Verification** and click **Get started**
4. Follow the prompts to enable 2FA on your Gmail account
5. **Important**: You must complete this step before proceeding

### Step 2: Generate an App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sign in with your Gmail account
3. Under **Select app**, choose **Mail**
4. Under **Select device**, choose **Other (Custom name)**
5. Enter a name like "Corporate Communications Portal"
6. Click **Generate**
7. **Copy the 16-character password** that appears (you won't see it again!)

### Step 3: Configure Supabase Environment Variables

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions**
4. Scroll down to **Secrets**
5. Add the following secrets:

   **Secret 1:**
   - **Name**: `GMAIL_USER`
   - **Value**: Your Gmail address (e.g., `yourname@gmail.com`)

   **Secret 2:**
   - **Name**: `GMAIL_APP_PASSWORD`
   - **Value**: The 16-character app password you generated

6. Click **Save** for each secret

### Step 4: Deploy the Updated Function

1. In your Supabase project, go to **Edge Functions**
2. Find the `send-email` function
3. The function should automatically redeploy with the new code
4. If not, you can manually redeploy it

## 🧪 Testing the Setup

1. Go to your application
2. Log in as an admin
3. Try sending a test email to a small group
4. Check if emails are delivered successfully

## 🔍 Troubleshooting

### Common Issues

**"Authentication failed" error:**
- Ensure 2FA is enabled on your Gmail account
- Verify the app password is correctly copied (16 characters)
- Check that `GMAIL_USER` contains your full Gmail address

**"Connection timeout" error:**
- Check your internet connection
- Verify Supabase Edge Functions are working
- Try again in a few minutes

**"Rate limit exceeded" error:**
- Gmail allows 500 emails per day
- Wait until the next day to send more emails
- Consider upgrading to a paid service for higher limits

**Emails going to spam:**
- Use a professional subject line
- Avoid spam trigger words
- Keep content professional and relevant

### Getting Help

If you're still having issues:

1. Check the Supabase Edge Function logs for error details
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Contact support if the issue persists

## 📊 Gmail SMTP Limits

- **Daily limit**: 500 emails per day
- **Rate limit**: ~20 emails per minute
- **File attachments**: Up to 25MB
- **Message size**: Up to 25MB

## 🔄 Alternative Email Services

If you need higher limits or different features:

1. **SendGrid** (Free: 100 emails/day)
2. **Mailgun** (Free: 5,000 emails/month for 3 months)
3. **Brevo** (Free: 300 emails/day)
4. **EmailJS** (Free: 200 emails/month)

## ✅ Success Checklist

- [ ] 2-Factor Authentication enabled on Gmail
- [ ] App password generated and copied
- [ ] `GMAIL_USER` environment variable set
- [ ] `GMAIL_APP_PASSWORD` environment variable set
- [ ] Edge function deployed successfully
- [ ] Test email sent and received
- [ ] No errors in Supabase logs

## 🎉 You're All Set!

Your application now uses Gmail SMTP for free email sending. No domain purchase required!

---

**Note**: Keep your app password secure and don't share it. If you suspect it's compromised, generate a new one and update your Supabase secrets. 