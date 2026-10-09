/**
 * Comprehensive test suite for OneRingAI
 * 
 * Tests 5T verification, 30-agent matrix, AI Station pipeline,
 * memory system, and newsletter dispatch.
 */
import { AgentRuntime, LocalExecutionBackend, OneRingAIDriver, createAgentRuntime } from '../src/agent-runtime/index.js';
import { SWARM_SPEC, SwarmFactory, getSquadMembers, getAgentById, CROSS_AGENT_PAIRINGS } from '../src/agents/matrix.js';
import { AgentRegistry } from '../src/agents/registry.js';
import { AgentOrchestrator, createOrchestrator } from '../src/agents/orchestrator.js';
import { createMemorySystemWithConnectors, InMemoryAdapter, PredicateRegistry } from '../src/memory/system.js';
import { createAistationPipeline, AI_STATION_MODULES, BRAND_PRESETS } from '../src/aistation/pipeline.js';
import { createNewsletterSystem, SimpleTemplateEngine, AnalyticsDashboard, DeliveryScheduler } from '../src/newsletter/dispatch.js';
import { Agent, StorageRegistry, createFileContextStorage } from '../src/core/agent.js';
import { fiveTGate, apply5TToResponse } from '../src/core/fiveT-gate.js';
import { Connector } from '../src/core/connector.js';
import { getModelInfo, calculateCost, getProviderCapabilities } from '../src/registry/models.js';

// Test utilities
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void> | void): void {
  const start = Date.now();
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        results.push({ name, passed: true, message: '', duration: Date.now() - start });
      }).catch((err) => {
        results.push({ name, passed: false, message: (err as Error).message, duration: Date.now() - start });
      });
    } else {
      results.push({ name, passed: true, message: '', duration: Date.now() - start });
    }
  } catch (err) {
    results.push({ name, passed: false, message: (err as Error).message, duration: Date.now() - start });
  }
}

async function assert(condition: boolean, message: string): Promise<void> {
  if (!condition) throw new Error(message);
}

// ============================================================================
// Test Suites
// ============================================================================

async function runCoreTests(): Promise<void> {
  console.log('=== Core Tests ===');
  
  test('Agent Runtime - Basic Creation', async () => {
    const runtime = createAgentRuntime();
    assert(runtime !== null, 'Runtime created successfully');
  });
  
  test('Agent Runtime - Driver Registration', async () => {
    const backend = new LocalExecutionBackend({ drivers: [new OneRingAIDriver()] });
    const runtime = new AgentRuntime({ backend });
    
    const drivers = backend.listDrivers();
    assert(drivers.length === 1, `Expected 1 driver, got ${drivers.length}`);
    assert(drivers[0].name === 'oneringai', 'Driver name should be oneringai');
  });
  
  test('Agent Runtime - Agent Registration', async () => {
    const runtime = createAgentRuntime();
    
    const agent = runtime.agent({
      id: 'test-agent',
      driver: 'oneringai',
      connector: 'openai',
      model: 'gpt-4.1',
    });
    
    assert(agent.id === 'test-agent', 'Agent ID should match');
    assert(agent.model === 'gpt-4.1', 'Agent model should match');
  });
  
  test('5T Gate - Basic Verification', async () => {
    const result = fiveTGate({ data: 'test', source_origin: 'test-suite' });
    assert(result.traceable === true, 'Should be traceable');
    assert(result.trackable === true, 'Should be trackable');
  });
  
  test('5T Gate - Apply to Response', async () => {
    const response = { output_text: 'test', usage: { input_tokens: 10, output_tokens: 5 } };
    const verified = apply5TToResponse(response, 'test-suite');
    assert(verified !== null, 'Response should be verified');
  });
  
  test('Model Registry - Model Info', () => {
    const info = getModelInfo('gpt-5.6');
    assert(info !== undefined, 'Model info should be found');
    assert(info!.vendor === 'OpenAI', 'Vendor should be OpenAI');
  });
  
  test('Model Registry - Cost Calculation', () => {
    const cost = calculateCost('gpt-5.6-luna', 50_000, 2_000);
    assert(cost > 0, 'Cost should be positive');
  });
  
  test('Model Registry - Provider Capabilities', () => {
    const caps = getProviderCapabilities('OpenAI');
    assert(caps !== undefined, 'Provider capabilities should be found');
  });
  
  test('Storage Registry - Configuration', () => {
    StorageRegistry.configure({
      sessions: 'memory',
    });
    
    const sessions = StorageRegistry.get('sessions');
    assert(sessions !== undefined, 'Sessions storage should be retrievable');
  });
  
  test('Connector - Creation', () => {
    Connector.create({
      name: 'test-openai',
      vendor: 'openai',
      auth: { type: 'api_key', apiKey: 'test-key' },
    });
    
    const connector = Connector.get('test-openai');
    assert(connector !== undefined, 'Connector should be created');
    assert(connector!.name === 'test-openai', 'Connector name should match');
  });
}

