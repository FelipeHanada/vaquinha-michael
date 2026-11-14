# Vaquinha — Michael Eles Não Ligam pra Gente

Página estática de arrecadação de fundos para levar a equipe **Michael Eles Não Ligam pra Gente**
à **Competição Latino-Americana de Programação da ICPC**, publicada no GitHub Pages.

- Instagram: <https://www.instagram.com/progcompuff/>
- WhatsApp do PCUFF: <https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq>
- Contato Felipe (WhatsApp): WhatsApp do PCUFF — <https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq>

## A página

**Desktop:** duas colunas — à esquerda a meta, o progresso e o PIX; à direita as fotos,
espalhadas e sobrepostas como fotos jogadas no chão. Abaixo, em largura total, a lista de
doadores com paginação e os contatos.

**Mobile:** coluna única — progresso → PIX → fotos (duas colunas) → doadores → contato.

1. Barra de progresso com a meta de arrecadação.
2. Indicador do valor já arrecadado (e quanto falta).
3. Lista de doadores lida de um CSV, com paginação de 6 por página.
4. Fotos do time.
5. QR Code do PIX.
6. Código PIX copia-e-cola com botão de copiar.
7. Botões de contato ao lado da lista de doadores (Instagram, WhatsApp do PCUFF e contato do Felipe), com as URLs visíveis no rodapé.

Stack: HTML + Bootstrap 5 (CDN) + JavaScript puro. Sem build, sem back-end.

## Estrutura

```
index.html
css/style.css          # poucos ajustes sobre o Bootstrap
js/main.js             # lê o CSV, calcula o progresso, pagina a lista, copia o PIX
data/config.json       # meta, chave PIX, payload e links
data/doacoes.csv       # uma linha por doação — é o arquivo que você edita
assets/pix-qrcode.jpeg # QR Code do PIX
assets/fotos/          # fotos otimizadas usadas na página
fotos-originais/       # originais em alta resolução (fora do Git)
```

## Como atualizar as doações

O arquivo já vem com **um doador de exemplo** (`Doador Exemplo`, com `0,00`) só para
mostrar o layout. Apague essa linha e coloque as doações reais.

Abra `data/doacoes.csv` e acrescente uma linha. Depois faça commit e push.

```csv
data;nome;valor;mensagem
05/11/2026;Maria Silva;150,00;Vão com tudo!
05/11/2026;João Pereira;50,00;
04/11/2026;Anônimo;200,00;Orgulho de vocês
```

| Coluna | Formato |
|--------|---------|
| `data` | `DD/MM/AAAA` ou `AAAA-MM-DD` |
| `nome` | texto; use `Anônimo` ou deixe vazio para doação anônima |
| `valor` | `150,00`, `150.00` ou `150` (aceita `R$` e ponto de milhar) |
| `mensagem` | opcional |

- Separador `;` (padrão do Excel em português). A primeira linha é o cabeçalho.
- Campos com `;` dentro precisam estar entre aspas.
- Linhas em branco e linhas começando com `#` são ignoradas.
- Salve como UTF-8.

O total, o percentual, o valor restante e a lista são sempre calculados a partir do CSV —
não edite esses números na mão.

## Fotos

As imagens em `assets/fotos/` estão com no máximo 1400 px no maior lado e ~200–300 KB cada.
Ao adicionar uma foto nova, reduza antes de subir e mantenha proporções parecidas.

## Configuração

`data/config.json` só muda quando a meta, a chave PIX ou os links mudarem:

```json
{
  "meta": 30000,
  "pix": {
    "chave": "f904fb1f-0a9a-4cc9-9b17-9c9cd3ab7082",
    "titular": "Felipe Eizo Hanada — Niterói",
    "copiaECola": "00020126...63048FD4",
    "qrCode": "assets/pix-qrcode.jpeg"
  },
  "links": {
    "instagram": "https://www.instagram.com/progcompuff/",
    "whatsapp": "https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq",
    "contato": "https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq"
  }
}
```

`chave`, `copiaECola` e a imagem do QR Code precisam ser do **mesmo** PIX. Ao trocar um,
troque os três.

## Rodar localmente

A página usa `fetch()` para ler o CSV, então precisa de um servidor (abrir via `file://` não funciona):

```bash
python -m http.server 8000
# http://localhost:8000
```

## Publicar no GitHub Pages

1. **Settings → Pages**: *Source* `Deploy from a branch`, *Branch* `main`, pasta `/ (root)`.
2. Acessar `https://<usuario>.github.io/<repositorio>/`.

Os caminhos do projeto são relativos, então funciona em subdiretório.

## Pendências

- [ ] Confirmar a meta real em `data/config.json` (hoje: R$ 30.000,00).
- [ ] Substituir os dados de exemplo de `data/doacoes.csv` pelas doações reais.
- [ ] Converter `assets/og-image.svg` para JPG/PNG 1200×630 (WhatsApp não exibe SVG em preview).
- [ ] Fazer um PIX de R$ 0,01 para confirmar que o QR e o copia-e-cola funcionam.

> Só publique nome de doador com autorização. O CSV é público, então não coloque CPF,
> e-mail, telefone ou qualquer dado pessoal nele.
