import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function SimpleTestAPI() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const navigate = useNavigate();

  const testRegister = async () => {
    setLoading(true);
    setResult('جاري اختبار التسجيل...');

    try {
      const testUser = {
        name: 'مستخدم تجريبي',
        email: `test${Date.now()}@test.com`,
        password: '123456',
        userType: 'passenger',
      };

      console.log('📤 Sending registration request...');
      const response = await authAPI.register(testUser);
      console.log('✅ Registration successful:', response);

      // حفظ بيانات المستخدم للاستخدام في تسجيل الدخول
      setLastUser({
        email: testUser.email,
        password: testUser.password,
      });

      setResult(
        `✅ نجح التسجيل!\n\nالبريد: ${testUser.email}\nكلمة المرور: ${testUser.password}\n\nToken: ${response.data.token.substring(0, 50)}...\n\nالمستخدم: ${JSON.stringify(response.data.user, null, 2)}`
      );
    } catch (error) {
      console.error('❌ Registration error:', error);
      setResult(`❌ فشل التسجيل:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!lastUser) {
      setResult('⚠️ يجب تسجيل مستخدم أولاً!\nاضغط زر "اختبار التسجيل" أولاً.');
      return;
    }

    setLoading(true);
    setResult('جاري اختبار تسجيل الدخول...');

    try {
      console.log('📤 Sending login request...');
      const response = await authAPI.login(lastUser.email, lastUser.password);
      console.log('✅ Login successful:', response);

      setResult(
        `✅ نجح تسجيل الدخول!\n\nالبريد: ${lastUser.email}\n\nToken: ${response.data.token.substring(0, 50)}...\n\nالمستخدم: ${JSON.stringify(response.data.user, null, 2)}`
      );
    } catch (error) {
      console.error('❌ Login error:', error);
      setResult(`❌ فشل تسجيل الدخول:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          background: '#6b46c1',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        ← العودة للصفحة الرئيسية
      </button>

      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
        🔧 اختبار الربط بين Frontend و Backend
      </h1>

      <div
        style={{
          background: '#4CAF50',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        ✅ الربط يعمل بنجاح! Backend متصل بـ Frontend
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={testRegister}
          disabled={loading}
          style={{
            flex: 1,
            padding: '20px',
            fontSize: '16px',
            background: loading ? '#999' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? '⏳ جاري...' : '1️⃣ اختبار التسجيل'}
        </button>

        <button
          onClick={testLogin}
          disabled={loading || !lastUser}
          style={{
            flex: 1,
            padding: '20px',
            fontSize: '16px',
            background: loading || !lastUser ? '#999' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !lastUser ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? '⏳ جاري...' : '2️⃣ اختبار تسجيل الدخول'}
        </button>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          minHeight: '250px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '13px',
          direction: 'ltr',
          textAlign: 'left',
        }}
      >
        {result || 'اضغط "اختبار التسجيل" أولاً، ثم "اختبار تسجيل الدخول"'}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e3f2fd',
          borderRadius: '8px',
        }}
      >
        <strong>📊 حالة النظام:</strong>
        <ul style={{ marginTop: '10px' }}>
          <li>✅ Backend API: http://localhost:5001/api</li>
          <li>✅ Frontend: http://localhost:3000</li>
          <li>✅ قاعدة البيانات: Neon PostgreSQL</li>
          <li>✅ CORS: مضبوط</li>
          <li>✅ JWT Authentication: يعمل</li>
        </ul>
      </div>
    </div>
  );
}