async function runMatrixTests(): Promise<void> {
  console.log('\n=== 30-Agent Matrix Tests ===');
  
  test('Matrix - 30 Spec Count', () => {
    assert(SWARM_SPEC.length === 30, `Expected 30 agents, got ${SWARM_SPEC.length}`);
  });
  
  test('Matrix - Squad Distribution', () => {
    const squads = ['strategy', 'tech', 'creative', 'marketing', 'guard'];
    for (const squad of squads) {
      const members = getSquadMembers(squad as any);
      assert(members.length === 6, `Squad ${squad} should have 6 members, got ${members.length}`);
    }
  });
  
  test('Matrix - Numbering Consistency', () => {
    // Verify agents are numbered 1-30
    for (let i = 1; i <= 30; i++) {
      const agent = getAgentByNo(i);
      assert(agent !== undefined, `Agent ${i} should exist`);
    }
  });
  
  test('Matrix - Unique IDs', () => {
    const ids = SWARM_SPEC.map(s => s.id);
    const unique = new Set(ids);
    assert(unique.size === 30, `Should have 30 unique IDs, got ${unique.size}`);
  });
  
  test('Matrix - All Squads Assigned', () => {
    for (const spec of SWARM_SPEC) {
      assert(spec.squad !== undefined, `Agent ${spec.id} should have a squad`);
      assert(['strategy', 'tech', 'creative', 'marketing', 'guard'].includes(spec.squad), 
        `Agent ${spec.id} should have valid squad`);
    }
  });
  
  test('Matrix - Pairing Coverage', () => {
    const paired = new Set<string>();
    for (const pairing of CROSS_AGENT_PAIRINGS) {
      paired.add(pairing.primaryAgentId);
      paired.add(pairing.partnerAgentId);
    }
    
    // At least the queen and all 30 agents should be in some pairing
    assert(paired.size >= 30, `At least 30 agents should be paired, got ${paired.size}`);
  });
  
  test('Matrix - Agent Lookup by ID', () => {
    const agent = getAgentById('queen-bee');
    assert(agent !== undefined, 'queen-bee should exist');
    assert(agent!.no === 1, 'Queen Bee should be agent #1');
  });
  
  test('SwarmFactory - Agent Creation', () => {
    const factory = new SwarmFactory('test-openai');
    const agent = factory.createAgent(SWARM_SPEC[0]);
    assert(agent !== undefined, 'Agent should be created');
    assert(agent.userId === SWARM_SPEC[0].id, 'Agent should have correct user ID');
  });
  
  test('SwarmFactory - Create All', () => {
    const factory = new SwarmFactory('test-openai');
    factory.createAll();
    const all = factory.getAllAgents();
    assert(all.size === 30, `Should create 30 agents, got ${all.size}`);
  });
  
  test('AgentRegistry - Global Tracking', () => {
    const count = AgentRegistry.count;
    assert(count > 0, 'Should have registered agents');
  });
  
  test('AgentOrchestrator - Creation', async () => {
    Connector.create({
      name: 'test-openai-orch',
      vendor: 'openai',
      auth: { type: 'api_key', apiKey: 'test-key' },
    });
    
    const orch = await createOrchestrator({
      connector: 'test-openai-orch',
      model: 'gpt-4.1',
      agentTypes: {
        architect: {
          systemPrompt: 'You are a senior architect',
          description: 'Senior architect',
          scenarios: ['designing'],
          capabilities: ['architecture'],
        },
        developer: {
          systemPrompt: 'You are a senior developer',
          description: 'Developer',
          scenarios: ['coding'],
          capabilities: ['coding'],
        },
      },
    });
    
    assert(orch !== null, 'Orchestrator should be created');
    const ws = orch.getWorkspace();
    assert(ws !== undefined, 'Workspace should be available');
  });
}

