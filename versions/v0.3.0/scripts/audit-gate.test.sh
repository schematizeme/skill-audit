#!/usr/bin/env bash
# Vermelho primeiro do gate da auditoria. O caso que mais importa e o `veredito-que-mente`:
# relatorio que se declara saudavel com orfao na lista e PIOR que nenhum relatorio, porque ele
# autoriza o release.
# EXCEÇÃO DECLARADA de strict mode (`schematize-shell` -> `references/piso.md` secao 1):
# harness de teste roda sem `-e` de propósito — ele precisa continuar depois de um caso
# vermelho para reportar TODOS, em vez de parar no primeiro.
set -u
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
G="$AQUI/audit-gate.mjs"
BASE="$AQUI/../assets/templates/audit.exemplo.json"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ok=0; fail=0

muta() { local nome="$1" esp="$2" agulha="$3" prog="$4"
  local arq="$TMP/$nome.json"
  python3 -c "
import json
d=json.load(open('$BASE',encoding='utf8'))
$prog
json.dump(d,open('$arq','w',encoding='utf8'),ensure_ascii=False)" || { echo "  ✖ $nome: mutacao falhou"; fail=$((fail+1)); return; }
  local saida; saida="$(node "$G" "$arq" 2>&1)"; local rc=$?
  if [ "$rc" != "$esp" ]; then echo "  ✖ $nome: exit $rc, esperado $esp"; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  if [ -n "$agulha" ] && ! grep -qF -- "$agulha" <<<"$saida"; then echo "  ✖ $nome: exit certo, saida sem \"$agulha\""; sed 's/^/      /' <<<"$saida"; fail=$((fail+1)); return; fi
  echo "  ✔ $nome"; ok=$((ok+1)); }

# O exemplo distribuido e um relatorio REALISTA: reprova, porque tem um orfao vivo.
echo "== o exemplo reprova (e por isso ele e util como exemplo) =="
muta exemplo-reprova 1 "ORFAO RED (done_unproven)" "pass"

# Sanar o orfao (com desfecho) e zerar o contador -> verde. E a unica forma de ficar verde.
SANO="d['orphans_red'][0]['resolution']={'outcome':'sanado','date':'2026-08-21','why':'middleware + teste de rate-limit no commit a1b2c3d, gate roda hoje'}; d['verdict']={'healthy':True,'blocking_orphans':0}; d['totals']['done_unproven']=1"
echo "== verde de partida =="
muta sano 0 "historico sao" "$SANO"

echo "== o veredito que mente =="
muta veredito-mente 1 "o veredito mente" "d['verdict']={'healthy':True,'blocking_orphans':0}"
muta contagem-errada 1 "mas ha 1 orfao(s) sem desfecho" "d['verdict']={'healthy':False,'blocking_orphans':7}"

echo "== cobertura: 'nao achei' nao e 'nao ha' =="
muta cobertura-parcial 1 "auditoria parcial nao fecha o gate" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':False,'not_audited':['chats/2026-07.md','decisoes/']}"
muta cobertura-parcial-cega 1 "nao sabe o que nao viu" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':False}"
muta cobertura-mentirosa 1 "cobertura e medida, nao sentida" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':9,'complete':True}"
muta cobertura-zero 1 "ausencia de rastro" "$SANO; d['coverage']={'artifacts_found':0,'artifacts_audited':0,'complete':True,'not_audited':[]}"
muta auditados-demais 1 "auditados (30) > encontrados" "$SANO; d['coverage']={'artifacts_found':12,'artifacts_audited':30,'complete':True,'not_audited':[]}"

echo "== feito sem prova volta a aberto, COM NOME =="
muta unproven-sem-nome 1 "feito sem prova volta a ABERTO" "$SANO; d['totals']['done_unproven']=4"

echo "== sem waiver silencioso =="
muta waiver-sem-motivo 1 "nao zera orfao" "$SANO; d['orphans_red'][1]['resolution']={'outcome':'reclassificado','date':'2026-08-21','why':'ok'}"
muta desfecho-no-futuro 1 "datado no FUTURO" "$SANO; d['orphans_red'][1]['resolution']['date']='2027-01-01'"

echo "== schema =="
muta kind-inventado 2 "fora de" "d['orphans_red'][0]['kind']='mais_ou_menos'"
muta orfao-sem-origem 2 "string vazia" "d['orphans_red'][0]['source']=''"
muta sem-veredito 2 'campo obrigatorio "verdict" ausente' "del d['verdict']"
muta data-torta 2 "nao casa" "d['audit_date']='21/08/2026'"
muta campo-desconhecido 2 "campo desconhecido" "d['inventado']=1"
muta healthy-string 2 "esperado booleano" "d['verdict']['healthy']='sim'"

echo "== uso errado =="
node "$G" >/dev/null 2>&1; [ $? = 2 ] && { echo "  ✔ sem argumento -> exit 2"; ok=$((ok+1)); } || { echo "  ✖ sem argumento"; fail=$((fail+1)); }
printf '{"nao' > "$TMP/torto.json"
node "$G" "$TMP/torto.json" >/dev/null 2>&1; [ $? = 2 ] && { echo "  ✔ JSON invalido -> exit 2"; ok=$((ok+1)); } || { echo "  ✖ JSON invalido"; fail=$((fail+1)); }

echo; echo "audit-gate: $ok ok, $fail falha(s)"; [ "$fail" = 0 ]
