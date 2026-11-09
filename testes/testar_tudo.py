# ============================================================================
# testes/testar_tudo.py — teste SIMPLES de cada parte, antes do deploy.
# Só usa o que já vem no Python (nada para instalar), exceto a parte 1 (usa o venv do analytics-python).
#
# Como usar (na pasta raiz do projeto):
#   python testes/testar_tudo.py                    -> testa o que estiver ligado (as partes desligadas aparecem como PULOU)
#   python testes/testar_tudo.py --gravar           -> também envia 2 linhas de teste e GRAVA no banco
#   python testes/testar_tudo.py --python http://localhost:8000 --back http://localhost:8080
# ============================================================================
import argparse, json, os, sys, urllib.request, urllib.error  # bibliotecas que já vêm com o Python

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # pasta raiz do projeto
ap = argparse.ArgumentParser()  # lê as opções da linha de comando
ap.add_argument("--python", default="http://localhost:8000")  # endereço da API Python
ap.add_argument("--back", default="http://localhost:8080")  # endereço do backend Spring
ap.add_argument("--email", default="admin@cti.local")  # e-mail do administrador (ADMIN_EMAIL)
ap.add_argument("--senha", default="Admin@12345")  # senha do administrador (ADMIN_PASSWORD)
ap.add_argument("--chave", default="")  # ETL_API_KEY, se você usa
ap.add_argument("--gravar", action="store_true")  # liga o teste que grava no banco
op = ap.parse_args()  # lê tudo

ok = falhou = pulou = 0  # contadores


def resultado(nome, passou, detalhe=""):  # escreve uma linha do relatório
    global ok, falhou
    if passou: ok += 1
    else: falhou += 1
    print(f"  [{'OK   ' if passou else 'FALHA'}] {nome} {detalhe}")  # OK ou FALHA


def pula(nome, motivo):  # escreve uma linha de teste que não pôde rodar
    global pulou
    pulou += 1
    print(f"  [PULOU] {nome} ({motivo})")


def chamar(metodo, url, corpo=None, token=None, chave=None):  # faz uma chamada HTTP e devolve (status, json)
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None  # corpo em JSON
    req = urllib.request.Request(url, data=dados, method=metodo)  # monta o pedido
    req.add_header("Content-Type", "application/json")  # avisa que é JSON
    if token: req.add_header("Authorization", "Bearer " + token)  # token do login
    if chave: req.add_header("X-ETL-Key", chave)  # chave do Python
    try:
        with urllib.request.urlopen(req, timeout=60) as r:  # envia e espera
            return r.status, json.loads(r.read().decode("utf-8") or "null")  # devolve status e JSON
    except urllib.error.HTTPError as e:  # servidor respondeu com erro (400, 401, 422...)
        try: return e.code, json.loads(e.read().decode("utf-8"))  # tenta ler o JSON do erro
        except Exception: return e.code, None
    except Exception:  # ninguém respondeu (serviço desligado)
        return None, None


AMOSTRA = json.load(open(os.path.join(RAIZ, "analytics-python", "amostras", "clientes.json"), encoding="utf-8"))  # 2 clientes de teste

# ---------------------------------------------------------------- 1) CIÊNCIA DE DADOS (sem precisar ligar nada)
print("\n1) Python: limpeza e cálculos (sem banco)")
sys.path.insert(0, os.path.join(RAIZ, "analytics-python"))  # deixa importar limpeza.py e analise.py
try:
    import pandas as pd  # pandas (instalado pelo requirements.txt)
    from limpeza import tratar  # limpeza.py
    from analise import calcular  # analise.py
    res = tratar(pd.DataFrame(AMOSTRA).astype(object))  # limpa as 2 linhas
    nomes = list(res.tratado["consultor"])  # consultores depois da limpeza
    resultado("consultores viram Título", nomes == ["Ana Souza", "Carlos Lima"], str(nomes))
    segs = list(res.tratado["segmento"])  # segmentos depois da limpeza
    resultado("segmentos padronizados", segs == ["Indústria", "Comércio"], str(segs))
    calc = calcular(res, len(AMOSTRA))  # faz as contas
    resultado("média = 1.135.000", round(calc["resumo"]["media"]) == 1135000, str(calc["resumo"]["media"]))
    resultado("mediana = 1.135.000", round(calc["resumo"]["mediana"]) == 1135000, str(calc["resumo"]["mediana"]))
except Exception as e:  # faltou instalar o requirements.txt?
    pula("limpeza e cálculos", f"{type(e).__name__}: {e} — ative o .venv e rode pip install -r requirements.txt")

