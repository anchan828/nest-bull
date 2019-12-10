import { BullModule, BullService } from "@anchan828/nest-bullmq";
import { Module } from "@nestjs/common";
import { HealthIndicatorResult, TerminusModule, TerminusModuleOptions } from "@nestjs/terminus";
import { Test } from "@nestjs/testing";
import { Job } from "bullmq";
import * as request from "supertest";
import { BullHealthIndicator } from "./bull.health";
import { QUEUE_NAME } from "./constants";
import { BullHealthModule } from "./health.module";

describe("BullHealthModule", () => {
  it("should compile module", async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          BullModule.forRoot({
            options: {
              connection: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
              },
            },
          }),
          BullHealthModule,
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  it("should compile health module", async () => {
    const getTerminusOptions = (bull: BullHealthIndicator): TerminusModuleOptions => ({
      endpoints: [
        {
          url: "/health",
          healthIndicators: [async (): Promise<HealthIndicatorResult> => bull.isHealthy()],
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
            options: {
              connection: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
              },
            },
          }),
          HealthModule,
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });

  describe("e2e tests", () => {
    it("should create nest application", async () => {
      const getTerminusOptions = (bull: BullHealthIndicator): TerminusModuleOptions => ({
        endpoints: [
          {
            url: "/health",
            healthIndicators: [async (): Promise<HealthIndicatorResult> => bull.isHealthy()],
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
            options: {
              connection: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
              },
            },
          }),
          HealthModule,
        ],
      }).compile();
      const app = module.createNestApplication();
      await expect(app.init()).resolves.toBeDefined();
      await app.close();
    });

    it("should return status is up", async () => {
      const getTerminusOptions = (bull: BullHealthIndicator): TerminusModuleOptions => ({
        endpoints: [
          {
            url: "/health",
            healthIndicators: [async (): Promise<HealthIndicatorResult> => bull.isHealthy()],
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
            options: {
              connection: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
              },
            },
          }),
          HealthModule,
        ],
      }).compile();

      const app = module.createNestApplication();
      await app.init();
      return request(app.getHttpServer())
        .get("/health")
        .expect(200)
        .expect({
          status: "ok",
          info: { bull: { status: "up" } },
          details: { bull: { status: "up" } },
        });
    });

    it("should return status is down", async () => {
      const getTerminusOptions = (bull: BullHealthIndicator): TerminusModuleOptions => ({
        endpoints: [
          {
            url: "/health",
            healthIndicators: [async (): Promise<HealthIndicatorResult> => bull.isHealthy()],
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
            options: {
              connection: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
              },
            },
          }),
          HealthModule,
        ],
      }).compile();

      const app = module.createNestApplication();

      await app.init();
      const service = app.get<BullService>(BullService);
      const queue = service.queues[QUEUE_NAME];
      jest.spyOn(queue, "add").mockResolvedValueOnce(({
        waitUntilFinished: (): Promise<any> => {
          throw new Error("faild");
        },
      } as unknown) as Job);

      return request(app.getHttpServer())
        .get("/health")
        .expect(503)
        .expect({
          status: "error",
          error: { bull: { status: "down", message: "faild" } },
          details: { bull: { status: "down", message: "faild" } },
        });
    });
  });
});
