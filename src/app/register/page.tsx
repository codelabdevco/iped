'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId: uid, birthDate, gender, occupation }),
      });
      const data = await res.json();
      if (data.success) { setDone(true); }
      else { setError(data.message || 'เกิดข้อผิดพลาด'); }
    } catch { setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-500">คุณสามารถปิดหน้านี้และกลับไปส่งสลิปใน LINE ได้เลยครับ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#FA3633' }}>iPED</h1>
          <p className="text-gray-500 text-sm mt-1">ลงทะเบียนข้อมูลส่วนตัว</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
            <div className="flex gap-3">
              {['ชาย','หญิง','ไม่ระบุ'].map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${gender === g ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อาชีพ</label>
            <select value={occupation} onChange={e => setOccupation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none" required>
              <option value="">เลือกอาชีพ</option>
              <option>พนักงานบริษัท</option>
              <option>ธุรกิจส่วนตัว</option>
              <option>ฟรีแลนซ์</option>
              <option>นักศึกษา</option>
              <option>อื่นๆ</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-base transition-all disabled:opacity-50"
            style={{ backgroundColor: '#FA3633' }}>
            {loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
