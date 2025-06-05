# 🔥 Applycat- AI-Powered Resume Generator & Analyzer

**The brutally honest AI Cate that tells you what recruiters are really thinking.**

Applica is a cutting-edge resume analysis platform that provides savage, viral-worthy feedback on your resume while offering professional improvements. Using advanced AI models, it identifies critical issues, provides ATS optimization, and generates improved resumes with multiple professional templates.

## ✨ Features

### 🎯 **Brutal Resume Analysis**

- **Gordon Ramsay-style feedback** - No sugar-coating, just honest truth
- **Viral, shareable roasts** - Screenshot-worthy feedback designed for social media
- **Comprehensive scoring** - Overall score (0-100) and ATS compatibility rating
- **Actionable insights** - Specific issues with clear fixes and examples

### 🚀 **AI-Powered Resume Improvement**

- **One-page optimization** - Transforms bloated resumes into impactful single-page documents
- **Multiple AI providers** - OpenAI GPT, Google Gemini, and Claude for reliable processing
- **Real data extraction** - Uses actual information from your resume (no placeholders)
- **Quantified achievements** - Converts weak bullet points into metric-driven impact statements

### 🎨 **Professional Resume Templates**

- **Classic Professional** (ATS: 100%) - Traditional single-column layout
- **Modern Executive** (ATS: 95%) - Contemporary design with subtle elements
- **Two-Column Professional** (ATS: 90%) - Space-efficient sidebar layout
- **Minimal Clean** (ATS: 100%) - Ultra-clean, content-focused design

### 📊 **ATS Optimization**

- **ATS compatibility scoring** - Ensures your resume passes applicant tracking systems
- **Keyword optimization** - Industry-relevant terms for better searchability
- **Format validation** - Standard headings and structure for maximum compatibility

### 🎯 **Job-Specific Tailoring**

- **Custom resume tailoring** - Adapts your resume for specific job postings
- **Keyword integration** - Naturally incorporates job description terms
- **Cover letter generation** - Creates personalized cover letters
- **Priority restructuring** - Highlights most relevant experience first

### 📱 **Social & Viral Features**

- **Shareable roasts** - Platform-optimized content for TikTok, Twitter, LinkedIn
- **Social media integration** - Easy sharing with pre-written captions
- **Viral templates** - "This AI roasted my resume and I can't even be mad 😂"

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **Radix UI** - Accessible component primitives

### **Backend & AI**

- **OpenAI GPT-3.5/4** - Primary analysis and improvement
- **Google Gemini** - Fallback with direct PDF analysis capabilities
- **Multi-provider fallback** - Ensures 99%+ uptime with OpenAI → Gemini priority

### **Features & Integrations**