async function runMemoryTests(): Promise<void> {
  console.log('\n=== Memory System Tests ===');
  
  test('MemorySystem - Creation', () => {
    const memory = createMemorySystemWithConnectors({
      store: new InMemoryAdapter(),
      connectors: {
        embedding: {
          embed: async (text: string | string[]) => {
            if (Array.isArray(text)) {
              return { embeddings: text.map(t => new Array(1536).fill(0.1)) };
            }
            return { embeddings: [new Array(1536).fill(0.1)] };
          },
        },
        profile: {
          generateProfile: async (prompt: string) => `Generated profile for: ${prompt.slice(0, 50)}`,
        },
      },
      predicates: PredicateRegistry.standard(),
      predicateMode: 'strict',
    });
    
    assert(memory !== null, 'Memory system should be created');
  });
  
  test('MemorySystem - Entity Upsert', async () => {
    const memory = createMemorySystemWithConnectors({
      store: new InMemoryAdapter(),
      connectors: {
        embedding: { embed: async (t: string) => ({ embeddings: [new Array(1536).fill(0)] }) },
      },
    });
    
    const entity = await memory.upsertEntity({
      type: 'person',
      displayName: 'Test User',
      identifiers: [{ kind: 'email', value: 'test@example.com' }],
      aliases: [],
      owner: 'user:current' as any,
      visibility: { owner: 'user:current' as any, group: null, world: 'none' },
      metadata: {},
    });
    
    assert(entity.id !== undefined, 'Entity should have an ID');
    assert(entity.displayName === 'Test User', 'Entity name should match');
  });
  
  test('MemorySystem - Store Fact', async () => {
    const memory = createMemorySystemWithConnectors({
      store: new InMemoryAdapter(),
      connectors: {
        embedding: { embed: async (t: string) => ({ embeddings: [new Array(1536).fill(0)] }) },
      },
      predicates: PredicateRegistry.standard(),
    });
    
    const fact = await memory.remember(
      { identifier: { kind: 'email', value: 'test@example.com' } },
      'prefers',
      'concise answers',
      { confidence: 0.9, importance: 2 }
    );
    
    assert(fact.id !== undefined, 'Fact should have an ID');
    assert(fact.value === 'concise answers', 'Fact value should match');
  });
  
  test('MemorySystem - Search Facts', async () => {
    const memory = createMemorySystemWithConnectors({
      store: new InMemoryAdapter(),
      connectors: {
        embedding: { embed: async (t: string) => ({ embeddings: [new Array(1536).fill(0)] }) },
      },
    });
    
    await memory.remember({ id: 'ent_1' }, 'prefers', 'concise answers');
    const results = await memory.searchFacts('concise', 'user:current' as any, { topK: 5 });
    assert(results.length > 0, 'Should find facts matching search');
  });
  
  test('MemorySystem - Predicate Validation', async () => {
    const memory = createMemorySystemWithConnectors({
      store: new InMemoryAdapter(),
      connectors: { embedding: { embed: async () => ({ embeddings: [] }) } },
      predicates: PredicateRegistry.standard(),
      predicateMode: 'strict',
    });
    
    try {
      await memory.remember({ id: 'ent_1' }, 'unknown_predicate', 'value');
      assert(false, 'Should throw for unknown predicate in strict mode');
    } catch (e) {
      assert((e as Error).message.includes('Unknown predicate'), 'Should report unknown predicate');
    }
  });
}

