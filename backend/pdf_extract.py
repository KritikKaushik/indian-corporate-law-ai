import pdfplumber
import os


def extract_pdf(pdf_path="act.pdf", output_path="output/raw_text.txt"):
    """Extract text from PDF and save to output file"""
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    os.makedirs("output", exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"✅ PDF extracted successfully → {len(text)} characters")
    return text


if __name__ == "__main__":
    extract_pdf()