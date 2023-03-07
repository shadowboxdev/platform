import { ComponentRef, Injectable, Type } from '@angular/core';

import { DialogBase } from '../behaviors/dialog.base';

@Injectable({
  providedIn: 'root',
})
export class DialogService extends DialogBase {}

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  count: number[] = [];
  zIndex: number[] = [];
  keys: string[] = [];
  parentRef: ComponentRef<unknown>[] = [];
  indexer = 0;
  lastIndex = 99999;

  public initModal() {
    let hasAdded = false;
    let counter = 0;
    for (let i = 0; i < this.count.length; i++) {
      if (this.count[i] == 0 && !hasAdded) {
        hasAdded = true;
        this.count[i] = 1;
        counter = i;
      }
    }
    if (!hasAdded) {
      this.count.push(1);
      counter = this.count.length;
    }
    this.lastIndex++;
    this.zIndex[counter] = this.lastIndex;
    return counter;
  }

  public setKey<T extends Type<unknown> = Type<unknown>>(
    key: string,
    parentRefComp: ComponentRef<T>
  ) {
    let hasAdded = false;
    let counter = 0;
    for (let i = 0; i < this.count.length; i++) {
      if (this.keys[i] == key && !hasAdded) {
        hasAdded = true;
        this.keys[i] = key;
        this.parentRef[i] = parentRefComp;
        counter = i;
      }
    }
    if (!hasAdded) {
      this.keys.push(key);
      this.parentRef.push(parentRefComp);
      counter = this.count.length;
    }

    this.lastIndex++;
    this.zIndex[counter] = this.lastIndex;
    return counter;
  }

  public getInitialIndex(counter: number) {
    return this.zIndex[counter];
  }

  public getNewIndex(counter: number): number {
    const maxEle = this.zIndex[counter];
    let max = 0;
    this.zIndex.forEach((element) => {
      if (element > max) {
        max = element;
      }
    });
    if (max > maxEle) {
      this.zIndex[counter] = max + 1;
    }
    this.lastIndex = this.zIndex[counter];

    return this.zIndex[counter];
  }

  public destroyModal(counter: number) {
    delete this.count[counter];
    delete this.keys[counter];
    delete this.parentRef[counter];
  }
}
