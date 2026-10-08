# Smart AI Router Skill

**版本：2.0.0-beta.1（測試版）**

⚠️ 此版本為測試版，請勿在生產環境使用於未充分驗證的場景。

Smart AI model routing for ESG domain tasks. Routes carbon_calculation, compliance_review, tcfd_analysis, sdg_mapping, evidence_ocr, and other ESG task types to optimal AI models with 3-level fallback chains. Upgraded with dynamic model discovery, time-travel debugging, and zero-trust security framework.

## 🧪 測試版功能
- 對話中心：整合「萬能永撰（OmniAgent）」與「萬能商情（Business Agent）」的測試界面
- 所有功能為測試用途，可能有不穩定或功能不完整
- 建議僅限內部測試環境使用

## Enhanced Architecture
- Dynamic Model Discovery: Integrated Groq, OpenRouter, Hugging Face providers
- Time-Space Rift Protocol: Event sourcing with replay & shadow testing
- Model Conversion Framework: PyTorch↔ONNX↔TensorFlow.js conversion
- Zero-Trust Security: OAG-based proof linking & artifact freezing

## ESG Task Type Router Table
| Task Type | Primary Model | Fallback 1 | Fallback 2 |
|-----------|--------------|------------|------------|
| carbon_calculation | Groq Llama 70B | Qwen 80B | Llama 90B Vision |
| compliance_review | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| gri_report_draft | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| tcfd_analysis | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| sdg_mapping | Groq Llama 70B | Qwen 80B | Llama 70B |
| evidence_ocr | Groq Llama 8B | Gemma 9B | Groq Llama 70B |
| email_archive | Groq Llama 8B | Gemma 9B | Groq Llama 70B |
| general | Groq Llama 70B | Llama 70B | Llama 90B Vision |

## Provider Discovery & Ranking
- Groq: 30 req/min, unlimited (recommended first)
- OpenRouter: 200/day, supports specialized models
- Hugging Face: Academic/enterprise models with licensing flexibility

## Model Conversion Matrix
- Format conversion capabilities: PyTorch↔ONNX↔TensorFlow.js
- Quantization support for performance optimization
- Conversion cost estimation

## Security & Compliance Protocols
- Zero-trust framework: Audit trail + hash locking
- Compliance tagging: ISO-14064-1/GRI compliance verification
- Strict access controls for ESG data flow

## Implementation Guides
- Express Gateway API integration
- Next.js API route configuration
- Shadow testing procedures
- Time-travel debugging workflow

## Testing & Validation
- Shadow testing procedures for model A/B comparison
- Time-travel debugging for complex ESG calculations
- Compliance validation workflows

## Migration Path
- v1 to v2 upgrade guide
- Configuration migration tool
- Compliance tag management

## Configuration Samples
- Production configuration
- Development/test configurations
- Shadow testing setup

## FAQ & Troubleshooting
- API rate limit handling
- Time-travel mode limitations
- Compliance verification errors

## Features
- Dynamic model discovery
- Time-travel debugging
- Zero-trust security
- Model conversion pipeline
- Shadow testing

```