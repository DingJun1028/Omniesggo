#!/usr/bin/env python3
"""
test_tool_decorator.py — 驗證 @tool 裝飾器從函數簽名自動生成 Ollama Tool Schema 的正確性
"""

from __future__ import annotations

import inspect
import json
from dataclasses import dataclass
from typing import Any, get_origin, get_type_hints

# ============================================================================
# @tool 裝飾器實作
# ============================================================================

@dataclass
class ToolParamSpec:
    name: str
    py_type: type
    description: str
    default: Any
    required: bool


@dataclass
class ToolSchema:
    name: str
    description: str
    parameters: dict  # JSON Schema 格式
    fn: Any = None  # 保留原始函數引用


def _python_type_to_json_schema(py_type: type) -> dict:
    """將 Python 型別映射為 JSON Schema 片段。"""
    origin = get_origin(py_type)
    if py_type is str or origin is None and py_type == str:
        return {"type": "string"}
    if py_type is int or origin is None and py_type == int:
        return {"type": "integer"}
    if py_type is float or origin is None and py_type == float:
        return {"type": "number"}
    if py_type is bool or origin is None and py_type == bool:
        return {"type": "boolean"}
    if origin is list or py_type is list:
        return {"type": "array", "items": {"type": "string"}}
    if py_type is dict or origin is dict:
        return {"type": "object"}
    # 預設回退
    return {"type": "string"}


def tool(name: str = None, description: str = None):
    """
    裝飾器：將純 Python 函數轉化為 Ollama Tool 定義（JSON Schema）。

    用法：
        @tool("查詢節點健康狀態")
        def get_node_health(node_id: str, time_window: int = 5) -> dict:
            '''查詢指定節點的健康狀態與負載指標'''
            ...

        schema = get_node_health.tool_schema
        print(json.dumps(schema.parameters, indent=2))
    """

    def decorator(fn):
        sig = inspect.signature(fn)
        hints = get_type_hints(fn)
        doc_first_line = (fn.__doc__ or "").strip().split("\n")[0] if fn.__doc__ else ""

        tool_name = name or fn.__name__
        tool_desc = description or doc_first_line or f"執行 {fn.__name__} 操作"

        properties: dict = {}
        required: list[str] = []

        for param_name, param in sig.parameters.items():
            if param_name == "self" or param_name == "kwargs":
                continue

            py_type = hints.get(param_name, param.annotation)
            if py_type is inspect.Parameter.empty:
                py_type = str  # 預設推斷為 string

            json_schema = _python_type_to_json_schema(py_type)
            param_def: dict = {"type": json_schema["type"]}

            # 加入描述（若函數有 docstring 或支援 @param 風格的註解）
            # 這裡簡化：直接使用參數名作為描述的一部分
            param_def["description"] = param_name

            if param.default is not inspect.Parameter.empty:
                param_def["default"] = param.default
            else:
                required.append(param_name)

            properties[param_name] = param_def

        schema_dict: dict = {
            "type": "object",
            "properties": properties,
        }
        if required:
            schema_dict["required"] = required

        # 封裝成 ToolSchema 物件，同時掛載到函數上方便取用
        tool_schema_obj = ToolSchema(
            name=tool_name,
            description=tool_desc,
            parameters=schema_dict,
            fn=fn,
        )
        fn.tool_schema = tool_schema_obj  # 型別: ignore[attr-defined]
        return fn

    return decorator


# ============================================================================
# 測試案例：用真實函數驗證產出的 JSON Schema
# ============================================================================

@tool("查詢叢集節點健康狀態")
def get_node_health(
    node_id: str,
    time_window: int = 5,
    include_metrics: bool = True,
) -> dict:
    """查詢指定節點的健康狀態與即時負載指標"""
    return {"node": node_id, "status": "healthy"}


@tool()
def purge_zombie_process(
    pid: int,
    force: bool = False,
) -> dict:
    """終結指定 PID 的殭屍進程，釋放系統資源"""
    return {"terminated": pid, "status": "purified"}


@tool(name="analyze_system_anomaly", description="深度分析系統異常根因")
def analyze_anomaly(
    logs: list[str],
    threshold: float = 0.8,
) -> dict:
    """
    接收日誌列表與閾值，分析異常根因。

    這是 The Mind（大腦）角色的典型任務。
    """
    return {"analysis": "done"}


# ============================================================================
# 驗證函式
# ============================================================================

