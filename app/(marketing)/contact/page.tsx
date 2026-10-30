'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../_components/card-primitives';

const CONTACT_ITEMS = [
  { icon: Mail, title: '電子郵件', value: 'hello@esggo.co', href: 'mailto:hello@esggo.co' },
  { icon: Phone, title: '電話', value: '+886-2-7743-1006', href: 'tel:+886-2-7743-1006' },
  { icon: MapPin, title: '地址', value: '台北市中山區 台灣', href: null },
] as const;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    plan: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-1)] mb-2">訊息已送出</h2>
            <p className="text-[var(--text-2)] mb-6">
              感謝您的諮詢，我們的業務團隊將在 1-2 個工作天內與您聯繫。
            </p>
            <Button onClick={() => setSubmitted(false)} variant="primary">
              返回聯絡頁面
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-20">
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-1)] mb-6">
              聯絡我們
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-2)]">
              有任何問題或想了解更多？歡迎與我們聯繫，我們很樂意為您服務
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {CONTACT_ITEMS.map(({ icon: Icon, title, value, href }) => (
                <Card key={title}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[var(--accent-cool-soft)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-[var(--accent-cool)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-1)] mb-1">{title}</h3>
                        {href ? (
                          <a href={href} className="text-[var(--text-2)] hover:text-[var(--accent-cool)] transition-colors">
                            {value}
                          </a>
                        ) : (
                          <p className="text-[var(--text-2)]">{value}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>發送諮詢訊息</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                          姓名 *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                          電子郵件 *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                          公司名稱 *
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          required
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                          聯絡電話
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="plan" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                        感興趣的方案
                      </label>
                      <select
                        id="plan"
                        name="plan"
                        value={formData.plan}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                      >
                        <option value="">請選擇</option>
                        <option value="free">免費試用</option>
                        <option value="pro">專業版</option>
                        <option value="enterprise">企業版</option>
                        <option value="other">其他</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                        訊息內容 *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all resize-none"
                        placeholder="請簡述您的需求或問題..."
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto group"
                    >
                      {isSubmitting ? '送出中...' : '送出訊息'}
                      {!isSubmitting && <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
