const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { prisma } = require("@inventory/database");

const cleanUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

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

  const accessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    }
  );

  return {
    user: cleanUser(user),
    accessToken,
    refreshToken,
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

  const accessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );

  return {
    user: cleanUser(user),
    accessToken,
    refreshToken,
  };

};

exports.refreshToken = async (refreshToken) => {

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  let decoded;

  try {

    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

  } catch (err) {

    throw new Error("Invalid refresh token");

  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:
        process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );

  return {
    accessToken: newAccessToken,
    user: cleanUser(user),
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

