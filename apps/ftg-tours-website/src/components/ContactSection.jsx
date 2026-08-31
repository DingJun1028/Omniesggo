import { useState } from 'react';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <section id="contact" className="py-24 bg-ftg-sand">
        <div className="max-w-3xl mx-auto text-center px-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-ftg-forest mb-4">感謝您的洽詢</h2>
          <p className="text-gray-600">我們將在 1-2 個工作日內回覆您</p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 bg-ftg-sand">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-ftg-forest mb-8 text-center">聯絡我們</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="姓名"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-ftg-orange focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="電子郵件"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-ftg-orange focus:outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <input
            type="text"
            placeholder="公司名稱"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-ftg-orange focus:outline-none"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <textarea
            placeholder="您的需求與問題"
            rows={5}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-ftg-orange focus:outline-none"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button
            type="submit"
            className="w-full px-8 py-4 rounded-full font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg"
          >
            送出洽詢
          </button>
        </form>
      </div>
    </section>
  );
}