- **PDF processing** - Direct file analysis and text extraction
- **Base64 encoding** - Secure file handling
- **Retry mechanisms** - Robust error handling with exponential backoff
- **Template system** - Dynamic resume formatting
- **Email capture** - Lead generation integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- API keys for AI providers:
  - `OPENAI_API_KEY` - OpenAI GPT models (Primary)
  - `GOOGLE_AI_API_KEY` - Google Gemini (Fallback)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/applica.git
   cd applica
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your API keys to `.env.local`:

   ```env
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_AI_API_KEY=your_gemini_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### 1. **Upload Your Resume**

- Drag and drop your PDF resume or click to browse
- Supports standard PDF formats up to 10MB
- Automatically extracts text and file metadata

### 2. **Get Brutal Analysis**

- Receive honest, actionable feedback in seconds
- View overall score, ATS rating, and specific issues
- Read viral-worthy roasts designed for social sharing

### 3. **Choose Improvement Type**

#### **🎨 Template-Based Improvement**

- Select from 4 ATS-optimized templates
- Get a one-page focused resume
- Includes quantified achievements and metrics

#### **🎯 Job-Specific Tailoring**

- Paste a job description
- Get a customized resume + cover letter
- Optimized for specific role requirements

### 4. **Share Your Results**

- Screenshot and share funny roasts on social media
- Use pre-written viral captions
- Generate engagement with relatable content

## 🎯 Key Features Explained

### **One-Page Optimization**

Modern recruiting demands concise, impactful resumes. Applica:

- Limits to 3-4 most relevant positions
- Maximum 12-15 achievement bullets total
- 120-180 word professional summaries
- Removes outdated or redundant content

### **AI Model Strategy**

- **Primary**: OpenAI GPT (fast, reliable, excellent reasoning)
- **Fallback**: Google Gemini (direct PDF analysis, high context)
- **Priority**: Automatic failover with exponential backoff retry

### **Template System**

Each template is optimized for different use cases:

- **Classic**: Traditional industries (finance, law, healthcare)
- **Modern**: Tech and creative fields
- **Two-Column**: Maximum information density
- **Minimal**: Startups and modern companies

## 🔧 Configuration

### **Model Configuration** (`lib/modelConfig.ts`)

```typescript
export const MODEL_PRIORITY: ModelProvider[] = [
  "openai", // Fast and reliable - PRIMARY
  "gemini", // Best for file analysis - FALLBACK
];
```

### **Template Selection** (`components/resume-results.tsx`)

```typescript
export const RESUME_TEMPLATES = {
  CLASSIC: { id: "classic", atsScore: 100 },
  MODERN: { id: "modern", atsScore: 95 },
  TWO_COLUMN: { id: "two-column", atsScore: 90 },
  MINIMAL: { id: "minimal", atsScore: 100 },
};
```

### **Environment Variables**

```env
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🤖 AI Integration

### **Analysis Pipeline**

1. **File Processing** - Extract text and metadata
2. **AI Analysis** - Generate scores and feedback
3. **Validation** - Ensure quality and format
4. **Response** - Return structured JSON

### **Improvement Pipeline**

1. **Context Building** - Combine analysis + template
2. **AI Generation** - Create improved resume
3. **Validation** - Check one-page constraints
4. **Retry Logic** - Ensure quality output

## 📈 Performance & Reliability

- **99%+ Uptime** - Multi-provider AI fallback
- **Sub-10s Analysis** - Optimized for speed
- **Retry Mechanisms** - Handles API failures gracefully
- **Input Validation** - Prevents malformed requests
- **Error Handling** - User-friendly error messages

## 🔐 Security & Privacy

- **No Data Storage** - Files processed in memory only
- **Secure Upload** - Base64 encoding for file transfer
- **API Rate Limiting** - Prevents abuse
- **Input Sanitization** - XSS protection
- **HTTPS Only** - Encrypted data transmission

## 🎨 UI/UX Features

- **Responsive Design** - Works on all devices
- **Dark/Light Mode** - User preference support
- **Animated Scoring** - Dramatic score reveals
- **Modal System** - Intuitive workflow
- **Copy to Clipboard** - Easy sharing
- **Loading States** - Clear progress indicators

## 🚀 Deployment

### **Vercel (Recommended)**

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### **Docker**

```bash
docker build -t applica .
docker run -p 3000:3000 applica
```

## 📊 Analytics & Metrics

Track key metrics for optimization:

- Resume upload success rate
- AI analysis completion rate
- Template selection preferences
- Improvement generation success
- User engagement with roasts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **LinkedIn Integration** - Direct profile import
- [ ] **Resume Builder** - Create from scratch
- [ ] **Interview Prep** - AI-powered practice
- [ ] **Company Matching** - Find relevant opportunities

## 📞 Support

- **Documentation**: [docs.applica.ai](https://docs.applica.ai)
- **Discord**: [Join our community](https://discord.gg/applica)
- **Email**: support@applica.ai
- **Twitter**: [@ApplicaAI](https://twitter.com/ApplicaAI)

---

**Made with ❤️ by the Applica team**

_Transform your resume. Land your dream job. Get roasted along the way._ 🔥
