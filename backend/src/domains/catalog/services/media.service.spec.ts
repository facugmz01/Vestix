import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const uploadDir = join(process.cwd(), 'uploads', 'products');
  let service: MediaService;
  const prisma = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    mkdirSync(uploadDir, { recursive: true });
    service = new MediaService(prisma);
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Leave shared uploads dir; only clean test files we recognize
  });

  it('persistDataUrl writes a file and returns /uploads/products/… URL', () => {
    // 1x1 PNG
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const url = service.persistDataUrl(png);
    expect(url).toMatch(/^\/uploads\/products\/product-\d+-\d+\.png$/);
    const filename = url.split('/').pop()!;
    const full = join(uploadDir, filename);
    expect(existsSync(full)).toBe(true);
    expect(readFileSync(full).length).toBeGreaterThan(0);
    rmSync(full);
  });

  it('persistImageRefs leaves remote paths intact and converts data-URLs', () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const result = service.persistImageRefs(['/uploads/products/existing.jpg', png, '', null]);
    expect(result[0]).toBe('/uploads/products/existing.jpg');
    expect(result[1]).toMatch(/^\/uploads\/products\/product-/);
    expect(result).toHaveLength(2);
    const filename = result[1].split('/').pop()!;
    rmSync(join(uploadDir, filename));
  });

  it('buildProductImageUrl prefixes /uploads/products', () => {
    expect(service.buildProductImageUrl('a.jpg')).toBe('/uploads/products/a.jpg');
  });
});
