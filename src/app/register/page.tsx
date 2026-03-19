'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

function RegisterForm() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get('lineUserId') || '';
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId, birthDate: birthDate.toISOString(), gender, occupation }),
      });
      const data = await res.json();
      if (data.success) { setResultData(data); setSuccess(true); }
      else { setError(data.message || 'Registration failed'); }
    } catch (err) { setError('Network error'); }
    finally { setLoading(false); }
  };

  const handleBackToLine = () => {
    try { window.close(); } catch (e) {}
    try { if ((window as any).liff) { (window as any).liff.closeWindow(); } } catch (e) {}
    setTimeout(() => { window.location.href = 'https://line.me/R/'; }, 500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)' }}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="h-2" style={{ backgroundColor: '#FA3633' }}></div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#06C755' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-gray-500 text-sm mt-2">ยินดีต้อนรับ, {resultData?.name || ''}!</p>
            <p className="text-gray-400 text-sm mt-1">พร้อมเริ่มใช้งานระบบจัดการใบเสร็จอัจฉริยะ</p>
            <a href="/dashboard" className="block w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all mt-6 text-center" style={{ backgroundColor: '#FA3633' }}>เข้าสู่ Dashboard</a>
            <button onClick={handleBackToLine} className="block w-full py-3 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-all mt-2">กลับไป LINE</button>
          </div>
        </div>
      </div>
    );
  }

  if (!lineUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)' }}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="h-2" style={{ backgroundColor: '#FA3633' }}></div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF0F0' }}>
                <span className="text-3xl">📲</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">ลงทะเบียนผ่าน LINE</h1>
              <p className="text-gray-400 text-sm mt-1">กรุณาลงทะเบียนผ่านแอป LINE เพื่อเริ่มใช้งาน</p>
            </div>
            <a href="/api/auth/line/login" className="block w-full py-3.5 rounded-xl text-white font-semibold text-base text-center transition-all mt-6" style={{ backgroundColor: '#06C755' }}>เข้าสู่ระบบผ่าน LINE</a>
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
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className={"w-full border border-gray-300 rounded-xl px-4 py-3 text-left focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-base " + (birthDate ? "text-gray-900" : "text-gray-400")}>
                    {birthDate ? format(birthDate, 'dd MMMM yyyy', { locale: th }) : 'เลือกวันเกิด'}
                    <svg className="w-5 h-5 float-right text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar mode="single" selected={birthDate} onSelect={(day) => { if (day) { setBirthDate(day); setCalendarOpen(false); } }} defaultMonth={new Date(2000, 0)} captionLayout="dropdown" fromYear={1940} toYear={new Date().getFullYear()} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
              <div className="flex gap-3">
                {['ชาย', 'หญิง', 'อื่นๆ'].map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={'flex-1 py-3 rounded-xl border text-sm font-medium transition-all ' + (gender === g ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}
                  >{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อาชีพ</label>
              <select value={occupation} onChange={e => setOccupation(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-base" required>
                <option value="">เลือกอาชีพ</option>
                <option value="พนักงานบริษัท">พนักงานบริษัท</option>
                <option value="ธุรกิจส่วนตัว">ธุรกิจส่วนตัว</option>
                <option value="ฟรีแลนซ์">ฟรีแลนซ์</option>
                <option value="นักศึกษา">นักศึกษา</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || !gender || !birthDate} className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all disabled:opacity-50" style={{ backgroundColor: '#FA3633' }}>
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
