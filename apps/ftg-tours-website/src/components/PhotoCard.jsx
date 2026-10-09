/**
 * PhotoCard — 防止孤兒句 (Orphan Lines)
 * - text-balance: 平衡文字換行, 防止單詞/單字孤立
 * - line-clamp-2: 標題最多 2 行
 * - line-clamp-3: 描述最多 3 行
 * - min-h-[120px]: 固定最小高度, 防止版面跳動
 * - flex-shrink-0: 防止 flex 容器壓縮
 */
export default function PhotoCard({ src, title, desc }) {
  return (
    <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 max-w-xs sm:max-w-sm flex-shrink-0 min-h-[120px]">
        <h3 className="text-lg font-semibold text-ftg-forest line-clamp-2 text-balance">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {desc}
        </p>
      </div>
    </div>
  );
}
