# schematize-audit

> **Auditoria de histórico** da casa — a disciplina "todo checklist criado foi mesmo sanado?".
> Enumera e **CONTA** todas as fontes de checklist/promessa (overdev, Q.A., handoffs, planos,
> ADRs, perguntas parkeadas, premature-stops), prova que cada item foi **entregue e verificado**
> (não só marcado), acha os **órfãos RED**, reabre "feito" sem prova, gera o checklist de
> saneamento e **trava** o veredito enquanto sobrar um órfão.

Pacote de **skill normativa para [Claude Code](https://claude.com/claude-code)**.
Parte do catálogo **schematize skills**. Disciplina **agnóstica de linguagem** que pareia com a
`schematize-engineering` (a base: overdev/DoD/archive/índice) e com a `schematize-pentest` (o
oráculo do "feito de verdade": suspeita ≠ achado).

## Instalar

### Pelo app schematize (recomendado)

```bash
schematize install audit      # requer o CLI schematize instalado
```

### Última versão (a partir de um clone)

```bash
git clone https://github.com/schematizeme/skill-audit.git
cd skill-audit && ./install.sh            # instala no projeto atual
# ./install.sh /caminho/do/projeto          # ou aponte para outro projeto
```

Ou baixe o `.zip` da última release e descompacte em `.claude/skills/`:

```bash
curl -L -o skill-audit.zip \
  https://github.com/schematizeme/skill-audit/releases/latest/download/skill-audit.zip
unzip skill-audit.zip -d .claude/skills/
```

## O que tem dentro

- **SKILL.md** — o contrato: 7 pisos inegociáveis (enumeração exaustiva por contagem, "feito"
  exige prova, nenhum checklist órfão, gate que trava em órfão RED, órfão vira saneamento, a
  auditoria não fecha item, saída durável no archive) + mapa de references.
- **references/** — `auditoria` (a disciplina), `metodologia` (plan-first, contagem, JSON, gate,
  CI/agendado), `evidencias` (o que conta como prova + spot-check + reabertura), `relatorio`
  (anatomia + veredito + onde gravar).
- **assets/commands/** — `/audit-help`, `/audit-plan`, `/audit-run` (a auditoria em si),
  `/audit-report`, `/audit-load`, `/audit-claude`, `/audit-cc`, `/audit-handoff`.
- **assets/CLAUDE.md** — regra sempre-on: nenhum checklist criado fica órfão; "feito" exige prova.

## Regra de ouro

**Checklist criado é dívida até ser sanado.** O overdev garante que a *sessão viva* não para com
item aberto; a auditoria garante que *nenhum item aberto ficou órfão no histórico* — e que
"feito" quer dizer feito, **com prova**. Os órfãos viram um `/eng-overdev` de saneamento; ao fim,
**reaudite** — o órfão só morre quando a reauditoria não o vê mais.

## Relação com as outras skills

- **schematize-engineering** — a base. A auditoria consome o overdev (`CHECKLIST`/`OBJETIVO`/
  `premature-stops`/`PERGUNTAS`/`DECISOES`/`PLAN`), a **DoD (§35)**, o **archive (§28)** e o
  **índice/MAPA (§39)**; fecha o loop `scan → plan → refactor → overdev`.
- **schematize-pentest** — o oráculo do "feito de verdade": um `[x]` sem evidência é suspeito,
  não fato; só a prova o promove.

MIT.
