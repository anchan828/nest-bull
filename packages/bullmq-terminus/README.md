# @anchan828/nest-bullmq-terminus

![npm](https://img.shields.io/npm/v/@anchan828/nest-bullmq-terminus.svg)
![NPM](https://img.shields.io/npm/l/@anchan828/nest-bullmq-terminus.svg)

## Description

The terminus of The [Bull](https://github.com/OptimalBits/bull) module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @anchan828/nest-bullmq-terminus @nestjs/terminus @anchan828/nest-bullmq bullmq
```

## Quick Start

1. Create Health Module

```ts
import { BullHealthIndicator, BullHealthModule } from "@anchan828/nest-bullmq-terminus";

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

2. Create bull queue/worker/queueEvents for checking health

```ts
import { BullHealthCheckQueue } from "@anchan828/nest-bullmq-terminus";

@Module({
  imports: [BullModule.forRoot(), HealthModule],
})
class AppModule {}
```

## License

[MIT](LICENSE)
