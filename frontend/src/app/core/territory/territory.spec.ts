import { TestBed } from '@angular/core/testing';

import { Territory } from './territory';

describe('Territory', () => {
  let service: Territory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Territory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
