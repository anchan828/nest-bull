import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BullCoreModule } from './bull-core.module';
import { BULL_MODULE_OPTIONS } from './bull.constants';
import { BullModuleOptions, BullModuleOptionsFactory } from './bull.interfaces';
describe('Bull', () => {
  describe('forRoot', () => {
    it('should compile', async () => {
      await expect(
        Test.createTestingModule({
          imports: [
            BullCoreModule.forRoot({
              queues: ['test'],
            }),
          ],
        }).compile(),
      ).resolves.toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should compile using useClass', async () => {
      @Injectable()
      class TestBullModuleOptionsFactory implements BullModuleOptionsFactory {
        createBullModuleOptions(): BullModuleOptions {
          return {
            queues: ['test'],
          };
        }
      }
      const app = await Test.createTestingModule({
        imports: [
          BullCoreModule.forRootAsync({
            imports: [],
            useClass: TestBullModuleOptionsFactory,
          }),
        ],
      }).compile();
      expect(app).toBeDefined();
      expect(app.get<BullModuleOptions>(BULL_MODULE_OPTIONS)).toStrictEqual({
        queues: ['test'],
      });
      await app.close();
    });

    it('should compile using useFactory', async () => {
      const app = await Test.createTestingModule({
        imports: [
          BullCoreModule.forRootAsync({
            imports: [],
            useFactory: () => ({ queues: ['test'] }),
          }),
        ],
      }).compile();
      expect(app).toBeDefined();
      expect(app.get<BullModuleOptions>(BULL_MODULE_OPTIONS)).toStrictEqual({
        queues: ['test'],
      });
      await app.close();
    });

    it('should compile using imports and inject', async () => {
      @Injectable()
      class TestEnv {
        test: string = 'test';
      }
      @Module({
        providers: [TestEnv],
        exports: [TestEnv],
      })
      class TestModule {}

      const app = await Test.createTestingModule({
        imports: [
          BullCoreModule.forRootAsync({
            imports: [TestModule],
            inject: [TestEnv],
            useFactory: (env: any) =>
              ({ queues: [env.test] } as BullModuleOptions),
          }),
        ],
      }).compile();
      expect(app).toBeDefined();
      expect(app.get<BullModuleOptions>(BULL_MODULE_OPTIONS)).toStrictEqual({
        queues: ['test'],
      });
      await app.close();
    });
  });
});
