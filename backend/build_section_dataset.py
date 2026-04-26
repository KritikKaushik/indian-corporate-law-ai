import json


def build_dataset(
    titles_path="output/section_titles.json",
    text_path="output/raw_text.txt",
    output_path="output/companies_act_dataset.json"
):
    """Build the full sections dataset from titles + raw text"""
    with open(titles_path, "r", encoding="utf-8") as f:
        section_titles = json.load(f)

    with open(text_path, "r", encoding="utf-8") as f:
        text = f.read()

    sections = []

    for i in range(len(section_titles)):
        number = str(section_titles[i]["section_number"])
        title = section_titles[i]["section_title"]

        start_pattern = f"{number}. {title}"
        start = text.find(start_pattern)

        if i < len(section_titles) - 1:
            next_number = str(section_titles[i + 1]["section_number"])
            next_title = section_titles[i + 1]["section_title"]
            end_pattern = f"{next_number}. {next_title}"
            end = text.find(end_pattern)
        else:
            end = len(text)

        content = text[start:end]

        # remove chapter headings
        if "CHAPTER" in content:
            content = content.split("CHAPTER")[0]

        content = content.strip()

        sections.append({
            "act_name": "Companies Act, 2013",
            "section_number": number,
            "section_title": title,
            "content": content
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(sections, f, indent=4)

    print(f"✅ Final dataset created → {len(sections)} sections")
    return sections


if __name__ == "__main__":
    build_dataset()