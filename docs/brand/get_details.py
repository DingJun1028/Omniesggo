lines = open(r"C:\Project\esggo\docs\brand\htb-spec-extracted.txt", encoding="utf-8").read().splitlines()

def find_section(title, length=30):
    for i, l in enumerate(lines):
        if title in l:
            print(f"=== {title} ===")
            for sub in lines[i:i+length]:
                print(sub)
            print("\n")
            break

find_section("1.3 本期非目標", 15)
find_section("2.4 用語規則", 25)
find_section("16.3 必須製作的資訊圖", 25)
find_section("16.5 不得使用生成圖", 20)
find_section("14.2 五層證據門檻", 25)
find_section("13.3 必備系統頁", 15)
