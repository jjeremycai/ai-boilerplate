# 🏃 60-Second Quick Start

## Option 1: One-Command Setup (Recommended)

```bash
npx create-cloudflare-app my-app --template lightweight-backend
cd my-app
npm run setup:wizard

# Follow the prompts, then:
npm run dev:worker

# Your API is now live at http://localhost:8787
# Test it: curl http://localhost:8787/api/hello
```

## Option 2: Clone This Repo

```bash
git clone <this-repo> my-app
cd my-app
npm install
npm run setup:wizard

# Your app is ready!
npm run dev:worker
```

## 🎯 Template Options

### Lite Template (15 minutes)
- ✅ Basic API endpoints
- ✅ CORS and error handling
- ✅ Health checks
- ❌ No database
- ❌ No authentication

**Perfect for:** Simple APIs, microservices, proof of concepts

### Standard Template (45 minutes)
- ✅ Everything in Lite
- ✅ Cloudflare D1 database
- ✅ Clerk authentication
- ✅ Web + Mobile apps
- ✅ Real-time chat
- ✅ Project/task management

**Perfect for:** Full-stack applications, MVPs

### Enterprise Template (60 minutes)
- ✅ Everything in Standard
- ✅ Monitoring and analytics
- ✅ CI/CD pipelines
- ✅ Security hardening
- ✅ Multi-environment setup

**Perfect for:** Production applications, enterprise use

## 🔥 Test Your Setup

```bash
# Health check
curl http://localhost:8787/health

# Basic API test
curl http://localhost:8787/api/hello

# If using Standard/Enterprise templates:
curl http://localhost:8787/api/v1/projects
```

## 🤖 AI Development Ready

This boilerplate includes:
- **MCP servers** for Claude integration
- **AI-friendly documentation** 
- **Structured patterns** for consistent code generation

```bash
# Setup MCP for Claude Desktop
npm run setup:mcp

# Now use Claude Code with full context!
```

## 📱 Mobile Development (Standard+ templates)

```bash
# Start mobile app
npm run mobile:start

# Run on iOS
npm run mobile:ios

# Run on Android  
npm run mobile:android
```

## 🚀 Deploy in Minutes

```bash
# Deploy everything
npm run deploy

# Deploy just the API
npm run deploy:worker-only
```

Your app will be live on Cloudflare's global edge network!

## 🆘 Need Help?

- **Health check failing?** Run `npm run setup:wizard` again
- **Database errors?** Check your D1 configuration in wrangler.toml
- **Auth issues?** Add your Clerk keys to .env and .dev.vars
- **MCP not working?** Run `npm run setup:mcp`

## 📊 What You Get Out of the Box

### API Endpoints
- `GET /health` - System status
- `GET /api/hello` - Hello world
- `GET /api/v1/projects` - Project management (Standard+)
- `GET /api/v1/tasks` - Task management (Standard+)
- `WebSocket /api/v1/chat` - Real-time chat (Standard+)

### Demo Data (Standard+ templates)
- 2 sample projects
- 5 example tasks  
- Different status examples
- Ready to explore immediately

## 🔄 Next Steps

1. **Customize the API** - Add your business logic
2. **Style the frontend** - Update components and styles  
3. **Configure authentication** - Add your Clerk keys
4. **Deploy to production** - Run `npm run deploy`
5. **Scale globally** - Cloudflare handles the rest!

---

**⏱️ Total time: 15-60 minutes depending on template**  
**🎯 Result: Production-ready app on global edge network**