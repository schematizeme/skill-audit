---
name: schematize-audit
metadata:
  version: 0.1.0
description: Auditoria de histórico da casa — a disciplina que prova que TODO checklist criado no projeto foi mesmo SANADO, não só marcado. Enumera e CONTA exaustivamente todas as fontes de checklist/promessa (overdev CHECKLIST/OBJETIVO/premature-stops/PERGUNTAS parkeadas, Q.A. plan-first, handoffs de contexto FEITO-vs-ABERTO, planos do eng-plan, ADRs proposed, qualquer MD com `- [ ]`/`- [~]`/"EM ABERTO") do archive e do histórico git; classifica cada item (feito/aberto/on-hold); acha os **órfãos RED** — aberto que nunca fechou, on-hold cuja pergunta ninguém respondeu, ADR proposed que nunca virou accepted/rejected, e "feito" sem prova (checkbox sem teste/commit/arquivo/gate que passa hoje → VOLTA a aberto, mesma disciplina do red-first e do "suspeito ≠ achado" da schematize-pentest); mede cobertura A/A (artefatos auditados == existentes); gera um checklist de SANEAMENTO dos órfãos (candidato a /eng-overdev) e TRAVA o veredito enquanto sobrar um órfão RED. Saída machine-readable + relatório gravado em `<projeto>_archive/audit/`. Roda em fim de marco, retomada de projeto parado, periódico/agendado e depois de um scan grande. Use SEMPRE que for auditar, fechar loop, validar "está pronto?" no macro, retomar projeto parado, ou garantir que os achados de um scan/plano viraram itens fechados — mesmo sem citar "auditoria". Pareia com a schematize-engineering (a BASE: overdev, DoD §35, archive §28, índice §39) e com a schematize-pentest (o oráculo do "feito de verdade").
---

# Auditoria de histórico da casa (schematize-audit)

Disciplina normativa, **agnóstica de linguagem**, que responde a uma pergunta só: **todo
checklist criado neste projeto foi mesmo sanado?** A casa gera *muitos* checklists — overdev,
Q.A., handoffs de contexto, planos, ADRs, TASKs, perguntas parkeadas. Cada um é uma **promessa**.
Esta skill fecha o loop `scan → plan → refactor → overdev` provando que o prometido foi
**entregue e verificado**, não apenas marcado com um `[x]` na fé.

É a contraparte de **histórico** do overdev: o overdev garante que a **sessão viva** não para
com item aberto; a auditoria garante que **nenhum item aberto ficou órfão no rastro** — e que
"feito" quer dizer feito, **com prova**.

**Versão:** skill `schematize-audit` v0.1.0. Changelog em `CHANGELOG.md`.

## Comandos (Claude Code)

Digite `/audit-help` pra ver todos. Em resumo:

| Comando | O que faz |
|---|---|
| `/audit-help` | lista todos os comandos do schematize-audit |
| `/audit-plan` | plan-first: enumera as fontes, define escopo/cobertura-alvo, gera o plano de auditoria em MD e pede aprovação ANTES de varrer |
| `/audit-run` | a auditoria em si: enumera e CONTA as fontes, classifica cada item, cruza com a realidade, spot-check de prova, acha os órfãos RED, gera o checklist de saneamento e trava em órfão RED |
| `/audit-report` | consolida cobertura + órfãos + saneamento + veredito num relatório e grava em `<projeto>_archive/audit/<data>.md` |
| `/audit-load` | carrega à força TODO o corpo normativo (auditoria, metodologia, evidências, relatório) e passa a aplicá-lo |
| `/audit-claude` | cria ou mescla o `CLAUDE.md` sempre-on de auditoria na raiz do repo |
| `/audit-cc` | context compact: gera handoff no archive e roda `/compact` |
| `/audit-handoff` | gera o handoff (context.md + checklist.md) sem compactar |

Os comandos ficam em `assets/commands/` e são instalados em `.claude/commands/`.

## Como usar esta skill

1. **Plan-first sempre** (`/audit-plan`): antes de varrer, enumere as fontes e fixe a
   **cobertura-alvo** — quantos artefatos existem no archive + histórico git. Auditar sem
   contar é auditar incompleto. Leia `references/metodologia.md`.
2. **Rode a auditoria** (`/audit-run`, `references/auditoria.md`): classifique **cada item**
   de **cada** artefato, cruze com o código/testes/archive, e faça o **spot-check de prova**
   (`references/evidencias.md`) — o que é "feito" precisa se provar hoje.
