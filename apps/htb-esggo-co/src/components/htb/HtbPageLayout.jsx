import HtbNavbar from './HtbNavbar';

export default function HtbPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-htb-paper text-htb-charcoal">
      <HtbNavbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-[480px] px-4 py-5">
          <p className="text-sm font-bold">高科生技股份有限公司</p>
          <p className="text-xs text-gray-600 mt-1">CH4 and Carbon Credits Research Center</p>
          <p className="text-xs text-gray-600">官方聯絡窗口：htb8957@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}
