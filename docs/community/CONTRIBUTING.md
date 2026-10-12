# 社群 QA 與使用說明投稿規範

這個目錄收錄可在網站「QA 與說明」頁閱讀的靜態 Markdown。投稿內容幫助使用者理解系統與補足可重現的 QA 案例，但不會自動成為正式測試結果。

## 投稿前必讀

- 不要修改 `docs/test-plan.md`、`docs/test-results.md` 或 `docs/rubric-traceability.md`；它們是正式、受維護者控管的證據。
- 一個 PR 原則上只新增一份 Markdown 檔。請先認領對應 Issue，避免重複案例。
- 不可放入學號、電話、email、真實工廠資料、API key、照片或未授權截圖。
- 不可寫「已通過」或「正式驗證」等結論。投稿 QA 的初始狀態一律是 `proposed`，由維護者重現後再更新狀態。
- 必須以既有情境 EVT-001～EVT-005 與四個展示階段為對象；不要捏造系統沒有的功能。

## 新增 QA 案例

在 `docs/community/qa/` 新增一份唯一檔案，例如 `QA-003.md`：

```md
---
kind: qa
id: QA-003
title: EVT-004 的人工複判狀態需清楚顯示
scenario: EVT-004
stage: diagnosis
status: proposed
author: your-github-id
created: 2026-10-12
---

## 測試目的

確認使用者可分辨「疑似誤報」與「已確診異常」。

## 前置條件

1. 開啟內建情境 EVT-004。

## 操作步驟

1. 前往「AI 診斷」頁。
2. 查看人工狀態與復機建議。

## 預期結果

頁面須明確說明人工複判結果，不得把事件描述成已確診根因。

## 實際觀察

待維護者重現與審核後補充。
```

## 新增操作說明或 FAQ

- `docs/community/guides/`：操作步驟或概念說明，檔名如 `GUIDE-001.md`。
- `docs/community/faq/`：一問一答的常見問題，檔名如 `FAQ-001.md`。
- 必填 front matter：`kind`、`id`、`title`、`author`、`created`。
- 正文至少包含 `## 說明`；FAQ 可加上 `## 使用者下一步`。

## PR 檢查

提交前執行：

```bash
npm run validate:community
npm run build
```

維護者會檢查內容是否真實、可重現、無個資、無重複，並決定是否收錄或升級為正式測試項目。
