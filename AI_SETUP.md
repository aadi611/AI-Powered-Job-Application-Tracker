# AI-Powered Job Application Tracker - Setup Guide

## 🚀 Quick Start with AI Features

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up OpenAI API Key

#### Option A: Create .env file (Recommended for Development)
Create a file named `.env` in the project root:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
FLASK_SECRET_KEY=your-random-secret-key
FLASK_ENV=development
```

#### Option B: Set Environment Variables (For Production/Deployment)

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**Heroku/Cloud Platforms:**
Add environment variables in your platform's dashboard/settings.

### 3. Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-`)
4. Paste it in your `.env` file

### 4. Run the Application
```bash
python app.py
```

Visit http://localhost:5000

## 🎯 AI Features Available

### 1. **Smart Job Post Parser** ✨
- Click "AI Job Parser" button in the sidebar
- Paste any job description (from LinkedIn, Indeed, etc.)
- AI automatically extracts:
  - Company name
  - Job position
  - Location
  - Salary range
  - Job type (Full-time, Part-time, etc.)
  - Key requirements
  - Job description summary
- Form auto-fills with extracted data!

### 2. **Follow-up Email Generator** (Coming Soon)
- AI generates personalized follow-up emails
- Based on time elapsed and job details
- Professional, non-pushy tone

### 3. **Application Success Analyzer** (Coming Soon)
- AI analyzes your application patterns
- Provides insights on what works
- Suggests improvements

## 📦 Deployment

### GitHub
The `.env` file is automatically ignored by `.gitignore`.
**Never commit your API key to GitHub!**

To deploy:
1. Push code to GitHub (API key stays local)
2. Set environment variable in your deployment platform
3. The app will automatically use the environment variable

### Environment Variables for Production
```
OPENAI_API_KEY=sk-your-key-here
FLASK_SECRET_KEY=random-secret-for-sessions
FLASK_ENV=production
```

## 🔒 Security Best Practices

1. ✅ **DO**: Use `.env` file for local development
2. ✅ **DO**: Add `.env` to `.gitignore` (already done)
3. ✅ **DO**: Use environment variables in production
4. ❌ **DON'T**: Commit API keys to version control
5. ❌ **DON'T**: Share your `.env` file
6. ❌ **DON'T**: Hardcode API keys in code

## 💡 Tips

- The app uses `gpt-4o-mini` model (fast and cost-effective)
- Each job parse costs ~$0.001-0.002
- Monitor your usage at https://platform.openai.com/usage
- Set usage limits in OpenAI dashboard for safety

## 🆘 Troubleshooting

**Error: "AI service not configured"**
- Check if `.env` file exists in project root
- Verify `OPENAI_API_KEY` is set correctly
- Restart the Flask application

**Error: "Invalid API key"**
- Verify your API key at https://platform.openai.com/api-keys
- Make sure key starts with `sk-`
- Check for extra spaces in `.env` file

**AI parsing takes too long**
- Normal processing time: 3-10 seconds
- Check your internet connection
- Verify OpenAI API status: https://status.openai.com/

## 📖 API Endpoints

- `POST /api/ai/parse-job` - Parse job description with AI
- `POST /api/ai/generate-followup` - Generate follow-up email
- `GET /api/ai/analyze-applications` - Get AI insights

Enjoy your AI-powered job tracking! 🚀
