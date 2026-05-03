import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GoalCreateComponent } from './goal-create.component';

describe('GoalCreateComponent', () => {
  let component: GoalCreateComponent;
  let fixture: ComponentFixture<GoalCreateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GoalCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoalCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