async function runAistationTests(): Promise<void> {
  console.log('\n=== AI Station Pipeline Tests ===');
  
  test('AIStation - Pipeline Creation', () => {
    const pipeline = createAistationPipeline('oneringai');
    assert(pipeline !== null, 'Pipeline should be created');
  });
  
  test('AIStation - 7 Modules', () => {
    const pipeline = createAistationPipeline();
    const modules = pipeline.getModules();
    assert(modules.length === 7, `Expected 7 modules, got ${modules.length}`);
  });
  
  test('AIStation - Module Verification Specs', () => {
    const pipeline = createAistationPipeline();
    const modules = pipeline.getModules();
    
    for (const mod of modules) {
      assert(mod.verification.tPrinciples.length > 0, `Module ${mod.id} should have T principles`);
      assert(mod.fallbackChain.length > 0, `Module ${mod.id} should have fallback chain`);
    }
  });
  
  test('AIStation - Brand Presets', () => {
    assert(BRAND_PRESETS['ftg-tours'] !== undefined, 'FTG Tours brand should exist');
    assert(BRAND_PRESETS['esggo'] !== undefined, 'ESG GO brand should exist');
  });
  
  test('AIStation - Graceful Fallback', async () => {
    const pipeline = createAistationPipeline();
    const result = await pipeline.executePipeline({
      host: 'Dr. Source',
      hostName: '壽司博士',
      script: 'This is a test script for AI Station',
      topic: 'test-topic',
      brand: 'ftg-tours',
    });
    
    assert(result.status === 'completed', `Pipeline should complete, got ${result.status}`);
    assert(result.outputs !== null, 'Outputs should be available');
  });
  
  test('AIStation - 5T Verification', async () => {
    const pipeline = createAistationPipeline();
    // Verify a module's output
    const module = pipeline.getModule('lineage');
    assert(module !== undefined, 'Lineage module should exist');
    
    const verification = await pipeline.verifyOutput({ id: 'test-artifact' }, 'lineage');
    assert(verification.passed === true, 'Verification should pass for valid output');
    assert(verification.hash !== undefined, 'Hash should be computed');
  });
}

