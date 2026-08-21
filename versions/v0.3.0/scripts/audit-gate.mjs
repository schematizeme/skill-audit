#!/usr/bin/env node
// schematize-audit — o VALIDADOR e o EXIT CODE. A skill prometia saida machine-readable e gate que
// trava, e entregava um exemplo em prosa: sem schema, sem validador, sem exit code (vistoria de
// 2026-08-21). Como e a skill que daria o veredito formal, a falta era estrutural.
//
// uso: audit-gate.mjs <audit.json> [--json]
//      0 = historico sao · 1 = REPROVA (orfao RED bloqueante) · 2 = documento invalido
//
// O que ele nao deixa passar, e que um exemplo em prosa nunca impediria:
//  · `verdict.healthy: true` com orfao bloqueante na lista (o veredito que mente);
//  · `blocking_orphans` que nao bate com a contagem real;
//  · lista de orfaos vazia com `coverage.complete: false` — "nao achei" nao e "nao ha";
//  · orfao "resolvido" sem desfecho explicito e datado (o waiver silencioso).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SCHEMA = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'schemas', 'audit-run.schema.json')

function valida(dado, esq, raiz, caminho = '$', erros = []) {
  if (esq.$ref) return valida(dado, esq.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], raiz), raiz, caminho, erros)
  if (esq.const !== undefined && dado !== esq.const) erros.push(`${caminho}: esperado ${JSON.stringify(esq.const)}`)
  if (esq.enum && !esq.enum.includes(dado)) erros.push(`${caminho}: "${dado}" fora de [${esq.enum.join('|')}]`)
  if (esq.type === 'string') {
    if (typeof dado !== 'string') { erros.push(`${caminho}: esperado string`); return erros }
    if (esq.minLength && dado.length < esq.minLength) erros.push(`${caminho}: string vazia`)
    if (esq.pattern && !new RegExp(esq.pattern).test(dado)) erros.push(`${caminho}: "${dado}" nao casa /${esq.pattern}/`)
  }
  if (esq.type === 'boolean' && typeof dado !== 'boolean') erros.push(`${caminho}: esperado booleano`)
  if (esq.type === 'integer') {
    if (!Number.isInteger(dado)) { erros.push(`${caminho}: esperado inteiro`); return erros }
    if (esq.minimum !== undefined && dado < esq.minimum) erros.push(`${caminho}: ${dado} < ${esq.minimum}`)
  }
  if (esq.type === 'array') {
    if (!Array.isArray(dado)) { erros.push(`${caminho}: esperado lista`); return erros }
    if (esq.items) dado.forEach((v, i) => valida(v, esq.items, raiz, `${caminho}[${i}]`, erros))
  }
  if (esq.type === 'object' || esq.properties) {
    if (dado === null || typeof dado !== 'object' || Array.isArray(dado)) { erros.push(`${caminho}: esperado objeto`); return erros }
    for (const req of esq.required || []) if (!(req in dado)) erros.push(`${caminho}: campo obrigatorio "${req}" ausente`)
    for (const [k, v] of Object.entries(dado)) {
      const sub = esq.properties?.[k]
      if (sub) valida(v, sub, raiz, `${caminho}.${k}`, erros)
      else if (esq.additionalProperties === false) erros.push(`${caminho}: campo desconhecido "${k}"`)
    }
  }
  return erros
}

