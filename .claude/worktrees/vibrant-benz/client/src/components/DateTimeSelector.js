import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const DateTimeSelector = ({ date, time, onDateChange, onTimeChange, errors = {} }) => {
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);
  const { t } = useLanguage();

  // Generate dynamic dates
  const quickDates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const formatDay = (d) => d.getDate();
    const formatMonth = (d) => d.toLocaleDateString('ar-EG', { month: 'long' });

    return [
      {
        key: 'today',
        label: t('today') || 'اليوم',
        dayNum: formatDay(today),
        month: formatMonth(today),
        value: 'today',
      },
      {
        key: 'tomorrow',
        label: t('tomorrow') || 'غداً',
        dayNum: formatDay(tomorrow),
        month: formatMonth(tomorrow),
        value: 'tomorrow',
      },
      {
        key: 'other',
        label: 'تاريخ آخر',
        dayNum: null,
        month: null,
        value: 'other',
      },
    ];
  }, [t]);

  const timeSuggestions = ['06:00', '07:00', '08:00', '09:00', '10:00', '14:00', '16:00', '18:00'];

  // Check if date is selected (today, tomorrow, or a specific date)
  const isDateSelected = (optionValue) => {
    if (optionValue === 'other') {
      // "Other" is selected if date is neither today, tomorrow, nor empty
      return date && date !== 'today' && date !== 'tomorrow';
    }
    return date === optionValue;
  };

  // Handle clicking on "other" - show native date picker
  const handleOtherClick = () => {
    // Trigger native date picker by focusing on hidden input
    document.getElementById('hidden-date-picker')?.click();
  };

  // Get display date for the date input
  const getDisplayDate = () => {
    if (!date) return '';
    if (date === 'today') {
      return new Date().toISOString().split('T')[0];
    }
    if (date === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return date;
  };

  // Format time for display in 12-hour format
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        borderRadius: '2rem',
        padding: '28px 24px',
        border: '1px solid var(--border-light)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: '"Cairo", sans-serif',
              letterSpacing: '-0.2px',
            }}
          >
            📅 {t('date')} والوقت
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0,
              fontFamily: '"Cairo", sans-serif',
              fontWeight: '300',
            }}
          >
            اختر الموعد المناسب لرحلتك
          </p>
        </div>
      </div>

      {/* Quick Date Selection - Modern Card Style */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {quickDates.map((option) => {
          const isSelected = isDateSelected(option.value);

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                if (option.value === 'other') {
                  handleOtherClick();
                } else {
                  onDateChange(option.value);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 8px',
                borderRadius: '16px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'var(--surface-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.08)' : 'none',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  marginBottom: '4px',
                  fontFamily: '"Cairo", sans-serif',
                }}
              >
                {option.label}
              </span>
              {option.dayNum ? (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    fontFamily: '"Cairo", sans-serif',
                  }}
                >
                  {option.dayNum} {option.month}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '18px',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  ⋯
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden Date Input for "Other" option */}
      <input
        id="hidden-date-picker"
        type="date"
        value={getDisplayDate()}
        onChange={(e) => onDateChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
        }}
      />

      {/* Time Input */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
            marginRight: '4px',
            fontFamily: '"Cairo", sans-serif',
          }}
        >
          وقت الانطلاق
        </label>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: '18px', opacity: 0.4 }}>⏰</span>
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            style={{
              width: '100%',
              paddingRight: '46px',
              paddingLeft: '40px',
              paddingTop: '14px',
              paddingBottom: '14px',
              borderRadius: '14px',
              border: errors.time ? '1.5px solid var(--error)' : '1px solid var(--border-light)',
              fontSize: '14px',
              background: 'rgba(249, 250, 251, 0.5)',
              color: 'var(--text-primary)',
              fontFamily: '"Cairo", sans-serif',
              fontWeight: '400',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--surface-primary)';
              e.target.style.borderColor = 'var(--primary)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(249, 250, 251, 0.5)';
              e.target.style.borderColor = 'var(--border-light)';
            }}
          />
          <button
            type="button"
            onClick={() => setShowTimeSuggestions(!showTimeSuggestions)}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                opacity: 0.4,
                transform: showTimeSuggestions ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </span>
          </button>
        </div>
        {errors.time && (
          <p
            style={{
              color: 'var(--error)',
              fontSize: '12px',
              marginTop: '6px',
              marginRight: '4px',
            }}
          >
            {errors.time}
          </p>
        )}
      </div>

      {/* Time Suggestions - Modern Grid */}
      {showTimeSuggestions && (
        <div
          style={{
            background: 'var(--surface-primary)',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid var(--border-light)',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                fontFamily: '"Cairo", sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              {t('suggestedTimes') || 'أوقات مقترحة'}
            </label>
            <button
              type="button"
              onClick={() => setShowTimeSuggestions(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '2px 6px',
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}
          >
            {timeSuggestions.map((timeOption) => {
              const isSelected = time === timeOption;
              return (
                <button
                  key={timeOption}
                  type="button"
                  onClick={() => {
                    onTimeChange(timeOption);
                    setShowTimeSuggestions(false);
                  }}
                  style={{
                    padding: '10px 6px',
                    border: isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border-light)',
                    borderRadius: '10px',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--surface-secondary)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Cairo", sans-serif',
                  }}
                >
                  {timeOption}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Selection Display - Elegant Summary */}
      {(date || time) && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              fontFamily: '"Cairo", sans-serif',
              marginBottom: '4px',
            }}
          >
            📅{' '}
            {new Date(getDisplayDate()).toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {time && (
            <div
              style={{
                fontSize: '14px',
                color: 'var(--primary)',
                fontFamily: '"Cairo", sans-serif',
                fontWeight: '500',
              }}
            >
              ⏰ {formatTimeDisplay(time)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimeSelector;
