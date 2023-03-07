import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogOneComponent } from './dialog-one.component';

describe('DialogOneComponent', () => {
  let component: DialogOneComponent;
  let fixture: ComponentFixture<DialogOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogOneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
