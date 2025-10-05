# Auto-Config: Persistent LLM Preference Inference

A client-side JavaScript bot that infers and manages user preferences from large language model (LLM) interactions, reducing repetitive prompt engineering. Built for privacy and personalization.

## Overview

Auto-Config analyzes LLM responses to detect recurring patterns (e.g., TikZ diagrams, code styles) using token weighting (frequency + novelty). It proposes editable 
configuration templates via a simple UI, auto-augments future prompts, and operates locally to ensure data privacy. Ideal for individual users and extensible to 
organizational contexts with locked preferences.


## Features
- **Dynamic Preference Inference**: Weights tokens based on usage and rarity (e.g., \( w_t = \alpha f_t + (1-\alpha) N_t \), where \( \alpha = 0.7 \)).
- **Client-Side Processing**: Runs in the browser, storing configs in `localStorage`.
- **Interactive UI**: Edit and apply preferences via a table interface.
- **Decay Mechanism**: Adjusts weights over time (decay rate \( \lambda = 0.001 \)).
- **Cross-Modal Support**: Detects colors, diagrams, and code patterns.
- **Organizational Extension**: Supports uneditable org policies (e.g., sensitive data warnings).

## Installation

1. **Clone the Repository**:
   ```bash
   git clone [https://github.com/jay-busireddy/Auto-Config.git]
   cd auto-config
