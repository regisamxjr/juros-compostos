# Planinvest

Simulador financeiro simples para planejar investimentos, metas e conversão de moedas.

## O que faz

O app tem três ferramentas:

1. **Juros compostos** — calcula quanto o dinheiro rende ao longo do tempo, com valor inicial, aportes mensais, taxa e período.
2. **Meta** — mostra quanto você precisa investir por mês para atingir um objetivo e compara outras opções de aporte.
3. **Moedas** — converte valores entre moedas com cotações de referência da [Frankfurter API](https://www.frankfurter.app/).

> As taxas de câmbio são de referência e **não** são cotações financeiras em tempo real.

## Como rodar

```bash
npm run dev --prefix frontend
```

Abra: [http://127.0.0.1:5173](http://127.0.0.1:5173)

A API de câmbio (`/api/*`) roda localmente com as mesmas Netlify Functions.

## Deploy (Netlify)

Site: [planinvest.netlify.app](https://planinvest.netlify.app)

- Base directory: `frontend`
- Build: `npm run build`
- Publish: `dist`
- API: Netlify Functions (`/api/currencies`, `/api/rates`)

Push na branch `main` dispara o deploy automático.

## Estrutura

```
frontend/                     → interface em React + Vite
frontend/netlify/functions/   → API de câmbio (local e produção)
netlify.toml                  → config de build e publish
```
