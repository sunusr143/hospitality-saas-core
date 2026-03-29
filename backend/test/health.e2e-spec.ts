import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';

@Controller()
class HealthController {
  @Get()
  healthCheck(): string {
    return 'Luxury Hospitality SaaS API is running';
  }
}

describe('Health (e2e)', () => {
  let controller: HealthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('returns health payload', () => {
    expect(controller.healthCheck()).toBe(
      'Luxury Hospitality SaaS API is running',
    );
  });
});
