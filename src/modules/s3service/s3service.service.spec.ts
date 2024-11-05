import { Test, TestingModule } from '@nestjs/testing';
import { S3serviceService } from './s3service.service';

describe('S3serviceService', () => {
  let service: S3serviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3serviceService],
    }).compile();

    service = module.get<S3serviceService>(S3serviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
