"""Pool Agent AI subsystem.

Three model tiers:
  - llama3.2 (Ollama)        : fast extraction, briefs, simple eval
  - deepseek-r1:8b (Ollama)   : reasoning chains, smart split, scam detection
  - claude-sonnet-4-5 (cloud) : nuanced narration & conflict mediation

Sanitizer rule: only Ollama gets raw RM amounts. Claude gets sanitized text.
"""
