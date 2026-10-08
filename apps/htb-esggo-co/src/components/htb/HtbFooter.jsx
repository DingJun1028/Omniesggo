export default function HtbFooter() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-[480px] px-4 py-6 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} 高科生技股份有限公司</p>
        <p className="mt-1">海門冬 × 畜牧碳資產平台</p>
      </div>
    </footer>
  );
}
