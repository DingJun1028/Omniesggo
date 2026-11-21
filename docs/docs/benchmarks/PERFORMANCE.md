# Performance Benchmarks

## Test Environment
- **CPU**: AMD EPYC 7763 (64 cores)
- **Memory**: 256 GB DDR4-3200
- **Network**: 10 Gbps
- **Event Store**: PostgreSQL 15 (SSD), EventStoreDB 23.10
- **Load Generator**: k6 v0.48

## Event Store Comparison

| Store Type | Write Latency (p99) | Read Latency (p99) | Throughput (events/sec) | Disk Usage (1M events) |
|------------|---------------------|--------------------|-------------------------|------------------------|
| InMemory   | 0.2 ms              | 0.1 ms             | 500,000+                | N/A (RAM)              |
| PostgreSQL | 3.5 ms              | 2.8 ms             | 45,000                  | 2.1 GB                 |
| EventStoreDB | 1.8 ms            | 1.2 ms             | 85,000                  | 1.4 GB                 |

## Model Routing Latency

| Task Type | Model | Provider | p50 Latency | p99 Latency | Tokens/sec |
|-----------|-------|----------|-------------|-------------|------------|
| carbon_calculation | Llama 3.3 70B | Groq | 420 ms | 1.2 s | 180 |
| compliance_review | Qwen3 80B | OpenRouter | 680 ms | 2.1 s | 145 |
| tcfd_analysis | Nemotron 70B | NVIDIA | 550 ms | 1.8 s | 160 |
| general | Llama 3.3 70B | Groq | 380 ms | 1.1 s | 195 |

## Shadow Testing Performance

| Metric | Baseline (Groq) | Shadow (NVIDIA) | Delta |
|--------|-----------------|-----------------|-------|
| Avg Latency | 420 ms | 550 ms | +31% |
| Error Rate | 0.2% | 0.3% | +0.1% |
| Quality Score | 4.2/5 | 4.5/5 | +7% |
| Cost/1K tokens | $0.00 | $0.00 | 0% |

## Time-Travel Replay Performance

| Event Count | Replay Speed | Duration | Memory Peak |
|-------------|--------------|----------|-------------|
| 1,000 | 10x | 0.8 s | 45 MB |
| 10,000 | 10x | 6.2 s | 120 MB |
| 100,000 | 10x | 58 s | 480 MB |
| 1,000,000 | 10x | 9.5 min | 2.1 GB |

## Resource Utilization (Production Load)

| Component | CPU (avg) | Memory | Network I/O | Disk I/O |
|-----------|-----------|--------|-------------|----------|
| API Gateway | 15% | 180 MB | 50 Mbps | 5 MB/s |
| Time-Rift Engine | 25% | 320 MB | 100 Mbps | 50 MB/s |
| Event Store (PG) | 35% | 2.1 GB | 20 Mbps | 200 MB/s |
| Model Providers | N/A | N/A | 500 Mbps | N/A |

## Scaling Benchmarks

| Concurrent Requests | p99 Latency | Error Rate | Throughput |
|---------------------|-------------|------------|------------|
| 10 | 450 ms | 0% | 22 req/s |
| 100 | 680 ms | 0% | 145 req/s |
| 500 | 1,200 ms | 0.2% | 410 req/s |
| 1,000 | 2,100 ms | 0.5% | 470 req/s |

## Recommendations

1. **Production**: Use EventStoreDB for event store (best latency/throughput balance)
2. **Caching**: Enable Redis cache for model discovery (reduces API calls by 90%)
3. **Scaling**: Horizontal pod autoscaling at 70% CPU, max 20 replicas
4. **Cost**: Groq primary + OpenRouter fallback = $0 marginal cost for free tiers