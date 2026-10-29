import { defineRune } from '@lib/adk/core';
import { Type } from "@sinclair/typebox";

const BenchmarkResultSchema = Type.Object({
  industry: Type.String(),
  metric_name: Type.String(),
  user_value: Type.Optional(Type.Number()),
  benchmark_avg: Type.Number(),
  benchmark_top_tier: Type.Number(),
  unit: Type.String(),
  ranking_percentile: Type.Optional(Type.Number()),
  improvement_potential: Type.String()
});

export const industryBenchmarkRune = defineRune({
  name: "industry_benchmarking",
  description: "將使用者的 ESG 數據與產業標竿 (如台積電、台達電) 進行深度對標。",
  schema: BenchmarkResultSchema,
  execute: async (context: any, input: any) => {
    // 預設標竿數據 (實務上可串接外部 API 或內置產業資料庫)
    const mockBenchmarks: Record<string, any> = {
      "溫室氣體排放": { avg: 50.5, top: 12.2, unit: "tCO2e/百萬元營收" },
      "再生能源比例": { avg: 15, top: 100, unit: "%" },
      "女性董事比例": { avg: 18, top: 35, unit: "%" }
    };

    const benchmark = mockBenchmarks[input.metric_name] || { avg: 0, top: 0, unit: "N/A" };
    
    let resultMessage = `[產業對標] 對標產業：${input.industry}。指標：${input.metric_name}。`;
    if (input.user_value !== undefined) {
      const isTop = input.user_value <= (benchmark.top * 1.2);
      resultMessage += `\n您的表現：${input.user_value} ${benchmark.unit}。`;
      resultMessage += isTop ? ` ★ 已達到標竿領先等級！` : ` 距離產業平均 (${benchmark.avg}) 仍有改善空間。`;
    } else {
      resultMessage += `\n產業平均：${benchmark.avg} ${benchmark.unit}。標竿領先：${benchmark.top} ${benchmark.unit}。`;
    }

    return resultMessage;
  }
});
