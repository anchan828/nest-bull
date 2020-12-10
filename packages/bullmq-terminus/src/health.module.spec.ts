import { BullModule, BullService } from "@anchan828/nest-bullmq";
import { Controller, Get, Module } from "@nestjs/common";
import { HealthCheck, HealthCheckService, TerminusModule } from "@nestjs/terminus";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { BullHealthIndicator } from "./bull.health";
import { QUEUE_NAME } from "./constants";
import { BullHealthModule } from "./health.module";

describe("BullHealthModule", () => {
  @Controller("/health")
  class BullHealthController {
    constructor(private health: HealthCheckService, private bull: BullHealthIndicator) {}

    @Get()
    @HealthCheck()
    check() {
      return this.health.check([() => this.bull.isHealthy()]);
    }
  }
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
    @Module({
      controllers: [BullHealthController],
      providers: [BullHealthIndicator],
      imports: [BullHealthModule, TerminusModule],
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
      @Module({
        controllers: [BullHealthController],
        providers: [BullHealthIndicator],
        imports: [BullHealthModule, TerminusModule],
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
      @Module({
        controllers: [BullHealthController],
        providers: [BullHealthIndicator],
        imports: [BullHealthModule, TerminusModule],
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
          error: {},
          info: { bull: { status: "up" } },
          details: { bull: { status: "up" } },
        });
    });

    it("should return status is down", async () => {
      @Module({
        controllers: [BullHealthController],
        providers: [BullHealthIndicator],
        imports: [BullHealthModule, TerminusModule],
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
      jest.spyOn(queue, "add").mockResolvedValueOnce({
        waitUntilFinished: (): Promise<any> => {
          throw new Error("faild");
        },
      } as any);

      return request(app.getHttpServer())
        .get("/health")
        .expect(503)
        .expect({
          status: "error",
          info: {},
          error: { bull: { status: "down", message: "faild" } },
          details: { bull: { status: "down", message: "faild" } },
        });
    });
  });
});
