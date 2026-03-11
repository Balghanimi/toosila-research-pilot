import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { emergencyAPI } from '../services/api';
import './EmergencyContacts.css';

const EmergencyContacts = () => {
  const { user } = useAuth();
  const { t, isArabic } = useLanguage();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    email: '',
    notifyOnTripStart: false,
    notifyOnSos: true,
  });

  const MAX_CONTACTS = 5;

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await emergencyAPI.getContacts();
      setContacts(response.data?.contacts || []);
    } catch (err) {
      setError(err.message || (isArabic ? 'فشل في تحميل جهات الاتصال' : 'Failed to load contacts'));
    } finally {
      setLoading(false);
    }
  }, [user, isArabic]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      relationship: '',
      email: '',
      notifyOnTripStart: false,
      notifyOnSos: true,
    });
    setEditingContact(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (contact) => {
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      relationship: contact.relationship || '',
      email: contact.email || '',
      notifyOnTripStart: contact.notifyOnTripStart || false,
      notifyOnSos: contact.notifyOnSos !== false,
    });
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError(isArabic ? 'الاسم ورقم الهاتف مطلوبان' : 'Name and phone are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingContact) {
        await emergencyAPI.updateContact(editingContact.id, formData);
      } else {
        await emergencyAPI.addContact(formData);
      }

      setShowForm(false);
      resetForm();
      await fetchContacts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId) => {
    const confirmMsg = isArabic
      ? 'هل أنت متأكد من حذف جهة الاتصال هذه؟'
      : 'Are you sure you want to delete this contact?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setError(null);
      await emergencyAPI.deleteContact(contactId);
      await fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="emergency-contacts-page">
        <div className="ec-info">{isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please login first'}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="emergency-contacts-page">
        <div className="ec-loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="emergency-contacts-page">
      <h2>{isArabic ? 'جهات اتصال الطوارئ' : 'Emergency Contacts'}</h2>
      <p className="page-subtitle">
        {isArabic
          ? 'أضف جهات اتصال ليتم إبلاغها عند إرسال تنبيه طوارئ'
          : 'Add contacts to be notified when you send an SOS alert'}
      </p>

      {error && <div className="ec-error">{error}</div>}

      <div className="ec-info">
        {isArabic
          ? 'هذه الجهات سيتم إبلاغها تلقائياً عند الضغط على زر الطوارئ SOS أثناء الرحلة.'
          : 'These contacts will be automatically notified when you press the SOS button during a trip.'}
      </div>

      {contacts.length === 0 ? (
        <div className="ec-empty">
          <div className="ec-empty-icon">📱</div>
          <h3>{isArabic ? 'لا توجد جهات اتصال' : 'No contacts yet'}</h3>
          <p>
            {isArabic
              ? 'أضف جهة اتصال طوارئ واحدة على الأقل لسلامتك'
              : 'Add at least one emergency contact for your safety'}
          </p>
        </div>
      ) : (
        contacts.map((contact) => (
          <div key={contact.id} className="ec-card">
            <div className="ec-card-header">
              <div className="ec-card-info">
                <h3>{contact.name}</h3>
                {contact.relationship && (
                  <span className="ec-relationship">{contact.relationship}</span>
                )}
              </div>
              <div className="ec-card-actions">
                <button onClick={() => openEditForm(contact)} title={t('edit')}>
                  ✏️
                </button>
                <button
                  className="ec-delete-btn"
                  onClick={() => handleDelete(contact.id)}
                  title={isArabic ? 'حذف' : 'Delete'}
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="ec-card-details">
              <div className="ec-detail">
                <span className="ec-icon">📞</span>
                <span dir="ltr">{contact.phone}</span>
              </div>
              {contact.email && (
                <div className="ec-detail">
                  <span className="ec-icon">📧</span>
                  <span>{contact.email}</span>
                </div>
              )}
            </div>

            <div className="ec-toggles">
              <span className={`ec-toggle-chip ${contact.notifyOnSos ? 'active' : 'inactive'}`}>
                🚨 {isArabic ? 'إبلاغ عند SOS' : 'Notify on SOS'}
              </span>
              <span
                className={`ec-toggle-chip ${contact.notifyOnTripStart ? 'active' : 'inactive'}`}
              >
                🚗 {isArabic ? 'إبلاغ عند الرحلة' : 'Notify on trip'}
              </span>
            </div>
          </div>
        ))
      )}

      <div className="ec-limit">
        {contacts.length}/{MAX_CONTACTS} {isArabic ? 'جهات اتصال' : 'contacts'}
      </div>

      <button
        className="ec-add-btn"
        onClick={openAddForm}
        disabled={contacts.length >= MAX_CONTACTS}
      >
        {contacts.length >= MAX_CONTACTS
          ? isArabic
            ? 'الحد الأقصى 5 جهات اتصال'
            : 'Maximum 5 contacts reached'
          : isArabic
            ? '+ إضافة جهة اتصال طوارئ'
            : '+ Add Emergency Contact'}
      </button>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="ec-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingContact
                ? isArabic
                  ? 'تعديل جهة الاتصال'
                  : 'Edit Contact'
                : isArabic
                  ? 'إضافة جهة اتصال طوارئ'
                  : 'Add Emergency Contact'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="ec-form-group">
                <label>
                  {isArabic ? 'الاسم' : 'Name'} <span className="ec-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isArabic ? 'اسم جهة الاتصال' : 'Contact name'}
                  required
                />
              </div>

              <div className="ec-form-group">
                <label>
                  {isArabic ? 'رقم الهاتف' : 'Phone Number'} <span className="ec-required">*</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="07XXXXXXXXX"
                  required
                />
              </div>

              <div className="ec-form-group">
                <label>{isArabic ? 'صلة القرابة' : 'Relationship'}</label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder={isArabic ? 'مثال: أخ، أب، صديق' : 'e.g. Brother, Father, Friend'}
                />
              </div>

              <div className="ec-form-group">
                <label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="ec-toggle-row">
                <label>{isArabic ? 'إبلاغ عند تنبيه SOS' : 'Notify on SOS alert'}</label>
                <div className="ec-switch">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnSos}
                    onChange={(e) => setFormData({ ...formData, notifyOnSos: e.target.checked })}
                    id="notifyOnSos"
                  />
                  <label className="ec-slider" htmlFor="notifyOnSos" />
                </div>
              </div>

              <div className="ec-toggle-row">
                <label>{isArabic ? 'إبلاغ عند بدء الرحلة' : 'Notify on trip start'}</label>
                <div className="ec-switch">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnTripStart}
                    onChange={(e) =>
                      setFormData({ ...formData, notifyOnTripStart: e.target.checked })
                    }
                    id="notifyOnTrip"
                  />
                  <label className="ec-slider" htmlFor="notifyOnTrip" />
                </div>
              </div>

              <div className="ec-modal-actions">
                <button type="submit" className="ec-save-btn" disabled={saving}>
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : isArabic ? 'حفظ' : 'Save'}
                </button>
                <button
                  type="button"
                  className="ec-cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContacts;
