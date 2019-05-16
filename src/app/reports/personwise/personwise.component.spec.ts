import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonwiseComponent } from './personwise.component';

describe('PersonwiseComponent', () => {
  let component: PersonwiseComponent;
  let fixture: ComponentFixture<PersonwiseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonwiseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonwiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
