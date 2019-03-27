import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomermasterComponent } from './customermaster.component';

describe('CustomermasterComponent', () => {
  let component: CustomermasterComponent;
  let fixture: ComponentFixture<CustomermasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomermasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomermasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
