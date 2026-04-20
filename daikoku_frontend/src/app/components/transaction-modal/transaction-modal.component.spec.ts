import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransactionModalComponent } from './transaction-modal.component';

describe('TransactionModalComponent', () => {
  let component: TransactionModalComponent;
  let fixture: ComponentFixture<TransactionModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TransactionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
