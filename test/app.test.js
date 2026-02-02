import request from 'supertest';
import app from '#/src/app.js';
import { describe, it, expect } from '@jest/globals';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api');

      expect(response.body).toHaveProperty(
        'message',
        'Acquistions API is running!'
      );
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
