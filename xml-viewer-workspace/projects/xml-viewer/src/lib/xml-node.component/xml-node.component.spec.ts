import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XmlNodeComponent } from './xml-node.component';

describe('XmlNodeComponent', () => {
  let component: XmlNodeComponent;
  let fixture: ComponentFixture<XmlNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmlNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XmlNodeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
