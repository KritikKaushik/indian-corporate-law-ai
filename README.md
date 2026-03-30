# Indian Corporate Law Dataset 🇮🇳⚖️

A structured raw dataset of major Indian Corporate Laws designed for AI-powered legal search, summarization, and analytics systems.

---

## 📌 Project Overview

This project focuses on extracting official Bare Act texts of Indian corporate legislations and converting them into machine-readable formats for Legal Tech applications.

The dataset serves as a foundational layer for building:

- AI Legal Summarizers
- Semantic Legal Search Engines
- Corporate Law Research Tools
- Legal Chatbots

---
## 🧠 AI Legal Assistant System

This project also includes an AI-powered legal assistant built using Retrieval-Augmented Generation (RAG).

### 🔹 Features
- Ask questions about Companies Act
- Retrieve relevant sections using FAISS
- Generate simplified explanations using LLM (Mistral via Ollama)

### 🔹 Architecture

User Query  
↓  
Vector Search (FAISS)  
↓  
Context Retrieval  
↓  
LLM (Mistral)  
↓  
Final Answer

## 📚 Covered Legislations

- Companies Act, 2013  
- Insolvency and Bankruptcy Code, 2016  
- Limited Liability Partnership Act, 2008  
- Competition Act, 2002  
- SEBI Act, 1992  

*(Currently starting with raw extraction. Structured parsing in progress.)*

---

## 🛠 Tech Stack

- Python 3
- pdfplumber
- JSON
- Git & GitHub

---

## 📂 Project Structure

corporate_law_dataset/
│
├── act.pdf
├── main.py
├── output/
│ └── raw_text.txt
├── data/
│ └── processed/
└── README.md


---

## 🚀 How to Run

1️⃣ Create Virtual Environment


2️⃣ Install Dependencies


3️⃣ Run Extraction Script


Extracted text will be saved inside the `output/` folder.

---

## 🎯 Future Improvements

- Section-wise parsing
- Chapter classification
- Amendment tracking
- Case law integration (NCLT, Supreme Court)
- Vector embeddings for semantic search
- MongoDB integration
- REST API for AI legal assistant

---

## ⚖️ Disclaimer

All legislative texts are sourced from official government portals such as India Code and the Ministry of Corporate Affairs. This project is intended for educational and research purposes only.

---

### 👨‍💻 Author

Kritik Kaushik  
AI Legal Dataset Initiative
