import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { surveyAPI } from '../../services/api';
import { trackEvent } from '../../utils/analyticsTracker';

const SUS_ITEMS = [
  'أعتقد أنني سأستخدم هذا التطبيق بشكل متكرر',
  'وجدت التطبيق معقداً بشكل غير ضروري',
  'اعتقدت أن التطبيق سهل الاستخدام',
  'أعتقد أنني بحاجة لمساعدة تقنية لاستخدام هذا التطبيق',
  'وجدت أن الوظائف المختلفة في التطبيق متكاملة بشكل جيد',
  'اعتقدت أن هناك تناقضاً كبيراً في هذا التطبيق',
  'أتخيل أن معظم الناس سيتعلمون استخدام هذا التطبيق بسرعة',
  'وجدت التطبيق مرهقاً في الاستخدام',
  'شعرت بثقة كبيرة أثناء استخدام التطبيق',
  'احتجت لتعلم الكثير قبل أن أتمكن من البدء في استخدام هذا التطبيق',
];

const SATISFACTION_ITEMS = [
  'أنا راضٍ عن تجربة مشاركة الرحلات بشكل عام',
  'حققت مشاركة الرحلات وفراً في تكاليف التنقل',
  'وفرت مشاركة الرحلات وقتي',
  'كانت تجربة التواصل مع السائقين/الركاب إيجابية',
  'أشعر بأمان أكبر في التنقل من خلال التطبيق',
  'ساهمت مشاركة الرحلات في تقليل الضغط النفسي للتنقل',
];

const LIKERT_LABELS_AR = [
  'لا أوافق بشدة', 'لا أوافق', 'لا أوافق إلى حد ما',
  'محايد', 'أوافق إلى حد ما', 'أوافق', 'أوافق بشدة',
];

const LikertScale = ({ items, values, onChange, isDarkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {items.map((item, idx) => (
      <div
        key={idx}
        style={{
          background: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)',
          borderRadius: '12px',
          padding: '16px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <p style={{
          fontFamily: '"Cairo", sans-serif', fontSize: '14px',
          color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)',
          marginBottom: '12px', textAlign: 'right', lineHeight: '1.6',
        }}>
          {item}
        </p>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((val) => (
            <button
              type="button" key={val}
              onClick={() => onChange(idx, val)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: values[idx] === val ? '2px solid var(--color-primary, #34C759)' : isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                background: values[idx] === val ? 'var(--color-primary, #34C759)' : isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'white',
                color: values[idx] === val ? 'white' : isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                fontWeight: values[idx] === val ? '700' : '500', fontSize: '14px', cursor: 'pointer',
              }}
              title={LIKERT_LABELS_AR[val - 1]}
            >
              {val}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '6px',
          fontSize: '10px', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          fontFamily: '"Cairo", sans-serif',
        }}>
          <span>أوافق بشدة</span>
          <span>لا أوافق بشدة</span>
        </div>
      </div>
    ))}
  </div>
);

