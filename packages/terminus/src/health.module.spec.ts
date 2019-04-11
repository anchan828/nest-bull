import { BullModule, getBullQueueToken } from '@anchan828/nest-bull';
import { Module } from '@nestjs/common';
import { TerminusModule, TerminusModuleOptions } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { Queue } from 'bull';
import * as request from 'supertest';
import { BullHealthCheckQueue, BullHealthIndicator } from './bull.health';
import { QUEUE_NAME } from './constants';
import { BullHealthModule } from './health.module';
describe('BullHealthModule', () => {
  it('should compile module', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            queues: [BullHealthCheckQueue],
          }),
          BullHealthModule,
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it('should compile health module', async () => {
    const getTerminusOptions = (
      bull: BullHealthIndicator,
    ): TerminusModuleOptions => ({
      endpoints: [
        {
          url: '/health',
          healthIndicators: [async () => bull.isHealthy()],
        },
      ],
    });
    @Module({
      imports: [
        TerminusModule.forRootAsync({
          imports: [BullHealthModule],
          inject: [BullHealthIndicator],
          useFactory: (bull: any) => getTerminusOptions(bull),
        }),
      ],
    })
    class HealthModule {}

    await expect(
      Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            queues: [BullHealthCheckQueue],
          }),
          HealthModule,
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  describe('e2e tests', () => {
    it('should create nest application', async () => {
      const getTerminusOptions = (
        bull: BullHealthIndicator,
      ): TerminusModuleOptions => ({
        endpoints: [
          {
            url: '/health',
            healthIndicators: [async () => bull.isHealthy()],
          },
        ],
      });
      @Module({
        imports: [
          TerminusModule.forRootAsync({
            imports: [BullHealthModule],
            inject: [BullHealthIndicator],
            useFactory: (bull: any) => getTerminusOptions(bull),
          }),
        ],
      })
      class HealthModule {}

      const module = await Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            queues: [BullHealthCheckQueue],
          }),
          HealthModule,
        ],
      }).compile();

      const app = module.createNestApplication();
      await expect(app.init()).resolves.toBeDefined();
      await app.close();
    });

    it('should return status is up', async () => {
      const getTerminusOptions = (
        bull: BullHealthIndicator,
      ): TerminusModuleOptions => ({
        endpoints: [
          {
            url: '/health',
            healthIndicators: [async () => bull.isHealthy()],
          },
        ],
      });
      @Module({
        imports: [
          TerminusModule.forRootAsync({
            imports: [BullHealthModule],
            inject: [BullHealthIndicator],
            useFactory: (bull: any) => getTerminusOptions(bull),
          }),
        ],
      })
      class HealthModule {}

      const module = await Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            queues: [BullHealthCheckQueue],
          }),
          HealthModule,
        ],
      }).compile();

      const app = module.createNestApplication();
      await app.init();
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok', info: { bull: { status: 'up' } } });
    });

    it('should return status is down', async () => {
      const getTerminusOptions = (
        bull: BullHealthIndicator,
      ): TerminusModuleOptions => ({
        endpoints: [
          {
            url: '/health',
            healthIndicators: [async () => bull.isHealthy()],
          },
        ],
      });
      @Module({
        imports: [
          TerminusModule.forRootAsync({
            imports: [BullHealthModule],
            inject: [BullHealthIndicator],
            useFactory: (bull: any) => getTerminusOptions(bull),
          }),
        ],
      })
      class HealthModule {}

      const module = await Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            queues: [BullHealthCheckQueue],
          }),
          HealthModule,
        ],
      }).compile();

      const app = module.createNestApplication();

      await app.init();
      const queue = app.get<Queue>(getBullQueueToken(QUEUE_NAME));
      jest.spyOn(queue, 'add').mockImplementationOnce(
        (name: string, data: any): Promise<any> => {
          return Promise.resolve({
            finished: (): Promise<any> => {
              throw new Error('faild');
            },
          });
        },
      );
      return request(app.getHttpServer())
        .get('/health')
        .expect(503)
        .expect({
          status: 'error',
          error: { bull: { status: 'down', message: 'faild' } },
        });
    });
  });
});
