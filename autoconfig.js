class AutoConfigBot {
  constructor(embeddingModel) {
    this.history = [];          // token history
    this.config = JSON.parse(localStorage.getItem('autoConfig') || '{}');// preferences { key: {value, weight, embedding, lastSeen, type} }
    this.embeddingModel = embeddingModel || {}; // word → vector
    this.decayRate = 0.95;      // per interaction decay
    this.promotionThreshold = 2.0; // promote to long-term if weight > threshold
    this.demoteThreshold = 0.3;    // demote/remove if weight falls below
  }

  // --- Helpers ---
  saveLocal() {
	localStorage.setItem("autoConfig", JSON.stringify(this.config));
  }

  loadLocal() {
	const data = localStorage.getItem("autoConfig");
	if (data) {
	  this.config = JSON.parse(data);
	}
  }
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  cosineSimilarity(vecA, vecB) {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return (normA && normB) ? dot / (normA * normB) : 0.0;
  }

  getEmbedding(token) {
    return this.embeddingModel[token] || Array(50).fill(0); // fallback vector
  }

  computeWeights(tokens) {
    const freq = {};
    tokens.forEach(t => freq[t] = (freq[t] || 0) + 1);

    const novelty = {};
    for (let t in freq) {
      const occ = this.history.filter(h => h.includes(t)).length;
      novelty[t] = 1 / Math.log(occ + 2);
    }

    const alpha = 0.7;
    const weights = {};
    for (let t in freq) {
      weights[t] = alpha * (freq[t] / tokens.length) + (1 - alpha) * novelty[t];
    }
    return weights;
  }

  // --- Main ---
  processResponse(responseText) {
    const tokens = this.tokenize(responseText);
    this.history.push(tokens);

    const weights = this.computeWeights(tokens);

    // Apply decay to all existing prefs
    for (let key in this.config) {
      this.config[key].weight *= this.decayRate;
    }

    // Update or add tokens
    for (let t of tokens) {
      const embedding = this.getEmbedding(t);
      if (!this.config[t]) {
        this.config[t] = {
          value: t,
          weight: weights[t],
          embedding,
          lastSeen: Date.now(),
          type: "short-term"
        };
      } else {
        this.config[t].weight += weights[t];
        this.config[t].lastSeen = Date.now();
      }

      // Promote/demote
      if (this.config[t].weight >= this.promotionThreshold) {
        this.config[t].type = "long-term";
      } else if (this.config[t].weight < this.demoteThreshold) {
        delete this.config[t]; // forget it
      }
    }
	this.saveLocal();
  }

  getRelevantPreferences(promptText, threshold = 0.75) {
    const tokens = this.tokenize(promptText);
    const relevant = [];

    for (let [prefKey, pref] of Object.entries(this.config)) {
      for (let t of tokens) {
        const sim = this.cosineSimilarity(this.getEmbedding(t), pref.embedding);
        if (sim >= threshold) {
          relevant.push({ 
            key: prefKey, 
            value: pref.value, 
            weight: pref.weight, 
            sim,
            type: pref.type
          });
        }
      }
    }

    // Rank by (weight × similarity), prioritize long-term
    return relevant
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "long-term" ? -1 : 1;
        return (b.weight * b.sim) - (a.weight * a.sim);
      })
      .slice(0, 5);
  }

  augmentPrompt(promptText) {
    const prefs = this.getRelevantPreferences(promptText);
    if (prefs.length === 0) return promptText;

    const prefText = prefs.map(p => `${p.key}=${p.value}`).join(", ");
    return `${promptText}\n[Preferences: ${prefText}]`;
  }
}


// Example usage

const embeddings = {
  "box": [0.8, 0.1, 0.2],
  "rectangle": [0.79, 0.12, 0.18],
  "tikz": [0.5, 0.5, 0.1]
};

const bot = new AutoConfigBot(embeddings);
bot.processResponse("Draw a red box using TikZ");
bot.processResponse("Make a rectangle diagram");
bot.processResponse("Add a green box"); 

bot.loadLocal();

const userPrompt = "Create a box diagram";
const augmented = bot.augmentPrompt(userPrompt);

console.log("Augmented Prompt:", augmented);
