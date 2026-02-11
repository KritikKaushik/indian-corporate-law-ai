import pdfplumber
import os

pdf_path = "act.pdf"

with pdfplumber.open(pdf_path) as pdf:
    text = ""
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

os.makedirs("output", exist_ok=True)

with open("output/raw_text.txt", "w") as f:
    f.write(text)

print("PDF extracted successfully ✅")
