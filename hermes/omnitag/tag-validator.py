#!/usr/bin/env python3
"""OmniTag Contract Validation Engine"""
import os, re, json, hashlib, datetime
from pathlib import Path
from typing import Dict, List

CONTRACT_DIR = Path(__file__).parent
SCHEMAS_FILE = CONTRACT_DIR / "tag-schemas.json"

class TagValidator:
    def __init__(self):
        with open(SCHEMAS_FILE) as f:
            self.schemas = json.load(f)
        self.violations = []
        self.events = []

    def _log(self, event, data):
        self.events.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "event": event,
            "data": data
        })

    def validate_file(self, filepath):
        path = Path(filepath)
        if not path.exists():
            return {"valid": False, "error": "File not found"}

        content = path.read_text(encoding="utf-8")
        tags = set(re.findall(r"#([a-zA-Z0-9-]+)", content))

        self._log("file_scanned", {"file": str(path), "tags": list(tags)})

        violations = []
        for tag in tags:
            for schema_name, schema in self.schemas.items():
                prohibited = schema.get("rules", {}).get("prohibited_patterns", [])
                if tag in prohibited:
                    violations.append({
                        "tag": tag,
                        "schema": schema_name,
                        "reason": "Prohibited pattern",
                        "file": str(path)
                    })

        content_hash = hashlib.sha256(content.encode()).hexdigest()
        result = {
            "file": str(path),
            "tags_found": len(tags),
            "tags": list(tags),
            "violations": violations,
            "hash": content_hash,
            "valid": len(violations) == 0
        }
        self._log("file_validated", result)
        return result

    def validate_project(self, target):
        target_path = Path(target)
        results = []
        all_tags = set()
        all_violations = []

        if target_path.is_file():
            files = [target_path]
        else:
            files = list(target_path.rglob("*.md")) + list(target_path.rglob("*.ts"))
            files = [f for f in files if ".hermes" not in str(f)]
            files = files[:100]

        for f in files:
            result = self.validate_file(str(f))
            results.append(result)
            all_tags.update(result["tags"])
            all_violations.extend(result["violations"])

        compliance = {
            "total_files": len(results),
            "total_tags": len(all_tags),
            "total_violations": len(all_violations),
            "5t_compliance": len(all_violations) == 0,
            "hash": hashlib.sha256(json.dumps(results, sort_keys=True).encode()).hexdigest()
        }
        self._log("project_validated", compliance)

        report_file = CONTRACT_DIR / "compliance-report.json"
        with open(report_file, "w") as f:
            json.dump({"compliance": compliance, "results": results, "events": self.events}, f, indent=2)

        print("Validation complete:")
        print("  Files:", compliance["total_files"])
        print("  Tags:", compliance["total_tags"])
        print("  Violations:", compliance["total_violations"])
        print("  5T Compliant:", compliance["5t_compliance"])
        print("  Hash:", compliance["hash"][:16] + "...")
        return compliance

if __name__ == "__main__":
    import sys
    validator = TagValidator()
    target = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    result = validator.validate_project(target)
    exit(0 if result["5t_compliance"] else 1)
