const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { prisma } = require("@inventory/database");

exports.register = async (payload) => {

  const tenant = await prisma.tenant.create({
    data: {
      name: payload.storeName,
      slug: payload.storeSlug,
    },
  });

  const hashedPassword =
    await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: payload.email,
      password: hashedPassword,
      role: "OWNER",
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return {
    user,
    token,
  };

};

exports.login = async (payload) => {

  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid =
    await bcrypt.compare(
      payload.password,
      user.password
    );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return {
    user,
    token,
  };

};

exports.me = async (userId) => {

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      tenant: true,
    },
  });

};

exports.refreshToken = async (user) => {

  const token = jwt.sign(
    {
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return {
    token,
  };

};