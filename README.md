# CORS Header Proxy (Cloudflare Workers)

這是一個基於 [Cloudflare Workers](https://workers.cloudflare.com/) 的 CORS 代理伺服器。它的主要功能是作為中間人，協助前端網頁存取不支援 CORS（跨來源資源共用）的第三方 API。

本專案原始碼來源自 Cloudflare 官方範例：[CORS Header Proxy](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)，並在安全性與參數設定上進行了強化。

## 運作原理

1. **接收請求**：代理伺服器接收帶有 `url` 查詢參數的 GET/POST/HEAD 請求。
2. **安全性驗證**：
   - **來源驗證 (Frontend Origin Check)**：強制檢查請求必須包含 `Origin` 標頭，且必須在 `ALLOWED_FRONTEND_ORIGINS` 白名單內。
   - **目標驗證 (Target URL Check)**：驗證目標網址的 Origin 是否在 `ALLOWED_TARGET_ORIGINS` 白名單內。
3. **標頭清洗 (Header Scrubbing)**：
   - **請求標頭**：僅轉發必要的標頭（如 `Content-Type`, `Accept`, `User-Agent`）至目標 API，移除 `Cookie` 等敏感資訊。
   - **回應標頭**：僅回傳安全的回應標頭（如 `Cache-Control`, `Content-Type`），移除目標 API 可能回傳的 `Set-Cookie`。
4. **注入 CORS 標頭**：在回傳結果中自動加入適當的 `Access-Control-Allow-Origin`，讓瀏覽器允許跨網域讀取。

## 如何使用

### 代理請求

將您想存取的 API 網址作為 `url` 參數傳遞：

```
https://proxy.sitcon.org/?url=https://api.target.com/data
```

### 測試頁面

直接存取代理伺服器的根目錄（不帶參數），會顯示一個內建的 HTML 測試頁面，供您確認代理功能是否正常。

## 設定與開發

### 白名單設定

在 `src/index.ts` 中，您可以修改以下兩個白名單：

- `ALLOWED_FRONTEND_ORIGINS`: 允許使用此代理服務的前端網域（例如 `https://sitcon.org`）。
- `ALLOWED_TARGET_ORIGINS`: 此代理服務允許抓取的目標 API 網域（例如 `https://anchor.fm`）。

### 開發與部署

1. **安裝相依套件**：
   ```bash
   npm install
   ```

2. **本地開發**：
   ```bash
   npm run dev
   ```

3. **部署至 Cloudflare**：
   ```bash
   npm run deploy
   ```

## 授權與來源 (License and Attribution)

本專案採用 [MIT License](LICENSE)。

部分程式碼源自 Cloudflare, Inc. 提供之官方範例，其同樣採用 MIT 授權：
- **原始來源**: [Cloudflare Workers Examples - CORS Header Proxy](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)

