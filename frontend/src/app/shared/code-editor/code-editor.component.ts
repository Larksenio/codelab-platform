import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
} from '@angular/core';
import loader from '@monaco-editor/loader';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `<div #editorRef style="width:100%;height:100%;"></div>`,
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('editorRef') editorRef!: ElementRef<HTMLDivElement>;

  @Input() language = 'python';
  @Input() theme    = 'vs-dark';
  @Input() value    = '';
  @Output() valueChange = new EventEmitter<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private editor: any = null;
  private initialized = false;

  async ngAfterViewInit(): Promise<void> {
    const monaco = await loader.init();

    this.editor = monaco.editor.create(this.editorRef.nativeElement, {
      value:                this.value,
      language:             this.language,
      theme:                this.theme,
      fontSize:             14,
      minimap:              { enabled: false },
      automaticLayout:      true,
      scrollBeyondLastLine: false,
      wordWrap:             'on',
    });

    this.editor.onDidChangeModelContent(() => {
      this.valueChange.emit(this.editor.getValue());
    });

    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !this.editor) return;

    if (changes['language']) {
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setModelLanguage(this.editor.getModel(), this.language);
      }
    }

    if (changes['value'] && this.editor.getValue() !== this.value) {
      this.editor.setValue(this.value);
    }
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
  }
}
