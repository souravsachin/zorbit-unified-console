import { HashIdService } from '../src/services/hash-id.service';

describe('HashIdService', () => {
  let service: HashIdService;

  beforeEach(() => {
    service = new HashIdService();
  });

  it('should generate IDs with the correct prefix', () => {
    const id = service.generate('WDG');
    expect(id).toMatch(/^WDG-[0-9A-F]{4}$/);
  });

  it('should generate IDs with DEM prefix', () => {
    const id = service.generate('DEM');
    expect(id).toMatch(/^DEM-[0-9A-F]{4}$/);
  });

  it('should generate IDs with DPL prefix', () => {
    const id = service.generate('DPL');
    expect(id).toMatch(/^DPL-[0-9A-F]{4}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(service.generate('WDG'));
    }
    // With 4 hex chars (65536 combos), 100 should be unique
    expect(ids.size).toBe(100);
  });
});
