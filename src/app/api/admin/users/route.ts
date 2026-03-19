import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAdmin, apiSuccess, apiError, getPagination } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import User from "@/models/User";
import { validateBody, ValidationSchema } from "@/lib/validate";
import { rateLimitByUser } from "@/lib/rate-limit";

const VALID_ROLES = ["superadmin", "admin", "manager", "accountant", "user"];
const VALID_ACCOUNT_TYPES = ["personal", "business"];

const createUserSchema: ValidationSchema = {
  name: { required: true, type: "string", maxLength: 200, sanitize: true },
  email: { type: "email", maxLength: 200 },
  role: { type: "string", enum: VALID_ROLES },
  accountType: { type: "string", enum: VALID_ACCOUNT_TYPES },
  occupation: { type: "string", maxLength: 200, sanitize: true },
};

const USER_SELECT_FIELDS =
  "_id name email lineUserId lineDisplayName lineProfilePic role accountType status onboardingComplete lastLogin loginCount documentsCount createdAt";

export async function GET(request: NextRequest) {
  return withAdmin(request, async (_session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPagination(req);

    const filter: Record<string, unknown> = {};

    // Search filter
    const search = searchParams.get("search");
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { lineDisplayName: regex },
      ];
    }

    // Enum filters
    const role = searchParams.get("role");
    if (role && VALID_ROLES.includes(role)) filter.role = role;

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const accountType = searchParams.get("accountType");
    if (accountType && VALID_ACCOUNT_TYPES.includes(accountType))
      filter.accountType = accountType;

    const [users, total, active, suspended, admins] = await Promise.all([
      User.find(filter)
        .select(USER_SELECT_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ role: { $in: ["superadmin", "admin"] } }),
    ]);

    return apiSuccess({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { total: await User.countDocuments(), active, suspended, admins },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAdmin(request, async (_session: JWTPayload, req: NextRequest) => {
    // Rate limit: 30 admin operations per minute
    const rl = rateLimitByUser(_session.userId, "admin");
    if (!rl.allowed) {
      return apiError("Too many requests, please wait", 429);
    }

    await connectDB();
    const body = await req.json();

    // Schema validation + sanitization
    const validation = validateBody(body, createUserSchema);
    if (!validation.valid) {
      return apiError(validation.errors.join(", "), 400);
    }

    const { email, role, accountType, status, occupation } = body;

    if (email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return apiError("อีเมลนี้ถูกใช้งานแล้ว", 409);
      }
    }

    const user = await User.create({
      name: body.name,
      email: email || undefined,
      role: role || "user",
      accountType: accountType || "personal",
      status: status || "active",
      occupation: body.occupation || undefined,
    });

    const created = await User.findById(user._id)
      .select(USER_SELECT_FIELDS)
      .lean();

    return apiSuccess({ user: created }, 201);
  });
}
