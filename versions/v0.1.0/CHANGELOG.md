# Changelog — schematize-audit

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/). Versionamento semântico.

## [0.1.0] — 2026-08-15

Primeira versão da skill de **auditoria de histórico** da casa — a disciplina "todo checklist
criado foi mesmo sanado?", extraída da `schematize-engineering` (reference `auditoria.md` +
comando `/eng-audit`) pra rodar solta e agnóstica de linguagem.

### Adicionado
- **SKILL.md** com 7 pisos inegociáveis (enumeração exaustiva por contagem, "feito" exige prova,
  nenhum checklist órfão, gate que trava em órfão RED, órfão vira saneamento, a auditoria não
  fecha item, saída durável no archive) + mapa de references + relação com engineering/pentest.
- **references/**:
  - `auditoria.md` — a disciplina: as fontes de checklist (enumerar + CONTAR), classificação por
    item (feito/aberto/on-hold), cruzamentos que pegam o buraco, "fechou de verdade" (prova, não
    fé), definição operacional de **órfão RED** (5 espécies), saída/gate, quando rodar.
  - `metodologia.md` — plan-first, enumeração exaustiva por contagem, cruzamento com grep
    dirigido, **saída machine-readable (JSON)**, gate que trava em órfão RED, integração com
    CI/agendado, ciclo `auditar → sanear → reauditar`.
  - `evidencias.md` — o que conta como **prova** (por tipo de item), o oráculo "suspeita ≠
    achado", spot-check por risco, mecanismo do "volta a aberto", registro da evidência mínima.
  - `relatorio.md` — anatomia do relatório (sumário/veredito, cobertura A/A com inventário
    `F1..Fn`, órfãos por tipo com origem, checklist de saneamento, evidências) e onde gravar.
- **assets/commands/**: `/audit-help`, `/audit-plan`, `/audit-run` (a auditoria em si, o que era
  `/eng-audit`), `/audit-report`, `/audit-load`, `/audit-claude`, `/audit-cc`, `/audit-handoff`.
- **assets/CLAUDE.md** — regra sempre-on: nenhum checklist criado fica órfão; "feito" exige prova.