async function runNewsletterTests(): Promise<void> {
  console.log('\n=== Newsletter Dispatch Tests ===');
  
  test('Newsletter - System Creation', () => {
    const system = createNewsletterSystem({});
    assert(system !== null, 'Newsletter system should be created');
  });
  
  test('Newsletter - Template Engine', async () => {
    const engine = new SimpleTemplateEngine();
    
    const result = await engine.renderString('Hello {{DATE}}!', {});
    assert(result.includes('Hello'), 'Should contain greeting');
    assert(result.includes('20'), 'DATE should be rendered');
  });
  
  test('Newsletter - Template Engine with Variables', async () => {
    const engine = new SimpleTemplateEngine();
    
    const result = await engine.renderString('{{name}} scored {{score}}', { name: 'Test', score: 100 });
    assert(result === 'Test scored 100', `Should be "Test scored 100", got "${result}"`);
  });
  
  test('Newsletter - Template Engine RANDOM', async () => {
    const engine = new SimpleTemplateEngine();
    
    // Register RANDOM handler if not already there
    const result = await engine.renderString('Your code: {{RANDOM:1000:9999}}', {});
    const numMatch = result.match(/Your code: (\d{4})/);
    assert(numMatch !== null, 'Should produce a 4-digit random number');
    const num = parseInt(numMatch![1], 10);
    assert(num >= 1000 && num <= 9999, `Random should be 1000-9999, got ${num}`);
  });
  
  test('Newsletter - Template Save and Retrieve', async () => {
    const system = createNewsletterSystem({});
    
    const template = await system.saveTemplate({
      name: 'Test Template',
      subject: 'Subject: {{topic}}',
      htmlBody: '<p>{{content}}</p>',
      textBody: '{{content}}',
      brand: 'oneringai',
    });
    
    const retrieved = await system.getTemplate(template.id);
    assert(retrieved !== undefined, 'Template should be retrievable');
    assert(retrieved!.name === 'Test Template', 'Template name should match');
  });
  
  test('Newsletter - Subscriber Management', async () => {
    const system = createNewsletterSystem({});
    
    const subscriber = await system.addSubscriber({
      email: 'test@example.com',
      platform: 'email',
      verified: true,
      preferences: {},
    });
    
    assert(subscriber.id !== undefined, 'Subscriber should have ID');
    
    const subscribers = await system.getSubscribers();
    assert(subscribers.length === 1, `Should have 1 subscriber, got ${subscribers.length}`);
    assert(subscribers[0].email === 'test@example.com', 'Email should match');
  });
  
  test('Newsletter - Dispatch', async () => {
    const system = createNewsletterSystem({
      smtp: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', secure: false },
    });
    
    const template = await system.saveTemplate({
      name: 'Test Dispatch',
      subject: 'Test: {{topic}}',
      htmlBody: '<h1>{{title}}</h1><p>{{content}}</p>',
      textBody: '{{title}}\n{{content}}',
      brand: 'oneringai',
    });
    
    await system.addSubscriber({
      email: 'test@example.com',
      platform: 'email',
      verified: true,
      preferences: {},
    });
    
    const { results, metrics } = await system.dispatch(template.id, {
      topic: 'Test Topic',
      title: 'Test Title',
      content: 'Test content',
    });
    
    assert(results.length === 1, `Should have 1 delivery result, got ${results.length}`);
    assert(results[0].success === true, 'Delivery should succeed');
  });
  
  test('Newsletter - HMAC Webhook Security', async () => {
    const secret = 'test-webhook-secret';
    const scheduler = new DeliveryScheduler({ webhook: { secret, rateLimit: { maxRequests: 10, perSeconds: 1 } } });
    
    const result = await scheduler.send('webhook', 'https://example.com/webhook', {
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });
    
    assert(result.success === true, 'Webhook delivery should succeed');
    assert(result.channel === 'webhook', 'Channel should be webhook');
  });
  
  test('Newsletter - Analytics Dashboard', () => {
    const dashboard = new AnalyticsDashboard();
    
    dashboard.recordDelivery({ success: true, channel: 'email', recipient: 'a@b.com', timestamp: Date.now() });
    dashboard.recordDelivery({ success: false, channel: 'email', recipient: 'c@d.com', error: 'bounce', timestamp: Date.now() });
    dashboard.recordEvent('open', {});
    dashboard.recordEvent('click', {});
    
    const metrics = dashboard.getMetrics();
    assert(metrics.sendCount === 2, `Should have 2 sends, got ${metrics.sendCount}`);
    assert(metrics.openCount === 1, `Should have 1 open, got ${metrics.openCount}`);
    assert(metrics.clickCount === 1, `Should have 1 click, got ${metrics.clickCount}`);
    assert(metrics.bounceCount === 1, `Should have 1 bounce, got ${metrics.bounceCount}`);
  });
  
  test('Newsletter - Subscriber Segmentation', async () => {
    const system = createNewsletterSystem({});
    
    await system.addSubscriber({
      email: 'user1@example.com',
      platform: 'email',
      verified: true,
      preferences: { plan: 'free' },
    });
    
    await system.addSubscriber({
      email: 'user2@example.com',
      platform: 'email',
      verified: true,
      preferences: { plan: 'paid' },
    });
    
    const segment = await system.createSegment('paid-users', (sub) => sub.preferences.plan === 'paid');
    const subscribers = await system.getSubscribers('paid-users');
    
    assert(subscribers.length === 1, `Paid segment should have 1 subscriber, got ${subscribers.length}`);
  });
  
  test('Newsletter - Default Weekly Swarm Report Template', async () => {
    const system = createNewsletterSystem({});
    
    // The default template should be auto-registered
    const retrieved = await system.getTemplate('weekly-swarm-report');
    assert(retrieved !== undefined, 'Default weekly report template should exist');
    assert(retrieved!.name.includes('萬能蜂群'), 'Should have Chinese name');
  });
}

