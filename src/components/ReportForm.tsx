import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SUPPORT_EMAIL = 'help@zimamak.com';

export default function ReportForm() {
  const [chaletName, setChaletName] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isReadOnlyName, setIsReadOnlyName] = useState(false);

  useEffect(() => {
    // Read URL params to pre-fill the chalet name and location
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const city = params.get('city');
    const area = params.get('area');
    
    if (name) {
      const locationInfo = (city && area) ? ` (${city} - ${area})` : '';
      setChaletName(`${name}${locationInfo}`);
      setIsReadOnlyName(true); // Don't let user change it if they came from the card
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chaletName || !reason || !details) return;

    setStatus('loading');
    setErrorMessage('');

    const finalChaletName = (!isReadOnlyName && location.trim() !== '') 
      ? `${chaletName} (${location})` 
      : chaletName;

    try {
      // 1. Dispatch email directly to help@zimamak.com
      try {
        await fetch(`https://formsubmit.co/ajax/${SUPPORT_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `[بلاغ جديد] - ${finalChaletName}`,
            _template: 'table',
            "اسم الشاليه / الإعلان": finalChaletName,
            "سبب البلاغ": reason,
            "تفاصيل البلاغ": details,
            "وسيلة التواصل مع المبلّغ": reporterContact.trim() || 'لم يتم تحديدها',
            "تاريخ ووقت الإرسال": new Date().toLocaleString('ar-SA')
          })
        });
      } catch (emailErr) {
        console.warn('Email dispatch warning:', emailErr);
      }

      // 2. Insert into Supabase table vac_reports for database archiving
      try {
        await supabase
          .from('vac_reports')
          .insert({
            chalet_name: finalChaletName,
            reason,
            details
          });
      } catch (dbErr) {
        console.warn('Database insert warning:', dbErr);
      }

      setStatus('success');
      setChaletName('');
      setReason('');
      setDetails('');
      setReporterContact('');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال البلاغ. حاول مرة أخرى.');
    }
  };

  if (status === 'success') {
    return (
      <div className="report-success animate-fade-in">
        <div className="success-icon">✓</div>
        <h2 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>تم إرسال البلاغ بنجاح!</h2>
        <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
          شكراً لتعاونك في الحفاظ على جودة ومصداقية المنصة. تم إرسال البلاغ مباشرة إلى فريق المتابعة عبر البريد الإلكتروني (<strong>{SUPPORT_EMAIL}</strong>) وسنقوم بمراجعته فوراً.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStatus('idle')}
            className="btn-submit" 
            style={{ width: 'auto', padding: '0.6rem 1.5rem', marginTop: 0 }}
          >
            إرسال بلاغ آخر
          </button>
          <a 
            href={`mailto:${SUPPORT_EMAIL}?subject=متابعة بلاغ: ${encodeURIComponent(chaletName || 'شاغر اليوم')}`}
            className="btn-email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', textDecoration: 'none' }}
          >
            ✉️ مراسلة الدعم مباشرة
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="report-form-container">
      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="chaletName">اسم الشاليه أو الإعلان <span className="required-star">*</span></label>
          <input 
            type="text" 
            id="chaletName" 
            required 
            placeholder="مثال: شاليه السعادة القسم الأول"
            value={chaletName}
            onChange={e => setChaletName(e.target.value)}
            readOnly={isReadOnlyName}
            style={{ backgroundColor: isReadOnlyName ? '#f1f3f5' : 'white' }}
          />
        </div>

        {!isReadOnlyName && (
          <div className="form-group">
            <label htmlFor="location">المدينة والحي (مهم جداً لتحديد الشاليه) <span className="required-star">*</span></label>
            <input 
              type="text" 
              id="location" 
              placeholder="مثال: جدة - حي أبحر"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reason">سبب البلاغ <span className="required-star">*</span></label>
          <select 
            id="reason" 
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            <option value="">اختر السبب...</option>
            <option value="إعلان وهمي أو مضلل">إعلان وهمي أو مضلل</option>
            <option value="احتيال أو محاولة نصب">احتيال أو محاولة نصب</option>
            <option value="صور غير لائقة أو غير مطابقة">صور غير لائقة أو غير مطابقة</option>
            <option value="الرقم المعروض خاطئ أو لا يعمل">الرقم المعروض خاطئ أو لا يعمل</option>
            <option value="طلب مبالغ خارج المنصة بشكل مشبوه">طلب مبالغ خارج المنصة بشكل مشبوه</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="details">تفاصيل البلاغ والمخالفة <span className="required-star">*</span></label>
          <textarea 
            id="details" 
            rows={4} 
            required 
            placeholder="اكتب تفاصيل ما حدث بدقة لمساعدتنا على اتخاذ الإجراء السريع..."
            value={details}
            onChange={e => setDetails(e.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="reporterContact">
            بريدك الإلكتروني أو رقم هاتفك <span className="optional-tag">(اختياري - لمتابعة البلاغ معك)</span>
          </label>
          <input 
            type="text" 
            id="reporterContact" 
            placeholder="مثال: yourname@example.com أو 05XXXXXXXX"
            value={reporterContact}
            onChange={e => setReporterContact(e.target.value)}
          />
        </div>

        {status === 'error' && (
          <div className="error-box">
            {errorMessage}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-submit"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'جاري إرسال البلاغ إلى الدعم...' : 'إرسال البلاغ الآن'}
        </button>
      </form>

      <style>{`
        .required-star {
          color: #DC2626;
        }
        .optional-tag {
          font-size: 0.8rem;
          font-weight: normal;
          color: var(--color-text-muted);
        }
        .report-success {
          background: var(--color-background);
          padding: var(--space-xl);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--color-border);
          text-align: center;
        }
        .success-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--color-success-bg);
          color: var(--color-success-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 auto var(--space-md) auto;
        }
        .report-form-container {
          background: var(--color-background);
          padding: var(--space-lg);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--color-border);
        }
        .report-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        .form-group label {
          font-weight: 500;
          font-size: 0.95rem;
        }
        .form-group select,
        .form-group input,
        .form-group textarea {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group select:focus,
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .error-box {
          background-color: #FEE2E2;
          color: #DC2626;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius-sm);
          font-size: 0.9rem;
          border: 1px solid #FCA5A5;
        }
        .btn-submit {
          margin-top: var(--space-xs);
          background-color: var(--color-primary);
          color: white;
          padding: 0.75rem var(--space-md);
          border-radius: var(--border-radius-md);
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.2s;
          border: none;
          cursor: pointer;
        }
        .btn-submit:hover:not(:disabled) {
          background-color: var(--color-primary-hover);
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-email {
          background-color: white;
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          border-radius: var(--border-radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-email:hover {
          background-color: #EEF2FF;
        }
      `}</style>
    </div>
  );
}

