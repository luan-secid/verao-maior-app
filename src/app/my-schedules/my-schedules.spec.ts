import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySchedules } from './my-schedules';

describe('MySchedules', () => {
  let component: MySchedules;
  let fixture: ComponentFixture<MySchedules>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySchedules]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MySchedules);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
