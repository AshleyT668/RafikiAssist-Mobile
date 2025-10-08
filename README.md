# 🌈 Rafiki Assist – A Mobile Application for Autistic Children and their Caregivers

## Empowering communication for every child.

Rafiki Assist is an assistive communication mobile application built using React Native (Expo).
It aims to support children with communication challenges—especially autistic and nonverbal children—by providing an accessible, friendly, and interactive platform. The app also empowers caregivers with tools to personalize communication and monitor interaction progress.

# 🧩 Key Features

## 👧 Child-Facing Module

Text-to-Speech (TTS) System: Enables children to express themselves by selecting words, phrases, or symbols that are converted into speech.

Autism-Friendly Design: Uses vibrant colors, large buttons, soft animations, and simple navigation for comfort and accessibility.

## 👩‍👧 Caregiver Module

Dashboard: Displays usage insights, child progress, and recent activity.

Chatbot Interface: Provides caregivers with interactive assistance, resources, and personalized suggestions.

Symbol Upload Interface: Allows caregivers to upload new images or symbols for communication customization.

## ⚙️ Settings & Personalization



## 🧠 Project Objective
The goal of Rafiki Assist is to:

Bridge communication gaps for nonverbal or speech-delayed children.

Support caregivers through interactive tools and progress feedback.

Promote inclusivity through technology and user-centered design.

## 🛠️ Tech Stack
Framework: React Native (Expo)

Language: JavaScript / TypeScript

UI Library: React Native Paper, Shadcn UI (custom components)

Navigation: React Navigation

Text-to-Speech: Expo Speech API

State Management: Context API / Redux (as applicable)

## 🤖 Chatbot Model Overview
The Rafiki Bot is the intelligent caregiver assistant within the Rafiki Assist ecosystem. It was developed and fine-tuned using transformer-based language modeling techniques to provide empathetic, informative, and context-aware responses to caregivers’ queries.

## 🧠 Model Architecture

Base Model: Microsoft Phi-3 Mini (4K Instruct)

Type: Causal Language Model (Decoder-only Transformer)

Parameter Size: ~3.8B

Optimization: 4-bit quantization (BitsAndBytes) for memory efficiency

Fine-Tuning Method: LoRA (Low-Rank Adaptation) via the peft library

Frameworks Used: Hugging Face Transformers, Datasets, PEFT, Accelerate, BitsAndBytes, TRL

This setup enables efficient training on limited hardware while maintaining strong language understanding and generation capabilities.

## 📊 Dataset Preparation
A custom instruction–response dataset was curated and uploaded to Kaggle under the dataset [ashleytizzu/rafikibot.]
The dataset consisted of structured caregiver queries and expected chatbot responses in a conversational format.
### Example
Question: How can I help my child communicate better at home?

Answer: Use short, clear sentences and consistent visual aids. Encourage expression through pictures or gestures before speech.

Each entry was reformatted into a prompt–label pair for fine-tuning using the following format:
### Question:
[User Input]
### Answer:
[Expected Response]

The dataset was split into 80% training and 20% validation sets for evaluation.

## ⚙️ Fine-Tuning Process
### 1.Model Loading:
The base model microsoft/phi-3-mini-4k-instruct was loaded with 4-bit quantization to optimize GPU memory usage.

### 2.LoRA Configuration:
Target layers for adaptation included:
["qkv_proj", "o_proj", "fc1", "fc2"]

with parameters:
r=16, lora_alpha=32, lora_dropout=0.05

### 3.Training Setup:

Batch Size: 2

Gradient Accumulation Steps: 4

Learning Rate: 2e-4

Epochs: 1

Optimizer: paged_adamw_32bit

Precision: FP16

### 4.Metrics:
The model’s performance was tracked using training loss, evaluation loss, and perplexity.
Visualization of loss curves was generated using Matplotlib.

## 🧪 Evaluation
After training, the model achieved low perplexity and stable loss convergence, indicating effective adaptation to the domain-specific caregiver communication dataset.
The resulting fine-tuned model (rafiki-phi3) was saved locally and used to generate responses through a text-generation pipeline.

## 💬 Deployment Integration

The fine-tuned chatbot is integrated into the Rafiki Assist caregiver interface, allowing real-time text-based interaction.
The model:

Handles caregiver queries empathetically and informatively.

Supports multi-turn conversation by maintaining short chat history context.

Can be extended with a backend API endpoint (e.g., Flask/FastAPI) for cloud-based deployment.

## 🔮 Future Improvements

Expand dataset with multilingual caregiver–child communication scenarios.

Optimize response latency for on-device inference using quantized deployment.

## ⚙️ Installation & Setup
### Prerequisites

Ensure you have:

Node.js (v18+)

Expo CLI installed

Android Studio or Expo Go app for testing

### Steps
#Clone the repository
git clone https://github.com/AshleyT668/RafikiAssist-Mobile.git

#Navigate into the project

cd RafikiAssist-Mobile

#Install dependencies

npm install

#Start the Expo development server

npx expo start
