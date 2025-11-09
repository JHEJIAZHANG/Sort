#!/bin/bash

echo "🧹 開始清理緩存..."

# 刪除 Next.js 緩存
echo "📁 刪除 .next 目錄..."
rm -rf .next

# 刪除 node_modules 緩存
echo "📁 刪除 node_modules/.cache 目錄..."
rm -rf node_modules/.cache

# 刪除 TypeScript 緩存
echo "📁 刪除 tsconfig.tsbuildinfo..."
rm -f tsconfig.tsbuildinfo

echo "✅ 緩存清理完成！"
echo ""
echo "請執行以下命令重新啟動開發服務器："
echo "  npm run dev"
echo ""
echo "然後在瀏覽器中："
echo "  1. 打開開發者工具（F12）"
echo "  2. 右鍵點擊刷新按鈕"
echo "  3. 選擇「清除緩存並強制重新整理」"
