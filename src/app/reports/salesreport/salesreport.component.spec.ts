import { SalesReportComponent } from './salesreport.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';


describe('SalesReportComponent', () => {
  let component: SalesReportComponent;
  let fixture: ComponentFixture<SalesReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalesReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
