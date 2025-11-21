#!/bin/bash

echo "🧹 強制清理並重新啟動前端"
echo "================================"

# 停止所有 node 進程
echo "1️⃣ 停止所有 Node 進程..."
pkill -f "next dev" || true
pkill -f "node" || true
sleep 2

# 刪除所有緩存
echo "2️⃣ 刪除所有緩存..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -f tsconfig.tsbuildinfo

# 重新安裝依賴（可選）
# echo "3️⃣ 重新安裝依賴..."
# npm install

echo "3️⃣ 重新啟動開發服務器..."
echo ""
echo "請執行: npm run dev"
echo ""
echo "然後在瀏覽器中："
echo "1. 完全關閉瀏覽器"
echo "2. 重新打開瀏覽器"
echo "3. 訪問教師頁面"
echo ""
echo "✅ 清理完成！"
