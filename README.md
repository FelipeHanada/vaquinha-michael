# Vaquinha — Michael Eles Não Ligam pra Gente

Página estática de arrecadação de fundos para levar a equipe **Michael Eles Não Ligam pra Gente**
à **Competição Latino-Americana de Programação da ICPC**, publicada no GitHub Pages.

- Instagram: <https://www.instagram.com/progcompuff/>
- WhatsApp do PCUFF: <https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq>

Equipe:

- Felipe Eizo Hanada — <https://www.linkedin.com/in/felipehanada/>
- Luiz Eduardo Miranda — <https://www.linkedin.com/in/luizeduram/>
- Rafael Rocha Damasceno — <https://www.linkedin.com/in/rafael-rd/>

Coaches:

- Luis Antonio Brasil Kowada — <https://www.ic.uff.br/blog/pessoas/luis-antonio-brasil-kowada/>
- Igor Machado Coelho — <https://www.ic.uff.br/blog/pessoas/igor-machado-coelho/>

## A página

**Desktop:** duas colunas — à esquerda a meta, o progresso, a contagem regressiva, o PIX e o convite do
PCUFF; à direita a galeria, com as fotos espalhadas e sobrepostas como fotos jogadas no chão. Abaixo,
em largura total, a lista de doadores com paginação e, ao lado dela, o ranking das maiores doações
acima dos contatos.

Enquanto a galeria rola, a coluna da esquerda acompanha a leitura: o bloco rola junto com a página
e, quando termina de entrar na tela, para com a base na base da janela — deixando o PIX e o convite
do PCUFF à vista — até que a coluna acabe, pouco antes da linha que separa a seção "Quem já apoiou".
Quem move o bloco é o `position: sticky` (no compositor, sem cálculo a cada quadro), então rolar
rápido não treme.

**Mobile:** coluna única — progresso → contagem regressiva → PIX → PCUFF → fotos (duas colunas) →
doadores → ranking → contato.

1. Barra de progresso com a meta de arrecadação.
2. Indicador do valor já arrecadado (e quanto falta).
3. Contagem regressiva para a competição, com dias, horas, minutos e segundos.
4. Lista de doadores lida de um CSV, com busca por nome (sem diferenciar maiúsculas nem acentos),
   seletor de ordenação (data, nome ou valor, em ordem crescente ou decrescente) e paginação de 6 por
   página, centralizada. Um aviso lembra que as doações entram manualmente (pode levar algumas horas
   até aparecerem).
5. Ranking das 10 maiores doações, acima dos contatos. Empates vão para quem doou antes (data mais
   antiga primeiro e, no mesmo dia, a ordem de registro no CSV), e a mesma pessoa pode aparecer mais
   de uma vez se doou mais de uma vez.
6. Galeria com as fotos do time, cada uma com legenda.
7. QR Code do PIX.
8. Código PIX copia-e-cola com botão de copiar.
9. Convite para o PCUFF (encontros às quintas, no laboratório 307).
10. Botões de contato ao lado da lista de doadores (Instagram e WhatsApp do PCUFF).
11. Rodapé com as logos do Instituto de Computação e da UFF, o LinkedIn de cada integrante e dos
    coaches, as URLs visíveis dos contatos e um aviso de que problemas na página podem ser
    reportados no WhatsApp do PCUFF.

Stack: HTML + Bootstrap 5 (CDN) + JavaScript puro em módulos ES. Sem build, sem back-end.

## Estrutura

```
index.html
css/style.css          # poucos ajustes sobre o Bootstrap
js/main.js             # monta a página: config, progresso, contagem, doadores, PIX e rolagem
js/doacoes.js          # lê o CSV, calcula os totais e o ranking (sem DOM)
js/contagem.js         # calcula a contagem regressiva da competição (sem DOM)
data/config.json       # meta, datas da competição, chave PIX, payload e links
data/doacoes.csv       # uma linha por doação — é o arquivo que você edita
assets/pix-qrcode.jpeg # QR Code do PIX
assets/logos/          # logos do Instituto de Computação (IC/UFF) e da UFF
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

As imagens em `assets/fotos/` estão com no máximo 1400 px no maior lado e ~170–300 KB cada.
Ao adicionar uma foto nova, reduza antes de subir e mantenha proporções parecidas.

Cada foto é uma `<figure>` com uma legenda curta em `<figcaption>`, e a ordem no HTML é
cronológica: **fase regional primeiro, fase nacional depois**.

## Logos

`assets/logos/ic-uff.png` e `assets/logos/uff.svg` são as logos oficiais, baixadas de
<https://www.ic.uff.br/> e <https://www.uff.br/>. Aparecem no rodapé com 44 px de altura.

## Configuração

`data/config.json` só muda quando a meta, as datas da competição, a chave PIX ou os links mudarem:

```json
{
  "meta": 30000,
  "competicao": {
    "inicio": "2027-07-13T00:00:00-03:00",
    "fim": "2027-07-17T23:59:59-03:00"
  },
  "pix": {
    "chave": "f904fb1f-0a9a-4cc9-9b17-9c9cd3ab7082",
    "titular": "Felipe Eizo Hanada (Niterói)",
    "copiaECola": "00020126...63048FD4",
    "qrCode": "assets/pix-qrcode.jpeg"
  },
  "links": {
    "instagram": "https://www.instagram.com/progcompuff/",
    "whatsapp": "https://chat.whatsapp.com/ID9LWRt21p2AANS2aA1Nsq"
  }
}
```

`chave`, `copiaECola` e a imagem do QR Code precisam ser do **mesmo** PIX. Ao trocar um,
troque os três.

As datas de `competicao` são ISO 8601 com fuso (`-03:00`, horário de Brasília). Enquanto o início não
chega, o cartão mostra dias, horas, minutos e segundos; no dia do início ele passa a avisar que a
competição está acontecendo, e depois do fim, que ela já aconteceu. Sem `inicio` válido o cartão não
aparece.

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
