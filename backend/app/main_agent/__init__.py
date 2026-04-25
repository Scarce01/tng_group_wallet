"""Main Agent — global conversational AI.

Entry point for users to do *anything* in the app via natural language.
Distinct from the Pool Agent, which is per-pool and observation-driven.

Wiring:
    routes/main_agent.py  POST /api/v1/agent/message    → conversation.handle
    routes/main_agent.py  GET  /api/v1/agent/conversation
    routes/main_agent.py  POST /api/v1/agent/action-confirm

Modules:
    prompt.py        — system prompt (live context injection)
    tool_registry.py — name → async callable mapping (32 implementable tools)
    conversation.py  — message handler + LLM + tool execution loop
"""
