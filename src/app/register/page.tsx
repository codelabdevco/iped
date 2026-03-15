'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RegisterForm() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get('uid') || '';
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId, birthDate, gender, occupation }),
      });
      const data = await res.json();
      if (data.success) {
        setResultData(data);
        setSuccess(true);
      } else {
        setError(data.message || 'Error');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)' }}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="h-2" style={{ backgroundColor: '#FA3633' }}></div>
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F0FFF0' }}>
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#FA3633' }}>ลงทะเบียนสำเร็จแล้ว!</h1>
            <p className="text-gray-500 text-sm mb-6">ขอบคุณที่ลงทะเบียนครับ</p>
            {resultData && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-400 text-sm">ชื่อ</span>
                  <span className="text-gray-700 text-sm font-medium">{resultData.name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-400 text-sm">อายุ</span>
                  <span className="text-gray-700 text-sm font-medium">{resultData.age} ปี</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-400 text-sm">เพศ</span>
                  <span className="text-gray-700 text-sm font-medium">{resultData.gender}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">อาชีพ</span>
                  <span className="text-gray-700 text-sm font-medium">{resultData.occupation}</span>
                </div>
              </div>
            )}
            <a
              href="https://line.me/R/"
              className="block w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all"
              style={{ backgroundColor: '#06C755' }}
            >
              กลับไป LINE
            </a>
            <p className="text-gray-400 text-xs mt-4">ตอนนี้คุณสามารถส่งสลิปมาใช้งานได้เลยครับ 😊</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)' }}>
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: '#FA3633' }}></div>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF0F0' }}>
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">ลงทะเบียน</h1>
            <p className="text-gray-400 text-sm mt-1">กรอกข้อมูลเพื่อเริ่มใช้งาน</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-base" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
              <div className="flex gap-3">
                {['ชาย','หญิง','อื่นๆ'].map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={'flex-1 py-3 rounded-xl border text-sm font-medium transition-all ' + (gender === g ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}
                  >{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อาชีพ</label>
              <select value={occupation} onChange={e => setOccupation(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-base" required>
                <option value="">เลือกอาชีพ</option>
                <option value="พนักงานบริษัท">พนักงานบริษัท</option>
                <option value="ธุรกิจส่วนตัว">ธุรกิจส่วนตัว</option>
                <option value="นักเรียน/นักศึกษา">นักเรียน/นักศึกษา</option>
                <option value="รับราชการ">รับราชการ</option>
                <option value="ฟรีแลนซ์">ฟรีแลนซ์</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !gender}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all disabled:opacity-50"
              style={{ backgroundColor: '#FA3633' }}>
              {loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
