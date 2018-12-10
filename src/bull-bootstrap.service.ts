import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { BullService } from './bull.service';

@Injectable()
export class BullBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly bullService: BullService) {}
  onApplicationBootstrap(): any {
    this.bullService.setupQueues();
  }
}
