import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerritoryList } from './territory-list';

describe('TerritoryList', () => {
  let component: TerritoryList;
  let fixture: ComponentFixture<TerritoryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerritoryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerritoryList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
