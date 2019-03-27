import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitmasterComponent } from './unitmaster.component';

describe('UnitmasterComponent', () => {
  let component: UnitmasterComponent;
  let fixture: ComponentFixture<UnitmasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitmasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
