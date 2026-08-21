# Changelog — schematize-audit

Todas as mudanças relevantes deste pacote, no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
com versionamento [SemVer](https://semver.org/lang/pt-BR/).


## [0.3.0] — 2026-08-21
A skill que daria o **veredito formal** do catálogo prometia saída machine-readable e gate que trava, e entregava **exemplo em prosa**: sem schema, sem validador, sem exit code (vistoria de 2026-08-21). A falta era estrutural — sem exit code, o gate da casa dependia de alguém ler bonito.

### Adicionado
- **`assets/schemas/audit-run.schema.json`** — o formato do JSON da auditoria: cobertura (com `not_audited`), totais, as **5 espécies** de órfão RED com origem `arquivo:linha` obrigatória, e o `resolution` como **desfecho explícito, datado e com motivo**.
- **`scripts/audit-gate.mjs`** — o validador e o exit code (`0`/`1`/`2`). O ponto de projeto: ele **não acredita no campo `verdict.healthy`** — recalcula a partir da lista. Relatório que se declara saudável com órfão vivo é **pior que nenhum relatório**, porque autoriza o release; o gate chama isso pelo nome e reprova. Também reprova cobertura incompleta (e de novo quando `not_audited` está vazio — auditoria que não sabe o que não viu), `totals.done_unproven` que não bate com os órfãos listados (feito sem prova volta a aberto **com nome**, não como número no resumo), motivo de uma palavra e desfecho datado no futuro.
- **`scripts/audit-gate.test.sh`** — **20 casos**, 18 vermelhos, incluindo `veredito-mente`, `cobertura-parcial-cega` e `waiver-sem-motivo`.
- **`assets/templates/audit.exemplo.json`** — um relatório **realista**, que **reprova**: um exemplo verde ensinaria o formato e esconderia o uso.

### Mudado
- `references/metodologia.md` §4 e §5 e `/audit-run` §5 passam a apontar para o artefato, com o comando e os três exit codes.

## [0.2.0] — 2026-08-18

Acompanha a migração do layout operacional do projeto de `.overdev/` para
`.schematize/overdev/` (o motor Rust lê ambos, com fallback ao legado, e auto-migra no
`overdev start`).

### Alterado
- A auditoria passa a enumerar as fontes de checklist do overdev no **novo layout**
  `.schematize/overdev/` (`CHECKLIST.md`, `state.json`, `DECISOES.md`, `PLAN.md`) **E** no
  layout **legado** `.overdev/` — projetos antigos ainda têm `.overdev/`, então ambos contam
  como fonte a auditar. Atualizados `references/auditoria.md`, `references/metodologia.md`,
  `assets/commands/audit-plan.md`, `assets/commands/audit-run.md`.
- `PERGUNTAS-OVERDEV.txt` continua na **raiz do projeto** e o espelho durável segue em
  `<projeto>_archive/overdev/` — inalterados.

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
