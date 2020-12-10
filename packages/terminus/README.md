# @anchan828/nest-bull-terminus

![npm](https://img.shields.io/npm/v/@anchan828/nest-bull-terminus.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-bull-terminus.svg)

## Description

The terminus of The [Bull](https://github.com/OptimalBits/bull) module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @anchan828/nest-bull-terminus @nestjs/terminus @anchan828/nest-bull bull
$ npm i --save-dev @types/bull
```

## Quick Start

1. Create Health Module

```ts
import { BullHealthCheckQueue, BullHealthIndicator, BullHealthModule } from "@anchan828/nest-bull-terminus";

@Controller("/health")
class BullHealthController {
  constructor(private health: HealthCheckService, private bull: BullHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.bull.isHealthy()]);
  }
}

@Module({
  controllers: [BullHealthController],
  imports: [BullHealthModule, TerminusModule],
})
export class HealthModule {}
```

2. Create Health Bull Queue

```ts
import { BullHealthCheckQueue } from "@anchan828/nest-bull-terminus";

@Module({
  imports: [
    BullModule.forRoot({
      queues: [BullHealthCheckQueue],
    }),
    HealthModule,
  ],
})
class AppModule {}
```

## License

[MIT](LICENSE)
