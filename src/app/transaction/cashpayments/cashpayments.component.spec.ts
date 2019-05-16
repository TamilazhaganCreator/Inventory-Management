import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashpaymentsComponent } from './cashpayments.component';

describe('CashpaymentsComponent', () => {
  let component: CashpaymentsComponent;
  let fixture: ComponentFixture<CashpaymentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashpaymentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashpaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