# ---------------------------------------------------------------- 2) API PYTHON (precisa estar ligada)
print("\n2) API Python (uvicorn api:app --port 8000)")
st, js = chamar("GET", op.python + "/saude")  # a API está de pé?
if st is None: pula("GET /saude", "API Python desligada")
else:
    resultado("GET /saude responde ok", st == 200 and js.get("status") == "ok")
    st, js = chamar("POST", op.python + "/testar", AMOSTRA)  # teste sem banco
    resultado("POST /testar calcula sem gravar", st == 200 and "resumo" in (js or {}), f"status {st}")

# ---------------------------------------------------------------- 3) BACKEND (precisa estar ligado)
print("\n3) Backend Spring (mvn spring-boot:run)")
st, js = chamar("GET", op.back + "/api/health")  # o backend está de pé?
if st is None: pula("GET /api/health", "backend desligado")
else:
    resultado("GET /api/health responde 200", st == 200)
    st, js = chamar("POST", op.back + "/api/auth/login", {"email": op.email, "senha": op.senha})  # login do admin
    token = (js or {}).get("token") if st == 200 else None  # token JWT
    resultado("login do administrador devolve token", bool(token), f"status {st}")
    st, _ = chamar("POST", op.back + "/api/uploads/validadas", {"arquivoNome": "x.xlsx", "linhas": []})  # sem token
    resultado("upload sem token é recusado (401)", st in (401, 403), f"status {st}")
    if token:
        st, js = chamar("POST", op.back + "/api/uploads/validadas", {"arquivoNome": "vazio.xlsx", "linhas": []}, token)  # sem linhas
        resultado("upload sem linhas é recusado (400)", st == 400, f"status {st}")
        if not op.gravar:
            pula("upload de 2 linhas (grava no banco)", "use --gravar para testar")
        else:
            linhas = [  # 1 linha boa e 1 ruim (nível X não existe)
                {"numeroLinha": 2, "codigoCliente": "TESTE001", "nomeCliente": "Cliente Teste", "consultor": "ana souza", "segmento": "IND.",
                 "nivelCliente": "A", "faturamentoAnual": "1000.00", "servicosContratados": "Firewall", "dataContratacao": "2025-01-15", "cidade": "Campinas", "uf": "SP"},
                {"numeroLinha": 3, "codigoCliente": "TESTE002", "nomeCliente": "Cliente Ruim", "consultor": "ana souza", "segmento": "Comercio",
                 "nivelCliente": "X", "faturamentoAnual": "500.00", "servicosContratados": "Firewall", "dataContratacao": "2025-01-15", "cidade": "", "uf": ""},
            ]
            st, js = chamar("POST", op.back + "/api/uploads/validadas", {"arquivoNome": "teste.xlsx", "linhas": linhas}, token)  # envia
            js = js or {}
            resultado("upload de teste devolve 201", st == 201, f"status {st} {js.get('erro', '')}")
            resultado("1 linha válida e 1 rejeitada", js.get("linhasValidas") == 1 and js.get("linhasInvalidas") == 1, str({k: js.get(k) for k in ('linhasValidas', 'linhasInvalidas')}))
            resultado("a linha ruim voltou em 'rejeitadas'", len(js.get("rejeitadas", [])) == 1, str(js.get("rejeitadas")))

    # ---------------------------------------------------------------- 4) DASHBOARD (o Java LÊ do banco o que o Python gravou)
    print("\n4) Dashboard (GET /api/dashboard)")
    st, _ = chamar("GET", op.back + "/api/dashboard")  # sem token
    resultado("dashboard sem token é recusado (401)", st in (401, 403), f"status {st}")
    if token:
        st, js = chamar("GET", op.back + "/api/dashboard/lotes", token=token)  # lista de lotes gravados no banco
        resultado("GET /api/dashboard/lotes devolve uma lista", st == 200 and isinstance(js, list), f"status {st}")
        st, js = chamar("GET", op.back + "/api/dashboard", token=token)  # último lote processado + JSON das contas
        if st == 404:
            pula("GET /api/dashboard", "banco ainda sem planilha: envie a sample-data/dados.xlsx pelo site")
        else:
            est = (js or {}).get("estatisticas") or {}  # o JSON que o Python gravou na tabela estatistica_lote
            resultado("GET /api/dashboard devolve o lote", st == 200 and bool((js or {}).get("lote")), f"status {st}")
            resultado("estatisticas tem os dados dos gráficos", all(k in est for k in ("resumo", "porSegmento", "porNivel", "porConsultor")),
                      f"clientes={est.get('resumo', {}).get('totalClientes')}")

print(f"\nResumo: {ok} OK, {falhou} FALHA, {pulou} PULOU")  # resumo final
sys.exit(1 if falhou else 0)  # código de saída: 0 = tudo certo