function gate(a) {
  const falhas = [], avisos = []
  const bloqueantes = a.orphans_red.filter(o => !o.resolution)

  // 1. Coerencia do veredito. Um relatorio que se declara saudavel com orfao na lista e pior que
  //    nenhum relatorio: ele autoriza o release.
  if (a.verdict.healthy && bloqueantes.length > 0) {
    falhas.push(`verdict.healthy = true com ${bloqueantes.length} orfao(s) RED sem desfecho — o veredito mente`)
  }
  if (a.verdict.blocking_orphans !== bloqueantes.length) {
    falhas.push(`verdict.blocking_orphans = ${a.verdict.blocking_orphans}, mas ha ${bloqueantes.length} orfao(s) sem desfecho na lista`)
  }
  if (!a.verdict.healthy && bloqueantes.length === 0) {
    avisos.push('verdict.healthy = false sem orfao bloqueante — ou falta orfao na lista, ou o veredito esta desatualizado')
  }

  // 2. Cobertura: "nao achei" nao e "nao ha".
  const { artifacts_found: achados, artifacts_audited: auditados, complete, not_audited: naoAuditados = [] } = a.coverage
  if (auditados > achados) falhas.push(`coverage: auditados (${auditados}) > encontrados (${achados})`)
  if (complete && auditados < achados) falhas.push(`coverage.complete = true com ${achados - auditados} artefato(s) nao auditado(s) — cobertura e medida, nao sentida`)
  if (!complete) {
    falhas.push(`coverage.complete = false — auditoria parcial nao fecha o gate${naoAuditados.length ? ` (faltou: ${naoAuditados.slice(0, 5).join(', ')})` : '; e nem lista o que faltou'}`)
  }
  if (achados === 0) falhas.push('coverage: nenhum artefato encontrado — auditoria sem material nao e historico sao, e ausencia de rastro')
  if (!complete && naoAuditados.length === 0) falhas.push('coverage incompleta sem `not_audited` — auditoria que nao sabe o que nao viu')

  // 3. `done_unproven` e reabertura, nao anotacao: tem de aparecer na lista de orfaos.
  const naLista = a.orphans_red.filter(o => o.kind === 'done_unproven').length
  if (a.totals.done_unproven !== naLista) {
    falhas.push(`totals.done_unproven = ${a.totals.done_unproven}, mas ha ${naLista} orfao(s) done_unproven listado(s) — feito sem prova volta a ABERTO, com nome`)
  }

  // 4. Desfecho: sem waiver silencioso.
  for (const [i, o] of a.orphans_red.entries()) {
    if (o.resolution && o.resolution.outcome !== 'sanado' && !/\S{10,}/.test(o.resolution.why || '')) {
      falhas.push(`orphans_red[${i}] (${o.kind}): reclassificado sem motivo escrito — "ignorar por ora" nao zera orfao`)
    }
    if (o.resolution && o.resolution.date && a.audit_date && o.resolution.date > a.audit_date) {
      falhas.push(`orphans_red[${i}]: desfecho datado no FUTURO (${o.resolution.date} > ${a.audit_date})`)
    }
  }

  // 5. Orfao bloqueante = reprova. E o piso da skill.
  if (bloqueantes.length) {
    for (const o of bloqueantes.slice(0, 20)) falhas.push(`ORFAO RED (${o.kind}) em ${o.source}: "${o.item}" — falta: ${o.missing}`)
  }

  return { falhas, avisos, bloqueantes: bloqueantes.length }
}

const argv = process.argv.slice(2)
const arq = argv.find(x => !x.startsWith('--'))
if (!arq) { console.error('uso: audit-gate.mjs <audit.json> [--json]\n      0 = sao · 1 = REPROVA · 2 = documento invalido'); process.exit(2) }
let a, esquema
try { esquema = JSON.parse(readFileSync(SCHEMA, 'utf8')) } catch (e) { console.error(`schema ilegivel: ${e.message}`); process.exit(2) }
try { a = JSON.parse(readFileSync(arq, 'utf8')) } catch (e) { console.error(`✖ ${arq}: JSON invalido — ${e.message}`); process.exit(2) }
const erros = valida(a, esquema, esquema)
if (erros.length) {
  if (argv.includes('--json')) console.log(JSON.stringify({ veredito: 'invalido', erros }, null, 2))
  else { console.error(`✖ ${arq} nao casa com o schema (${erros.length}):`); erros.forEach(e => console.error(`  · ${e}`)) }
  process.exit(2)
}
const { falhas, avisos, bloqueantes } = gate(a)
if (argv.includes('--json')) {
  console.log(JSON.stringify({ veredito: falhas.length ? 'reprovado' : 'aprovado', bloqueantes, falhas, avisos }, null, 2))
} else {
  avisos.forEach(x => console.error(`  ! ${x}`))
  if (falhas.length) {
    console.error(`\n✖ AUDITORIA REPROVADA — ${falhas.length} bloqueio(s):`)
    falhas.forEach(f => console.error(`  · ${f}`))
    console.error('\nOrfao so sai da lista SANADO (fechado com prova) ou com desfecho explicito e datado.')
  } else {
    console.log(`✔ historico sao — 0 orfao RED bloqueante, cobertura completa (${a.coverage.artifacts_audited}/${a.coverage.artifacts_found}).`)
  }
}
process.exit(falhas.length ? 1 : 0)
