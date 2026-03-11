import React, { useState } from 'react';
import styles from './CollapsibleSearchForm.module.css';
import SearchableCitySelect from '../UI/SearchableCitySelect';

/**
 * Collapsible Search Form Component for Mobile-Optimized Offers Page
 * Features:
 * - Collapsible/Expandable with smooth animation
 * - Mobile-first design (48px+ touch targets)
 * - 16px+ font size (prevents iOS auto-zoom)
 * - Accessible and WCAG compliant
 * - Searchable city dropdowns with Arabic support
 */
const CollapsibleSearchForm = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  allCities = [],
  currentUser = null,
  // isDriver = false, // Reserved for future use
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if current user is female
  const isFemale = currentUser?.gender === 'female';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFilterChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleSearchClick = () => {
    onSearch();
    // Auto-collapse after search on mobile
    if (window.innerWidth <= 768) {
      setIsExpanded(false);
    }
  };

  return (
    <div className={styles.searchFormContainer}>
      {/* Toggle Button - Always Visible */}
      <button
        type="button"
        onClick={handleToggle}
        className={styles.toggleButton}
        aria-expanded={isExpanded}
        aria-controls="search-form-content"
      >
        <span className={styles.toggleIcon}>🔍</span>
        <span className={styles.toggleText}>البحث السريع</span>
        <span className={styles.toggleArrow}>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Search Form - Collapsible */}
      <div
        id="search-form-content"
        className={`${styles.formContent} ${isExpanded ? styles.expanded : ''}`}
        aria-hidden={!isExpanded}
      >
        <div className={styles.formInner}>
          {/* Basic Filters */}
          <div className={styles.basicFilters}>
            {/* From City */}
            <div className={styles.formGroup}>
              <SearchableCitySelect
                value={filters.fromCity || ''}
                onChange={(value) => handleFilterChange('fromCity', value)}
                cities={allCities}
                label="من"
                placeholder="اختر مدينة المغادرة..."
                allOptionLabel="جميع المدن"
                id="from-city"
              />
            </div>

            {/* To City */}
            <div className={styles.formGroup}>
              <SearchableCitySelect
                value={filters.toCity || ''}
                onChange={(value) => handleFilterChange('toCity', value)}
                cities={allCities}
                label="إلى"
                placeholder="اختر مدينة الوصول..."
                allOptionLabel="جميع المدن"
                id="to-city"
              />
            </div>

            {/* Departure Date */}
            <div className={styles.formGroup}>
              <label htmlFor="departure-date" className={styles.label}>
                تاريخ المغادرة
              </label>
              <input
                type="date"
                id="departure-date"
                value={filters.departureDate || ''}
                onChange={(e) => handleFilterChange('departureDate', e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Sort By */}
            <div className={styles.formGroup}>
              <label htmlFor="sort-by" className={styles.label}>
                ترتيب حسب
              </label>
              <select
                id="sort-by"
                value={filters.sortBy || 'date'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className={styles.select}
              >
                <option value="date">التاريخ</option>
                <option value="price">السعر</option>
                <option value="rating">التقييم</option>
              </select>
            </div>

            {/* Ladies-Only Filter */}
            <div className={styles.formGroup}>
              <label
                htmlFor="ladies-only-filter"
                className={styles.checkboxLabel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isFemale ? 'pointer' : 'not-allowed',
                  opacity: isFemale ? 1 : 0.6,
                  padding: '12px',
                  background: filters.ladiesOnly
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : 'transparent',
                  borderRadius: '8px',
                  border: filters.ladiesOnly ? '1px solid #ec4899' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="checkbox"
                  id="ladies-only-filter"
                  checked={filters.ladiesOnly || false}
                  onChange={(e) => handleFilterChange('ladiesOnly', e.target.checked)}
                  disabled={!isFemale}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: isFemale ? 'pointer' : 'not-allowed',
                  }}
                />
                <span
                  style={{
                    color: filters.ladiesOnly ? '#ec4899' : 'inherit',
                    fontWeight: filters.ladiesOnly ? '600' : '500',
                    direction: 'rtl',
                  }}
                >
                  👩 رحلات للنساء فقط
                </span>
              </label>
              {!isFemale && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    display: 'block',
                    direction: 'rtl',
                  }}
                >
                  متاح للنساء فقط
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              onClick={handleSearchClick}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <span>🔍</span>
              <span>بحث</span>
            </button>

            <button
              type="button"
              onClick={onClearFilters}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              <span>🔄</span>
              <span>مسح الفلاتر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSearchForm;
