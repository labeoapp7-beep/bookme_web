import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ReportForm() {
  const [chaletName, setChaletName] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
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

    try {
      const finalChaletName = (!isReadOnlyName && location.trim() !== '') 
        ? `${chaletName} (${location})` 
        : chaletName;

      const { error } = await supabase
        .from('vac_reports')
        .insert({
          chalet_name: finalChaletName,
          reason,
          details
        });

      if (error) throw error;
      setStatus('success');
      setChaletName('');
      setReason('');
      setDetails('');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال البلاغ. حاول مرة أخرى.');
    }
  };

  if (status === 'success') {
    return (
      <div className="report-success">
        <h2 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>شكراً لتعاونك!</h2>
        <p className="text-body">تم استلام بلاغك بنجاح وسيقوم فريقنا بمراجعته واتخاذ الإجراء اللازم بأسرع وقت.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="btn-submit" 
          style={{ marginTop: '1.5rem', width: 'auto', padding: '0.5rem 1.5rem' }}
        >
          إرسال بلاغ آخر
        </button>
      </div>
    );
  }

  return (
    <div className="report-form-container">
      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="chaletName">اسم الشاليه أو الإعلان</label>
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
            <label htmlFor="location">المدينة والحي (مهم جداً لتحديد الشاليه)</label>
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
          <label htmlFor="reason">سبب البلاغ</label>
          <select 
            id="reason" 
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            <option value="">اختر السبب...</option>
            <option value="إعلان وهمي أو مضلل">إعلان وهمي أو مضلل</option>
            <option value="احتيال أو محاولة نصب">احتيال أو محاولة نصب</option>
            <option value="صور غير لائقة">صور غير لائقة</option>
            <option value="الرقم المعروض خاطئ أو لا يعمل">الرقم المعروض خاطئ أو لا يعمل</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="details">تفاصيل إضافية</label>
          <textarea 
            id="details" 
            rows={5} 
            required 
            placeholder="اكتب تفاصيل المخالفة هنا..."
            value={details}
            onChange={e => setDetails(e.target.value)}
          ></textarea>
        </div>

        {status === 'error' && (
          <div style={{ color: '#DC2626', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {errorMessage}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-submit"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'جاري الإرسال...' : 'إرسال البلاغ'}
        </button>
      </form>
      <style>{`
        .report-success {
          background: var(--color-background);
          padding: var(--space-xl);
          border-radius: var(--border-radius-md);
          border: 1px solid var(--color-border);
          text-align: center;
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
        }
        .form-group select,
        .form-group input,
        .form-group textarea {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          font-family: inherit;
          font-size: 1rem;
          outline: none;
          resize: vertical;
          background: white;
        }
        .form-group select:focus,
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: var(--color-primary);
        }
        .btn-submit {
          margin-top: var(--space-sm);
          background-color: var(--color-primary);
          color: white;
          padding: var(--space-md);
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
      `}</style>
    </div>
  );
}