// ============================================================================
// 5T Compliance Tests
// ============================================================================

async function run5TComplianceTests(): Promise<void> {
  console.log('\n=== 5T Compliance Tests ===');
  
  test('5T - Traceable on Agent Output', async () => {
    const response = { output_text: 'test output' };
    const verified = apply5TToResponse(response, 'test-source');
    assert(verified.source_origin === 'test-source', 'Source origin should be set');
    assert(verified._5t_verified === true, 'Should be marked as verified');
  });
  
  test('5T - Trackable on Session Save', async () => {
    const storage = createFileContextStorage('/tmp/test-storage');
    assert(storage !== undefined, 'Storage should be created');
  });
  
  test('5T - Trustworthy hash lock', async () => {
    const data = { test: 'data' };
    const verified = apply5TToResponse(data, 'test');
    assert(verified._5t_hash !== undefined, 'Should have a hash');
    assert(typeof verified._5t_hash === 'string', 'Hash should be a string');
  });
  
  test('5T - All 5 Principles Applied', () => {
    const gate = fiveTGate({ data: 'test' });
    assert(gate.traceable === true, 'Traceable');
    assert(gate.trackable === true, 'Trackable');
    assert(gate.tangible === true, 'Tangible');
    assert(gate.transparent === true, 'Transparent');
    assert(gate.trustworthy === true, 'Trustworthy');
  });
}

// ============================================================================
// Cross-Agent Pairing Tests
// ============================================================================

async function runCrossAgentTests(): Promise<void> {
  console.log('\n=== Cross-Agent Pairing Tests ===');
  
  test('Cross-Agent - All 30 Agents Paired', () => {
    const paired = new Set<string>();
    for (const pairing of CROSS_AGENT_PAIRINGS) {
      paired.add(pairing.primaryAgentId);
      paired.add(pairing.partnerAgentId);
    }
    
    // Get all agent IDs
    const allIds = new Set(SWARM_SPEC.map(s => s.id));
    const unpaired = [...allIds].filter(id => !paired.has(id));
    assert(unpaired.length === 0, `All 30 agents should be paired, but these are unpaired: ${unpaired.join(', ')}`);
  });
  
  test('Cross-Agent - Pairings Have Purpose', () => {
    for (const pairing of CROSS_AGENT_PAIRINGS) {
      assert(pairing.purpose.length > 0, 'Pairing should have a purpose');
      assert(pairing.sharedTools.length > 0, 'Pairing should share tools');
    }
  });
  
  test('Cross-Agent - No Self-Pairing', () => {
    for (const pairing of CROSS_AGENT_PAIRINGS) {
      assert(pairing.primaryAgentId !== pairing.partnerAgentId, 
        `Agent should not pair with itself: ${pairing.primaryAgentId}`);
    }
  });
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('Running OneRingAI Test Suite...\n');
  
  await runCoreTests();
  await runMatrixTests();
  await runMemoryTests();
  await runAistationTests();
  await runNewsletterTests();
  await run5TComplianceTests();
  await runCrossAgentTests();
  
  // Summary
  console.log('\n=== Test Summary ===');
  
  let passed = 0;
  let failed = 0;
  const failures: TestResult[] = [];
  
  for (const result of results) {
    if (result.passed) {
      passed++;
      console.log(`  ✅ ${result.name} (${result.duration}ms)`);
    } else {
      failed++;
      console.log(`  ❌ ${result.name}: ${result.message}`);
      failures.push(result);
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed out of ${results.length} tests`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.message}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
