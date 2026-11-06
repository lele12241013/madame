# Amor nas Estrelas — Site Interativo Romântico

Um site interativo com tema **Céu Estrelado Noturno**, efeitos sonoros mágicos sintetizados, mini-jogo arcade de capturar corações caindo e um **Envelope 3D** que se abre revelando uma carta de amor com frase em destaque, constelação de motivos e contador de tempo juntos.

---

## Como personalizar com o nome dela e sua frase

Abra o arquivo [`config.js`](./config.js) em qualquer editor de texto (Bloco de Notas, VS Code ou direto pelo site do GitHub) e edite os campos:

- `nomeDela`: O nome ou apelido carinhoso dela.
- `seuNome`: O seu nome para a assinatura da carta.
- `fraseDestaque`: A frase principal que aparece com efeito de digitação quando a carta se abre.
- `paragrafosCarta`: Os parágrafos da sua carta.
- `dataInicioRelacionamento`: A data em que vocês começaram a namorar/ficar (ex: `"2024-06-12T00:00:00"`). Caso não queira exibir o contador, mude `mostrarContadorTempo` para `false`.
- `motivosQueTeAmo`: Os 5 motivos que aparecem quando ela clica nas estrelas embaixo da carta.

---

## Como colocar no GitHub Pages (Grátis e com link para mandar no WhatsApp)

1. Crie uma conta ou entre no [GitHub](https://github.com).
2. Clique no botão **"+"** no canto superior direito e escolha **New repository**.
3. Dê um nome bonito ao repositório (por exemplo: `para-meu-amor`), deixe marcado como **Public** e clique em **Create repository**.
4. Na página que abrir, clique em **uploading an existing file** e arraste os 4 arquivos desta pasta:
   - `index.html`
   - `config.js`
   - `styles.css`
   - `script.js`
5. Clique no botão verde **Commit changes**.
6. Vá na aba **Settings** (Configurações) do repositório -> no menu lateral esquerdo, clique em **Pages**.
7. Em **Branch**, selecione `main` (ou `master`) e clique em **Save**.
8. Aguarde cerca de 1 minuto e recarregue a página: o GitHub vai mostrar o link oficial do seu site (ex: `https://seu-usuario.github.io/para-meu-amor/`) prontinho para mandar para ela!
