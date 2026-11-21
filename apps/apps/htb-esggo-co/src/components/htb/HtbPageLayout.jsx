import HtbNavbar from './HtbNavbar';

export default function HtbPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-htb-paper text-htb-charcoal flex flex-col">
      <HtbNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
