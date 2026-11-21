# Developer Onboarding Guide

## Day 1: Getting Started

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/DingJun1028/esggo.git
cd esggo

# Install Python dependencies
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys:
# - OPENROUTER_API_KEY
# - GROQ_API_KEY
# - HF_TOKEN
# - NVIDIA_API_KEY (optional)
```

### 3. Start Development Servers
```bash
# Start the Smart AI Router backend
npm run dev:backend

# Start the React frontend
npm run dev:frontend

# The frontend should be available at http://localhost:3001
```

## Day 2: Understanding the Architecture

### Key Components to Explore
1. **Time-Rift Engine** (`src/time-rift/`) - Event sourcing core
2. **OmniAgentGateway** (`src/gateway/`) - Security layer
3. **Model Discovery** (`src/discovery/`) - Dynamic model loading
4. **Providers** (`src/providers/`) - OpenRouter, Groq, HuggingFace, NVIDIA

### Run Tests
```bash
# Run all tests
npm test

# Run specific test
npm test -- e2e.test.ts
```

## Day 3: Making Your First Contribution

### Adding a New Provider
1. Create a new file in `src/providers/`
2. Implement the required interface
3. Add it to the discovery service
4. Write tests
5. Submit a PR

### Example: Adding a Custom Provider
```typescript
// src/providers/custom.ts
export async function fetchCustomModels(): Promise<Model[]> {
  // Your implementation
}
```

## Common Development Tasks

### Running Locally
```bash
npm run dev           # Start both servers with watch mode
npm run build         # Build production bundles
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Debugging
- Use `console.log` or the built-in logger (`src/utils/logger.ts`)
- Access Time-Rift events at `http://localhost:3000/events`
- Check the `/healthz` endpoint for service health

## Support Resources
- Documentation: `/docs`
- Architecture Decisions: `/docs/architecture/`
- Runbook: `/docs/runbook/`
- API Reference: `/docs/api/`