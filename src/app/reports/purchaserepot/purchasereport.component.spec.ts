import { PurchaseReportComponent } from './purchasereport.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';


describe('SalesReportComponent', () => {
  let component: PurchaseReportComponent;
  let fixture: ComponentFixture<PurchaseReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PurchaseReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
