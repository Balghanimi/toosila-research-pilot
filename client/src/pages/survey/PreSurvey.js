import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { surveyAPI } from '../../services/api';
import { trackEvent } from '../../utils/analyticsTracker';

const LIKERT_LABELS_AR = [
  'لا أوافق بشدة',
  'لا أوافق',
  'لا أوافق إلى حد ما',
  'محايد',
  'أوافق إلى حد ما',
  'أوافق',
  'أوافق بشدة',
];

const COMMUTE_MODES = [
  { value: 'private_car', label: 'سيارة خاصة', labelEn: 'Private Car' },
  { value: 'taxi', label: 'تاكسي', labelEn: 'Taxi' },
  { value: 'minibus', label: 'ميني باص / كيا', labelEn: 'Minibus' },
  { value: 'walking', label: 'مشي', labelEn: 'Walking' },
  { value: 'motorcycle', label: 'دراجة نارية', labelEn: 'Motorcycle' },
  { value: 'other', label: 'أخرى', labelEn: 'Other' },
];

const WILLINGNESS_ITEMS = [
  'أنا مستعد لمشاركة رحلتي مع أشخاص من الجامعة',
  'أفضل المشاركة على القيادة بمفردي إذا كانت التكلفة أقل',
  'أثق بأن المشاركة آمنة مع زملاء الجامعة',
  'سأوصي أصدقائي بمشاركة الرحلات',
  'أنا مستعد لتعديل وقت مغادرتي لتتناسب مع شريك الرحلة',
];

const INTERPERSONAL_TRUST_ITEMS = [
  'أثق بأن مستخدمي التطبيق صادقون',
  'أعتقد أن السائقين/الركاب سيلتزمون بالاتفاقيات',
  'أشعر بالأمان عند التعامل مع أشخاص لا أعرفهم عبر التطبيق',
  'أتوقع أن يتصرف الآخرون بشكل مسؤول أثناء الرحلة',
  'أعتقد أن نظام التقييم يساعد في تحديد المستخدمين الموثوقين',
  'أثق بأن معلوماتي الشخصية ستبقى محمية',
];

const PLATFORM_TRUST_ITEMS = [
  'أثق بأن التطبيق سيعمل بشكل موثوق',
  'أعتقد أن بياناتي آمنة في التطبيق',
  'أثق بأن التطبيق سيحل المشكلات إذا حدثت',
  'أشعر بالراحة في استخدام التطبيق للمعاملات المالية',
  'أعتقد أن التطبيق يحمي خصوصيتي',
];

const GENDER_COMFORT_ITEMS = [
  'أشعر بالراحة في مشاركة الرحلة مع أشخاص من نفس الجنس',
  'أشعر بالراحة في مشاركة الرحلة مع أشخاص من الجنس الآخر',
  'وجود خيار "للنساء فقط" يزيد من ثقتي بالتطبيق',
  'أعتقد أن فصل الرحلات حسب الجنس ضروري في مجتمعنا',
];

const TECH_READINESS_ITEMS = [
  'أستخدم التكنولوجيا الحديثة بسهولة',
  'أحب تجربة التطبيقات الجديدة',
  'أشعر بالثقة عند استخدام تطبيقات الهاتف',
  'أفضل الحلول الرقمية على التقليدية',
  'أتعلم استخدام التطبيقات الجديدة بسرعة',
  'التكنولوجيا تجعل حياتي أسهل',
  'أثق بالدفع الإلكتروني',
  'أستخدم تطبيقات النقل (تاكسي أونلاين) بانتظام',
];

