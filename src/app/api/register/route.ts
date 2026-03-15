import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { lineUserId, birthDate, gender, occupation } = await req.json();
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    await connectDB();
    const user = await User.findOne({ lineUserId });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Register API error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