const PostSurvey = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Repeated measures
  const [dailyCost, setDailyCost] = useState('');
  const [commuteTime, setCommuteTime] = useState('');

  // Post-only scales
  const [satisfaction, setSatisfaction] = useState(Array(SATISFACTION_ITEMS.length).fill(0));
  const [susScores, setSusScores] = useState(Array(SUS_ITEMS.length).fill(0));
  const [npsScore, setNpsScore] = useState(null);
  const [willingnessToContinue, setWillingnessToContinue] = useState(0);
  const [openFeedback, setOpenFeedback] = useState('');

  // Repeated trust
  const TRUST_ITEMS = [
    'أثق بأن مستخدمي التطبيق صادقون',
    'أعتقد أن السائقين/الركاب سيلتزمون بالاتفاقيات',
    'أشعر بالأمان عند التعامل مع أشخاص لا أعرفهم عبر التطبيق',
    'أتوقع أن يتصرف الآخرون بشكل مسؤول أثناء الرحلة',
    'أعتقد أن نظام التقييم يساعد في تحديد المستخدمين الموثوقين',
    'أثق بأن معلوماتي الشخصية ستبقى محمية',
  ];
  const [interpersonalTrust, setInterpersonalTrust] = useState(Array(TRUST_ITEMS.length).fill(0));

  useEffect(() => {
    (async () => {
      try {
        const result = await surveyAPI.getStatus();
        if (result.postCompleted) setAlreadyCompleted(true);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (satisfaction.includes(0) || susScores.includes(0) || interpersonalTrust.includes(0) || npsScore === null || willingnessToContinue === 0) {
      setError('يرجى الإجابة على جميع الأسئلة');
      setLoading(false);
      return;
    }

    try {
      await surveyAPI.submit({
        surveyType: 'post',
        dailyCostIqd: parseInt(dailyCost),
        commuteTimeMinutes: parseInt(commuteTime),
        interpersonalTrust,
        satisfaction,
        npsScore,
        susScore: susScores,
        willingnessToContinue,
        openFeedback,
      });
      trackEvent('post_survey_completed', 'survey');
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'white',
    borderRadius: '20px', padding: '28px 20px',
    boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid rgba(52, 199, 89, 0.2)' : 'none',
    maxWidth: '600px', margin: '0 auto',
  };
  const titleStyle = { fontFamily: '"Cairo", sans-serif', fontSize: '22px', fontWeight: '700', color: isDarkMode ? 'white' : 'var(--text-primary)', textAlign: 'center', marginBottom: '8px' };
  const subtitleStyle = { fontFamily: '"Cairo", sans-serif', fontSize: '14px', color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6' };
  const btnStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--color-primary, #34C759)', color: 'white', fontFamily: '"Cairo", sans-serif', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '20px' };
  const backBtnStyle = { ...btnStyle, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: isDarkMode ? 'white' : 'var(--text-primary)' };
  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)', background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc', color: isDarkMode ? 'white' : 'var(--text-primary)', fontFamily: '"Cairo", sans-serif', fontSize: '15px', textAlign: 'right', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontFamily: '"Cairo", sans-serif', fontSize: '14px', fontWeight: '600', color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-primary)', marginBottom: '8px', display: 'block', textAlign: 'right' };

  if (alreadyCompleted) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: '100px', minHeight: '100vh' }}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>تم إكمال الاستبيان</h2>
          <p style={subtitleStyle}>شكراً لك! لقد أكملت استبيان ما بعد الدراسة بنجاح.</p>
          <button style={btnStyle} onClick={() => navigate('/home')}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const totalSteps = 4;
  const progressPercent = Math.min((step / totalSteps) * 100, 100);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: '100px', minHeight: '100vh' }}>
      {/* Progress */}
      <div style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--color-primary, #34C759)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: '600px', margin: '0 auto 16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontFamily: '"Cairo", sans-serif', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Step 0: Current commute (post) */}
      {step === 0 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>استبيان ما بعد الدراسة</h2>
          <p style={subtitleStyle}>كيف أصبح تنقلك بعد استخدام توصيلة؟</p>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>تكلفة التنقل اليومية الحالية (دينار عراقي)</label>
            <input type="number" style={inputStyle} value={dailyCost} onChange={(e) => setDailyCost(e.target.value)} placeholder="مثال: 3000" min="0" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>وقت التنقل الحالي (دقيقة، اتجاه واحد)</label>
            <input type="number" style={inputStyle} value={commuteTime} onChange={(e) => setCommuteTime(e.target.value)} placeholder="مثال: 20" min="1" />
          </div>
          <button style={btnStyle} onClick={() => { if (!dailyCost || !commuteTime) { setError('يرجى ملء جميع الحقول'); return; } setError(''); setStep(1); }}>التالي</button>
        </div>
      )}

      {/* Step 1: Satisfaction + Trust */}
      {step === 1 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>الرضا والثقة</h2>
          <LikertScale items={SATISFACTION_ITEMS} values={satisfaction} onChange={(idx, val) => { const u = [...satisfaction]; u[idx] = val; setSatisfaction(u); }} isDarkMode={isDarkMode} />
          <h2 style={{ ...titleStyle, marginTop: '32px' }}>الثقة بين الأشخاص (بعد التجربة)</h2>
          <LikertScale items={TRUST_ITEMS} values={interpersonalTrust} onChange={(idx, val) => { const u = [...interpersonalTrust]; u[idx] = val; setInterpersonalTrust(u); }} isDarkMode={isDarkMode} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={backBtnStyle} onClick={() => setStep(0)}>السابق</button>
            <button style={btnStyle} onClick={() => setStep(2)}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 2: SUS */}
      {step === 2 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>سهولة استخدام التطبيق (SUS)</h2>
          <p style={subtitleStyle}>قيّم تجربتك مع التطبيق</p>
          <LikertScale items={SUS_ITEMS} values={susScores} onChange={(idx, val) => { const u = [...susScores]; u[idx] = val; setSusScores(u); }} isDarkMode={isDarkMode} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={backBtnStyle} onClick={() => setStep(1)}>السابق</button>
            <button style={btnStyle} onClick={() => setStep(3)}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 3: NPS + Willingness + Open */}
      {step === 3 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>التوصية والاستمرار</h2>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>ما مدى احتمالية أن توصي بتوصيلة لصديق؟ (0-10)</label>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button type="button" key={val} onClick={() => setNpsScore(val)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    border: npsScore === val ? '2px solid var(--color-primary, #34C759)' : isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                    background: npsScore === val ? 'var(--color-primary, #34C759)' : isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'white',
                    color: npsScore === val ? 'white' : isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    fontWeight: npsScore === val ? '700' : '500', fontSize: '13px', cursor: 'pointer',
                  }}
                >{val}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>ما مدى رغبتك في الاستمرار باستخدام مشاركة الرحلات؟ (1-7)</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                <button type="button" key={val} onClick={() => setWillingnessToContinue(val)}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    border: willingnessToContinue === val ? '2px solid var(--color-primary, #34C759)' : isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                    background: willingnessToContinue === val ? 'var(--color-primary, #34C759)' : isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'white',
                    color: willingnessToContinue === val ? 'white' : isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    fontWeight: willingnessToContinue === val ? '700' : '500', fontSize: '14px', cursor: 'pointer',
                  }}
                >{val}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>ملاحظات أو اقتراحات (اختياري)</label>
            <textarea
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              value={openFeedback}
              onChange={(e) => setOpenFeedback(e.target.value)}
              placeholder="ما هي العوائق التي واجهتها؟ كيف يمكن تحسين الخدمة؟"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={backBtnStyle} onClick={() => setStep(2)}>السابق</button>
            <button style={btnStyle} onClick={handleSubmit} disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال الاستبيان'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Thank you */}
      {step === 4 && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h2 style={titleStyle}>شكراً لمشاركتك!</h2>
            <p style={subtitleStyle}>
              تم إرسال استبيان ما بعد الدراسة بنجاح.
              مساهمتك في هذا البحث ستساعد في تحسين خدمات النقل في العراق.
            </p>
            <button style={btnStyle} onClick={() => navigate('/home')}>العودة للرئيسية</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostSurvey;
