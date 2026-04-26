import re
import json


def extract_titles(input_path="output/raw_text.txt", output_path="output/section_titles.json"):
    """Extract section numbers and titles from raw text"""
    with open(input_path, "r", encoding="utf-8") as f:
        text = f.read() 

    # get only the SECTIONS index block
    start = text.find("SECTIONS")
    end = text.find("CHAPTER II")

    section_block = text[start:end]

    # extract section numbers and titles
    pattern = r"\n\s*(\d+)\.\s*(.+)"
    matches = re.findall(pattern, section_block)

    sections = []
    for number, title in matches:
        sections.append({
            "act_name": "Companies Act, 2013",
            "section_number": number,
            "section_title": title.strip()
        })
        

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sections, f, indent=4)

    print(f"✅ Section titles extracted: {len(sections)}")
    return sections


if __name__ == "__main__":
    extract_titles()
