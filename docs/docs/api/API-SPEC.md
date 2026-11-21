# Smart AI Router API Reference

## Base URL
```
https://api.esggo.ai/v2
```

## Authentication
All endpoints require an API key in the header:
```http
Authorization: Bearer YOUR_API_KEY
```

---

## Health Check Endpoints

### GET /healthz
Basic liveness check

**Response (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": "2024-07-05T10:30:00Z",
  "service": "smart-ai-router"
}
```

### GET /healthz?detail=true
Detailed component health check

**Response (200 OK)**
```json
{
  "status": "healthy",
  "checks": {
    "router": "healthy",
    "gateway": "healthy",
    "eventStore": "healthy",
    "modelDiscovery": "healthy"
  },
  "uptime": 3600,
  "memory": {
    "heapUsed": 50000000,
    "heapTotal": 100000000,
    "rss": 150000000
  }
}
```

---

## AI Routing Endpoint

### POST /api/route
Route a task to the optimal AI model

**Request Body**
```json
{
  "taskType": "carbon_calculation",
  "message": "Calculate CO2 emissions for manufacturing process",
  "options": {
    "useGateway": true,
    "complianceType": "ISO-14064-1"
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "traceId": "trace_1720099200000_abc123",
  "result": {
    "content": "根據 Scope 1、2、3 標準...",
    "usage": {
      "promptTokens": 50,
      "completionTokens": 100,
      "totalTokens": 150
    }
  },
  "model": {
    "id": "llama-3.3-70b-versatile",
    "provider": "groq",
    "strategy": "primary"
  }
}
```

**Error Response (500)**
```json
{
  "success": false,
  "error": "All fallback models failed",
  "traceId": "trace_1720099200000_xyz789"
}
```

---

## Model Management Endpoints

### GET /api/models
Discover available free models

**Response (200 OK)**
```json
[
  {
    "id": "llama-3.3-70b-versatile",
    "name": "Llama 3.3 70B",
    "provider": "groq",
    "tags": ["chat", "reasoning"],
    "contextWindow": 32768,
    "isFree": true
  }
]
```

### POST /api/models/convert
Convert model format

**Request Body**
```json
{
  "modelId": "model-123",
  "config": {
    "sourceFramework": "pytorch",
    "targetFramework": "onnx",
    "outputFormat": "onnx"
  }
}
```

---

## Debug Endpoints

### POST /debug/time-travel
Replay events by trace ID

**Request Body**
```json
{
  "traceId": "trace_1720099200000_abc123",
  "speed": 10,
  "filters": {
    "eventTypes": ["MODEL_ROUTED", "MODEL_RESPONDED"]
  }
}
```

**Response (200 OK)**
```json
{
  "sessionId": "replay_1720099200000_def456",
  "status": "completed",
  "totalEvents": 5,
  "processedEvents": 5,
  "events": [...]
}
```

### POST /debug/shadow-test
Start shadow test for a model

**Request Body**
```json
{
  "modelId": "new-model-id",
  "trafficPercentage": 15,
  "durationMinutes": 60
}
```

---

## Metrics Endpoint

### GET /metrics
Prometheus metrics

**Response (200 OK)**
```
# HELP smart_ai_router_requests_total Total requests
# TYPE smart_ai_router_requests_total counter
smart_ai_router_requests_total{status="success"} 100
smart_ai_router_requests_total{status="failed"} 2

# HELP smart_ai_router_latency_seconds Request latency
# TYPE smart_ai_router_latency_seconds histogram
smart_ai_router_latency_seconds_bucket{le="0.1"} 50
smart_ai_router_latency_seconds_bucket{le="0.5"} 95
smart_ai_router_latency_seconds_bucket{le="1.0"} 100
```