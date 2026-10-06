import json, collections

p = "data/omni-factory-kpis.json"
with open(p, encoding="utf-8") as f:
    d = json.load(f)

print("version:", d.get("version"))
print("lastUpdated:", d.get("lastUpdated"))
print("dataSource:", d.get("dataSource"))

mods = d.get("modules", [])
print("module count:", len(mods))
print("module ids:", [m.get("id") for m in mods])

kpis = [k for m in mods for k in m.get("kpis", [])]
print("KPI count:", len(kpis))

cnt = collections.Counter()
for k in kpis:
    cnt[k["name"]] += 1
print("KPI name distribution:", dict(cnt))

trend = collections.Counter(k.get("trend") for k in kpis)
print("trend distribution:", dict(trend))

print("sample modules:")
for m in mods[:2]:
    print(" -", m["id"], m["name"], m["array"], "kpis:", [(k["name"], k["value"], k["trend"]) for k in m["kpis"]])
