import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalestransactionComponent } from './salestransaction.component';

describe('SalestransactionComponent', () => {
  let component: SalestransactionComponent;
  let fixture: ComponentFixture<SalestransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalestransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalestransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
