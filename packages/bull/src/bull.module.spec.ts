import { Test } from '@nestjs/testing';
import { BullModuleOptions } from './bull.interfaces';
import { BullModule } from './bull.module';
import { cleanTestFiles, createTestFile } from './bull.utils.spec';
describe('BullModule', () => {
  it('should be defined', () => {
    expect(BullModule).toBeDefined();
  });

  describe('forRoot', () => {
    cleanTestFiles();
    it('should compile', async () => {
      const app = await Test.createTestingModule({
        imports: [BullModule.forRoot({} as any)],
      }).compile();
      expect(app).toBeDefined();
    });

    const compileModule = async (
      filePath: string,
      bullModuleOptions: BullModuleOptions = {
        queues: [filePath],
      },
    ): Promise<void> => {
      const app = await Test.createTestingModule({
        imports: [
          BullModule.forRoot(bullModuleOptions),
          require(filePath).TestModule,
        ],
      }).compile();
      expect(app).toBeDefined();
      await app.close();
    };

    it(`BullQueue don't set to providers`, async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
      }
      @Module({
        providers: [TestClass]
      })
      export class TestModule {}`),
      );
    });

    it('BullQueue decorator only', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });

    it('BullQueueProcess', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
       @BullQueueProcess()
       public async process(job: any) {
         console.log("hello")
       }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });

    it('BullQueueProcess has options', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
       @BullQueueProcess({
        concurrency: 2
       })
       public async process(job: any) {
         console.log("hello")
       }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });

    it('BullQueue has extra options', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue({
        extra: {
          defaultProcessorOptions: {
            concurrency: 2,
          },
        },
      })
      export class TestClass {
       @BullQueueProcess()
       public async process(job: any) {
         console.log("hello")
       }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });

    it('BullModule has extra options', async () => {
      const filePath = createTestFile(`
      @BullQueue()
      export class TestClass {
       @BullQueueProcess()
       public async process(job: any) {
         console.log("hello")
       }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`);
      await compileModule(filePath, {
        queues: [filePath],
        extra: {
          defaultProcessorOptions: {
            concurrency: 2,
          },
        },
      });
    });

    it('BullQueue has completed event', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
        @BullQueueEventCompleted()
        public async completed(job: any, result: any) {
          console.log('completed', job.id, result);
        }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });

    it('BullQueue has 2 completed event', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
        @BullQueueEventCompleted()
        @BullQueueEventCompleted()
        public async completed(job: any, result: any) {
          console.log('completed', job.id, result);
        }

        @BullQueueEventCompleted()
        public async completed2(job: any, result: any) {
          console.log('completed', job.id, result);
        }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });
    it('BullQueue has all events', async () => {
      await compileModule(
        createTestFile(`
      @BullQueue()
      export class TestClass {
        @BullQueueEventError()
        public async error(error: Error) {
          console.error('error', error);
        }
        @BullQueueEventWaiting()
        public async waiting(jobId: any) {
          console.log('wating', jobId);
        }
        @BullQueueEventActive()
        public async active(job: any, jobPromise: Promise<any>) {
          console.log('active', job.id);
        }
        @BullQueueEventStalled()
        public async stalled(job: any) {
          console.log('stalled', job.id);
        }
        @BullQueueEventProgress()
        public async progress(job: any, progress: number) {
          console.log('progress', job.id, progress);
        }
        @BullQueueEventCompleted()
        public async completed(job: any, result: any) {
          console.log('completed', job.id, result);
        }
        @BullQueueEventFailed()
        public async failed(job: any, error: Error) {
          console.error('failed', job.id, error);
        }
        @BullQueueEventPaused()
        public async paused() {
          console.log('paused');
        }
        @BullQueueEventResumed()
        public async resumed(job: any) {
          console.log('resumed', job.id);
        }
        @BullQueueEventCleaned()
        public async cleaned(job: any, type: string) {
          console.log('cleaned', job.id, type);
        }
        @BullQueueEventDrained()
        public async drained() {
          console.log('drained');
        }
        @BullQueueEventRemoved()
        public async removed(job: any) {
          console.log('removed', job.id);
        }

        // global events

        @BullQueueEventGlobalError()
        public async globalError(error: Error) {
          console.error('global error', error);
        }
        @BullQueueEventGlobalWaiting()
        public async globalWaiting(jobId: any) {
          console.log('global wating', jobId);
        }
        @BullQueueEventGlobalActive()
        public async globalActive(jobId: any) {
          console.log('global active', jobId);
        }
        @BullQueueEventGlobalStalled()
        public async globalStalled(jobId: any) {
          console.log('global stalled', jobId);
        }
        @BullQueueEventGlobalProgress()
        public async globalProgress(jobId: any, progress: number) {
          console.log('global progress', jobId, progress);
        }
        @BullQueueEventGlobalCompleted()
        public async globalCompleted(jobId: any, result: any) {
          console.log('global completed', jobId, result);
        }
        @BullQueueEventGlobalFailed()
        public async globalFailed(jobId: any, error: Error) {
          console.error('global failed', jobId, error);
        }
        @BullQueueEventGlobalPaused()
        public async globalPaused() {
          console.log('global paused');
        }
        @BullQueueEventGlobalResumed()
        public async globalResumed(jobId: any) {
          console.log('global resumed', jobId);
        }
        @BullQueueEventGlobalCleaned()
        public async globalCleaned(jobId: any, type: string) {
          console.log('global cleaned', jobId, type);
        }
        @BullQueueEventGlobalDrained()
        public async globalDrained() {
          console.log('global drained');
        }
        @BullQueueEventGlobalRemoved()
        public async globalRemoved(jobId: any) {
          console.log('global removed', jobId);
        }
      }
      @Module({
        providers: [TestClass],
      })
      export class TestModule {}`),
      );
    });
  });
});
