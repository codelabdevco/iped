import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { pushMessage } from '@/lib/line-bot';
import { completeFlex } from '@/lib/onboarding';
import { logger } from "@/lib/logger";

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
    const pictureUrl = user.lineProfilePic || '';

    // Send same completeFlex as chat registration
    try {
      const flex = completeFlex(
        displayName || '-', String(age), gender, occupation, pictureUrl || undefined, lineUserId);
      await pushMessage(lineUserId, [flex]);
    } catch (pushErr) {
      logger.error("Push message error", { error: pushErr instanceof Error ? pushErr.message : String(pushErr) });
    }

    return NextResponse.json({
      success: true,
      name: displayName,
      age,
      gender,
      occupation,
    });
  } catch (err) {
    logger.error("Register API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