const LikertScale = ({ items, values, onChange, isDarkMode }) => {
  return (
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
          <p
            style={{
              fontFamily: '"Cairo", sans-serif',
              fontSize: '14px',
              color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)',
              marginBottom: '12px',
              textAlign: 'right',
              lineHeight: '1.6',
            }}
          >
            {item}
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => onChange(idx, val)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border:
                    values[idx] === val
                      ? '2px solid var(--color-primary, #34C759)'
                      : isDarkMode
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid rgba(0,0,0,0.15)',
                  background:
                    values[idx] === val
                      ? 'var(--color-primary, #34C759)'
                      : isDarkMode
                        ? 'rgba(30, 41, 59, 0.6)'
                        : 'white',
                  color: values[idx] === val ? 'white' : isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                  fontWeight: values[idx] === val ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={LIKERT_LABELS_AR[val - 1]}
              >
                {val}
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '10px',
              color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            <span>أوافق بشدة</span>
            <span>لا أوافق بشدة</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PreSurvey = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0: consent, 1: commute, 2-5: likert sections, 6: done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Form state
  const [commuteMode, setCommuteMode] = useState('');
  const [dailyCost, setDailyCost] = useState('');
  const [commuteTime, setCommuteTime] = useState('');
  const [commuteDays, setCommuteDays] = useState('');
  const [willingness, setWillingness] = useState(Array(WILLINGNESS_ITEMS.length).fill(0));
  const [interpersonalTrust, setInterpersonalTrust] = useState(Array(INTERPERSONAL_TRUST_ITEMS.length).fill(0));
  const [platformTrust, setPlatformTrust] = useState(Array(PLATFORM_TRUST_ITEMS.length).fill(0));
  const [genderComfort, setGenderComfort] = useState(Array(GENDER_COMFORT_ITEMS.length).fill(0));
  const [techReadiness, setTechReadiness] = useState(Array(TECH_READINESS_ITEMS.length).fill(0));

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const result = await surveyAPI.getStatus();
      if (result.preCompleted) {
        setAlreadyCompleted(true);
      }
    } catch {
      // Ignore — first time user
    }
  };

  const handleConsent = async () => {
    setLoading(true);
    try {
      await surveyAPI.giveConsent();
      trackEvent('consent_given', 'survey');
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validate likert scales are complete
    if (willingness.includes(0) || interpersonalTrust.includes(0) || platformTrust.includes(0) || genderComfort.includes(0) || techReadiness.includes(0)) {
      setError('يرجى الإجابة على جميع الأسئلة');
      setLoading(false);
      return;
    }

    try {
      await surveyAPI.submit({
        surveyType: 'pre',
        commuteMode,
        dailyCostIqd: parseInt(dailyCost),
        commuteTimeMinutes: parseInt(commuteTime),
        commuteDaysPerWeek: parseInt(commuteDays),
        willingnessToShare: willingness,
        interpersonalTrust,
        platformTrust,
        genderComfort,
        technologyReadiness: techReadiness,
      });

      trackEvent('pre_survey_completed', 'survey');
      setStep(6);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'white',
    borderRadius: '20px',
    padding: '28px 20px',
    boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid rgba(52, 199, 89, 0.2)' : 'none',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontFamily: '"Cairo", sans-serif',
    fontSize: '22px',
    fontWeight: '700',
    color: isDarkMode ? 'white' : 'var(--text-primary)',
    textAlign: 'center',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontFamily: '"Cairo", sans-serif',
    fontSize: '14px',
    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: '1.6',
  };

  const btnStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--color-primary, #34C759)',
    color: 'white',
    fontFamily: '"Cairo", sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginTop: '20px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
    background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
    color: isDarkMode ? 'white' : 'var(--text-primary)',
    fontFamily: '"Cairo", sans-serif',
    fontSize: '15px',
    textAlign: 'right',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    fontFamily: '"Cairo", sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-primary)',
    marginBottom: '8px',
    display: 'block',
    textAlign: 'right',
  };

  // Progress bar
  const totalSteps = 6;
  const progressPercent = Math.min((step / totalSteps) * 100, 100);

  if (alreadyCompleted) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: '100px', minHeight: '100vh' }}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>تم إكمال الاستبيان</h2>
          <p style={subtitleStyle}>شكراً لك! لقد أكملت استبيان ما قبل الدراسة بنجاح.</p>
          <button style={btnStyle} onClick={() => navigate('/home')}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: '100px',
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(to bottom, rgba(52, 199, 89, 0.08) 0%, transparent 50%)'
          : 'linear-gradient(to bottom, rgba(52, 199, 89, 0.03) 0%, transparent 50%)',
      }}
    >
      {/* Progress bar */}
      <div style={{ maxWidth: '600px', margin: '0 auto 20px', padding: '0 4px' }}>
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--color-primary, #34C759)',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p
          style={{
            fontFamily: '"Cairo", sans-serif',
            fontSize: '12px',
            color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            textAlign: 'center',
            marginTop: '6px',
          }}
        >
          {step} / {totalSteps}
        </p>
      </div>

      {error && (
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto 16px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontFamily: '"Cairo", sans-serif',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Step 0: Consent */}
      {step === 0 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>دراسة التنقل الذكي في الحرم الجامعي</h2>
          <p style={subtitleStyle}>
            يهدف هذا البحث إلى دراسة تبني مشاركة الرحلات في الجامعات العراقية.
            مشاركتك تساعدنا في تحسين خدمات النقل.
          </p>
          <div
            style={{
              background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.15)',
            }}
          >
            <p
              style={{
                fontFamily: '"Cairo", sans-serif',
                fontSize: '13px',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                textAlign: 'right',
                lineHeight: '1.8',
                margin: 0,
              }}
            >
              - مشاركتك طوعية ويمكنك الانسحاب في أي وقت
              <br />
              - بياناتك مجهولة الهوية وتُستخدم لأغراض البحث فقط
              <br />
              - لن يتم مشاركة معلوماتك الشخصية
              <br />
              - الاستبيان يستغرق حوالي 5-7 دقائق
            </p>
          </div>
          <button style={btnStyle} onClick={handleConsent} disabled={loading}>
            {loading ? 'جاري التسجيل...' : 'أوافق على المشاركة'}
          </button>
        </div>
      )}

      {/* Step 1: Commute Profile */}
      {step === 1 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>معلومات التنقل</h2>
          <p style={subtitleStyle}>أخبرنا عن تنقلك اليومي إلى الجامعة</p>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>وسيلة التنقل الرئيسية</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COMMUTE_MODES.map((mode) => (
                <button
                  type="button"
                  key={mode.value}
                  onClick={() => setCommuteMode(mode.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: commuteMode === mode.value
                      ? '2px solid var(--color-primary, #34C759)'
                      : isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
                    background: commuteMode === mode.value
                      ? 'rgba(52, 199, 89, 0.15)'
                      : isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                    color: commuteMode === mode.value
                      ? 'var(--color-primary, #34C759)'
                      : isDarkMode ? 'rgba(255,255,255,0.8)' : 'var(--text-primary)',
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: '13px',
                    fontWeight: commuteMode === mode.value ? '700' : '500',
                    cursor: 'pointer',
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>تكلفة التنقل اليومية (دينار عراقي)</label>
            <input
              type="number"
              style={inputStyle}
              value={dailyCost}
              onChange={(e) => setDailyCost(e.target.value)}
              placeholder="مثال: 5000"
              min="0"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>وقت التنقل (دقيقة، اتجاه واحد)</label>
            <input
              type="number"
              style={inputStyle}
              value={commuteTime}
              onChange={(e) => setCommuteTime(e.target.value)}
              placeholder="مثال: 30"
              min="1"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>عدد أيام التنقل أسبوعياً</label>
            <input
              type="number"
              style={inputStyle}
              value={commuteDays}
              onChange={(e) => setCommuteDays(e.target.value)}
              placeholder="مثال: 5"
              min="1"
              max="7"
            />
          </div>

          <button
            style={btnStyle}
            onClick={() => {
              if (!commuteMode || !dailyCost || !commuteTime || !commuteDays) {
                setError('يرجى ملء جميع الحقول');
                return;
              }
              setError('');
              setStep(2);
            }}
          >
            التالي
          </button>
        </div>
      )}

      {/* Step 2: Willingness to Share */}
      {step === 2 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>الاستعداد لمشاركة الرحلات</h2>
          <p style={subtitleStyle}>ما مدى موافقتك على العبارات التالية؟ (1 = لا أوافق بشدة، 7 = أوافق بشدة)</p>
          <LikertScale
            items={WILLINGNESS_ITEMS}
            values={willingness}
            onChange={(idx, val) => {
              const updated = [...willingness];
              updated[idx] = val;
              setWillingness(updated);
            }}
            isDarkMode={isDarkMode}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ ...btnStyle, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: isDarkMode ? 'white' : 'var(--text-primary)' }} onClick={() => setStep(1)}>السابق</button>
            <button style={btnStyle} onClick={() => setStep(3)}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 3: Trust */}
      {step === 3 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>الثقة بين الأشخاص</h2>
          <p style={subtitleStyle}>ما مدى موافقتك على العبارات التالية؟</p>
          <LikertScale
            items={INTERPERSONAL_TRUST_ITEMS}
            values={interpersonalTrust}
            onChange={(idx, val) => {
              const updated = [...interpersonalTrust];
              updated[idx] = val;
              setInterpersonalTrust(updated);
            }}
            isDarkMode={isDarkMode}
          />
          <h2 style={{ ...titleStyle, marginTop: '32px' }}>الثقة بالمنصة</h2>
          <LikertScale
            items={PLATFORM_TRUST_ITEMS}
            values={platformTrust}
            onChange={(idx, val) => {
              const updated = [...platformTrust];
              updated[idx] = val;
              setPlatformTrust(updated);
            }}
            isDarkMode={isDarkMode}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ ...btnStyle, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: isDarkMode ? 'white' : 'var(--text-primary)' }} onClick={() => setStep(2)}>السابق</button>
            <button style={btnStyle} onClick={() => setStep(4)}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 4: Gender Comfort */}
      {step === 4 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>الراحة حسب الجنس</h2>
          <p style={subtitleStyle}>ما مدى موافقتك على العبارات التالية؟</p>
          <LikertScale
            items={GENDER_COMFORT_ITEMS}
            values={genderComfort}
            onChange={(idx, val) => {
              const updated = [...genderComfort];
              updated[idx] = val;
              setGenderComfort(updated);
            }}
            isDarkMode={isDarkMode}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ ...btnStyle, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: isDarkMode ? 'white' : 'var(--text-primary)' }} onClick={() => setStep(3)}>السابق</button>
            <button style={btnStyle} onClick={() => setStep(5)}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 5: Technology Readiness */}
      {step === 5 && (
        <div style={cardStyle}>
          <h2 style={titleStyle}>الجاهزية التكنولوجية</h2>
          <p style={subtitleStyle}>ما مدى موافقتك على العبارات التالية؟</p>
          <LikertScale
            items={TECH_READINESS_ITEMS}
            values={techReadiness}
            onChange={(idx, val) => {
              const updated = [...techReadiness];
              updated[idx] = val;
              setTechReadiness(updated);
            }}
            isDarkMode={isDarkMode}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ ...btnStyle, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: isDarkMode ? 'white' : 'var(--text-primary)' }} onClick={() => setStep(4)}>السابق</button>
            <button style={btnStyle} onClick={handleSubmit} disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال الاستبيان'}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Thank you */}
      {step === 6 && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h2 style={titleStyle}>شكراً لك!</h2>
            <p style={subtitleStyle}>
              تم إرسال الاستبيان بنجاح. مشاركتك تساهم في تحسين خدمات النقل الجامعي في العراق.
            </p>
            <button style={btnStyle} onClick={() => navigate('/home')}>
              ابدأ استخدام التطبيق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreSurvey;
