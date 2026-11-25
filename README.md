# Planinvest

Simulador financeiro simples para planejar investimentos, metas e conversão de moedas.

## O que faz

O app tem três ferramentas:

1. **Juros compostos** — calcula quanto o dinheiro rende ao longo do tempo, com valor inicial, aportes mensais, taxa e período.
2. **Meta** — mostra quanto você precisa investir por mês para atingir um objetivo e compara outras opções de aporte.
3. **Moedas** — converte valores entre moedas com cotações de referência da [Frankfurter API](https://www.frankfurter.app/).

> As taxas de câmbio são de referência e **não** são cotações financeiras em tempo real.

## Como rodar

Na raiz do projeto:

```bash
# API de câmbio local (porta 3001)
npm run start:backend

# Frontend (porta 5173)
npm run dev:frontend
```

Depois abra: [http://127.0.0.1:5173](http://127.0.0.1:5173)

## Deploy (Netlify)

Site: [planinvest.netlify.app](https://planinvest.netlify.app)

- Base directory: `frontend`
- Build: `npm run build`
- Publish: `dist`
- API de câmbio em produção via Netlify Functions (`/api/currencies`, `/api/rates`)

Push na branch `main` dispara o deploy automático.

## Estrutura

```
backend/                      → API local (dev) com cache
frontend/                     → interface em React + Vite
frontend/netlify/functions/   → API em produção (Netlify)
netlify.toml                  → config de build e publish
```
