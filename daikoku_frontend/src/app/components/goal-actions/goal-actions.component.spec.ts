import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GoalActionsComponent } from './goal-actions.component';

describe('GoalActionsComponent', () => {
  let component: GoalActionsComponent;
  let fixture: ComponentFixture<GoalActionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GoalActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
