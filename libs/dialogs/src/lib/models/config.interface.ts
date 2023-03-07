import { Point } from '@angular/cdk/drag-drop';

export interface SdwDialogConfig {
  headerColor?: string;
  titleColor?: string;
  iconsColor?: string;
  closeHoverColor?: string;
  buttonHoverColor?: string;
  width?: string;
  height?: string;
  title?: string;
  position?: Point;

  contentBackgroundColor?: string;
  allowOutOfBounds?: boolean;
}
