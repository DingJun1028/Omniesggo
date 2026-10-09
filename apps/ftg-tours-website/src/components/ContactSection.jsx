/**
 * ContactSection.jsx — the shared enquiry form used at the bottom of pages.
 * 5T-Traceable: recovered from the production bundle,
 *   `function wr({ctaTitle,ctaSub,features})` at offset 347228. The earlier
 *   hand-written version of this file was a different component entirely: it
 *   took no props, hard-coded Chinese strings and invented a 4-field form,
 *   which is why pages passing ctaTitle/ctaSub/features rendered no heading and
 *   no feature chips. The eight real fields, the select options, the brochure
 *   mailto link and the success panel below are all production's.
 */
import { useState } from 'react';
import { useLanguage } from '../i18n';
import { COMPANY } from '../data/siteData';

const EMPTY = {
  company: '',
  contact_name: '',
  email: '',
  phone: '',
  participants: '',
  activity_type: '',
  preferred_date: '',
  message: '',
};

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-ftg-green focus:border-ftg-green outline-none transition text-base';

export default function ContactSection({ ctaTitle, ctaSub, features }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await (
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      ).json();
      if (res.ok) {
        setStatus('success');
        setForm(EMPTY);
      } else {
        setStatus('error');
        setError(res.error || t('contact.submitFailed'));
      }
    } catch {
      setStatus('error');
      setError(t('contact.networkError'));
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-ftg-sand rounded-3xl p-8 sm:p-10 md:p-14 text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-ftg-green/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-ftg-green"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-ftg-forest mb-3">
          {t('contact.successTitle')}
        </h3>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-md mx-auto">
          {t('contact.successMsg')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      <div className="bg-ftg-forest px-6 sm:px-10 py-8 sm:py-10 text-center">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
          {ctaTitle}
        </h3>
        {ctaSub && (
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {ctaSub}
          </p>
        )}
      </div>

      {features && features.length > 0 && (
        <div className="px-6 sm:px-10 pt-6 pb-2">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {features.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ftg-cream text-ftg-forest text-xs sm:text-sm font-medium"
              >
                <svg
                  className="w-3.5 h-3.5 text-ftg-green"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formCompany')}
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              placeholder={t('contact.formCompanyPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formContact')}
            </label>
            <input
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              required
              placeholder={t('contact.formContactPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formEmail')}
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder={t('contact.formEmailPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formPhone')}
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder={t('contact.formPhonePlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formParticipants')}
            </label>
            <input
              name="participants"
              value={form.participants}
              onChange={handleChange}
              placeholder={t('contact.formParticipantsPlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formActivityType')}
            </label>
            <select
              name="activity_type"
              value={form.activity_type}
              onChange={handleChange}
              required
              className={FIELD_CLASS}
            >
              <option value="">{t('contact.formSelectOption')}</option>
              <option value="corporate-travel">{t('products.corpTravel')}</option>
              <option value="family-day">{t('products.familyDay')}</option>
              <option value="esg-team-day">{t('products.esgTeamDay')}</option>
              <option value="wellbeing">{t('products.wellbeing')}</option>
              <option value="executive">{t('products.executive')}</option>
              <option value="impact-note">{t('products.impactNote')}</option>
              <option value="other">{t('contact.otherOption')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formDate')}
            </label>
            <input
              name="preferred_date"
              type="date"
              value={form.preferred_date}
              onChange={handleChange}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ftg-forest mb-2">
              {t('contact.formMessage')}
            </label>
            <input
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={t('contact.formMessagePlaceholder')}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex-1 bg-ftg-orange text-white px-8 py-3.5 rounded-full font-semibold text-sm md:text-base hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg shadow-orange-200"
          >
            {t(status === 'sending' ? 'contact.submitting' : 'contact.submitBtn')}
          </button>
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(t('contact.brochureSubject'))}`}
            className="flex-1 border-2 border-ftg-forest text-ftg-forest px-8 py-3.5 rounded-full font-semibold text-sm md:text-base hover:bg-ftg-forest hover:text-white transition-colors text-center"
          >
            {t('contact.requestBrochureBtn')}
          </a>
        </div>
      </form>
    </div>
  );
}
