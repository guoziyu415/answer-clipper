---
name: answer-clipper
description: Open and use the AnyAnnotate workspace when the user wants to collect, annotate, organize, or export useful excerpts without extending the conversation for each edit.
---

# AnyAnnotate

Use `open_answer_clipper` when the user wants to view or manage their excerpt draft. The returned interactive workspace handles annotation, editing, ordering, deletion, and export directly; do not ask the user to repeat those edits in the chat.

Use `add_answer_clip` only when the user clearly identifies exact text to keep. Preserve that text as `quote`; do not paraphrase it. Include an annotation, tags, or source only when the user supplies them or their intent is unambiguous.

Do not call app-only `draft_*` tools yourself. They are reserved for direct widget interactions so buttons and fields do not cause new model turns.