3. **Consolide** (`/audit-report`, `references/relatorio.md`): cobertura A/A, órfãos por tipo
   com origem, checklist de saneamento e **veredito de gate**. Grava no archive.
4. **Não trabalhe de memória** — as fontes, os cruzamentos e o que conta como prova estão nos
   references. Aplique os pisos abaixo independentemente do reference carregado.

Mapa de references — leia o que casa com a tarefa:

| Tarefa | Reference |
|---|---|
| A disciplina: as fontes de checklist, classificação por item, cruzamentos que pegam o buraco, "fechou de verdade", saída/gate, quando rodar | `references/auditoria.md` |
| Como conduzir: enumerar exaustivo por contagem, plan-first, saída machine-readable (JSON), gate que trava em órfão RED, integração com CI/agendado | `references/metodologia.md` |
| O que conta como **prova** de que um item foi sanado (teste/commit/arquivo/gate que passa hoje), spot-check, registro da evidência mínima | `references/evidencias.md` |
| Anatomia do **relatório** de auditoria (cobertura A/A, órfãos por tipo com origem, checklist de saneamento, veredito) e onde gravar | `references/relatorio.md` |

## Pisos inegociáveis (vetam o atalho)

Independente do reference, estes limites nunca são cruzados:

1. **Enumeração exaustiva por CONTAGEM.** Toda fonte de checklist do archive **e** do histórico
   git entra na auditoria. A cobertura é `A` auditados / `A` existentes e **tem que bater**.
   Artefato de fora = auditoria incompleta, não "auditoria boa o suficiente".
2. **"Feito" exige prova — checkbox sem evidência é suspeito, não fato.** Um `- [x]` cujo
   teste/commit/arquivo não existe, ou cujo gate não passa hoje, **volta a aberto** no relatório.
   É a mesma guarda do red-first e do "suspeito ≠ achado" da `schematize-pentest`.
3. **Nenhum checklist criado fica órfão.** Item `- [ ]` que nunca fechou, `- [~]` on-hold cuja
   pergunta ninguém respondeu, pergunta parkeada pendente em `PERGUNTAS-OVERDEV.txt`, ADR
   `proposed` que nunca virou `accepted`/`rejected` → cada um é **órfão RED** e precisa de desfecho.
4. **O gate TRAVA em órfão RED.** Histórico são = **zero órfãos RED**. Qualquer aberto/hold/
   parkeado sem desfecho **não fecha** — é dívida rastreável, nunca "já era".
5. **Órfão vira saneamento.** Os órfãos RED viram um **novo checklist** (candidato a
   `/eng-overdev`): reabrir + resolver + verificar + reteste. Auditoria que aponta e não gera o
   conserto é meia-auditoria.
6. **A auditoria NÃO fecha item; ela verifica.** Marcar `[x]` durante a auditoria é proibido —
   quem fecha item é o run de saneamento, com prova. A auditoria é read-mostly sobre o histórico.
7. **Saída durável no archive.** Todo relatório mora em `<projeto>_archive/audit/<data>.md`
   (§28), nunca no root. Sem archive, a auditoria não aconteceu.

## Relação com as outras skills

- **schematize-engineering** — a **BASE**. A auditoria consome o que a engenharia produz: o
  **overdev** (`CHECKLIST.md`, `OBJETIVO.md`, `premature-stops.log`, `PERGUNTAS-OVERDEV.txt`,
  `DECISOES.md`/`PLAN.md`), a **DoD (§35)**, o **archive (§28)** e o **índice/MAPA (§39)**. Os
  órfãos RED viram um checklist de `/eng-overdev`; o loop que a auditoria fecha é o
  `scan (/eng-scan) → plan (/eng-plan) → refactor (/eng-refactor) → overdev (/eng-overdev)`.
  Esta skill extrai a disciplina de **auditoria de histórico** que nasceu ali, pra rodar solta.
- **schematize-pentest** — o **oráculo** do "feito de verdade". A auditoria empresta da pentest
  a disciplina de que **suspeita ≠ achado**: um `[x]` sem evidência é suspeito; só a prova
  (teste/commit/arquivo/gate que passa) o promove a fato. Mesma postura do red-first.
- **schematize-web / go / rust / elixir / c# / zig / ruby / node** — a auditoria é
  agnóstica: ela audita os checklists **de qualquer stack**; a prova de cada item roda no gate
  daquela linguagem (`/<slug>-review`, testes, lint).
