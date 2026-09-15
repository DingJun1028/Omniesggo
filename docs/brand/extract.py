import zipfile
import xml.etree.ElementTree as ET

docx = r"C:\Users\dingj\AppData\Local\hermes\attachments\高科生技新官網完整設計與建置規格書_v1.0.docx"
z = zipfile.ZipFile(docx)
xml = z.read("word/document.xml")
root = ET.fromstring(xml)
ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
texts = []
for p in root.iter(f"{{{ns}}}p"):
    p_text = "".join(node.text for node in p.iter(f"{{{ns}}}t") if node.text)
    if p_text.strip():
        texts.append(p_text.strip())

out_file = r"C:\Project\esggo\docs\brand\htb-spec-extracted.txt"
with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(texts))

print(f"PARAGRAPHS_EXTRACTED: {len(texts)}")