def assert_schema(tool_fn, expected_name: str, expected_params: list[str],
                  expected_required: list[str], test_label: str) -> None:
    """斷言工具產出的 Schema 符合預期。"""
    schema = tool_fn.tool_schema
    assert schema is not None, f"[{test_label}] 裝飾器未掛载 tool_schema"
    assert schema.name == expected_name, \
        f"[{test_label}] 名稱不符：{schema.name} != {expected_name}"
    assert list(schema.parameters["properties"].keys()) == expected_params, \
        f"[{test_label}] 參數列表不符：{list(schema.parameters['properties'].keys())} != {expected_params}"
    if expected_required:
        assert schema.parameters.get("required") == expected_required, \
            f"[{test_label}] required 欄位不符：{schema.parameters.get('required')} != {expected_required}"
    else:
        assert "required" not in schema.parameters or not schema.parameters["required"], \
            f"[{test_label}] 不應有 required 欄位"

    # 驗證每個參數的型別映射正確
    for pname, pdef in schema.parameters["properties"].items():
        assert "type" in pdef, f"[{test_label}] {pname} 缺少 type 欄位"
        assert "description" in pdef, f"[{test_label}] {pname} 缺少 description 欄位"

    print(f"✅ [{test_label}] 通過")


def print_schema(tool_fn, label: str) -> None:
    """美觀列印工具的 JSON Schema。"""
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    schema = tool_fn.tool_schema
    print(json.dumps({
        "name": schema.name,
        "description": schema.description,
        "parameters": schema.parameters,
    }, indent=2, ensure_ascii=False))
    print()


# ============================================================================
# 主測試流程
# ============================================================================

def main() -> None:
    print("🔍 開始驗證 @tool 裝飾器產出的 Ollama Tool Schema 正確性\n")

    # 案例 1：含預設值的參數 → required 中不包含該參數
    print_schema(get_node_health, "案例 1：get_node_health（含預設值）")
    assert_schema(
        get_node_health,
        expected_name="查詢叢集節點健康狀態",
        expected_params=["node_id", "time_window", "include_metrics"],
        expected_required=["node_id"],  # 只有 node_id 是必填
        test_label="案例 1：參數與 required 欄位",
    )

    # 案例 2：無預設值參數都應在 required 中
    print_schema(purge_zombie_process, "案例 2：purge_zombie_process（均為必填）")
    assert_schema(
        purge_zombie_process,
        expected_name="purge_zombie_process",
        expected_params=["pid", "force"],
        expected_required=["pid"],  # force 有預設值所以不在 required
        test_label="案例 2：force 有預設值不在 required",
    )

    # 案例 3：自訂 name 與 description，函式 Docstring 不用作為 description
    print_schema(analyze_anomaly, "案例 3：analyze_anomaly（自訂 name/description）")
    assert_schema(
        analyze_anomaly,
        expected_name="analyze_system_anomaly",
        expected_params=["logs", "threshold"],
        expected_required=["logs"],
        test_label="案例 3：自訂名稱與描述優先",
    )

    # 驗證型別映射
    print("\n🔍 驗證型別映射正確性")
    for fn, expected_map in [
        (get_node_health, {"node_id": "string", "time_window": "integer", "include_metrics": "boolean"}),
        (purge_zombie_process, {"pid": "integer", "force": "boolean"}),
        (analyze_anomaly, {"logs": "array", "threshold": "number"}),
    ]:
        schema = fn.tool_schema
        for pname, expected_type in expected_map.items():
            actual_type = schema.parameters["properties"][pname]["type"]
            assert actual_type == expected_type, \
                f"型別不符：{pname} 期望 {expected_type} 實際 {actual_type}"
        print(f"✅ {fn.tool_schema.name} 型別映射正確")

    # 產出可直接貼入 Ollama 的 tools 定義
    print("\n" + "="*60)
    print("  可直接用於 Ollama Chat API 的 tools 定義")
    print("="*60)
    tools_for_ollama = [
        {
            "type": "function",
            "function": {
                "name": s.name,
                "description": s.description,
                "parameters": s.parameters,
            }
        }
        for s in [get_node_health.tool_schema, purge_zombie_process.tool_schema, analyze_anomaly.tool_schema]
    ]
    print(json.dumps(tools_for_ollama, indent=2, ensure_ascii=False))

    print("\n" + "="*60)
    print("  裝飾器驗證全部通過 — 寫函數 = 寫工具，零儀式感")
    print("="*60)


if __name__ == "__main__":
    main()
