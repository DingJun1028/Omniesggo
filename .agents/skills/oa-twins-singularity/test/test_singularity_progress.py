# -*- coding: utf-8 -*-
"""singularity_progress.py unittest 測試。

涵蓋：
  - parse_5t_tags：明確標籤 / "T" 佔位符 / 未知值 / 非列表
  - derive_stage：合成進度與 pending 宣告
  - check_structure：合法與不合法合成矩陣
  - 真實矩陣（存在時）：10 峰 60 代理結構校驗

執行：python -m unittest discover -s .agents/skills/oa-twins-singularity/test -v
"""

from __future__ import annotations

import json
import os
import sys
import unittest

sys.path.insert(
    0, os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
)

import singularity_progress as sp  # noqa: E402

REPO_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
REAL_MATRIX = os.path.join(REPO_ROOT, "esggo-omni-center", "oa-twins", "peak6_classification.json")


def make_peak(peak_code, peak_name, hive, n_agents=6, tag5=None):
    agents = []
    for i in range(n_agents):
        agents.append({
            "id": i + 1,
            "code": f"{i + 1:02d}",
            "title": f"代理{i + 1}",
            "tags": "#測試",
            "5t": tag5 if tag5 is not None else ["T", "T", "T", "T", "T"],
        })
    return {
        "peak_code": peak_code,
        "peak_name": peak_name,
        "attribute": "暗屬性" if hive == "蜂王隊" else "光屬性",
        "belong_hive": hive,
        "agent_range": [1, n_agents],
        "function_line": "測試",
        "agents": agents,
    }


def make_valid_matrix(full_explicit=True):
    tag5 = list(sp.CANON_5T) if full_explicit else ["T", "T", "T", "T", "T"]
    peaks = []
    for i in range(5):
        peaks.append(make_peak(f"A{i + 1}", f"暗峰{i + 1}", "蜂王隊", tag5=tag5))
    for i in range(5):
        peaks.append(make_peak(f"B{i + 1}", f"光峰{i + 1}", "蜂后隊", tag5=tag5))
    return {"classification": "測試", "version": "vTest", "peaks": peaks}


class TestParse5t(unittest.TestCase):
    def test_explicit_tags(self):
        parsed = sp.parse_5t_tags(["Traceable", "Transparent"])
        self.assertEqual(parsed["explicit"], {"Traceable", "Transparent"})
        self.assertEqual(parsed["placeholder"], 0)
        self.assertEqual(parsed["unknown"], 0)

    def test_placeholder_T_not_counted(self):
        parsed = sp.parse_5t_tags(["T", "T", "T", "T", "T"])
        self.assertEqual(len(parsed["explicit"]), 0)
        self.assertEqual(parsed["placeholder"], 5)

    def test_unknown_value(self):
        parsed = sp.parse_5t_tags(["Foo", 42])
        self.assertEqual(len(parsed["explicit"]), 0)
        self.assertEqual(parsed["unknown"], 2)

    def test_non_list(self):
        parsed = sp.parse_5t_tags("Traceable")
        self.assertEqual(parsed["unknown"], 1)

    def test_none(self):
        parsed = sp.parse_5t_tags(None)
        self.assertEqual(parsed["unknown"], 0)
        self.assertEqual(len(parsed["explicit"]), 0)


class TestStructure(unittest.TestCase):
    def test_valid_matrix(self):
        structure = sp.check_structure(make_valid_matrix())
        self.assertTrue(structure["ok"])
        self.assertEqual(structure["peaks"], 10)
        self.assertEqual(structure["agent_total"], 60)
        self.assertEqual(structure["hive_counts"], {"蜂王隊": 5, "蜂后隊": 5})

    def test_wrong_agent_count(self):
        data = make_valid_matrix()
        data["peaks"][0]["agents"] = data["peaks"][0]["agents"][:3]
        structure = sp.check_structure(data)
        self.assertFalse(structure["ok"])
        self.assertFalse(structure["checks"]["per_peak_6"])

    def test_wrong_peak_count(self):
        data = make_valid_matrix()
        data["peaks"] = data["peaks"][:8]
        structure = sp.check_structure(data)
        self.assertFalse(structure["ok"])
        self.assertFalse(structure["checks"]["peaks_10"])


class TestStage(unittest.TestCase):
    def test_full_explicit_full_stage1(self):
        report = sp.measure_structure_and_stage(make_valid_matrix(full_explicit=True))
        self.assertEqual(report["stage"]["stage1_progress"], 100.0)
        self.assertEqual(report["coverage_5t"]["coverage"], 1.0)

    def test_placeholder_only_covers_structure(self):
        report = sp.measure_structure_and_stage(make_valid_matrix(full_explicit=False))
        # 佔位符不計覆蓋 → 覆蓋率 0，僅結構 30%
        self.assertEqual(report["coverage_5t"]["coverage"], 0.0)
        self.assertEqual(report["stage"]["stage1_progress"], 30.0)

    def test_stages_2_to_4_pending(self):
        report = sp.measure_structure_and_stage(make_valid_matrix())
        pending = report["stage"]["stages_2_to_4"]
        self.assertEqual(len(pending), 3)
        for p in pending:
            self.assertIn("required_evidence", p)


class TestRealMatrix(unittest.TestCase):
    @unittest.skipUnless(os.path.isfile(REAL_MATRIX), "正典矩陣不存在")
    def test_real_matrix_structure(self):
        with open(REAL_MATRIX, "rb") as f:
            data = json.loads(f.read().decode("utf-8"))
        structure = sp.check_structure(data)
        self.assertTrue(structure["ok"], f"真實矩陣結構異常: {structure['checks']}")
        self.assertEqual(structure["agent_total"], 60)

    @unittest.skipUnless(os.path.isfile(REAL_MATRIX), "正典矩陣不存在")
    def test_real_matrix_coverage_reported(self):
        with open(REAL_MATRIX, "rb") as f:
            data = json.loads(f.read().decode("utf-8"))
        coverage = sp.measure_coverage(data)
        self.assertEqual(coverage["agents"], 60)
        self.assertEqual(coverage["max_possible"], 300)
        self.assertGreaterEqual(coverage["coverage"], 0.0)
        self.assertLessEqual(coverage["coverage"], 1.0)


if __name__ == "__main__":
    unittest.main()
