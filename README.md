# 🌈 Rafiki Assist

Rafiki Assist is a mobile assistive communication and caregiver support application designed to help children with autism and their caregivers. The app provides a **child-friendly text-to-speech (TTS)** interface and a **caregiver dashboard** featuring analytics, symbol management, and an AI-powered chatbot for emotional and practical support.

---

## 🧩 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Implementation Environment](#implementation-environment)
  - [Hardware Requirements](#hardware-requirements)
  - [Software Requirements](#software-requirements)
- [Modules and Components](#modules-and-components)
  - [Authentication & 2FA](#authentication--2fa)
  - [Landing Page / Role Selection](#landing-page--role-selection)
  - [Text-to-Speech (TTS) Module](#text-to-speech-tts-module)
  - [Caregiver Dashboard](#caregiver-dashboard)
  - [Chatbot (Rafiki Bot)](#chatbot-rafiki-bot)
  - [Profile & Settings](#profile--settings)
- [Dataset and Model Training](#dataset-and-model-training)
  - [Data Description](#data-description)
  - [Preprocessing & Encoding](#preprocessing--encoding)
  - [Training Process](#training-process)
  - [Evaluation Metrics](#evaluation-metrics)
- [Testing and Validation](#testing-and-validation)
- [Setup Instructions](#setup-instructions)
- [Future Work](#future-work)
- [License](#license)

---

## 🧠 Overview

**Rafiki Assist** bridges the communication gap between non-verbal autistic children and their caregivers through assistive technology.  
The app integrates:
- A **symbol-based Text-to-Speech module** for children,
- A **caregiver dashboard** for managing symbols and tracking usage,
- And an **AI-driven chatbot** fine-tuned to provide empathetic support and guidance to autism caregivers.

The system operates entirely online and currently supports **English** as the primary language.

---

## 🌟 Key Features

| Feature | Description |
|----------|-------------|
| 👩‍👦 **Role-based Access** | Separate interfaces for caregivers and children. |
| 🔊 **Customizable TTS Module** | Converts selected symbols to speech using `expo-speech`. Caregivers can upload **custom familiar symbols/images** to personalize communication. |
| 💬 **Rafiki Chatbot** | Offers autism caregiving advice using a fine-tuned language model trained on curated caregiver datasets. |
| 🧮 **Symbol Analytics** | Tracks and visualizes symbol usage to help caregivers understand communication trends. |
| 🔐 **Secure Login + 2FA** | Uses Firebase Authentication and optional Google Authenticator integration for two-factor security. |
| ⚙️ **Profile & Settings** | Centralized settings hub for appearance, accessibility, and account management. |
| 🌐 **Cross-Platform** | Built with **React Native (Expo)** for Android and iOS compatibility. |

---

## 🏗️ System Architecture

The app integrates the following core technologies:

- **Frontend:** React Native (Expo)
- **Backend & Database:** Firebase Firestore, Firebase Storage, Firebase Authentication
- **Model Hosting:** Hugging Face (Fine-tuned Phi-3-mini-4k-instruct)
- **Version Control:** Git + GitHub
- **Deployment:** Expo Go (Development) / EAS Build (Production)
- **Testing:** PyTest, Postman
- **Security:** Google Authenticator 2FA

---

## 💻 Implementation Environment

### 🔧 Hardware Requirements

| Hardware | Description / Justification |
|-----------|------------------------------|
| Smartphone (Android/iOS) | Required for deployment and use. |
| Processor | Quad-core 1.5GHz+ for smooth TTS and rendering. |
| RAM | Minimum 2GB (4GB recommended). |
| Storage | At least 200MB free for app + cached symbols. |
| Display | 5-inch+ screen for accessibility. |
| Speaker | Essential for audio output from TTS. |
| Internet | Stable 3G/4G or Wi-Fi connection for Firebase operations. |
| Development Machine | Windows 10+ or macOS 10.15+ with Node.js, Expo CLI, and VS Code. |

### 🧰 Software Requirements

| Component | Specification |
|------------|---------------|
| Mobile OS | Android, iOS |
| Language | JavaScript |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Authentication | Firebase Auth + Google Authenticator |
| TTS | Expo Speech API |
| Image Upload | Expo Image Picker |
| Hosting | Firebase Hosting |
| Version Control | Git + GitHub |

---

## ⚙️ Modules and Components

### 🔐 Authentication & 2FA
Users register via email and password. Optional **Google Authenticator** integration provides two-factor security through a time-based 6-digit verification code.

### 🧭 Landing Page / Role Selection
Upon login, users select their role:
- **Child:** Redirected to the TTS module.
- **Caregiver:** Access to dashboard and chatbot.

### 🔊 Text-to-Speech (TTS) Module
A child-friendly interface where children tap symbols to generate speech using Expo Speech.  
Caregivers can upload **custom images** familiar to the child, making Rafiki Assist’s TTS unique and personal.

### 📊 Caregiver Dashboard
Provides access to:
- **Symbol Analytics:** Displays top 5 most-used symbols weekly.
- **Symbol Manager:** Upload, update, or delete TTS symbols.
- **Chatbot:** Access to Rafiki Bot for caregiving support.

### 🤖 Chatbot (Rafiki Bot)
A fine-tuned conversational model trained to respond empathetically and contextually to caregiver queries.  
The chatbot’s dataset includes caregiver FAQs, autism guides, and real-life insights contributed by volunteer caregivers.

### ⚙️ Profile & Settings
A unified interface for:
- Profile editing & password updates  
- 2FA setup & security management  
- Dark Mode & High Contrast accessibility options  
- Quick navigation to analytics and symbol management

---

## 🧬 Dataset and Model Training

### 📁 Data Description
A custom dataset curated from caregiver guides, online forums, and contributions from consenting caregivers. Stored as JSONL under the Kaggle repository:  
[`ashleytizzu/rafikibot`](https://www.kaggle.com/datasets/ashleytizzu/rafikibot)

Each record:
```json
{"formatted": "### Question: ... ### Answer: ..."}
```
---

## 🧹 Preprocessing & Encoding
Data was parsed into “prompt” and “label” fields using a custom parse_formatted function. Tokenization was performed using AutoTokenizer from the Hugging Face Transformers library with the microsoft/phi-3-mini-4k-instruct model.

---

🧠 Training Process

- Base Model: microsoft/phi-3-mini-4k-instruct

- Fine-tuning Method: LoRA (Low-Rank Adaptation)

- Learning Rate: 2e-4

- Batch Size: 2

- Optimizer: AdamW

- Precision: FP16

- Epochs: 1

Both training and validation losses decreased consistently, indicating effective learning.

---

📈 Evaluation Metrics

Metric: Perplexity

Score: 1.78 (Lower is better)

Low perplexity indicated that the model effectively captured empathetic, context-aware caregiver communication.

---

🧪 Testing and Validation

Testing focused on:

✅ Functional tests for TTS, authentication, and chatbot response.

✅ Integration tests for Firebase data flow.

✅ UI/UX validation with sample caregivers.

✅ Performance validation on physical Android and iOS devices.

Testing Tools:

PyTest: Automated backend test scripts.

Postman: API endpoint validation.

Expo Go: Real-device frontend testing.

---

**1. Clone Repository**

```
git clone https://github.com/<your-username>/RafikiAssist.git
cd RafikiAssist
````
**2.Install Dependencies**

```
npm install
```
**3.Configure Firebase**

Create a Firebase project.

Add your app’s Firebase config to firebaseConfig.js.

**4.Run App in Development Mode**
```
npx expo start
```
**5.Build for Production**
```
eas build -p android
eas build -p ios
```
---
**6.🚀 Future Work**
✅ Offline support for TTS and symbol cache

🤖 AI-powered caregiver chatbot with real-time online resources

🌍 Multi-language support beyond English

🧠 Data analytics on TTS usage patterns

💾 Cloud backup for uploaded symbols and profiles





