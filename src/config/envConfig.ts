import 'dotenv/config';

const _config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  cookieSecret: process.env.COOKIE_SECRET,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpService: process.env.SMTP_SERVICE,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  appName: process.env.APP_NAME,
  // add ENV TODO:
  sebConfigKey: process.env.SEB_CONFIG_KEY,
  sebAllowedKeys: process.env.SEB_ALLOWED_KEY,
  baseUrl: process.env.BASE_URL,
  supportEmail: process.env.SUPPORT_EMAIL,
  logoUrl: process.env.LOGO_URL,
  allowedOrigins: process.env.ALLOWED_ORIGIN,
};

const envConfig = Object.freeze(_config);
export default envConfig;
