const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.init();
  }

  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
};