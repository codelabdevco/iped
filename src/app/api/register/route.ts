import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { pushMessage } from '@/lib/line-bot';

export async function POST(req: NextRequest) {
  try {
    const { lineUserId, birthDate, gender, occupation } = await req.json();
    if (!lineUserId || !birthDate || !gender || !occupation) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    await connectDB();
    const user = await User.findOne({ lineUserId });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const bd = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const md = today.getMonth() - bd.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < bd.getDate())) age--;
    user.birthDate = bd;
    user.age = age;
    user.gender = gender;
    user.occupation = occupation;
    user.onboardingStep = 4;
    user.onboardingComplete = true;
    await user.save();

    const displayName = user.lineDisplayName || user.name || '';

    // Send completion push message to LINE
    try {
      const completeFlex = {
        type: 'flex',
        altText: 'ลงทะเบียนสำเร็จ!',
        contents: {
          type: 'bubble',
          size: 'mega',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: '✅', size: '3xl', align: 'center' },
                ],
                paddingAll: '20px',
              },
              {
                type: 'text',
                text: 'ลงทะเบียนสำเร็จแล้ว!',
                weight: 'bold',
                size: 'xl',
                align: 'center',
                color: '#FA3633',
              },
              {
                type: 'text',
                text: 'ขอบคุณที่ลงทะเบียนครับ',
                size: 'sm',
                color: '#666666',
                align: 'center',
                margin: 'md',
              },
              { type: 'separator', margin: 'xl' },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'xl',
                spacing: 'sm',
                contents: [
                  {
                    type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'ชื่อ', size: 'sm', color: '#999999', flex: 2 },
                      { type: 'text', text: displayName, size: 'sm', color: '#333333', flex: 5, align: 'end' },
                    ],
                  },
                  {
                    type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'อายุ', size: 'sm', color: '#999999', flex: 2 },
                      { type: 'text', text: age + ' ปี', size: 'sm', color: '#333333', flex: 5, align: 'end' },
                    ],
                  },
                  {
                    type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'เพศ', size: 'sm', color: '#999999', flex: 2 },
                      { type: 'text', text: gender, size: 'sm', color: '#333333', flex: 5, align: 'end' },
                    ],
                  },
                  {
                    type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'อาชีพ', size: 'sm', color: '#999999', flex: 2 },
                      { type: 'text', text: occupation, size: 'sm', color: '#333333', flex: 5, align: 'end' },
                    ],
                  },
                ],
              },
            ],
            paddingAll: '20px',
            backgroundColor: '#FFFFFF',
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ตอนนี้คุณสามารถส่งสลิปมาใช้งานได้เลยครับ 😊',
                size: 'sm',
                color: '#999999',
                align: 'center',
                wrap: true,
              },
            ],
            paddingAll: '20px',
          },
        },
      };
      await pushMessage(lineUserId, [completeFlex]);
    } catch (pushErr) {
      console.error('Push message error:', pushErr);
    }

    return NextResponse.json({
      success: true,
      name: displayName,
      age,
      gender,
      occupation,
    });
  } catch (err) {
    console.error('Register API error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
